import { describe, expect, it } from "vitest";
import { cosineSimilarity } from "../clients/sie.js";
import { scoreFit } from "./score-fit.js";
import type { SIEClientLike } from "../clients/sie.js";

function mockEmbedding(values: number[]): Float32Array {
  return new Float32Array(values);
}

function createMockSIEClient(
  roleValues: number[],
  cvValues: number[],
): SIEClientLike {
  return {
    async encode(_model, input, options) {
      if (options?.isQuery) {
        return { dense: mockEmbedding(roleValues) };
      }
      return { dense: mockEmbedding(cvValues) };
    },
  };
}

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const vector = mockEmbedding([1, 0, 0]);
    expect(cosineSimilarity(vector, vector)).toBeCloseTo(1);
  });
});

describe("scoreFit", () => {
  const model = "BAAI/bge-m3";

  it("maps 79% to Good tier", async () => {
    const client = createMockSIEClient([1, 0], [0.79, 0.61]);
    const result = await scoreFit(
      { roleDescription: "Senior engineer", cvText: "TypeScript expert" },
      { sieClient: client, model },
    );
    expect(result.score).toBe(79);
    expect(result.tier).toBe("Good");
  });

  it("maps 80% to Strong tier", async () => {
    const client = createMockSIEClient([1, 0], [0.8, 0.6]);
    const result = await scoreFit(
      { roleDescription: "Senior engineer", cvText: "TypeScript expert" },
      { sieClient: client, model },
    );
    expect(result.score).toBe(80);
    expect(result.tier).toBe("Strong");
  });

  it("returns Unknown for empty CV", async () => {
    const client = createMockSIEClient([1, 0], [1, 0]);
    const result = await scoreFit(
      { roleDescription: "Senior engineer", cvText: "   " },
      { sieClient: client, model },
    );
    expect(result.score).toBe(0);
    expect(result.tier).toBe("Unknown");
  });
});
