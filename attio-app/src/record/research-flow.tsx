import { showDialog } from "attio/client";
import type { ResearchResult } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { WritebackOptions } from "@recruiting-copilot/core/schemas/writeback-options";
import { ApprovalDialog } from "./approval-dialog";

export async function openApprovalDialog(options: {
  recordId: string;
  candidateName: string;
  result: ResearchResult;
  roleTitle?: string;
  onApproved?: () => void;
  initialOptions?: Partial<WritebackOptions>;
  focus?: "review" | "rejection";
}): Promise<void> {
  await showDialog({
    title: options.focus === "rejection" ? "Draft rejection" : "Approve research bundle",
    Dialog: ({ hideDialog }) => (
      <ApprovalDialog
        hideDialog={hideDialog}
        recordId={options.recordId}
        candidateName={options.candidateName}
        fit={options.result.fit}
        bundle={options.result.bundle}
        roleTitle={options.roleTitle}
        onApproved={options.onApproved}
        initialOptions={options.initialOptions}
        focus={options.focus}
      />
    ),
  });
}
