import { describe, expect, it, vi, afterEach } from "vitest";
import { cosineSimilarity, createFetchSIEClient, encodeText } from "./sie.js";

describe("sie client", () => {
  it("cosineSimilarity calculates correctly", () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([1, 0, 0]);
    expect(cosineSimilarity(a, b)).toBe(1);

    const c = new Float32Array([0, 1, 0]);
    expect(cosineSimilarity(a, c)).toBe(0);

    const d = new Float32Array([0.5, 0.5, 0.5]);
    const e = new Float32Array([0.5, 0.5, 0.5]);
    expect(cosineSimilarity(d, e)).toBeCloseTo(1);
  });

  it("cosineSimilarity returns 0 for zero vectors or mismatched lengths", () => {
    const a = new Float32Array([0, 0]);
    const b = new Float32Array([0, 0]);
    expect(cosineSimilarity(a, b)).toBe(0);

    const c = new Float32Array([1, 0]);
    const d = new Float32Array([1, 0, 0]);
    expect(cosineSimilarity(c, d)).toBe(0);
  });

  it("encodeText returns dense embedding", async () => {
    const mockClient = {
      encode: vi.fn().mockResolvedValue({ dense: new Float32Array([1, 2, 3]) })
    };

    const result = await encodeText(mockClient as any, "model-id", "test text");
    expect(result.dense).toBeInstanceOf(Float32Array);
    expect(Array.from(result.dense)).toEqual([1, 2, 3]);
  });

  it("encodeText throws if dense embedding is missing", async () => {
    const mockClient = {
      encode: vi.fn().mockResolvedValue({})
    };

    await expect(encodeText(mockClient as any, "model-id", "test text")).rejects.toThrow(/no dense embedding/);
  });
});

describe("createFetchSIEClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("encodes text via JSON fetch API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{ dense: { values: [0.1, 0.2, 0.3] } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createFetchSIEClient({
      clusterUrl: "http://sie.example.com:8080",
      apiKey: "test-key",
    });

    const result = await client.encode("BAAI/bge-m3", { text: "hello" }, { isQuery: true });

    expect(result.dense).toBeInstanceOf(Float32Array);
    expect(result.dense?.length).toBe(3);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://sie.example.com:8080/v1/encode/BAAI%2Fbge-m3",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
        body: JSON.stringify({
          items: [{ text: "hello" }],
          params: { is_query: true },
        }),
      }),
    );
  });
});
