import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface GeminiClientConfig {
  apiKey: string;
  model?: string;
}

export interface GenerateStructuredOptions<T extends z.ZodType> {
  prompt: string;
  schema: T;
  model?: string;
}

export function createGeminiClient(config: GeminiClientConfig): GoogleGenAI {
  return new GoogleGenAI({ apiKey: config.apiKey });
}

export async function generateStructured<T extends z.ZodType>(
  client: GoogleGenAI,
  options: GenerateStructuredOptions<T>,
): Promise<z.infer<T>> {
  const model = options.model ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const jsonSchema = zodToJsonSchema(options.schema, { $refStrategy: "none" });

  const response = await client.models.generateContent({
    model,
    contents: options.prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: jsonSchema as Record<string, unknown>,
    },
  });

  const text = response.text;
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
