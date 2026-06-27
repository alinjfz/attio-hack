import { Button, Link, LoadingState, Section, TextBlock, showToast } from "attio/client";
import { useState } from "react";
import type { HostedAudioPart } from "../server/host-audio.server";
import hostAudioForScript from "../server/host-audio.server";

export function PlayAudioSummaryButton({
  script,
  label = "Generate audio summary",
}: {
  script: string;
  label?: string;
}) {
  const [parts, setParts] = useState<HostedAudioPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");

  const handleGenerate = async () => {
    if (parts.length > 0) {
      return;
    }

    setLoading(true);
    setLoadingLabel("Generating audio…");

    try {
      const hosted = await hostAudioForScript(script);
      setParts(hosted);
      await showToast({
        title: "Audio ready",
        text:
          hosted.length === 1
            ? "Open or download the link below to listen on your device."
            : `${hosted.length} parts — open each link in order.`,
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
      {parts.length > 0 && (
        <Section title="Listen on your device">
          <TextBlock>
            Audio is hosted outside Attio. Use Open to play in your browser, or Download to
            save the file.
          </TextBlock>
          {parts.map((part) => (
            <Section
              key={`${part.part}-${part.url}`}
              title={part.total > 1 ? `Part ${part.part} of ${part.total}` : "Audio clip"}
            >
            <TextBlock>
              <Link href={part.url}>Open in browser</Link>
            </TextBlock>
            <TextBlock>
              <Link href={part.downloadUrl}>Download audio file</Link>
            </TextBlock>
            </Section>
          ))}
        </Section>
      )}
    </>
  );
}
