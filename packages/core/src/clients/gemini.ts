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
  const apiKey = config.apiKey.trim();
  assertGeminiApiKeyShape(apiKey);
  return { apiKey };
}

/** Accepts AI Studio standard (AIza) and auth (AQ.) keys; rejects OAuth tokens. */
export function assertGeminiApiKeyShape(apiKey: string): void {
  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Create one at https://aistudio.google.com/apikey (AIza or AQ. format).",
    );
  }
  if (apiKey.startsWith("ya29.")) {
    throw new Error(
      "Gemini key looks like an OAuth access token (ya29.*). Paste your AI Studio API key (AIza or AQ.) instead.",
    );
  }
  if (!apiKey.startsWith("AIza") && !apiKey.startsWith("AQ.")) {
    throw new Error(
      "Gemini API key should start with AIza (standard) or AQ. (auth key from AI Studio).",
    );
  }
}

function geminiAuthHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };
}

function formatGeminiAuthError(status: number, body: string): string {
  if (status !== 401 && status !== 403) {
    return `Gemini request failed: ${status} ${body}`;
  }

  const hints: string[] = [
    "Use a Google AI Studio API key (AIza standard or AQ. auth key) from https://aistudio.google.com/apikey",
  ];

  if (body.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")) {
    hints.unshift(
      "Auth failed — confirm the full key is copied and saved in Attio app settings (not only .env).",
    );
  }

  hints.push(
    "In Attio: Apps → recruiting-copilot → Settings → Gemini API key (research runs in Attio's cloud and does not read your local .env).",
  );

  return `Gemini authentication failed (${status}): ${hints.join(" ")}`;
}

export async function generateStructured<T extends z.ZodType>(
  client: GeminiClientLike,
  options: GenerateStructuredOptions<T>,
): Promise<z.infer<T>> {
  const model = options.model ?? "gemini-2.5-flash";
  const responseJsonSchema = toGeminiJsonSchema(options.schema);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: geminiAuthHeaders(client.apiKey),
    body: JSON.stringify({
      contents: [{ parts: [{ text: options.prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(formatGeminiAuthError(response.status, body));
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
