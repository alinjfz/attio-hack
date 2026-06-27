import { describe, expect, it, vi, afterEach } from "vitest";
import app from "./index.js";
import { clearTtsCache, storeAudio } from "./tts-cache.js";

describe("api webhook", () => {
  it("GET /health returns ok", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("POST /webhook/research rejects missing auth", async () => {
    const response = await app.request("/webhook/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleDescription: "Engineer",
        cvText: "CV",
        candidateName: "Alex",
      }),
    });

    expect(response.status).toBe(401);
  });
});

describe("api tts hosting", () => {
  afterEach(() => {
    clearTtsCache();
    vi.restoreAllMocks();
  });

  it("POST /tts rejects missing auth", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";
    const response = await app.request("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello" }),
    });
    expect(response.status).toBe(401);
  });

  it("GET /tts/:id serves cached audio", async () => {
    const id = storeAudio(new Uint8Array([1, 2, 3]).buffer, "audio/wav");
    const response = await app.request(`/tts/${id}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/wav");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("POST /tts synthesizes and returns hosted URLs", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";
    process.env.SLNG_API_KEY = "test-key";
    process.env.API_PUBLIC_URL = "http://localhost:3001";

    vi.spyOn(await import("@recruiting-copilot/core"), "textToSpeechBuffer").mockResolvedValue({
      buffer: new Uint8Array([9, 8, 7]).buffer,
      contentType: "audio/wav",
    });

    const response = await app.request("/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": "test-secret",
      },
      body: JSON.stringify({ text: "Cruz Jacobs scores 54 percent." }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.url).toContain("/tts/");
    expect(body.downloadUrl).toContain("download=1");
  });

  it("POST /tts uses request Host for public URLs when behind a tunnel", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";
    process.env.SLNG_API_KEY = "test-key";
    process.env.API_PUBLIC_URL = "https://stale-subdomain.trycloudflare.com";

    vi.spyOn(await import("@recruiting-copilot/core"), "textToSpeechBuffer").mockResolvedValue({
      buffer: new Uint8Array([9, 8, 7]).buffer,
      contentType: "audio/wav",
    });

    const response = await app.request("/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": "test-secret",
        Host: "fresh-subdomain.trycloudflare.com",
        "X-Forwarded-Proto": "https",
      },
      body: JSON.stringify({ text: "Hello" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.url).toMatch(/^https:\/\/fresh-subdomain\.trycloudflare\.com\/tts\//);
    expect(body.downloadUrl).toMatch(/^https:\/\/fresh-subdomain\.trycloudflare\.com\/tts\//);
  });
});
