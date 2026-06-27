import type { App } from "attio";
import {
  Button,
  Forms,
  LoadingState,
  Widget,
  showToast,
  useForm,
  useQuery,
} from "attio/client";
import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";
import type { FitTier } from "@recruiting-copilot/core/schemas/fit-result";
import { Suspense, useState } from "react";
import getCandidateContext from "../graphql/get-candidate-context.graphql";
import saveCvText from "../server/save-cv-text.server";
import researchCandidate from "../server/research-candidate.server";
import { BundlePreview } from "./bundle-preview";
import draftRejection from "../server/draft-rejection.server";
import { openApprovalDialog } from "./research-flow";
import { TierBadge } from "./tier-badge";

function readText(
  value?: { __typename?: string; value?: string | null } | null,
): string {
  return value?.__typename === "TextValue" ? (value.value ?? "") : "";
}

function readNumber(
  value?: { __typename?: string; value?: number | null } | null,
): number | undefined {
  return value?.__typename === "NumberValue" ? (value.value ?? undefined) : undefined;
}

function readTier(
  value?: { __typename?: string; value?: { title?: string | null } | null } | null,
): FitTier | undefined {
  const title = value?.__typename === "SelectValue" ? value.value?.title : undefined;
  if (title === "Strong" || title === "Good" || title === "Weak" || title === "Unknown") {
    return title;
  }
  return undefined;
}

function readRoleContext(
  role?: {
    __typename?: string;
    value?: {
      id?: string;
      description?: { __typename?: string; value?: string | null } | null;
      title?: { __typename?: string; value?: string | null } | null;
    } | null;
  } | null,
): {
  roleRecordId?: string;
  roleDescription?: string;
  roleTitle?: string;
} {
  if (role?.__typename !== "RecordReferenceValue" || !role.value?.id) {
    return {};
  }

  return {
    roleRecordId: role.value.id,
    roleDescription: readText(role.value.description),
    roleTitle: readText(role.value.title),
  };
}

function RecruitingCopilotContent({ recordId }: { recordId: string }) {
  const { person } = useQuery(getCandidateContext, { recordId });
  const [preview, setPreview] = useState<{ fit: FitResult; bundle: DraftBundle } | null>(
    null,
  );
  const [researching, setResearching] = useState(false);
  const [draftingRejection, setDraftingRejection] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const candidateName = person?.name?.full_name ?? "Candidate";
  const initialCv = readText(person?.cv_text);
  const fitScore = readNumber(person?.fit_score);
  const fitTier = readTier(person?.fit_tier);
  const twoLiner = readText(person?.two_liner);
  const roleContext = readRoleContext(person?.role);
  const hasRole = !!roleContext.roleRecordId;

  const { Form, TextArea, SubmitButton } = useForm(
    {
      cvText: Forms.string(),
    },
    {
      cvText: initialCv,
    },
  );

  const handleSaveCv = async (values: { cvText: string }) => {
    try {
      await saveCvText(recordId, values.cvText);
      await showToast({
        title: "CV saved",
        text: "CV text updated on this person.",
        variant: "success",
      });
    } catch (error) {
      await showToast({
        title: "Save failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    }
  };

  const handleResearch = async () => {
    if (!hasRole) {
      await showToast({
        title: "Missing Role",
        text: "Link this person to a Role before researching.",
        variant: "error",
      });
      return;
    }

    setResearching(true);
    try {
      const result = await researchCandidate(recordId, {
        name: candidateName,
        cvText: initialCv,
        linkedinUrl: readText(person?.linkedin_url) || undefined,
        ...roleContext,
      });
      await openApprovalDialog({
        recordId,
        candidateName,
        result,
        roleTitle: roleContext.roleTitle,
        onApproved: () => setRefreshKey((value) => value + 1),
      });
      setPreview(result);
    } catch (error) {
      await showToast({
        title: "Research failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setResearching(false);
    }
  };

  const handleDraftRejection = async () => {
    if (!hasRole) {
      await showToast({
        title: "Missing Role",
        text: "Link this person to a Role before drafting a rejection.",
        variant: "error",
      });
      return;
    }

    setDraftingRejection(true);
    try {
      const result = await draftRejection(recordId);
      await openApprovalDialog({
        recordId,
        candidateName,
        result,
        roleTitle: roleContext.roleTitle,
        focus: "rejection",
        onApproved: () => setRefreshKey((value) => value + 1),
      });
    } catch (error) {
      await showToast({
        title: "Rejection draft failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setDraftingRejection(false);
    }
  };

  return (
    <>
      <Widget.TextWidget>
        <Widget.Title>Recruiting Copilot</Widget.Title>
        <Widget.Text.Secondary>
          Research fit vs linked Role. Nothing writes until you approve.
        </Widget.Text.Secondary>
      </Widget.TextWidget>

      {fitScore !== undefined && fitTier && (
        <Widget.TextWidget>
          <TierBadge tier={fitTier} score={fitScore} />
          {twoLiner ? ` — ${twoLiner}` : ""}
        </Widget.TextWidget>
      )}

      <Form onSubmit={handleSaveCv} key={`${recordId}-${refreshKey}-${initialCv}`}>
        <TextArea
          name="cvText"
          label="CV text"
          placeholder="Paste candidate CV here…"
          resizable
        />
        <SubmitButton label="Save CV" />
      </Form>

      <Button
        label={researching ? "Researching…" : "Research candidate"}
        onClick={handleResearch}
        disabled={researching || draftingRejection}
      />

      <Button
        label={draftingRejection ? "Drafting rejection…" : "Draft rejection"}
        onClick={handleDraftRejection}
        disabled={researching || draftingRejection}
      />

      {preview && <BundlePreview fit={preview.fit} bundle={preview.bundle} />}
    </>
  );
}

export const recruitingCopilotWidget: App.Record.Widget = {
  id: "recruiting-copilot",
  label: "Recruiting Copilot",
  objects: ["people"],
  Widget: ({ recordId }) => (
    <Suspense fallback={<LoadingState />}>
      <RecruitingCopilotContent recordId={recordId} />
    </Suspense>
  ),
};
