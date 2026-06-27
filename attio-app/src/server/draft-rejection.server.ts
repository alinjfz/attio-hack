import { ATTIO_API_TOKEN } from "attio/server";
import { getPersonContext } from "@recruiting-copilot/core/attio";
import { createGeminiClient } from "@recruiting-copilot/core/clients/gemini";
import { generateStructured } from "@recruiting-copilot/core/clients/gemini";
import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";
import { z } from "zod";
import { readRuntimeEnv } from "./runtime-env";

const RejectionOnlySchema = z.object({
  rejectionEmailDraft: z.string(),
  fitReasoning: z.object({
    pros: z.array(z.string()),
    cons: z.array(z.string()),
  }),
});

export interface DraftRejectionResult {
  fit: FitResult;
  bundle: DraftBundle;
  roleTitle?: string;
}

export default async function draftRejection(recordId: string): Promise<DraftRejectionResult> {
  const geminiKey = await readRuntimeEnv("GEMINI_API_KEY");
  if (!geminiKey) {
    throw new Error("Missing gemini_api_key in app settings.");
  }

  const context = await getPersonContext({ apiToken: ATTIO_API_TOKEN }, recordId);
  if (!context.roleDescription) {
    throw new Error("Link this person to a Role before drafting a rejection.");
  }

  const prompt = [
    "You are a recruiting copilot drafting a polite, personalised rejection email.",
    "Never imply the message was sent. Keep it warm and professional.",
    "",
    `Candidate: ${context.name}`,
    `Role: ${context.roleTitle ?? "Open role"}`,
    "",
    "Role description:",
    context.roleDescription,
    "",
    "Candidate CV:",
    context.cvText || "(No CV text on record.)",
    "",
    'Return JSON: { "rejectionEmailDraft": "...", "fitReasoning": { "pros": [], "cons": [] } }',
  ].join("\n");

  const partial = await generateStructured(createGeminiClient({ apiKey: geminiKey }), {
    prompt,
    schema: RejectionOnlySchema,
    model: await readRuntimeEnv("GEMINI_MODEL"),
  });

  return {
    fit: {
      score: 0,
      tier: "Unknown",
      rawSimilarity: 0,
    },
    roleTitle: context.roleTitle,
    bundle: {
      twoLiner: "",
      fitReasoning: partial.fitReasoning,
      gapAnalysis: [],
      hmNote: "",
      clientSubmittalDraft: "",
      candidateEmailDraft: "",
      rejectionEmailDraft: partial.rejectionEmailDraft,
      webBullets: [],
    },
  };
}
