import type { App } from "attio";
import { alert, showToast } from "attio/client";
import batchSummarizeAudioForRecords from "../server/batch-summarize-audio.server";
import { openCombinedAudioDialog } from "../record/audio-playlist-flow";

const MAX_BULK = 10;

export const bulkAudioSummaryAction: App.Record.BulkAction = {
  id: "bulk-audio-summary",
  label: "Listen to candidates (SLNG)",
  icon: "SummarizeRecord",
  objects: ["people"],
  onTrigger: async ({ runRecordBatches }) => {
    const recordIds: string[] = [];
    let limitAlerted = false;

    const outcome = await runRecordBatches(
      {
        batchSize: 1,
        onStart: ({ totalRecords }) => {
          if (totalRecords > MAX_BULK && !limitAlerted) {
            limitAlerted = true;
            void alert({
              title: `Max ${MAX_BULK} per run`,
              text: `You selected ${totalRecords} candidates. Only the first ${MAX_BULK} will be included.`,
            });
          }
          return {
            title: "SLNG batch audio",
            text: `Preparing up to ${Math.min(totalRecords, MAX_BULK)} candidates…`,
          };
        },
        onProgress: ({ processedRecords, totalRecords }) => ({
          title: "SLNG batch audio",
          text: `Collected ${processedRecords}/${Math.min(totalRecords, MAX_BULK)} candidates…`,
        }),
        onComplete: () => ({
          title: "Script ready",
          text: "Opening combined transcript and audio.",
          variant: "success",
        }),
        onError: (_context, error) => ({
          title: "Batch audio failed",
          text: error instanceof Error ? error.message : "Unknown error",
          variant: "error",
        }),
      },
      async (batch) => {
        const recordId = batch.recordIds[0];
        if (!recordId || recordIds.length >= MAX_BULK) {
          return null;
        }
        if (recordIds.includes(recordId)) {
          return null;
        }
        recordIds.push(recordId);
        return recordId;
      },
    );

    if (recordIds.length === 0) {
      const message =
        !outcome.success && outcome.error instanceof Error
          ? outcome.error.message
          : "No candidates selected.";
      await showToast({
        title: "Batch audio failed",
        text: message,
        variant: "error",
      });
      return;
    }

    try {
      const preview = await batchSummarizeAudioForRecords(recordIds);
      await openCombinedAudioDialog({
        title: "Candidate audio summary",
        preview,
      });
    } catch (error) {
      await showToast({
        title: "Batch audio failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    }
  },
};
