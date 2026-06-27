import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { generateStructured } from "../clients/gemini.js";
import { DraftBundleSchema } from "../schemas/draft-bundle.js";
import { buildDraftPrompt, generateDrafts } from "./generate-drafts.js";

const validBundle = {
  twoLiner: "Strong TypeScript engineer with CRM experience.",
  fitReasoning: {
    pros: ["8 years TypeScript", "CRM integrations"],
    cons: ["Limited Attio-specific experience"],
  },
  gapAnalysis: [
    { area: "Attio SDK", gap: "No prior Attio app shipped", severity: "low" as const },
  ],
  hmNote: "Worth a screen — strong full-stack background.",
  clientSubmittalDraft: "I'd like to submit Alex for your senior engineer role...",
  candidateEmailDraft: "Hi Alex, your background looks like a strong match...",
  webBullets: [{ text: "Led CRM migration project", source: "https://example.com/profile" }],
};

describe("DraftBundleSchema", () => {
  it("parses valid fixture JSON", () => {
    const bundle = DraftBundleSchema.parse(validBundle);
    expect(bundle.twoLiner).toContain("TypeScript");
  });
});

describe("generateDrafts", () => {
  it("returns parsed bundle from mocked Gemini response", async () => {
    const geminiClient = {} as never;
    const spy = vi.spyOn(
      await import("../clients/gemini.js"),
      "generateStructured",
    ).mockResolvedValue(validBundle);

    const bundle = await generateDrafts(
      {
        roleDescription: "Senior engineer",
        cvText: "8 years TypeScript",
        candidateName: "Alex Morgan",
        fit: { score: 82, tier: "Strong", rawSimilarity: 0.82 },
      },
      { geminiClient },
    );

    expect(bundle.clientSubmittalDraft).toContain("submit Alex");
    spy.mockRestore();
  });

  it("throws on malformed JSON from Gemini", async () => {
    const TestSchema = z.object({ ok: z.boolean() });
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({ text: "not-json" }),
      },
    } as never;

    await expect(
      generateStructured(mockClient, {
        prompt: "test",
        schema: TestSchema,
      }),
    ).rejects.toThrow(/invalid JSON/i);
  });
});

describe("buildDraftPrompt", () => {
  it("includes fit score and role description", () => {
    const prompt = buildDraftPrompt({
      roleDescription: "Build recruiting tools",
      cvText: "CRM engineer",
      candidateName: "Alex",
      fit: { score: 75, tier: "Good", rawSimilarity: 0.75 },
    });
    expect(prompt).toContain("75%");
    expect(prompt).toContain("Build recruiting tools");
    expect(prompt).toContain("partnership-first");
  });
});
