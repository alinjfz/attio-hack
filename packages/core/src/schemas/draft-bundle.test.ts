import { describe, expect, it } from "vitest";
import { DraftBundleSchema, normalizeOptionalHttpUrl } from "./draft-bundle.js";

describe("normalizeOptionalHttpUrl", () => {
  it("adds https to bare domains", () => {
    expect(normalizeOptionalHttpUrl("example.com")).toBe("https://example.com/");
    expect(normalizeOptionalHttpUrl("github.com/octocat")).toBe("https://github.com/octocat");
  });

  it("keeps valid absolute URLs", () => {
    expect(normalizeOptionalHttpUrl("https://www.linkedin.com/in/maybelle-damore")).toBe(
      "https://www.linkedin.com/in/maybelle-damore",
    );
  });

  it("drops empty and non-url values", () => {
    expect(normalizeOptionalHttpUrl("")).toBeUndefined();
    expect(normalizeOptionalHttpUrl("CV")).toBeUndefined();
    expect(normalizeOptionalHttpUrl(undefined)).toBeUndefined();
  });
});

describe("DraftBundleSchema", () => {
  it("accepts webBullets with bare-domain sources", () => {
    const parsed = DraftBundleSchema.parse({
      twoLiner: "Headline",
      fitReasoning: { pros: ["a"], cons: ["b"] },
      gapAnalysis: [],
      hmNote: "note",
      clientSubmittalDraft: "submittal",
      candidateEmailDraft: "email",
      rejectionEmailDraft: "rejection",
      webBullets: [
        { text: "Portfolio site", source: "example.com" },
        { text: "GitHub", source: "github.com/octocat" },
        { text: "LinkedIn", source: "https://www.linkedin.com/in/maybelle-damore" },
      ],
    });

    expect(parsed.webBullets[0]?.source).toBe("https://example.com/");
    expect(parsed.webBullets[1]?.source).toBe("https://github.com/octocat");
    expect(parsed.webBullets[2]?.source).toBe("https://www.linkedin.com/in/maybelle-damore");
  });
});
