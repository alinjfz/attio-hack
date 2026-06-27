import { z } from "zod";

export const WritebackOptionsSchema = z.object({
  createHmNote: z.boolean(),
  createSlngSummary: z.boolean(),
  createRejectionEmail: z.boolean(),
  markPotentialCandidateLater: z.boolean(),
});

export type WritebackOptions = z.infer<typeof WritebackOptionsSchema>;

export type WritebackMode = "approve" | "reject";

export const DEFAULT_APPROVE_OPTIONS: WritebackOptions = {
  createHmNote: true,
  createSlngSummary: false,
  createRejectionEmail: false,
  markPotentialCandidateLater: false,
};

export const DEFAULT_REJECT_OPTIONS: WritebackOptions = {
  createHmNote: false,
  createSlngSummary: false,
  createRejectionEmail: true,
  markPotentialCandidateLater: true,
};
