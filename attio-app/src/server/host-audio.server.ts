import { isSlngEnabled } from "@recruiting-copilot/core/config/features";
import {
  cleanTtsScript,
  splitScriptForTts,
} from "@recruiting-copilot/core/utils/split-tts-script";
import { readRuntimeEnv, readRuntimeEnvFlag } from "./runtime-env";

export interface HostedAudioPart {
  part: number;
  total: number;
  url: string;
  downloadUrl: string;
}

interface TtsApiResponse {
  url: string;
  downloadUrl: string;
}

export default async function hostAudioForScript(
  script: string,
): Promise<HostedAudioPart[]> {
  const trimmed = cleanTtsScript(script);
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

  const apiPublicUrl = await readRuntimeEnv("API_PUBLIC_URL");
  const webhookSecret = await readRuntimeEnv("WEBHOOK_SECRET");
  if (!apiPublicUrl) {
    throw new Error(
      "Missing api_public_url in app settings. Run pnpm dev:api and expose it with ngrok (see README).",
    );
  }
  if (!webhookSecret) {
    throw new Error("Missing webhook_secret in app settings (same value as WEBHOOK_SECRET in .env).");
  }

  const baseUrl = apiPublicUrl.replace(/\/$/, "");
  const chunks = splitScriptForTts(trimmed);
  const parts: HostedAudioPart[] = [];

  for (let index = 0; index < chunks.length; index++) {
    const response = await fetch(`${baseUrl}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": webhookSecret,
      },
      body: JSON.stringify({ text: chunks[index] }),
    });

    if (!response.ok) {
      throw new Error(`Audio hosting failed: ${response.status} ${await response.text()}`);
    }

    const payload = (await response.json()) as TtsApiResponse;
    parts.push({
      part: index + 1,
      total: chunks.length,
      url: payload.url,
      downloadUrl: payload.downloadUrl,
    });
  }

  return parts;
}
