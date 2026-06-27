import { describe, expect, it } from "vitest";
import { cosineSimilarity } from "../clients/sie.js";
import { scoreFit, similarityToFitPercent, splitCvIntoChunks, finalizeFitScore } from "./score-fit.js";
import type { SIEClientLike } from "../clients/sie.js";

function mockEmbedding(values: number[]): Float32Array {
  return new Float32Array(values);
}

function createMockSIEClient(
  roleValues: number[],
  chunkVectors: number[][],
): SIEClientLike {
  return {
    async encode(_model, input, options) {
      if (options?.isQuery) {
        return { dense: mockEmbedding(roleValues) };
      }
      return { dense: mockEmbedding(chunkVectors[0] ?? roleValues) };
    },
    async encodeBatch(_model, inputs) {
      return inputs.map((_input, index) => ({
        dense: mockEmbedding(chunkVectors[index] ?? chunkVectors[chunkVectors.length - 1]!),
      }));
    },
  };
}

describe("splitCvIntoChunks", () => {
  it("splits on blank lines and merges overflow", () => {
    const cv = [
      "Intro paragraph with enough characters to pass the minimum length filter",
      "Skills paragraph with enough characters to pass the minimum length filter",
      "Section A with enough characters to pass the minimum length filter",
      "Section B with enough characters to pass the minimum length filter",
      "Section C with enough characters to pass the minimum length filter",
      "Section D with enough characters to pass the minimum length filter",
      "Section E with enough characters to pass the minimum length filter",
      "Section F with enough characters to pass the minimum length filter",
      "Section G with enough characters to pass the minimum length filter",
      "Tail section with enough characters to pass the minimum length filter",
    ].join("\n\n");
    const chunks = splitCvIntoChunks(cv, 4);
    expect(chunks).toHaveLength(4);
    expect(chunks[3]).toContain("Tail section");
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const vector = mockEmbedding([1, 0, 0]);
    expect(cosineSimilarity(vector, vector)).toBeCloseTo(1);
  });
});

describe("similarityToFitPercent", () => {
  it("maps the BGE-M3 band to recruiter-friendly percentages", () => {
    expect(similarityToFitPercent(0.58)).toBe(0);
    expect(similarityToFitPercent(0.76)).toBe(100);
    expect(similarityToFitPercent(0.7427)).toBeGreaterThanOrEqual(88);
  });
});

describe("scoreFit", () => {
  const model = "BAAI/bge-m3";

  it("maps a strong chunk match to Strong tier", async () => {
    const client = createMockSIEClient([1, 0], [[0.79, 0.61]]);
    const result = await scoreFit(
      { roleDescription: "Senior engineer", cvText: "TypeScript expert" },
      { sieClient: client, model },
    );
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.tier).toBe("Strong");
  });

  it("maps a moderate chunk match to Good tier", async () => {
    const client = createMockSIEClient([1, 0], [[0.69, 0.72]]);
    const result = await scoreFit(
      { roleDescription: "Senior engineer", cvText: "TypeScript expert" },
      { sieClient: client, model },
    );
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(80);
    expect(result.tier).toBe("Good");
  });

  it("uses the best-matching CV chunk, not the weakest", async () => {
    const client = createMockSIEClient(
      [1, 0],
      [
        [0.4, 0.92],
        [0.92, 0.4],
      ],
    );
    const result = await scoreFit(
      {
        roleDescription: "Forward deployed engineer",
        cvText:
          "Earlier career in unrelated domains with no technical overlap at all\n\n" +
          "Forward deployed engineer with Python, TypeScript, FastAPI, React, and LLM delivery",
      },
      { sieClient: client, model },
    );
    expect(result.score).toBeGreaterThanOrEqual(88);
    expect(result.tier).toBe("Strong");
  });

  it("returns Unknown for empty CV", async () => {
    const client = createMockSIEClient([1, 0], [[1, 0]]);
    const result = await scoreFit(
      { roleDescription: "Senior engineer", cvText: "   " },
      { sieClient: client, model },
    );
    expect(result.score).toBe(0);
    expect(result.tier).toBe("Unknown");
  });
});

describe("finalizeFitScore", () => {
  const baseFit = { score: 90, tier: "Strong" as const, rawSimilarity: 0.74 };

  it("returns 100% when gap analysis is empty", () => {
    const result = finalizeFitScore(baseFit, []);
    expect(result.score).toBe(100);
    expect(result.tier).toBe("Strong");
  });

  it("keeps the embedding score when gaps exist", () => {
    const result = finalizeFitScore(baseFit, [
      { area: "Location", gap: "Hybrid preference unclear", severity: "low" },
    ]);
    expect(result.score).toBe(90);
  });
});
