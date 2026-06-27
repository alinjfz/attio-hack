import type { GeminiClientLike } from "../clients/gemini.js";
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

const SPOKEN_NAME_RULES = [
  "Always refer to each candidate by their name — repeat the name naturally.",
  "Never use he, she, they, him, her, them, or their.",
  "No filler openings (never start with 'Reviewing ... profile reveals' or similar).",
  "Start directly with a candidate name and fit score or highlight.",
].join(" ");

export async function generateListSummaryScript(
  candidates: ListCandidateSummary[],
  client: GeminiClientLike,
  model?: string,
): Promise<string> {
  const prompt = [
    "Write a spoken recruiting summary for a busy recruiter.",
    "Cover every candidate below, their fit scores, and one highlight each.",
    "Partnership-first tone. Do not imply any message was sent.",
    SPOKEN_NAME_RULES,
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

export async function generateCandidateReadAloudScript(
  candidate: ListCandidateSummary,
  position: number,
  total: number,
  client: GeminiClientLike,
  model?: string,
): Promise<string> {
  const prompt = [
    "Write a spoken 15-second recruiting read-aloud for one candidate.",
    "Partnership-first tone. Do not imply any message was sent.",
    SPOKEN_NAME_RULES,
    `This is candidate ${position} of ${total} in a batch review.`,
    "",
    `Name: ${candidate.name}`,
    `Fit: ${candidate.fitScore}% (${candidate.fitTier})`,
    candidate.twoLiner ? `Highlight: ${candidate.twoLiner}` : "",
    "",
    'Return JSON: { "script": "..." }',
  ]
    .filter(Boolean)
    .join("\n");

  const result = await generateStructured(client, {
    prompt,
    schema: ListScriptSchema,
    model,
  });

  return result.script;
}
