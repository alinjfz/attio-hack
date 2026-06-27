import { z } from "zod";

export const ResearchInputSchema = z.object({
  roleDescription: z.string(),
  cvText: z.string(),
  candidateName: z.string(),
  linkedinUrl: z.string().url().optional(),
  roleTitle: z.string().optional(),
});

export type ResearchInput = z.infer<typeof ResearchInputSchema>;

export const EnrichmentContextSchema = z.object({
  snippets: z.array(z.string()),
  sources: z.array(
    z.object({
      url: z.string().url(),
      title: z.string(),
    }),
  ),
});

export type EnrichmentContext = z.infer<typeof EnrichmentContextSchema>;
