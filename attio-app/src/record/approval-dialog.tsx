import {
  Badge,
  Button,
  Divider,
  Forms,
  Section,
  Typography,
  useForm,
  showToast,
} from "attio/client";
import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";
import approveWriteback from "../server/approve-writeback.server";
import { TierBadge } from "./tier-badge";

export interface ApprovalDialogProps {
  hideDialog: () => void;
  recordId: string;
  candidateName: string;
  fit: FitResult;
  bundle: DraftBundle;
  onApproved?: () => void;
}

export function ApprovalDialog({
  hideDialog,
  recordId,
  candidateName,
  fit,
  bundle,
  onApproved,
}: ApprovalDialogProps) {
  const { Form, TextArea, SubmitButton, WithState } = useForm(
    {
      twoLiner: Forms.string(),
      hmNote: Forms.string(),
    },
    {
      twoLiner: bundle.twoLiner,
      hmNote: bundle.hmNote,
    },
  );

  const handleApprove = async (values: { twoLiner: string; hmNote: string }) => {
    try {
      await approveWriteback({
        recordId,
        fit,
        bundle: {
          ...bundle,
          twoLiner: values.twoLiner,
          hmNote: values.hmNote,
        },
      });
      await showToast({
        title: "Approved",
        text: "Fit fields and HM note written to Attio.",
        variant: "success",
      });
      onApproved?.();
      hideDialog();
    } catch (error) {
      await showToast({
        title: "Write-back failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    }
  };

  return (
    <Form onSubmit={handleApprove}>
      <Section title={`Review — ${candidateName}`}>
        <TierBadge tier={fit.tier} score={fit.score} />
      </Section>

      <Section title="Fit reasoning">
        <Typography.Body>
          <strong>Pros</strong>
        </Typography.Body>
        {bundle.fitReasoning.pros.map((pro) => (
          <Typography.Body key={pro}>• {pro}</Typography.Body>
        ))}
        <Typography.Body>
          <strong>Cons</strong>
        </Typography.Body>
        {bundle.fitReasoning.cons.map((con) => (
          <Typography.Body key={con}>• {con}</Typography.Body>
        ))}
      </Section>

      <Section title="Gap analysis">
        {bundle.gapAnalysis.length === 0 ? (
          <Typography.Body>No major gaps flagged.</Typography.Body>
        ) : (
          bundle.gapAnalysis.map((gap) => (
            <Typography.Body key={`${gap.area}-${gap.gap}`}>
              <Badge color={gap.severity === "high" ? "red" : gap.severity === "medium" ? "amber" : "grey"}>
                {gap.severity}
              </Badge>{" "}
              {gap.area}: {gap.gap}
            </Typography.Body>
          ))
        )}
      </Section>

      <Section title="Editable drafts">
        <TextArea name="twoLiner" label="2-line summary" resizable />
        <TextArea name="hmNote" label="HM internal note" resizable />
      </Section>

      <Section title="Client submittal draft">
        <Typography.Body>{bundle.clientSubmittalDraft}</Typography.Body>
      </Section>

      <Section title="Candidate email draft">
        <Typography.Body>{bundle.candidateEmailDraft}</Typography.Body>
      </Section>

      {bundle.webBullets.length > 0 && (
        <Section title="Web / LinkedIn bullets">
          {bundle.webBullets.map((bullet) => (
            <Typography.Body key={bullet.text}>
              • {bullet.text}
              {bullet.source ? ` (${bullet.source})` : ""}
            </Typography.Body>
          ))}
        </Section>
      )}

      <Divider />

      <WithState submitting>
        {({ submitting }) => (
          <>
            <SubmitButton
              label={submitting ? "Writing to Attio…" : "Approve & write to Attio"}
            />
            <Button
              label="Reject"
              onClick={() => {
                hideDialog();
              }}
              disabled={submitting}
            />
          </>
        )}
      </WithState>
    </Form>
  );
}
