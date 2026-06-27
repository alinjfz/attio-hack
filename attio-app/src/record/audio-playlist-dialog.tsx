import { Button, Section, TextBlock } from "attio/client";
import { useEffect, useRef, useState } from "react";
import type { AudioSegment } from "../server/batch-summarize-audio.server";

export function AudioPlaylistDialog({
  hideDialog,
  segments,
}: {
  hideDialog: () => void;
  segments: AudioSegment[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = segments[currentIndex];
  const audioSrc = current
    ? `data:${current.contentType};base64,${current.audioBase64}`
    : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) {
      return;
    }

    audio.load();
    void audio.play().catch(() => {
      // Autoplay may be blocked until the user interacts.
    });
  }, [audioSrc]);

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

      {audioSrc && (
        <audio
          ref={audioRef}
          controls
          src={audioSrc}
          onEnded={handleEnded}
        />
      )}

      <Button
        label="Previous"
        onClick={handlePrevious}
        disabled={currentIndex === 0}
      />
      <Button
        label="Next"
        onClick={handleNext}
        disabled={currentIndex >= segments.length - 1}
      />
      <Button label="Close" onClick={hideDialog} />
    </>
  );
}
