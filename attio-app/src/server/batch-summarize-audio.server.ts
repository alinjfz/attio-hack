import { ATTIO_API_TOKEN } from "attio/server";
import { getPersonAudioSummary } from "@recruiting-copilot/core/attio";
import {
  summarizeCandidatesFromRecordIds,
  type AudioSegmentPreview,
} from "@recruiting-copilot/core/pipeline/batch-summarize-audio";
import { loadAudioDeps } from "./load-audio-deps.server";

export type { AudioSegmentPreview };

const MAX_CANDIDATES = 10;

export default async function batchSummarizeAudioForRecords(
  recordIds: string[],
): Promise<AudioSegmentPreview[]> {
  if (recordIds.length === 0) {
    throw new Error("Select at least one candidate.");
  }

  const deps = await loadAudioDeps();
  const config = { apiToken: ATTIO_API_TOKEN };

  return summarizeCandidatesFromRecordIds(recordIds, {
    geminiClient: deps.geminiClient,
    geminiModel: deps.geminiModel,
    maxCandidates: MAX_CANDIDATES,
    fetchSummary: (recordId) => getPersonAudioSummary(config, recordId),
  });
}
