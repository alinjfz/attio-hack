import type { App } from "attio";
import { Button, Section, Typography, showToast } from "attio/client";
import { useState } from "react";
import summarizeList from "../server/summarize-list.server";

function AudioSummaryPanel({ recordId }: { recordId: string }) {
  void recordId;
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleListen = async () => {
    setLoading(true);
    try {
      const result = await summarizeList({
        candidates: [
          {
            name: "Demo Candidate A",
            fitScore: 88,
            fitTier: "Strong",
            twoLiner: "Strong TypeScript engineer with CRM experience.",
          },
          {
            name: "Demo Candidate B",
            fitScore: 72,
            fitTier: "Good",
            twoLiner: "Solid full-stack generalist.",
          },
          {
            name: "Demo Candidate C",
            fitScore: 61,
            fitTier: "Good",
            twoLiner: "Good culture fit, lighter Attio exposure.",
          },
        ],
      });
      setAudioSrc(`data:${result.contentType};base64,${result.audioBase64}`);
      await showToast({
        title: "Audio ready",
        text: "Press play to hear the top-3 summary.",
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
        Hear a spoken overview of the top 3 candidates by fit score. Requires
        ENABLE_SLNG=true and SLNG_API_KEY in app secrets.
      </Typography.Body>
      <Button
        label={loading ? "Generating audio…" : "Listen to summary"}
        onClick={handleListen}
        disabled={loading}
      />
      {audioSrc && <audio controls src={audioSrc} />}
    </Section>
  );
}

export const audioSummaryWidget: App.Record.Widget = {
  id: "recruiting-audio-summary",
  label: "Listen to summary",
  objects: ["people"],
  Widget: ({ recordId }) => <AudioSummaryPanel recordId={recordId} />,
};
