import {
  extractUrl,
  mergeEnrichment,
  searchCandidate,
  shouldEnrich,
  type TavilyClientLike,
} from "../clients/tavily.js";
import type { EnrichmentContext, ResearchInput } from "../schemas/research-input.js";

export { shouldEnrich };

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
