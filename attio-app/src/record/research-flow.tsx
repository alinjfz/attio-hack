import { showDialog } from "attio/client";
import type { ResearchResult } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { WritebackOptions } from "@recruiting-copilot/core/schemas/writeback-options";
import { ApprovalDialog } from "./approval-dialog";

export interface ApprovalResult {
  audioScript?: string;
}

export async function openApprovalDialog(options: {
  recordId: string;
  candidateName: string;
  result: ResearchResult;
  roleTitle?: string;
  onApproved?: (result?: ApprovalResult) => void;
  initialOptions?: Partial<WritebackOptions>;
  focus?: "review" | "rejection";
}): Promise<ApprovalResult | undefined> {
  let approvalResult: ApprovalResult | undefined;

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
        onApproved={(result) => {
          approvalResult = result;
          options.onApproved?.(result);
        }}
        initialOptions={options.initialOptions}
        focus={options.focus}
      />
    ),
  });

  return approvalResult;
}
