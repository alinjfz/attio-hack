import type { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { generateStructured } from "../clients/gemini.js";

export interface ListCandidateSummary {
  name: string;
  fitScore: number;
  fitTier: string;
  twoLiner?: string;
}

const ListScriptSchema = z.object({
  script: z.string(),
});

export async function generateListSummaryScript(
  candidates: ListCandidateSummary[],
  client: GoogleGenAI,
  model?: string,
): Promise<string> {
  const prompt = [
    "Write a spoken 45-second recruiting summary for a busy recruiter.",
    "Cover the top candidates, their fit scores, and one highlight each.",
    "Partnership-first tone. Do not imply any message was sent.",
    "",
    "Candidates:",
    ...candidates.map(
      (candidate, index) =>
        `${index + 1}. ${candidate.name} — ${candidate.fitScore}% (${candidate.fitTier})${
          candidate.twoLiner ? `: ${candidate.twoLiner}` : ""
        }`,
    ),
    "",
    'Return JSON: { "script": "..." }',
  ].join("\n");

  const result = await generateStructured(client, {
    prompt,
    schema: ListScriptSchema,
    model,
  });

  return result.script;
}
