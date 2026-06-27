import type { App } from "attio";
import { alert, showToast } from "attio/client";
import summarizeCandidateAudio from "../server/summarize-candidate-audio.server";
import { openAudioPlaylistDialog } from "../record/audio-playlist-flow";

const MAX_BULK = 10;

export const bulkAudioSummaryAction: App.Record.BulkAction = {
  id: "bulk-audio-summary",
  label: "Listen to candidates (SLNG)",
  icon: "Microphone",
  objects: ["people"],
  onTrigger: async ({ runRecordBatches, recordIds }) => {
    let processed = 0;
    let limitAlerted = false;
    const segments: Awaited<ReturnType<typeof summarizeCandidateAudio>>[] = [];

    const outcome = await runRecordBatches(
      {
        batchSize: 1,
        onStart: ({ totalRecords }) => {
          if (totalRecords > MAX_BULK && !limitAlerted) {
            limitAlerted = true;
            void alert({
              title: `Max ${MAX_BULK} per run`,
              text: `You selected ${totalRecords} candidates. Only the first ${MAX_BULK} will be read aloud.`,
            });
          }
          return {
            title: "SLNG batch audio",
            text: `Reading up to ${Math.min(totalRecords, MAX_BULK)} candidates one by one…`,
          };
        },
        onProgress: ({ processedRecords, totalRecords }) => ({
          title: "SLNG batch audio",
          text: `Generated ${processedRecords}/${Math.min(totalRecords, MAX_BULK)} audio clips…`,
        }),
        onComplete: () => ({
          title: "Audio ready",
          text: "Opening playlist — candidates play one by one.",
          variant: "success",
        }),
        onError: (_context, error) => ({
          title: "Batch audio failed",
          text: error instanceof Error ? error.message : "Unknown error",
          variant: "error",
        }),
      },
      async (batch) => {
        if (processed >= MAX_BULK) {
          return null;
        }

        const recordId = batch.recordIds[0];
        if (!recordId) {
          return null;
        }
        if (segments.some((segment) => segment.recordId === recordId)) {
          return null;
        }

        processed += 1;

        try {
          const segment = await summarizeCandidateAudio(recordId);
          segments.push(segment);
          return segment;
        } catch (error) {
          await showToast({
            title: "Skipped candidate",
            text: error instanceof Error ? error.message : "Unknown error",
            variant: "error",
          });
          return null;
        }
      },
    );

    if (segments.length === 0) {
      await showToast({
        title: "Batch audio failed",
        text:
          outcome.error instanceof Error
            ? outcome.error.message
            : "No candidate audio was generated. Research candidates first.",
        variant: "error",
      });
      return;
    }

    segments.sort((a, b) => b.fitScore - a.fitScore);

    await openAudioPlaylistDialog({
      title: "Candidate audio playlist",
      segments,
    });
  },
};
