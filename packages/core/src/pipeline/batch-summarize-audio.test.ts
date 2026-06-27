import { describe, expect, it, vi, afterEach } from "vitest";
import { batchGenerateCombinedAudioScript } from "./batch-summarize-audio.js";

describe("batchGenerateCombinedAudioScript", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates one combined script for all candidates in fit-score order", async () => {
    vi.spyOn(await import("./summarize-list.js"), "generateListSummaryScript").mockResolvedValue(
      "Alex leads at ninety percent. Bob follows at seventy percent.",
    );

    const preview = await batchGenerateCombinedAudioScript(
      [
        { recordId: "rec_b", name: "Bob", fitScore: 70, fitTier: "Good" },
        { recordId: "rec_a", name: "Alex", fitScore: 90, fitTier: "Strong" },
      ],
      {
        geminiClient: {} as never,
      },
    );

    expect(preview.script).toContain("Alex");
    expect(preview.candidates).toHaveLength(2);
    expect(preview.candidates[0]?.name).toBe("Alex");
    expect(preview.candidates[1]?.name).toBe("Bob");
  });
});
