import { z } from "zod";

export const FitTierSchema = z.enum(["Strong", "Good", "Weak", "Unknown"]);
export type FitTier = z.infer<typeof FitTierSchema>;

export const FitResultSchema = z.object({
  score: z.number().min(0).max(100),
  tier: FitTierSchema,
  rawSimilarity: z.number().min(-1).max(1),
});

export type FitResult = z.infer<typeof FitResultSchema>;

export function scoreToTier(score: number): FitTier {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Weak";
  return "Unknown";
}
