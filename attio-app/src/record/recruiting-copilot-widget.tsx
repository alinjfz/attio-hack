import type { App } from "attio";
import {
  Button,
  LoadingState,
  Widget,
  showToast,
  useForm,
  useQuery,
} from "attio/client";
import type { DraftBundle, FitResult, FitTier } from "@recruiting-copilot/core";
import { Suspense, useState } from "react";
import getCandidateContext from "../graphql/get-candidate-context.graphql";
import saveCvText from "../server/save-cv-text.server";
import { BundlePreview } from "./bundle-preview";
import { runResearchForRecord } from "./research-flow";
import { TierBadge } from "./tier-badge";

type TextValue = { __typename?: "TextValue"; value?: string | null };
type NumberValue = { __typename?: "NumberValue"; value?: number | null };
type SelectValue = {
  __typename?: "SelectValue";
  option?: { title?: string | null } | null;
};

function readText(value?: TextValue | null): string {
  return value?.__typename === "TextValue" ? (value.value ?? "") : "";
}

function readNumber(value?: NumberValue | null): number | undefined {
  return value?.__typename === "NumberValue" ? (value.value ?? undefined) : undefined;
}

function readTier(value?: SelectValue | null): FitTier | undefined {
  const title = value?.__typename === "SelectValue" ? value.option?.title : undefined;
  if (title === "Strong" || title === "Good" || title === "Weak" || title === "Unknown") {
    return title;
  }
  return undefined;
}

function RecruitingCopilotContent({ recordId }: { recordId: string }) {
  const { person } = useQuery(getCandidateContext, { recordId });
  const [preview, setPreview] = useState<{ fit: FitResult; bundle: DraftBundle } | null>(
    null,
  );
  const [researching, setResearching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const candidateName = person?.name?.full_name ?? "Candidate";
  const initialCv = readText(person?.cv_text);
  const fitScore = readNumber(person?.fit_score);
  const fitTier = readTier(person?.fit_tier);
  const twoLiner = readText(person?.two_liner);
  const hasRole = person?.role?.__typename === "RecordReferenceValue";

  const { Form, TextArea, SubmitButton } = useForm({
    cvText: initialCv,
  });

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
      const result = await runResearchForRecord({
        recordId,
        candidateName,
        onApproved: () => setRefreshKey((value) => value + 1),
      });
      if (result) {
        setPreview(result);
      }
    } finally {
      setResearching(false);
    }
  };

  return (
    <Widget>
      <Widget.Title>Recruiting Copilot</Widget.Title>
      <Widget.Text.Secondary>
        Research fit vs linked Role. Nothing writes until you approve.
      </Widget.Text.Secondary>

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
        disabled={researching}
      />

      {preview && <BundlePreview fit={preview.fit} bundle={preview.bundle} />}
    </Widget>
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
