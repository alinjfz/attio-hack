import { describe, expect, it, vi } from "vitest";
import { generateListSummaryScript } from "./summarize-list.js";

describe("generateListSummaryScript", () => {
  it("returns spoken script from Gemini structured output", async () => {
    const spy = vi
      .spyOn(await import("../clients/gemini.js"), "generateStructured")
      .mockResolvedValue({ script: "Top candidate Alex scores 88 percent…" });

    const script = await generateListSummaryScript(
      [{ name: "Alex", fitScore: 88, fitTier: "Strong", twoLiner: "TS expert" }],
      {} as never,
    );

    expect(script).toContain("Alex");
    spy.mockRestore();
  });
});
