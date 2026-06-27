import { readEnv } from "../config/env.js";

export interface SlngConfig {
  apiKey: string;
  endpoint?: string;
  /** URL path model id, e.g. `slng/deepgram/aura:2-en` */
  model?: string;
  /** Voice id sent in the JSON body, e.g. `aura-2-thalia-en` */
  voice?: string;
}

export interface TextToSpeechResult {
  audioBase64: string;
  contentType: string;
}

/** SLNG-hosted Aura 2 English — deployed default (not `aura:2`, which returns 503). */
export const DEFAULT_SLNG_TTS_MODEL = "slng/deepgram/aura:2-en";
export const DEFAULT_SLNG_TTS_VOICE = "aura-2-thalia-en";

export function buildSlngTtsEndpoint(modelId: string): string {
  return `https://api.slng.ai/v1/tts/${modelId}`;
}

export async function textToSpeech(
  text: string,
  config: SlngConfig,
): Promise<TextToSpeechResult> {
  const model = config.model ?? readEnv("SLNG_TTS_MODEL") ?? DEFAULT_SLNG_TTS_MODEL;
  const voice = config.voice ?? readEnv("SLNG_TTS_VOICE") ?? DEFAULT_SLNG_TTS_VOICE;
  const endpoint = config.endpoint ?? readEnv("SLNG_TTS_ENDPOINT") ?? buildSlngTtsEndpoint(model);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model: voice,
    }),
  });

  if (!response.ok) {
    throw new Error(`SLNG TTS failed: ${response.status} ${await response.text()}`);
  }

  const buffer = await response.arrayBuffer();
  const audioBase64 = arrayBufferToBase64(buffer);
  const contentType = response.headers.get("content-type") ?? "audio/wav";

  return { audioBase64, contentType };
}

/** Works in Attio server runtime (no Node `Buffer`). */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  throw new Error("base64 encoding is unavailable in this runtime");
}
