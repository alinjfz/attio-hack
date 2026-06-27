import { ATTIO_API_TOKEN } from "attio/server";
import {
  getPersonAudioSummary,
  listRecruitingListRecordIds,
} from "@recruiting-copilot/core/attio";
import { createGeminiClient } from "@recruiting-copilot/core/clients/gemini";
import { isSlngEnabled } from "@recruiting-copilot/core/config/features";
import {
  batchSummarizeAudio,
  type AudioSegment,
} from "@recruiting-copilot/core/pipeline/batch-summarize-audio";
import { readRuntimeEnv, readRuntimeEnvFlag } from "./runtime-env";

export type { AudioSegment };

const MAX_CANDIDATES = 10;

async function loadSlngDeps() {
  const slngEnabled = await readRuntimeEnvFlag("ENABLE_SLNG");
  const slngKey = await readRuntimeEnv("SLNG_API_KEY");
  const geminiKey = await readRuntimeEnv("GEMINI_API_KEY");

  if (!isSlngEnabled({ enableSlng: slngEnabled, slngApiKey: slngKey })) {
    throw new Error(
      "SLNG audio summary is disabled. Turn on enable_slng and add slng_api_key in app settings.",
    );
  }
  if (!slngKey) {
    throw new Error("Missing slng_api_key in app settings.");
  }
  if (!geminiKey) {
    throw new Error("Missing gemini_api_key in app settings.");
  }

  return {
    slngKey,
    geminiClient: createGeminiClient({ apiKey: geminiKey }),
    geminiModel: await readRuntimeEnv("GEMINI_MODEL"),
  };
}

async function summarizeRecordIds(recordIds: string[]): Promise<AudioSegment[]> {
  const config = { apiToken: ATTIO_API_TOKEN };
  const uniqueIds = [...new Set(recordIds)].slice(0, MAX_CANDIDATES);
  const candidates = [];

  for (const recordId of uniqueIds) {
    const summary = await getPersonAudioSummary(config, recordId);
    if (summary) {
      candidates.push(summary);
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      "No researched candidates found. Run research first so fit_score and fit_tier are set.",
    );
  }

  const deps = await loadSlngDeps();
  const segments = await batchSummarizeAudio(candidates, {
    geminiClient: deps.geminiClient,
    geminiModel: deps.geminiModel,
    slngApiKey: deps.slngKey,
  });

  return segments.map((segment, index) => ({
    ...segment,
    recordId: candidates[index]?.recordId ?? segment.recordId,
  }));
}

export default async function batchSummarizeAudioForRecords(
  recordIds: string[],
): Promise<AudioSegment[]> {
  if (recordIds.length === 0) {
    throw new Error("Select at least one candidate.");
  }
  return summarizeRecordIds(recordIds);
}

export async function batchSummarizeRecruitingList(): Promise<AudioSegment[]> {
  const config = { apiToken: ATTIO_API_TOKEN };
  const recordIds = await listRecruitingListRecordIds(config);
  if (recordIds.length === 0) {
    throw new Error("The recruiting list has no candidates.");
  }
  return summarizeRecordIds(recordIds);
}
