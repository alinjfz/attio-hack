import type { App } from "attio";
import { Button, LoadingState, Section, Typography, showToast } from "attio/client";
import { Suspense, useState } from "react";
import summarizeRecruitingListAudio from "../server/summarize-recruiting-list-audio.server";
import { openCombinedAudioDialog } from "./audio-playlist-flow";
import { PersonAudioSummary } from "./person-audio-summary";

function AudioSummaryPanel({ recordId }: { recordId: string }) {
  const [loading, setLoading] = useState(false);

  const handleListenToList = async () => {
    setLoading(true);
    try {
      const preview = await summarizeRecruitingListAudio();
      await openCombinedAudioDialog({
        title: "Recruiting list audio",
        preview,
      });
      await showToast({
        title: "Script ready",
        text: `${preview.candidates.length} candidates in one combined transcript.`,
        variant: "success",
      });
    } catch (error) {
      await showToast({
        title: "Audio summary failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Section title="This candidate">
        <Suspense fallback={<LoadingState />}>
          <PersonAudioSummary recordId={recordId} />
        </Suspense>
      </Section>

      <Section title="Recruiting list">
        <Typography.Body>
          Generate one combined spoken summary for every researched candidate on the
          recruiting list.
        </Typography.Body>
        <Button
          label={loading ? "Preparing combined script…" : "Listen to recruiting list"}
          onClick={handleListenToList}
          disabled={loading}
        />
      </Section>
    </>
  );
}

export const audioSummaryWidget: App.Record.Widget = {
  id: "recruiting-audio-summary",
  label: "Listen to summary",
  objects: ["people"],
  Widget: ({ recordId }) => <AudioSummaryPanel recordId={recordId} />,
};
