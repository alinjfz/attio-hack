import {
  extractUrl,
  mergeEnrichment,
  searchCandidate,
  shouldEnrich,
  type TavilyClientLike,
} from "../clients/tavily.js";
import type { EnrichmentContext, ResearchInput } from "../schemas/research-input.js";
import type { ResearchResult } from "../schemas/draft-bundle.js";
import { generateDrafts, type GenerateDraftsDeps } from "./generate-drafts.js";
import { scoreFit, type ScoreFitDeps } from "./score-fit.js";

export interface RunResearchDeps {
  scoreFit: ScoreFitDeps;
  generateDrafts: GenerateDraftsDeps;
  tavilyClient?: TavilyClientLike;
}

export async function enrichCandidateContext(
  input: ResearchInput,
  tavilyClient?: TavilyClientLike,
): Promise<EnrichmentContext | undefined> {
  if (!shouldEnrich(input.cvText, input.linkedinUrl) || !tavilyClient) {
    return undefined;
  }

  const contexts: EnrichmentContext[] = [];

  if (input.linkedinUrl) {
    contexts.push(await extractUrl(tavilyClient, input.linkedinUrl));
  }

  contexts.push(
    await searchCandidate(
      tavilyClient,
      input.candidateName,
      input.roleTitle ?? "candidate",
    ),
  );

  const merged = mergeEnrichment(...contexts);
  return merged.snippets.length > 0 ? merged : undefined;
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

  return { fit, bundle };
}
