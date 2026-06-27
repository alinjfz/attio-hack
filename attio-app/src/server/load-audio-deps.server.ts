import { createGeminiClient } from "@recruiting-copilot/core/clients/gemini";
import { isSlngEnabled } from "@recruiting-copilot/core/config/features";
import { readRuntimeEnv, readRuntimeEnvFlag } from "./runtime-env";

export async function loadAudioDeps() {
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

  return {
    slngKey,
    geminiClient: createGeminiClient({ apiKey: geminiKey }),
    geminiModel: await readRuntimeEnv("GEMINI_MODEL"),
  };
}
