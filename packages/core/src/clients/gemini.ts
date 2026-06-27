import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface GeminiClientConfig {
  apiKey: string;
  model?: string;
}

export interface GeminiClientLike {
  apiKey: string;
}

export interface GenerateStructuredOptions<T extends z.ZodType> {
  prompt: string;
  schema: T;
  model?: string;
}

export function createGeminiClient(config: GeminiClientConfig): GeminiClientLike {
  return { apiKey: config.apiKey };
}

export async function generateStructured<T extends z.ZodType>(
  client: GeminiClientLike,
  options: GenerateStructuredOptions<T>,
): Promise<z.infer<T>> {
  const model = options.model ?? "gemini-2.5-flash";
  const jsonSchema = zodToJsonSchema(options.schema, { $refStrategy: "none" });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(client.apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: options.prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }

  return options.schema.parse(parsed);
}
