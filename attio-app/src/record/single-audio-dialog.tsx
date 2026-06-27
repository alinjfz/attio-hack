import { Button, LoadingState, Section, TextBlock, showToast } from "attio/client";
import { useEffect, useRef, useState } from "react";
import synthesizeAudio from "../server/synthesize-audio.server";

export function SingleAudioDialog({
  hideDialog,
  script,
  candidateName,
}: {
  hideDialog: () => void;
  script: string;
  candidateName?: string;
}) {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    void synthesizeAudio(script)
      .then((audio) => {
        if (cancelled) {
          return;
        }
        setAudioSrc(`data:${audio.contentType};base64,${audio.audioBase64}`);
      })
      .catch(async (error) => {
        if (cancelled) {
          return;
        }
        await showToast({
          title: "Audio synthesis failed",
          text: error instanceof Error ? error.message : "Unknown error",
          variant: "error",
        });
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [script]);

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
    <>
      <Section title={candidateName ? `Audio — ${candidateName}` : "SLNG audio summary"}>
        <TextBlock>{script}</TextBlock>
      </Section>

      {loading && <LoadingState />}

      {audioSrc && !loading && <audio ref={audioRef} controls src={audioSrc} />}

      <Button label="Close" onClick={hideDialog} />
    </>
  );
}
