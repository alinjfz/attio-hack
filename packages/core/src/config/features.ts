/**
 * Feature flags — all optional integrations are off unless explicitly enabled in .env.
 * Gemini + Superlinked are required for research; Tavily, SLNG, and n8n paths are optional.
 */

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

export function isTavilyEnabled(): boolean {
  return envFlag("ENABLE_TAVILY") && Boolean(process.env.TAVILY_API_KEY?.trim());
}

export function isSlngEnabled(): boolean {
  return envFlag("ENABLE_SLNG") && Boolean(process.env.SLNG_API_KEY?.trim());
}

export async function createTavilyClientIfEnabled(): Promise<
  import("../clients/tavily.js").TavilyClientLike | undefined
> {
  if (!isTavilyEnabled()) {
    return undefined;
  }

  const { createTavilyClient } = await import("../clients/tavily.js");
  return createTavilyClient({ apiKey: process.env.TAVILY_API_KEY!.trim() });
}
