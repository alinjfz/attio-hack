import { describe, expect, it, vi, afterEach } from "vitest";
import * as attioRest from "../clients/attio-rest.js";
import { applyWriteback } from "./apply-writeback.js";
import type { DraftBundle } from "../schemas/draft-bundle.js";

const bundle: DraftBundle = {
  twoLiner: "Strong engineer.",
  fitReasoning: { pros: ["TypeScript"], cons: ["No Attio"] },
  gapAnalysis: [],
  hmNote: "Recommend screen.",
  clientSubmittalDraft: "Submitting Alex.",
  candidateEmailDraft: "Hi Alex",
  rejectionEmailDraft: "Thanks for your time.",
  webBullets: [],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("applyWriteback", () => {
  it("writes fit fields and HM note on approve", async () => {
    vi.spyOn(attioRest, "patchPerson").mockResolvedValue(undefined);
    vi.spyOn(attioRest, "createNote").mockResolvedValue(undefined);

    await applyWriteback(
      {
        recordId: "rec_1",
        candidateName: "Alex",
        fit: { score: 80, tier: "Strong", rawSimilarity: 0.8 },
        bundle,
        mode: "approve",
        options: {
          createHmNote: true,
          createSlngSummary: false,
          createRejectionEmail: false,
          markPotentialCandidateLater: false,
        },
      },
      { attioConfig: { apiToken: "test" } },
    );

    expect(attioRest.patchPerson).toHaveBeenCalledOnce();
    expect(attioRest.createNote).toHaveBeenCalledOnce();
  });

  it("skips fit patch on reject but logs rejection outputs", async () => {
    vi.spyOn(attioRest, "patchPerson").mockResolvedValue(undefined);
    vi.spyOn(attioRest, "createNote").mockResolvedValue(undefined);

    await applyWriteback(
      {
        recordId: "rec_1",
        candidateName: "Alex",
        fit: { score: 55, tier: "Weak", rawSimilarity: 0.55 },
        bundle,
        mode: "reject",
        roleTitle: "Senior Engineer",
        options: {
          createHmNote: false,
          createSlngSummary: false,
          createRejectionEmail: true,
          markPotentialCandidateLater: true,
        },
      },
      { attioConfig: { apiToken: "test" } },
    );

    expect(attioRest.patchPerson).not.toHaveBeenCalled();
    expect(attioRest.createNote).toHaveBeenCalledTimes(2);
  });
});
