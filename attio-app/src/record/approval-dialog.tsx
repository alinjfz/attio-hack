import {
  Button,
  Forms,
  Section,
  TextBlock,
  useForm,
  showToast,
} from "attio/client";
import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";
import {
  DEFAULT_APPROVE_OPTIONS,
  DEFAULT_REJECT_OPTIONS,
  type WritebackOptions,
} from "@recruiting-copilot/core/schemas/writeback-options";
import { useState } from "react";
import applyWritebackServer from "../server/apply-writeback.server";
import { TierBadge } from "./tier-badge";

export interface ApprovalDialogProps {
  hideDialog: () => void;
  recordId: string;
  candidateName: string;
  fit: FitResult;
  bundle: DraftBundle;
  roleTitle?: string;
  onApproved?: () => void;
  initialOptions?: Partial<WritebackOptions>;
  focus?: "review" | "rejection";
}

function formatBullets(items: string[]): string {
  if (items.length === 0) {
    return "None listed.";
  }
  return items.map((item) => `• ${item}`).join("\n");
}

function buildOptions(values: {
  createHmNote: boolean;
  createSlngSummary: boolean;
  createRejectionEmail: boolean;
  markPotentialCandidateLater: boolean;
}): WritebackOptions {
  return {
    createHmNote: values.createHmNote,
    createSlngSummary: values.createSlngSummary,
    createRejectionEmail: values.createRejectionEmail,
    markPotentialCandidateLater: values.markPotentialCandidateLater,
  };
}

export function ApprovalDialog({
  hideDialog,
  recordId,
  candidateName,
  fit,
  bundle,
  roleTitle,
  onApproved,
  initialOptions,
  focus = "review",
}: ApprovalDialogProps) {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const defaultOptions =
    focus === "rejection"
      ? { ...DEFAULT_REJECT_OPTIONS, ...initialOptions }
      : { ...DEFAULT_APPROVE_OPTIONS, ...initialOptions };

  const { Form, TextArea, SubmitButton, Checkbox, WithState } = useForm(
    {
      twoLiner: Forms.string().multiline(),
      hmNote: Forms.string().multiline(),
      rejectionEmailDraft: Forms.string().multiline(),
      createHmNote: Forms.boolean(),
      createSlngSummary: Forms.boolean(),
      createRejectionEmail: Forms.boolean(),
      markPotentialCandidateLater: Forms.boolean(),
    },
    {
      twoLiner: bundle.twoLiner ?? "",
      hmNote: bundle.hmNote ?? "",
      rejectionEmailDraft: bundle.rejectionEmailDraft ?? "",
      createHmNote: defaultOptions.createHmNote,
      createSlngSummary: defaultOptions.createSlngSummary,
      createRejectionEmail: defaultOptions.createRejectionEmail,
      markPotentialCandidateLater: defaultOptions.markPotentialCandidateLater,
    },
  );

  const runWriteback = async (
    mode: "approve" | "reject",
    values: {
      twoLiner: string;
      hmNote: string;
      rejectionEmailDraft: string;
      createHmNote: boolean;
      createSlngSummary: boolean;
      createRejectionEmail: boolean;
      markPotentialCandidateLater: boolean;
    },
  ) => {
    const options = buildOptions(values);
    const updatedBundle: DraftBundle = {
      ...bundle,
      twoLiner: values.twoLiner,
      hmNote: values.hmNote,
      rejectionEmailDraft: values.rejectionEmailDraft,
    };

    const result = await applyWritebackServer({
      recordId,
      candidateName,
      fit,
      bundle: updatedBundle,
      mode,
      options,
      roleTitle,
    });

    if (result.audioSummary) {
      setAudioSrc(
        `data:${result.audioSummary.contentType};base64,${result.audioSummary.audioBase64}`,
      );
    }

    return result;
  };

  const handleApprove = async (values: {
    twoLiner: string;
    hmNote: string;
    rejectionEmailDraft: string;
    createHmNote: boolean;
    createSlngSummary: boolean;
    createRejectionEmail: boolean;
    markPotentialCandidateLater: boolean;
  }) => {
    try {
      const result = await runWriteback("approve", values);
      await showToast({
        title: "Approved",
        text: result.audioSummary
          ? "Fit fields and selected outputs written. Audio summary ready below."
          : "Fit fields and selected outputs written to Attio.",
        variant: "success",
      });
      if (!result.audioSummary) {
        onApproved?.();
        hideDialog();
      }
    } catch (error) {
      await showToast({
        title: "Write-back failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    }
  };

  const handleReject = async (values: {
    twoLiner: string;
    hmNote: string;
    rejectionEmailDraft: string;
    createHmNote: boolean;
    createSlngSummary: boolean;
    createRejectionEmail: boolean;
    markPotentialCandidateLater: boolean;
  }) => {
    try {
      const result = await runWriteback("reject", values);
      await showToast({
        title: "Rejected for this role",
        text: result.audioSummary
          ? "Selected outputs logged. Audio summary ready below."
          : "Selected outputs logged to Attio notes.",
        variant: "success",
      });
      if (!result.audioSummary) {
        onApproved?.();
        hideDialog();
      }
    } catch (error) {
      await showToast({
        title: "Rejection write-back failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    }
  };

  const gapLines =
    bundle.gapAnalysis.length === 0
      ? "No major gaps flagged."
      : bundle.gapAnalysis
          .map((gap) => `[${gap.severity}] ${gap.area}: ${gap.gap}`)
          .join("\n");

  const webLines =
    bundle.webBullets.length === 0
      ? ""
      : bundle.webBullets
          .map((bullet) =>
            bullet.source ? `• ${bullet.text} (${bullet.source})` : `• ${bullet.text}`,
          )
          .join("\n");

  return (
    <Form onSubmit={handleApprove}>
      <Section title={`Review — ${candidateName}`}>
        {fit.score > 0 ? (
          <TierBadge tier={fit.tier} score={fit.score} />
        ) : (
          <TextBlock>Rejection draft — fit score not required.</TextBlock>
        )}
      </Section>

      {focus === "review" && (
        <>
          <Section title="Fit reasoning">
            <TextBlock>
              Pros{"\n"}
              {formatBullets(bundle.fitReasoning?.pros ?? [])}
            </TextBlock>
            <TextBlock>
              Cons{"\n"}
              {formatBullets(bundle.fitReasoning?.cons ?? [])}
            </TextBlock>
          </Section>

          <Section title="Gap analysis">
            <TextBlock>{gapLines}</TextBlock>
          </Section>
        </>
      )}

      <Section title="Editable drafts">
        {focus === "review" && (
          <>
            <TextArea name="twoLiner" label="2-line summary" resizable />
            <TextArea name="hmNote" label="HM internal note" resizable />
          </>
        )}
        <TextArea name="rejectionEmailDraft" label="Rejection email draft" resizable />
      </Section>

      {focus === "review" && (
        <>
          <Section title="Client submittal draft">
            <TextBlock>{bundle.clientSubmittalDraft || "No submittal draft generated."}</TextBlock>
          </Section>

          <Section title="Candidate email draft">
            <TextBlock>{bundle.candidateEmailDraft || "No candidate email draft generated."}</TextBlock>
          </Section>

          {webLines && (
            <Section title="Web / LinkedIn bullets">
              <TextBlock>{webLines}</TextBlock>
            </Section>
          )}
        </>
      )}

      <Section title="Output options">
        <Checkbox label="Create note for HM" name="createHmNote" />
        <Checkbox label="Create a summary with SLNG" name="createSlngSummary" />
        <Checkbox label="Create a rejection email with reason" name="createRejectionEmail" />
        <Checkbox
          label="Mark as potential candidate for later (reject for this role)"
          name="markPotentialCandidateLater"
        />
      </Section>

      {audioSrc && (
        <Section title="SLNG audio summary">
          <audio controls src={audioSrc} />
          <Button
            label="Done"
            onClick={() => {
              onApproved?.();
              hideDialog();
            }}
          />
        </Section>
      )}

      <WithState submitting values>
        {({ submitting, values }) => (
          <Button
            label="Reject for this role"
            variant="destructive"
            onClick={() => handleReject(values)}
            disabled={submitting}
          />
        )}
      </WithState>

      <SubmitButton label="Approve & write to Attio" />
    </Form>
  );
}
