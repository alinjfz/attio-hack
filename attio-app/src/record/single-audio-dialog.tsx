import { Button, LoadingState, Section, TextBlock, showToast } from "attio/client";
import { useEffect, useRef, useState } from "react";
import synthesizeAudio from "../server/synthesize-audio.server";

export function InlineAudioPlayer({
  script,
  candidateName,
}: {
  script: string;
  candidateName?: string;
}) {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadAudio = async () => {
    setStarted(true);
    setLoading(true);
    setAudioSrc(null);
    try {
      const audio = await synthesizeAudio(script);
      setAudioSrc(`data:${audio.contentType};base64,${audio.audioBase64}`);
    } catch (error) {
      await showToast({
        title: "Audio synthesis failed",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc || loading) {
      return;
    }
    audio.load();
    void audio.play().catch(() => {
      // Autoplay may be blocked until the user interacts.
    });
  }, [audioSrc, loading]);

  return (
    <Section title={candidateName ? `Audio — ${candidateName}` : "SLNG audio summary"}>
      <TextBlock>{script}</TextBlock>
      {!started && (
        <Button label="Play audio summary" onClick={() => void loadAudio()} />
      )}
      {loading && <LoadingState />}
      {audioSrc && !loading && <audio ref={audioRef} controls src={audioSrc} />}
    </Section>
  );
}

export function SingleAudioDialog({
  hideDialog,
  script,
  candidateName,
}: {
  hideDialog: () => void;
  script: string;
  candidateName?: string;
}) {
  return (
    <>
      <InlineAudioPlayer script={script} candidateName={candidateName} />
      <Button label="Close" onClick={hideDialog} />
    </>
  );
}
