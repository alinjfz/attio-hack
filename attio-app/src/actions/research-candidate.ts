import type { App } from "attio";
import { showToast } from "attio/client";
import { openApprovalDialog } from "../record/research-flow";
import researchCandidate from "../server/research-candidate.server";

export const researchCandidateAction: App.Record.Action = {
  id: "research-candidate",
  label: "Research candidate",
  icon: "Search",
  objects: ["people"],
  onTrigger: async ({ recordId }) => {
    try {
      const result = await researchCandidate(recordId);
      await openApprovalDialog({
        recordId,
        candidateName: "Candidate",
        result,
      });
    } catch (error) {
      await showToast({
        title: "Research failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    }
  },
};
