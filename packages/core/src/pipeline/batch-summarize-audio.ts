import type { GeminiClientLike } from "../clients/gemini.js";
import {
  generateListSummaryScript,
  type ListCandidateSummary,
} from "./summarize-list.js";
import { cleanTtsScript } from "../utils/split-tts-script.js";

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

export interface CombinedAudioPreview {
  script: string;
  candidates: BatchCandidateSummary[];
}

export interface AudioSegment extends AudioSegmentPreview {
  audioBase64: string;
  contentType: string;
}

export interface BatchScriptDeps {
  geminiClient: GeminiClientLike;
  geminiModel?: string;
}

export async function batchGenerateCombinedAudioScript(
  candidates: BatchCandidateSummary[],
  deps: BatchScriptDeps,
): Promise<CombinedAudioPreview> {
  const sorted = [...candidates].sort((a, b) => b.fitScore - a.fitScore);
  const script = cleanTtsScript(
    await generateListSummaryScript(sorted, deps.geminiClient, deps.geminiModel),
  );

  return {
    script,
    candidates: sorted,
  };
}

export async function summarizeCandidatesFromRecordIds(
  recordIds: string[],
  deps: BatchScriptDeps & {
    fetchSummary: (recordId: string) => Promise<BatchCandidateSummary | null>;
    maxCandidates?: number;
  },
): Promise<CombinedAudioPreview> {
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

  return batchGenerateCombinedAudioScript(candidates, deps);
}
