import type { App } from "attio";
import { alert, showToast } from "attio/client";
import { openApprovalDialog } from "../record/research-flow";
import researchCandidate from "../server/research-candidate.server";

const MAX_BULK = 5;

export const bulkResearchAction: App.Record.BulkAction = {
  id: "bulk-research",
  label: "Research candidates",
  icon: "Search",
  objects: ["people"],
  onTrigger: async ({ runRecordBatches }) => {
    let processed = 0;
    let limitAlerted = false;

    const outcome = await runRecordBatches(
      {
        batchSize: 1,
        onStart: ({ totalRecords }) => {
          if (totalRecords > MAX_BULK && !limitAlerted) {
            limitAlerted = true;
            void alert({
              title: "Max 5 per run",
              text: `You selected ${totalRecords} candidates. Only the first ${MAX_BULK} will be researched.`,
            });
          }
          return {
            title: "Bulk research",
            text: `Researching up to ${Math.min(totalRecords, MAX_BULK)} candidates…`,
          };
        },
        onProgress: ({ processedRecords, totalRecords }) => ({
          title: "Bulk research",
          text: `${processedRecords}/${Math.min(totalRecords, MAX_BULK)} complete`,
        }),
        onComplete: () => ({
          title: "Bulk research complete",
          text: "Approve each bundle to write fit fields and notes.",
          variant: "success",
        }),
        onError: (_context, error) => ({
          title: "Bulk research error",
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

        processed += 1;

        try {
          const result = await researchCandidate(recordId);
          await openApprovalDialog({
            recordId,
            candidateName: "Candidate",
            result,
          });
          return result;
        } catch (error) {
          await showToast({
            title: "Research failed",
            text: error instanceof Error ? error.message : "Unknown error",
            variant: "error",
          });
          return null;
        }
      },
    );

    if (!outcome.success && outcome.partialResults.length === 0) {
      await showToast({
        title: "Bulk research failed",
        text:
          outcome.error instanceof Error
            ? outcome.error.message
            : "No candidates were researched.",
        variant: "error",
      });
    }
  },
};
