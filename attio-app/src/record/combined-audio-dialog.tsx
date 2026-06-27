import { Button, Section, TextBlock } from "attio/client";
import type { CombinedAudioPreview } from "@recruiting-copilot/core/pipeline/batch-summarize-audio";
import { cleanTtsScript } from "@recruiting-copilot/core/utils/split-tts-script";
import { PlayAudioSummaryButton } from "./single-audio-dialog";

function formatCandidateLine(candidate: CombinedAudioPreview["candidates"][number]): string {
  return `${candidate.name} — ${candidate.fitScore}% (${candidate.fitTier})`;
}

export function CombinedAudioDialog({
  hideDialog,
  preview,
  title = "SLNG audio summary",
}: {
  hideDialog: () => void;
  preview: CombinedAudioPreview;
  title?: string;
}) {
  const roster =
    preview.candidates.length === 0
      ? "No candidates."
      : preview.candidates.map((candidate) => formatCandidateLine(candidate)).join("\n");

  return (
    <>
      <Section title={title}>
        <TextBlock>
          {preview.candidates.length} candidate{preview.candidates.length === 1 ? "" : "s"}
        </TextBlock>
      </Section>

      <Section title="Candidates">
        <TextBlock>{roster}</TextBlock>
      </Section>

      <Section title="Transcript">
        <TextBlock>{cleanTtsScript(preview.script)}</TextBlock>
      </Section>

      <PlayAudioSummaryButton
        script={cleanTtsScript(preview.script)}
        label="Play combined audio"
      />
      <Button label="Close" icon="Cross" onClick={hideDialog} />
    </>
  );
}
