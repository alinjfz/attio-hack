import { ATTIO_API_TOKEN } from "attio/server";
import { getPersonAudioSummary } from "@recruiting-copilot/core/attio";
import { createGeminiClient } from "@recruiting-copilot/core/clients/gemini";
import { textToSpeech } from "@recruiting-copilot/core/clients/slng";
import { isSlngEnabled } from "@recruiting-copilot/core/config/features";
import { generateCandidateReadAloudScript } from "@recruiting-copilot/core/pipeline/summarize-list";
import type { AudioSegment } from "./batch-summarize-audio.server";
import { readRuntimeEnv, readRuntimeEnvFlag } from "./runtime-env";

export default async function summarizeCandidateAudio(
  recordId: string,
): Promise<AudioSegment> {
  const slngEnabled = await readRuntimeEnvFlag("ENABLE_SLNG");
  const slngKey = await readRuntimeEnv("SLNG_API_KEY");
  const geminiKey = await readRuntimeEnv("GEMINI_API_KEY");

  if (!isSlngEnabled({ enableSlng: slngEnabled, slngApiKey: slngKey })) {
    throw new Error(
      "SLNG audio summary is disabled. Turn on enable_slng and add slng_api_key in app settings.",
    );
  }
  if (!slngKey) {
    throw new Error("Missing slng_api_key in app settings.");
  }
  if (!geminiKey) {
    throw new Error("Missing gemini_api_key in app settings.");
  }

  const summary = await getPersonAudioSummary({ apiToken: ATTIO_API_TOKEN }, recordId);
  if (!summary) {
    throw new Error("This candidate has no fit score yet. Run research first.");
  }

  const script = await generateCandidateReadAloudScript(
    summary,
    1,
    1,
    createGeminiClient({ apiKey: geminiKey }),
    await readRuntimeEnv("GEMINI_MODEL"),
  );

  const audio = await textToSpeech(script, { apiKey: slngKey });

  return {
    recordId: summary.recordId,
    name: summary.name,
    fitScore: summary.fitScore,
    fitTier: summary.fitTier,
    script,
    audioBase64: audio.audioBase64,
    contentType: audio.contentType,
  };
}
