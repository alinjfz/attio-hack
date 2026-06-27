export interface SlngConfig {
  apiKey: string;
  endpoint?: string;
}

export interface TextToSpeechResult {
  audioBase64: string;
  contentType: string;
}

export async function textToSpeech(
  text: string,
  config: SlngConfig,
): Promise<TextToSpeechResult> {
  const endpoint =
    config.endpoint ??
    "https://api.slng.ai/v1/tts/slng/deepgram/aura:2-en";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "aura-2-thalia-en",
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`SLNG TTS failed: ${response.status} ${await response.text()}`);
  }

  const buffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(buffer).toString("base64");
  const contentType = response.headers.get("content-type") ?? "audio/wav";

  return { audioBase64, contentType };
}
