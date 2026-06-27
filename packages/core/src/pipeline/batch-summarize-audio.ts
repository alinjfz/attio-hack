import type { GeminiClientLike } from "../clients/gemini.js";
import { textToSpeech } from "../clients/slng.js";
import {
  generateCandidateReadAloudScript,
  type ListCandidateSummary,
} from "./summarize-list.js";

export interface BatchCandidateSummary extends ListCandidateSummary {
  recordId?: string;
}

export interface AudioSegment {
  recordId?: string;
  name: string;
  fitScore: number;
  fitTier: string;
  script: string;
  audioBase64: string;
  contentType: string;
}

export interface BatchSummarizeAudioDeps {
  geminiClient: GeminiClientLike;
  geminiModel?: string;
  slngApiKey: string;
}

export async function batchSummarizeAudio(
  candidates: BatchCandidateSummary[],
  deps: BatchSummarizeAudioDeps,
): Promise<AudioSegment[]> {
  const sorted = [...candidates].sort((a, b) => b.fitScore - a.fitScore);
  const segments: AudioSegment[] = [];

  for (let index = 0; index < sorted.length; index++) {
    const candidate = sorted[index]!;
    const script = await generateCandidateReadAloudScript(
      candidate,
      index + 1,
      sorted.length,
      deps.geminiClient,
      deps.geminiModel,
    );

    const audio = await textToSpeech(script, { apiKey: deps.slngApiKey });

    segments.push({
      recordId: candidate.recordId,
      name: candidate.name,
      fitScore: candidate.fitScore,
      fitTier: candidate.fitTier,
      script,
      audioBase64: audio.audioBase64,
      contentType: audio.contentType,
    });
  }

  return segments;
}
