import type { GeminiClientLike } from "../clients/gemini.js";
import { generateStructured } from "../clients/gemini.js";
import type { EnrichmentContext } from "../schemas/research-input.js";
import { DraftBundleSchema, type DraftBundle } from "../schemas/draft-bundle.js";
import type { FitResult } from "../schemas/fit-result.js";
import { ensureParagraphBreaks } from "../utils/format-prose.js";

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
    "  - pros: concrete strengths tied to the role brief (5-10 bullets when warranted)",
    "  - cons: for strong matches (many pros, no high-severity gaps), use at most 1-2 deliberately nitpicky or lightly sarcastic stretch observations — not real hiring blockers (e.g. 'possibly too kind in stakeholder updates', 'suspicious track record of shipping too fast'). Do not invent substantive gaps (e.g. reactive vs proactive embedding) when the CV shows client-facing delivery, requirements discovery, and cross-functional work. Skip filler cons.",
    "- gapAnalysis: only genuine gaps; area must be a plain-English label (no [medium] or bracketed severity tokens in area); severity is the separate enum field only; return an empty array when the candidate fully meets the role with no material gaps",
    "- hmNote: internal hiring manager note in markdown-friendly prose with blank lines between paragraphs",
    "- clientSubmittalDraft: client-facing submittal email draft; separate greeting, each body paragraph, and sign-off with blank lines (use real newline characters, not just spaces)",
    "- candidateEmailDraft: outreach/update email draft with blank lines between paragraphs (use real newline characters)",
    "- rejectionEmailDraft: polite personalised rejection email for this role with greeting, reason paragraphs, and warm closing — not sent automatically",
    "- webBullets: research highlights; include absolute source URLs (https://...) when available",
  ].join("\n");
}

export async function generateDrafts(
  input: GenerateDraftsInput,
  deps: GenerateDraftsDeps,
): Promise<DraftBundle> {
  const bundle = await generateStructured(deps.geminiClient, {
    prompt: buildDraftPrompt(input),
    schema: DraftBundleSchema,
    model: deps.model,
  });

  return normalizeDraftBundle(bundle);
}

function normalizeDraftBundle(bundle: DraftBundle): DraftBundle {
  return {
    ...bundle,
    twoLiner: ensureParagraphBreaks(bundle.twoLiner),
    hmNote: ensureParagraphBreaks(bundle.hmNote),
    clientSubmittalDraft: ensureParagraphBreaks(bundle.clientSubmittalDraft),
    candidateEmailDraft: ensureParagraphBreaks(bundle.candidateEmailDraft),
    rejectionEmailDraft: ensureParagraphBreaks(bundle.rejectionEmailDraft),
  };
}
