import { textToSpeech } from "@recruiting-copilot/core/clients/slng";
import { isSlngEnabled } from "@recruiting-copilot/core/config/features";
import { TTS_CHUNK_MAX_CHARS } from "@recruiting-copilot/core/utils/split-tts-script";
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

  if (trimmed.length > TTS_CHUNK_MAX_CHARS) {
    throw new Error(
      `Script too long for one audio request (${trimmed.length} chars). Play uses chunked synthesis automatically.`,
    );
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

  return textToSpeech(trimmed, {
    apiKey: slngKey,
    model: await readRuntimeEnv("SLNG_TTS_MODEL"),
    voice: await readRuntimeEnv("SLNG_TTS_VOICE"),
  });
}
