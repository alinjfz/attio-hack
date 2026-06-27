import { createGeminiClient } from "@recruiting-copilot/core/clients/gemini";
import { textToSpeech } from "@recruiting-copilot/core/clients/slng";
import { isSlngEnabled } from "@recruiting-copilot/core/config/features";
import { generateListSummaryScript } from "@recruiting-copilot/core/pipeline/summarize-list";
import { readRuntimeEnv, readRuntimeEnvFlag } from "./runtime-env";

export interface SummarizeListInput {
  candidates: Array<{
    name: string;
    fitScore: number;
    fitTier: string;
    twoLiner?: string;
  }>;
}

export interface SummarizeListResult {
  script: string;
  audioBase64: string;
  contentType: string;
}

export default async function summarizeList(
  input: SummarizeListInput,
): Promise<SummarizeListResult> {
  const slngEnabled = await readRuntimeEnvFlag("ENABLE_SLNG");
  const slngKey = await readRuntimeEnv("SLNG_API_KEY");

  if (!isSlngEnabled({ enableSlng: slngEnabled, slngApiKey: slngKey })) {
    throw new Error("SLNG audio summary is disabled. Set enable_slng and slng_api_key in app settings.");
  }

  const geminiKey = await readRuntimeEnv("GEMINI_API_KEY");
  if (!geminiKey) {
    throw new Error("Missing gemini_api_key in app settings.");
  }
  if (!slngKey) {
    throw new Error("Missing slng_api_key in app settings.");
  }

  const topCandidates = input.candidates
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 3);

  if (topCandidates.length === 0) {
    throw new Error("No candidates with fit scores to summarize.");
  }

  const script = await generateListSummaryScript(
    topCandidates,
    createGeminiClient({ apiKey: geminiKey }),
    await readRuntimeEnv("GEMINI_MODEL"),
  );

  const audio = await textToSpeech(script, { apiKey: slngKey });

  return {
    script,
    audioBase64: audio.audioBase64,
    contentType: audio.contentType,
  };
}
