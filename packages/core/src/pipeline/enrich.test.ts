import { describe, expect, it, vi } from "vitest";
import { enrichCandidateContext } from "./enrich.js";
import type { TavilyClientLike } from "../clients/tavily.js";

describe("enrichCandidateContext", () => {
  it("returns merged Tavily context when enabled and CV is thin", async () => {
    process.env.ENABLE_TAVILY = "true";
    process.env.TAVILY_API_KEY = "tvly-test-key";

    const client: TavilyClientLike = {
      search: vi.fn().mockResolvedValue({
        answer: "Senior engineer at Acme",
        results: [
          {
            title: "LinkedIn",
            url: "https://linkedin.com/in/alex",
            content: "Built CRM tools",
          },
        ],
      }),
      extract: vi.fn().mockResolvedValue({
        results: [{ url: "https://linkedin.com/in/alex", rawContent: "Profile text" }],
      }),
    };

    const enrichment = await enrichCandidateContext(
      {
        roleDescription: "Engineer",
        cvText: "short",
        candidateName: "Alex Morgan",
        linkedinUrl: "https://linkedin.com/in/alex",
        roleTitle: "Senior Engineer",
      },
      client,
    );

    expect(enrichment?.snippets.length).toBeGreaterThan(0);
    expect(enrichment?.sources[0]?.url).toContain("linkedin.com");
  });
});
