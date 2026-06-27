import { isSlngEnabled } from "@recruiting-copilot/core/config/features";
import {
  assertPublicApiReachable,
  formatAudioHostingError,
} from "@recruiting-copilot/core/utils/audio-hosting-errors";
import { cleanTtsScript } from "@recruiting-copilot/core/utils/split-tts-script";
import { readRuntimeEnv, readRuntimeEnvFlag } from "./runtime-env";

export interface HostedAudio {
  url: string;
  downloadUrl: string;
}

interface TtsApiResponse {
  url: string;
  downloadUrl: string;
}

export default async function hostAudioForScript(
  script: string,
): Promise<HostedAudio> {
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
      "Missing api_public_url in app settings. Run pnpm api:public and paste the tunnel URL it prints.",
    );
  }
  if (!webhookSecret) {
    throw new Error("Missing webhook_secret in app settings (same value as WEBHOOK_SECRET in .env).");
  }

  if (
    apiPublicUrl.includes("localhost") ||
    apiPublicUrl.includes("127.0.0.1") ||
    apiPublicUrl.includes("host.docker.internal")
  ) {
    throw new Error(
      "api_public_url must be a public https URL (trycloudflare.com), not localhost. Run pnpm api:public and paste the URL into Attio app settings.",
    );
  }

  const baseUrl = apiPublicUrl.replace(/\/$/, "");
  await assertPublicApiReachable(baseUrl);

  const response = await fetch(`${baseUrl}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": webhookSecret,
    },
    body: JSON.stringify({ text: trimmed }),
  });

  if (!response.ok) {
    throw new Error(formatAudioHostingError(response.status, await response.text(), baseUrl));
  }

  const payload = (await response.json()) as TtsApiResponse;
  return {
    url: payload.url,
    downloadUrl: payload.downloadUrl,
  };
}
