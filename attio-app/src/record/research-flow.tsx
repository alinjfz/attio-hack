import { showDialog } from "attio/client";
import type { ResearchResult } from "@recruiting-copilot/core/schemas/draft-bundle";
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
