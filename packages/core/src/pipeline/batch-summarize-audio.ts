import type { GeminiClientLike } from "../clients/gemini.js";
import {
  generateCandidateReadAloudScript,
  type ListCandidateSummary,
} from "./summarize-list.js";

export interface BatchCandidateSummary extends ListCandidateSummary {
  recordId?: string;
}

/** Script + metadata only — audio is synthesized in a separate server call. */
export interface AudioSegmentPreview {
  recordId?: string;
  name: string;
  fitScore: number;
  fitTier: string;
  script: string;
}

export interface AudioSegment extends AudioSegmentPreview {
  audioBase64: string;
  contentType: string;
}

export interface BatchScriptDeps {
  geminiClient: GeminiClientLike;
  geminiModel?: string;
}

export async function batchGenerateAudioScripts(
  candidates: BatchCandidateSummary[],
  deps: BatchScriptDeps,
): Promise<AudioSegmentPreview[]> {
  const sorted = [...candidates].sort((a, b) => b.fitScore - a.fitScore);
  const segments: AudioSegmentPreview[] = [];

  for (let index = 0; index < sorted.length; index++) {
    const candidate = sorted[index]!;
    const script = await generateCandidateReadAloudScript(
      candidate,
      index + 1,
      sorted.length,
      deps.geminiClient,
      deps.geminiModel,
    );

    segments.push({
      recordId: candidate.recordId,
      name: candidate.name,
      fitScore: candidate.fitScore,
      fitTier: candidate.fitTier,
      script,
    });
  }

  return segments;
}

export async function summarizeCandidatesFromRecordIds(
  recordIds: string[],
  deps: BatchScriptDeps & {
    fetchSummary: (recordId: string) => Promise<BatchCandidateSummary | null>;
    maxCandidates?: number;
  },
): Promise<AudioSegmentPreview[]> {
  const uniqueIds = [...new Set(recordIds)].slice(0, deps.maxCandidates ?? 10);
  const candidates: BatchCandidateSummary[] = [];

  for (const recordId of uniqueIds) {
    const summary = await deps.fetchSummary(recordId);
    if (summary) {
      candidates.push(summary);
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      "No researched candidates found. Run research first so fit_score and fit_tier are set.",
    );
  }

  return batchGenerateAudioScripts(candidates, deps);
}
