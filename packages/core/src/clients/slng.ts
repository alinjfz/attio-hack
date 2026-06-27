export interface SlngConfig {
  apiKey: string;
  endpoint?: string;
}

export interface TextToSpeechResult {
  audioBase64: string;
  contentType: string;
}

const DEFAULT_TTS_ENDPOINT = "https://api.slng.ai/v1/tts/slng/deepgram/aura:2";
const DEFAULT_TTS_VOICE = "aura-2-thalia-en";

export async function textToSpeech(
  text: string,
  config: SlngConfig,
): Promise<TextToSpeechResult> {
  const endpoint = config.endpoint ?? DEFAULT_TTS_ENDPOINT;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model: DEFAULT_TTS_VOICE,
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
