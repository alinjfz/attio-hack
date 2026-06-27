import type { App } from "attio";
import { Button, Section, Typography, showToast } from "attio/client";
import { useState } from "react";
import { batchSummarizeRecruitingList } from "../server/batch-summarize-audio.server";
import { openAudioPlaylistDialog } from "./audio-playlist-flow";

function AudioSummaryPanel({ recordId }: { recordId: string }) {
  void recordId;
  const [loading, setLoading] = useState(false);

  const handleListenToList = async () => {
    setLoading(true);
    try {
      const segments = await batchSummarizeRecruitingList();
      await openAudioPlaylistDialog({
        title: "Recruiting list audio",
        segments,
      });
      await showToast({
        title: "Audio ready",
        text: `${segments.length} candidates — plays one by one, highest fit first.`,
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
        Read every researched candidate on the recruiting list aloud, one by one,
        sorted by fit score. Requires enable_slng and slng_api_key in app settings.
        Or select people on a list and use bulk action “Listen to candidates (SLNG)”.
      </Typography.Body>
      <Button
        label={loading ? "Generating audio…" : "Listen to recruiting list"}
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
