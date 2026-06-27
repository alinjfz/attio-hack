import { describe, expect, it, vi, afterEach } from "vitest";
import { z } from "zod";
import { createGeminiClient, generateStructured } from "./gemini.js";

describe("gemini client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("createGeminiClient returns client handle", () => {
    const client = createGeminiClient({ apiKey: "test-api-key" });
    expect(client.apiKey).toBe("test-api-key");
  });

  it("generateStructured parses valid JSON correctly", async () => {
    const client = createGeminiClient({ apiKey: "test" });
    const schema = z.object({ foo: z.string() });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ foo: "bar" }) }] } }],
        }),
        { status: 200 },
      ),
    );

    const result = await generateStructured(client, { prompt: "test prompt", schema });
    expect(result.foo).toBe("bar");
  });

  it("generateStructured sends responseJsonSchema instead of legacy responseSchema", async () => {
    const client = createGeminiClient({ apiKey: "test" });
    const schema = z.object({ foo: z.string() });
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ foo: "bar" }) }] } }],
        }),
        { status: 200 },
      ),
    );
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    await generateStructured(client, { prompt: "test prompt", schema });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.generationConfig.responseJsonSchema).toBeDefined();
    expect(body.generationConfig.responseSchema).toBeUndefined();
    expect(body.generationConfig.responseJsonSchema.$schema).toBeUndefined();
  });

  it("generateStructured throws on invalid JSON", async () => {
    const client = createGeminiClient({ apiKey: "test" });
    const schema = z.object({ foo: z.string() });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "invalid json string" }] } }],
        }),
        { status: 200 },
      ),
    );

    await expect(generateStructured(client, { prompt: "test prompt", schema })).rejects.toThrow(
      /invalid JSON/,
    );
  });

  it("generateStructured throws when Gemini returns empty text", async () => {
    const client = createGeminiClient({ apiKey: "test" });
    const schema = z.object({ foo: z.string() });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "" }] } }] }), {
        status: 200,
      }),
    );

    await expect(generateStructured(client, { prompt: "test prompt", schema })).rejects.toThrow(
      /empty response/,
    );
  });
});
