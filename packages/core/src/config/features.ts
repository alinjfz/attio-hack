/**
 * Feature flags — all optional integrations are off unless explicitly enabled in .env.
 * Gemini + Superlinked are required for research; Tavily, SLNG, and n8n paths are optional.
 */

import { readEnv, readEnvFlag } from "./env.js";

export interface FeatureEnv {
  enableTavily?: boolean;
  tavilyApiKey?: string;
  enableSlng?: boolean;
  slngApiKey?: string;
}

function resolveFeatureEnv(overrides?: FeatureEnv) {
  const enableTavily = overrides?.enableTavily ?? readEnvFlag("ENABLE_TAVILY");
  const tavilyApiKey = overrides?.tavilyApiKey ?? readEnv("TAVILY_API_KEY");
  const enableSlng = overrides?.enableSlng ?? readEnvFlag("ENABLE_SLNG");
  const slngApiKey = overrides?.slngApiKey ?? readEnv("SLNG_API_KEY");
  return { enableTavily, tavilyApiKey, enableSlng, slngApiKey };
}

export function isTavilyEnabled(overrides?: FeatureEnv): boolean {
  const env = resolveFeatureEnv(overrides);
  return env.enableTavily && Boolean(env.tavilyApiKey);
}

export function isSlngEnabled(overrides?: FeatureEnv): boolean {
  const env = resolveFeatureEnv(overrides);
  return env.enableSlng && Boolean(env.slngApiKey);
}

export async function createTavilyClientIfEnabled(
  overrides?: FeatureEnv,
): Promise<import("../clients/tavily.js").TavilyClientLike | undefined> {
  const env = resolveFeatureEnv(overrides);
  if (!env.enableTavily || !env.tavilyApiKey) {
    return undefined;
  }

  const { createTavilyClient } = await import("../clients/tavily.js");
  return createTavilyClient({ apiKey: env.tavilyApiKey });
}