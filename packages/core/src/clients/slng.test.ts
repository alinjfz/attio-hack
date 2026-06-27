import { describe, expect, it, vi, afterEach } from "vitest";
import {
  arrayBufferToBase64,
  buildSlngTtsEndpoint,
  DEFAULT_SLNG_TTS_MODEL,
  textToSpeech,
} from "./slng.js";

describe("slng client", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("arrayBufferToBase64 encodes without Node Buffer", () => {
    const encoded = arrayBufferToBase64(new Uint8Array([72, 105]).buffer);
    expect(encoded).toBe("SGk=");
  });

  it("buildSlngTtsEndpoint uses deployed aura:2-en model path", () => {
    expect(buildSlngTtsEndpoint(DEFAULT_SLNG_TTS_MODEL)).toBe(
      "https://api.slng.ai/v1/tts/slng/deepgram/aura:2-en",
    );
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
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.slng.ai/v1/tts/slng/deepgram/aura:2-en",
      expect.objectContaining({ method: "POST" }),
    );
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
