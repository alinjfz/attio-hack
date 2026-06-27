import { showDialog, showToast } from "attio/client";
import type { ResearchResult } from "@recruiting-copilot/core";
import researchCandidate from "../server/research-candidate.server";
import { ApprovalDialog } from "./approval-dialog";

export async function openApprovalDialog(options: {
  recordId: string;
  candidateName: string;
  result: ResearchResult;
  onApproved?: () => void;
}): Promise<void> {
  await showDialog({
    title: "Approve research bundle",
    Dialog: ({ hideDialog }) => (
      <ApprovalDialog
        hideDialog={hideDialog}
        recordId={options.recordId}
        candidateName={options.candidateName}
        fit={options.result.fit}
        bundle={options.result.bundle}
        onApproved={options.onApproved}
      />
    ),
  });
}

export async function runResearchForRecord(options: {
  recordId: string;
  candidateName: string;
  onApproved?: () => void;
}): Promise<ResearchResult | null> {
  try {
    const result = await researchCandidate(options.recordId);
    await openApprovalDialog({
      recordId: options.recordId,
      candidateName: options.candidateName,
      result,
      onApproved: options.onApproved,
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
}
