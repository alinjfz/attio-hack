import { Button, LoadingState, Section, TextBlock, showToast } from "attio/client";
import { useEffect, useRef, useState } from "react";
import type { AudioSegmentPreview } from "@recruiting-copilot/core/pipeline/batch-summarize-audio";
import synthesizeAudio from "../server/synthesize-audio.server";

export function AudioPlaylistDialog({
  hideDialog,
  segments,
}: {
  hideDialog: () => void;
  segments: AudioSegmentPreview[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = segments[currentIndex];

  useEffect(() => {
    if (!current?.script) {
      setAudioSrc(null);
      return;
    }

    let cancelled = false;
    setLoadingAudio(true);
    setAudioSrc(null);

    void synthesizeAudio(current.script)
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
          setLoadingAudio(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [current?.script]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc || loadingAudio) {
      return;
    }

    audio.load();
    void audio.play().catch(() => {
      // Autoplay may be blocked until the user interacts.
    });
  }, [audioSrc, loadingAudio]);

  const handleEnded = () => {
    if (currentIndex < segments.length - 1) {
      setCurrentIndex((value) => value + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((value) => Math.max(0, value - 1));
  };

  const handleNext = () => {
    setCurrentIndex((value) => Math.min(segments.length - 1, value + 1));
  };

  if (!current) {
    return <TextBlock>No audio segments available.</TextBlock>;
  }

  return (
    <>
      <Section title={`${current.name} — ${current.fitScore}% (${current.fitTier})`}>
        <TextBlock>
          Candidate {currentIndex + 1} of {segments.length}
        </TextBlock>
        <TextBlock>{current.script}</TextBlock>
      </Section>

      {loadingAudio && <LoadingState />}

      {audioSrc && !loadingAudio && (
        <audio ref={audioRef} controls src={audioSrc} onEnded={handleEnded} />
      )}

      <Button label="Previous" onClick={handlePrevious} disabled={currentIndex === 0} />
      <Button
        label="Next"
        onClick={handleNext}
        disabled={currentIndex >= segments.length - 1}
      />
      <Button label="Close" onClick={hideDialog} />
    </>
  );
}
