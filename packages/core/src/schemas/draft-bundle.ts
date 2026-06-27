import { z } from "zod";

export const DraftBundleSchema = z.object({
  twoLiner: z.string(),
  fitReasoning: z.object({
    pros: z.array(z.string()),
    cons: z.array(z.string()),
  }),
  gapAnalysis: z.array(
    z.object({
      area: z.string(),
      gap: z.string(),
      severity: z.enum(["high", "medium", "low"]),
    }),
  ),
  hmNote: z.string(),
  clientSubmittalDraft: z.string(),
  candidateEmailDraft: z.string(),
  webBullets: z.array(
    z.object({
      text: z.string(),
      source: z.string().url().optional(),
    }),
  ),
});

export type DraftBundle = z.infer<typeof DraftBundleSchema>;

export const ResearchResultSchema = z.object({
  fit: z.object({
    score: z.number(),
    tier: z.enum(["Strong", "Good", "Weak", "Unknown"]),
    rawSimilarity: z.number(),
  }),
  bundle: DraftBundleSchema,
});

export type ResearchResult = z.infer<typeof ResearchResultSchema>;
