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

/** Gemini's legacy responseSchema is OpenAPI-only; Zod emits JSON Schema keywords it rejects. */
export function toGeminiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(schema, { $refStrategy: "none" });
  return stripSchemaMetadata(jsonSchema) as Record<string, unknown>;
}

function stripSchemaMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripSchemaMetadata);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === "$schema" || key === "$defs" || key === "definitions") {
      continue;
    }
    result[key] = stripSchemaMetadata(child);
  }
  return result;
}

export function createGeminiClient(config: GeminiClientConfig): GeminiClientLike {
  return { apiKey: config.apiKey };
}

export async function generateStructured<T extends z.ZodType>(
  client: GeminiClientLike,
  options: GenerateStructuredOptions<T>,
): Promise<z.infer<T>> {
  const model = options.model ?? "gemini-2.5-flash";
  const responseJsonSchema = toGeminiJsonSchema(options.schema);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(client.apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: options.prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema,
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
