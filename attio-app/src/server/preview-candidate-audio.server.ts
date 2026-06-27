import { ATTIO_API_TOKEN } from "attio/server";
import { getPersonAudioSummary } from "@recruiting-copilot/core/attio";
import type { AudioSegmentPreview } from "@recruiting-copilot/core/pipeline/batch-summarize-audio";
import { generateCandidateReadAloudScript } from "@recruiting-copilot/core/pipeline/summarize-list";
import { loadAudioDeps } from "./load-audio-deps.server";

export default async function previewCandidateAudio(
  recordId: string,
): Promise<AudioSegmentPreview> {
  const deps = await loadAudioDeps();
  const summary = await getPersonAudioSummary({ apiToken: ATTIO_API_TOKEN }, recordId);
  if (!summary) {
    throw new Error("This candidate has no fit score yet. Run research first.");
  }

  const script = await generateCandidateReadAloudScript(
    summary,
    1,
    1,
    deps.geminiClient,
    deps.geminiModel,
  );

  return {
    recordId: summary.recordId,
    name: summary.name,
    fitScore: summary.fitScore,
    fitTier: summary.fitTier,
    script,
  };
}
