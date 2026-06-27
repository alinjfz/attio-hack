import { cosineSimilarity, encodeText, encodeTexts, type SIEClientLike } from "../clients/sie.js";
import type { DraftBundle } from "../schemas/draft-bundle.js";
import type { FitResult } from "../schemas/fit-result.js";
import { scoreToTier } from "../schemas/fit-result.js";

export interface ScoreFitInput {
  roleDescription: string;
  cvText: string;
  roleTitle?: string;
  model?: string;
}

export interface ScoreFitDeps {
  sieClient: SIEClientLike;
  model: string;
}

/** Split CV into sections so Superlinked compares the role to the best-matching chunk (not one diluted whole-doc vector). */
export function splitCvIntoChunks(cvText: string, maxChunks = 8): string[] {
  const sections = cvText
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter((section) => section.length >= 30);

  if (sections.length === 0) {
    const trimmed = cvText.trim();
    return trimmed ? [trimmed] : [];
  }

  if (sections.length <= maxChunks) {
    return sections;
  }

  const head = sections.slice(0, maxChunks - 1);
  const tail = sections.slice(maxChunks - 1).join("\n\n");
  return [...head, tail];
}

function buildRoleQuery(input: ScoreFitInput): string {
  return [input.roleTitle?.trim(), input.roleDescription.trim()].filter(Boolean).join("\n\n");
}

/**
 * BGE-M3 bi-encoder cosine scores cluster in a narrow band (~0.58–0.78) for role-vs-CV
 * retrieval. Map that band to 0–100 so strong semantic matches read as 85–95%, not low 60s.
 */
export function similarityToFitPercent(rawSimilarity: number): number {
  const SIM_FLOOR = 0.58;
  const SIM_CEILING = 0.76;
  const scaled = ((rawSimilarity - SIM_FLOOR) / (SIM_CEILING - SIM_FLOOR)) * 100;
  return Math.round(Math.max(0, Math.min(100, scaled)));
}

/** Perfect semantic + requirements match: no gaps → 100%. */
export function finalizeFitScore(
  fit: FitResult,
  gapAnalysis: DraftBundle["gapAnalysis"],
): FitResult {
  if (gapAnalysis.length > 0) {
    return fit;
  }

  return {
    ...fit,
    score: 100,
    tier: "Strong",
  };
}

export async function scoreFit(
  input: ScoreFitInput,
  deps: ScoreFitDeps,
): Promise<FitResult> {
  const roleQuery = buildRoleQuery(input);
  const cvText = input.cvText.trim();
  const model = input.model ?? deps.model;

  if (!roleQuery || !cvText) {
    return {
      score: 0,
      tier: "Unknown",
      rawSimilarity: 0,
    };
  }

  const chunks = splitCvIntoChunks(cvText);
  const [roleEmb, chunkEmbs] = await Promise.all([
    encodeText(deps.sieClient, model, roleQuery, { isQuery: true }),
    encodeTexts(deps.sieClient, model, chunks),
  ]);

  const similarities = chunkEmbs.map((chunkEmb) => cosineSimilarity(roleEmb.dense, chunkEmb.dense));
  const rawSimilarity = similarities.length > 0 ? Math.max(...similarities) : 0;
  const score = similarityToFitPercent(rawSimilarity);

  return {
    score,
    tier: scoreToTier(score),
    rawSimilarity,
  };
}
