import type { App } from "attio";
import { Button, Section, Typography, showToast } from "attio/client";
import { useState } from "react";
import summarizeRecruitingListAudio from "../server/summarize-recruiting-list-audio.server";
import { openAudioPlaylistDialog } from "./audio-playlist-flow";

function AudioSummaryPanel({ recordId }: { recordId: string }) {
  void recordId;
  const [loading, setLoading] = useState(false);

  const handleListenToList = async () => {
    setLoading(true);
    try {
      const segments = await summarizeRecruitingListAudio();
      await openAudioPlaylistDialog({
        title: "Recruiting list audio",
        segments,
      });
      await showToast({
        title: "Scripts ready",
        text: `${segments.length} candidates — audio loads one by one, highest fit first.`,
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
    <Section title="List audio summary (SLNG)">
      <Typography.Body>
        Prepare spoken summaries for every researched candidate on the recruiting list.
        Audio is generated one candidate at a time to keep responses fast. Requires
        enable_slng and slng_api_key in app settings.
      </Typography.Body>
      <Button
        label={loading ? "Preparing scripts…" : "Listen to recruiting list"}
        onClick={handleListenToList}
        disabled={loading}
      />
    </Section>
  );
}

export const audioSummaryWidget: App.Record.Widget = {
  id: "recruiting-audio-summary",
  label: "Listen to summary",
  objects: ["people"],
  Widget: ({ recordId }) => <AudioSummaryPanel recordId={recordId} />,
};
