import { Button, Link, LoadingState, Section, TextBlock, showToast } from "attio/client";
import { useState } from "react";
import type { HostedAudio } from "../server/host-audio.server";
import hostAudioForScript from "../server/host-audio.server";

export function PlayAudioSummaryButton({
  script,
  label = "Generate audio summary",
}: {
  script: string;
  label?: string;
}) {
  const [audio, setAudio] = useState<HostedAudio | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");

  const handleGenerate = async () => {
    if (audio) {
      return;
    }

    setLoading(true);
    setLoadingLabel("Generating audio…");

    try {
      const hosted = await hostAudioForScript(script);
      setAudio(hosted);
      await showToast({
        title: "Audio ready",
        text: "Open or download the link below to listen on your device.",
        variant: "success",
      });
    } catch (error) {
      await showToast({
        title: "Audio synthesis failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setLoading(false);
      setLoadingLabel("");
    }
  };

  return (
    <>
      <Button
        label={loading ? loadingLabel || "Generating audio…" : label}
        icon="Play"
        onClick={() => void handleGenerate()}
        disabled={loading}
      />
      {loading && <LoadingState />}
      {audio && (
        <Section title="Listen on your device">
          <TextBlock>
            Audio is hosted outside Attio. Use Open to play in your browser, or Download to
            save the file.
          </TextBlock>
          <TextBlock>
            <Link href={audio.url}>Open in browser</Link>
          </TextBlock>
          <TextBlock>
            <Link href={audio.downloadUrl}>Download audio file</Link>
          </TextBlock>
        </Section>
      )}
    </>
  );
}
