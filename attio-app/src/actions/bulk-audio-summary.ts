import type { App } from "attio";
import { alert, showToast } from "attio/client";
import previewCandidateAudio from "../server/preview-candidate-audio.server";
import { openAudioPlaylistDialog } from "../record/audio-playlist-flow";

const MAX_BULK = 10;

export const bulkAudioSummaryAction: App.Record.BulkAction = {
  id: "bulk-audio-summary",
  label: "Listen to candidates (SLNG)",
  icon: "Search",
  objects: ["people"],
  onTrigger: async ({ runRecordBatches }) => {
    let processed = 0;
    let limitAlerted = false;
    const segments: Awaited<ReturnType<typeof previewCandidateAudio>>[] = [];

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
            text: `Preparing up to ${Math.min(totalRecords, MAX_BULK)} scripts…`,
          };
        },
        onProgress: ({ processedRecords, totalRecords }) => ({
          title: "SLNG batch audio",
          text: `Prepared ${processedRecords}/${Math.min(totalRecords, MAX_BULK)} scripts…`,
        }),
        onComplete: () => ({
          title: "Scripts ready",
          text: "Opening playlist — audio loads one candidate at a time.",
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
          const segment = await previewCandidateAudio(recordId);
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
      const message =
        !outcome.success && outcome.error instanceof Error
          ? outcome.error.message
          : "No candidate scripts were generated. Research candidates first.";
      await showToast({
        title: "Batch audio failed",
        text: message,
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
