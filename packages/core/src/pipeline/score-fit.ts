import { cosineSimilarity, encodeText, type SIEClientLike } from "../clients/sie.js";
import type { FitResult } from "../schemas/fit-result.js";
import { scoreToTier } from "../schemas/fit-result.js";

export interface ScoreFitInput {
  roleDescription: string;
  cvText: string;
  model?: string;
}

export interface ScoreFitDeps {
  sieClient: SIEClientLike;
  model: string;
}

export async function scoreFit(
  input: ScoreFitInput,
  deps: ScoreFitDeps,
): Promise<FitResult> {
  const roleDescription = input.roleDescription.trim();
  const cvText = input.cvText.trim();
  const model = input.model ?? deps.model;

  if (!roleDescription || !cvText) {
    return {
      score: 0,
      tier: "Unknown",
      rawSimilarity: 0,
    };
  }

  const [roleEmb, cvEmb] = await Promise.all([
    encodeText(deps.sieClient, model, roleDescription, { isQuery: true }),
    encodeText(deps.sieClient, model, cvText),
  ]);

  const rawSimilarity = cosineSimilarity(roleEmb.dense, cvEmb.dense);
  const score = Math.round(Math.max(0, Math.min(100, rawSimilarity * 100)));

  return {
    score,
    tier: scoreToTier(score),
    rawSimilarity,
  };
}
