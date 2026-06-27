import { ATTIO_API_TOKEN } from "attio/server";
import { getPersonAudioSummary } from "@recruiting-copilot/core/attio";
import {
  summarizeCandidatesFromRecordIds,
  type CombinedAudioPreview,
} from "@recruiting-copilot/core/pipeline/batch-summarize-audio";
import { loadAudioDeps } from "./load-audio-deps.server";

export type { CombinedAudioPreview };

const MAX_CANDIDATES = 10;

export default async function batchSummarizeAudioForRecords(
  recordIds: string[],
): Promise<CombinedAudioPreview> {
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
