import type { TavilyClientLike } from "../clients/tavily.js";
import type { ResearchInput } from "../schemas/research-input.js";
import type { ResearchResult } from "../schemas/draft-bundle.js";
import { enrichCandidateContext } from "./enrich.js";
import { generateDrafts, type GenerateDraftsDeps } from "./generate-drafts.js";
import { finalizeFitScore, scoreFit, type ScoreFitDeps } from "./score-fit.js";

export interface RunResearchDeps {
  scoreFit: ScoreFitDeps;
  generateDrafts: GenerateDraftsDeps;
  tavilyClient?: TavilyClientLike;
}

export async function runResearch(
  input: ResearchInput,
  deps: RunResearchDeps,
): Promise<ResearchResult> {
  const enrichment = await enrichCandidateContext(input, deps.tavilyClient);
  const fit = await scoreFit(
    {
      roleDescription: input.roleDescription,
      cvText: input.cvText,
      roleTitle: input.roleTitle,
    },
    deps.scoreFit,
  );

  const bundle = await generateDrafts(
    {
      roleDescription: input.roleDescription,
      cvText: input.cvText,
      candidateName: input.candidateName,
      fit,
      enrichment,
      roleTitle: input.roleTitle,
    },
    deps.generateDrafts,
  );

  const finalFit = finalizeFitScore(fit, bundle.gapAnalysis);

  return { fit: finalFit, bundle };
}

export { enrichCandidateContext } from "./enrich.js";
