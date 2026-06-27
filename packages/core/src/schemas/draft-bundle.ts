import { z } from "zod";

/** Accept bare domains from LLM output; drop values that still aren't valid URLs. */
export function normalizeOptionalHttpUrl(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.includes(".")
      ? `https://${trimmed}`
      : undefined;

  if (!withProtocol) {
    return undefined;
  }

  try {
    return new URL(withProtocol).href;
  } catch {
    return undefined;
  }
}

const optionalHttpUrl = z.preprocess(
  normalizeOptionalHttpUrl,
  z.string().url().optional(),
);

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
  rejectionEmailDraft: z.string(),
  webBullets: z.array(
    z.object({
      text: z.string(),
      source: optionalHttpUrl,
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
