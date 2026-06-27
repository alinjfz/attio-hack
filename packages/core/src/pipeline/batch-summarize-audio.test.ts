import { describe, expect, it, vi, afterEach } from "vitest";
import { batchGenerateAudioScripts } from "./batch-summarize-audio.js";

describe("batchGenerateAudioScripts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates one script preview per candidate in fit-score order", async () => {
    vi.spyOn(await import("./summarize-list.js"), "generateCandidateReadAloudScript")
      .mockResolvedValueOnce("First candidate script.")
      .mockResolvedValueOnce("Second candidate script.");

    const segments = await batchGenerateAudioScripts(
      [
        { recordId: "rec_b", name: "Bob", fitScore: 70, fitTier: "Good" },
        { recordId: "rec_a", name: "Alex", fitScore: 90, fitTier: "Strong" },
      ],
      {
        geminiClient: {} as never,
      },
    );

    expect(segments).toHaveLength(2);
    expect(segments[0]?.name).toBe("Alex");
    expect(segments[1]?.name).toBe("Bob");
    expect(segments[0]?.recordId).toBe("rec_a");
    expect(segments[0]).not.toHaveProperty("audioBase64");
  });
});
