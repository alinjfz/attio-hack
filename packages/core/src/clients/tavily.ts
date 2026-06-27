import { isTavilyEnabled } from "../config/features.js";
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
  if (!config.apiKey?.trim()) {
    throw new Error("TAVILY_API_KEY is required when ENABLE_TAVILY=true");
  }

  const apiKey = config.apiKey.trim();

  return {
    async search(query, options) {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: options?.searchDepth ?? "basic",
          max_results: options?.maxResults ?? 5,
          include_answer: options?.includeAnswer ?? false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily search failed: ${response.status} ${await response.text()}`);
      }

      return (await response.json()) as Awaited<ReturnType<TavilyClientLike["search"]>>;
    },

    async extract(urls) {
      const response = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          urls,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily extract failed: ${response.status} ${await response.text()}`);
      }

      return (await response.json()) as Awaited<ReturnType<TavilyClientLike["extract"]>>;
    },
  };
}

export function shouldEnrich(cvText: string, linkedinUrl?: string): boolean {
  if (!isTavilyEnabled()) {
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
