import { textToSpeech } from "@recruiting-copilot/core/clients/slng";
import { isSlngEnabled } from "@recruiting-copilot/core/config/features";
import { readRuntimeEnv, readRuntimeEnvFlag } from "./runtime-env";

export interface SynthesizeAudioResult {
  audioBase64: string;
  contentType: string;
}

export default async function synthesizeAudio(script: string): Promise<SynthesizeAudioResult> {
  const trimmed = script.trim();
  if (!trimmed) {
    throw new Error("Cannot synthesize empty audio script.");
  }

  const slngEnabled = await readRuntimeEnvFlag("ENABLE_SLNG");
  const slngKey = await readRuntimeEnv("SLNG_API_KEY");

  if (!isSlngEnabled({ enableSlng: slngEnabled, slngApiKey: slngKey })) {
    throw new Error(
      "SLNG audio summary is disabled. Turn on enable_slng and add slng_api_key in app settings.",
    );
  }
  if (!slngKey) {
    throw new Error("Missing slng_api_key in app settings.");
  }

  return textToSpeech(trimmed, { apiKey: slngKey });
}
