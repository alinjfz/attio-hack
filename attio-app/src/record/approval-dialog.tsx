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
import { formatGapAnalysisLines } from "@recruiting-copilot/core/utils/format-gap-analysis";
import applyWritebackServer from "../server/apply-writeback.server";
import type { ApprovalResult } from "./research-flow";
import { displayBlocks, displayBulletBlocks } from "./display-blocks";
import { TierBadge } from "./tier-badge";

export interface ApprovalDialogProps {
  hideDialog: () => void;
  recordId: string;
  candidateName: string;
  fit: FitResult;
  bundle: DraftBundle;
  roleTitle?: string;
  onApproved?: (result?: ApprovalResult) => void;
  initialOptions?: Partial<WritebackOptions>;
  focus?: "review" | "rejection";
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
  const defaultOptions =
    focus === "rejection"
      ? { ...DEFAULT_REJECT_OPTIONS, ...initialOptions }
      : { ...DEFAULT_APPROVE_OPTIONS, ...initialOptions };

  const { Form, TextArea, SubmitButton, Toggle, InputGroup, WithState } = useForm(
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

  const finishWriteback = async (
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
    successTitle: string,
    successText: string,
  ) => {
    const result = await applyWritebackServer({
      recordId,
      candidateName,
      fit,
      bundle: {
        ...bundle,
        twoLiner: values.twoLiner,
        hmNote: values.hmNote,
        rejectionEmailDraft: values.rejectionEmailDraft,
      },
      mode,
      options: buildOptions(values),
      roleTitle,
    });

    await showToast({
      title: successTitle,
      text: result.audioSummary
        ? `${successText} Use Generate audio summary on this person, then open the link in your browser.`
        : successText,
      variant: "success",
    });

    onApproved?.({
      audioScript: result.audioSummary?.script,
    });
    hideDialog();
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
      await finishWriteback(
        "approve",
        values,
        "Approved",
        "Fit fields and selected outputs written to Attio.",
      );
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
      await finishWriteback(
        "reject",
        values,
        "Rejected for this role",
        "Selected outputs logged to Attio notes.",
      );
    } catch (error) {
      await showToast({
        title: "Rejection write-back failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    }
  };

  const gapLines = formatGapAnalysisLines(bundle.gapAnalysis);

  const webBullets = bundle.webBullets.map((bullet) =>
    bullet.source ? `${bullet.text} — ${bullet.source}` : bullet.text,
  );

  return (
    <Form onSubmit={handleApprove}>
      <Section title={`Review — ${candidateName}`}>
        {fit.score > 0 ? (
          <TierBadge tier={fit.tier} score={fit.score} />
        ) : (
          <TextBlock align="left">Rejection draft — fit score not required.</TextBlock>
        )}
      </Section>

      {focus === "review" && (
        <>
          <Section title="Fit reasoning">
            <TextBlock align="left">Pros</TextBlock>
            {displayBulletBlocks(bundle.fitReasoning?.pros ?? [], "pro")}
            <TextBlock align="left">Cons</TextBlock>
            {displayBulletBlocks(bundle.fitReasoning?.cons ?? [], "con")}
          </Section>

          <Section title="Gap analysis">
            {displayBulletBlocks(gapLines, "gap", "No major gaps flagged.")}
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
            {displayBlocks(bundle.clientSubmittalDraft, "submittal", "No submittal draft.")}
          </Section>

          <Section title="Candidate email draft">
            {displayBlocks(bundle.candidateEmailDraft, "candidate-email", "No candidate email draft.")}
          </Section>

          {webBullets.length > 0 && (
            <Section title="Web / LinkedIn bullets">
              {displayBulletBlocks(webBullets, "web")}
            </Section>
          )}
        </>
      )}

      <Section title="Output options">
        <InputGroup>
          <Toggle label="Create note for HM" name="createHmNote" />
          <Toggle label="Create a summary with SLNG" name="createSlngSummary" />
          <Toggle label="Create a rejection email with reason" name="createRejectionEmail" />
          <Toggle
            label="Mark as potential candidate for later (reject for this role)"
            name="markPotentialCandidateLater"
          />
        </InputGroup>
      </Section>

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
