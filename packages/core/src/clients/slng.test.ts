import { describe, expect, it, vi, afterEach } from "vitest";
import { textToSpeech } from "./slng.js";

describe("slng client", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("textToSpeech resolves with audioBase64 and contentType", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      headers: new Headers({ "content-type": "audio/wav" }),
    } as any);

    const result = await textToSpeech("hello", { apiKey: "test-api-key" });
    expect(result.audioBase64).toBeDefined();
    expect(result.contentType).toBe("audio/wav");
  });

  it("textToSpeech uses default content-type if missing", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      headers: new Headers(),
    } as any);

    const result = await textToSpeech("hello", { apiKey: "test-api-key" });
    expect(result.contentType).toBe("audio/wav");
  });

  it("textToSpeech throws on non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    } as any);

    await expect(textToSpeech("hello", { apiKey: "test" })).rejects.toThrow(/SLNG TTS failed: 500/);
  });
});
