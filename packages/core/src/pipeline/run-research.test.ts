import { describe, expect, it, vi } from "vitest";
import { runResearch } from "./run-research.js";
import type { SIEClientLike } from "../clients/sie.js";

const mockBundle = {
  twoLiner: "Strong match for senior engineering role.",
  fitReasoning: { pros: ["TypeScript"], cons: ["No Attio SDK"] },
  gapAnalysis: [],
  hmNote: "Recommend screen.",
  clientSubmittalDraft: "Submitting Alex for review.",
  candidateEmailDraft: "Hi Alex",
  rejectionEmailDraft: "Thank you for applying.",
  webBullets: [],
};

describe("runResearch", () => {
  it("orchestrates score and draft generation with mocked clients", async () => {
    const sieClient: SIEClientLike = {
      encode: vi.fn(async (_model, _input, options) => ({
        dense: new Float32Array(options?.isQuery ? [1, 0] : [0.85, 0.53]),
      })),
    };

    const generateSpy = vi
      .spyOn(await import("./generate-drafts.js"), "generateDrafts")
      .mockResolvedValue(mockBundle);

    const result = await runResearch(
      {
        roleDescription: "Senior engineer",
        cvText: "8 years TypeScript",
        candidateName: "Alex Morgan",
      },
      {
        scoreFit: { sieClient, model: "BAAI/bge-m3" },
        generateDrafts: { geminiClient: {} as never },
      },
    );

    expect(result.fit.tier).toBe("Strong");
    expect(result.bundle.twoLiner).toContain("Strong match");
    expect(result.bundle.clientSubmittalDraft).toBeTruthy();
    generateSpy.mockRestore();
  });
});
