import type { GeminiClientLike } from "../clients/gemini.js";
import { generateStructured } from "../clients/gemini.js";
import type { EnrichmentContext } from "../schemas/research-input.js";
import { DraftBundleSchema, type DraftBundle } from "../schemas/draft-bundle.js";
import type { FitResult } from "../schemas/fit-result.js";

export interface GenerateDraftsInput {
  roleDescription: string;
  cvText: string;
  candidateName: string;
  fit: FitResult;
  enrichment?: EnrichmentContext;
  roleTitle?: string;
}

export interface GenerateDraftsDeps {
  geminiClient: GeminiClientLike;
  model?: string;
}

export function buildDraftPrompt(input: GenerateDraftsInput): string {
  const enrichmentBlock =
    input.enrichment && input.enrichment.snippets.length > 0
      ? [
          "Web research context:",
          ...input.enrichment.snippets.map((snippet, index) => `${index + 1}. ${snippet}`),
          "Sources:",
          ...input.enrichment.sources.map((source) => `- ${source.title}: ${source.url}`),
        ].join("\n")
      : "No additional web research context available.";

  return [
    "You are a recruiting copilot helping agency recruiters prepare partnership-first candidate materials.",
    "Never imply auto-send. All outputs are drafts for human approval.",
    "",
    `Candidate: ${input.candidateName}`,
    `Role title: ${input.roleTitle ?? "Not specified"}`,
    `Fit score: ${input.fit.score}% (${input.fit.tier})`,
    "",
    "Role description:",
    input.roleDescription,
    "",
    "Candidate CV:",
    input.cvText,
    "",
    enrichmentBlock,
    "",
    "Return JSON with:",
    "- twoLiner: concise 2-line candidate headline",
    "- fitReasoning: pros and cons vs the role",
    "- gapAnalysis: missing skills/seniority/location with severity",
    "- hmNote: internal hiring manager note in markdown-friendly prose with blank lines between paragraphs",
    "- clientSubmittalDraft: client-facing submittal email draft with greeting, body paragraphs, and sign-off separated by blank lines",
    "- candidateEmailDraft: optional outreach/update email draft with clear paragraph breaks",
    "- rejectionEmailDraft: polite personalised rejection email for this role with greeting, reason paragraphs, and warm closing — not sent automatically",
    "- webBullets: research highlights; include absolute source URLs (https://...) when available",
  ].join("\n");
}

export async function generateDrafts(
  input: GenerateDraftsInput,
  deps: GenerateDraftsDeps,
): Promise<DraftBundle> {
  return generateStructured(deps.geminiClient, {
    prompt: buildDraftPrompt(input),
    schema: DraftBundleSchema,
    model: deps.model,
  });
}
