import { ATTIO_API_TOKEN } from "attio/server";
import { getPersonAudioSummary, getPersonAudioSummaryScript } from "@recruiting-copilot/core/attio";
import type { CombinedAudioPreview } from "@recruiting-copilot/core/pipeline/batch-summarize-audio";

export default async function personCombinedAudio(
  recordId: string,
): Promise<CombinedAudioPreview> {
  const config = { apiToken: ATTIO_API_TOKEN };
  const summary = await getPersonAudioSummary(config, recordId);
  const script = await getPersonAudioSummaryScript(config, recordId);

  if (!script?.trim()) {
    throw new Error(
      "No audio summary on this person. Approve research with Create a summary with SLNG first.",
    );
  }

  if (!summary) {
    return {
      script: script.trim(),
      candidates: [
        {
          recordId,
          name: "Candidate",
          fitScore: 0,
          fitTier: "Unknown",
        },
      ],
    };
  }

  return {
    script: script.trim(),
    candidates: [summary],
  };
}
