import { tavily } from "@tavily/core";
import type { EnrichmentContext } from "../schemas/research-input.js";

export interface TavilyConfig {
  apiKey: string;
}

export interface TavilyClientLike {
  search(
    query: string,
    options?: {
      searchDepth?: "basic" | "advanced";
      maxResults?: number;
      includeAnswer?: boolean;
    },
  ): Promise<{
    answer?: string;
    results?: Array<{ title?: string; url?: string; content?: string }>;
  }>;
  extract(urls: string[]): Promise<{
    results?: Array<{ url?: string; rawContent?: string }>;
  }>;
}

export function createTavilyClient(config: TavilyConfig): TavilyClientLike {
  return tavily({ apiKey: config.apiKey });
}

export function shouldEnrich(cvText: string, linkedinUrl?: string): boolean {
  if (process.env.ENABLE_TAVILY !== "true") {
    return false;
  }
  if (cvText.length < 500) {
    return true;
  }
  if (linkedinUrl && cvText.length < 1500) {
    return true;
  }
  return false;
}

export async function searchCandidate(
  client: TavilyClientLike,
  candidateName: string,
  roleTitle: string,
): Promise<EnrichmentContext> {
  const query = `${candidateName} ${roleTitle} site:linkedin.com OR professional background`;
  const search = await client.search(query, {
    searchDepth: "advanced",
    maxResults: 5,
    includeAnswer: true,
  });

  const snippets: string[] = [];
  const sources: EnrichmentContext["sources"] = [];

  if (search.answer) {
    snippets.push(search.answer);
  }

  for (const result of search.results ?? []) {
    if (result.content) {
      snippets.push(result.content);
    }
    if (result.url) {
      sources.push({
        url: result.url,
        title: result.title ?? result.url,
      });
    }
  }

  return { snippets, sources };
}

export async function extractUrl(
  client: TavilyClientLike,
  linkedinUrl: string,
): Promise<EnrichmentContext> {
  const extract = await client.extract([linkedinUrl]);
  const snippets: string[] = [];
  const sources: EnrichmentContext["sources"] = [];

  for (const result of extract.results ?? []) {
    if (result.rawContent) {
      snippets.push(result.rawContent);
    }
    if (result.url) {
      sources.push({
        url: result.url,
        title: result.url,
      });
    }
  }

  return { snippets, sources };
}

export function mergeEnrichment(
  ...contexts: EnrichmentContext[]
): EnrichmentContext {
  const snippets: string[] = [];
  const sources: EnrichmentContext["sources"] = [];
  const seenUrls = new Set<string>();

  for (const context of contexts) {
    snippets.push(...context.snippets);
    for (const source of context.sources) {
      if (!seenUrls.has(source.url)) {
        seenUrls.add(source.url);
        sources.push(source);
      }
    }
  }

  return { snippets, sources };
}
