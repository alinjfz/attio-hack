import { Button, LoadingState, showToast } from "attio/client";
import { splitScriptForTts } from "@recruiting-copilot/core/utils/split-tts-script";
import { useEffect, useRef, useState } from "react";
import synthesizeAudio from "../server/synthesize-audio.server";

export function PlayAudioSummaryButton({
  script,
  label = "Play audio summary",
}: {
  script: string;
  label?: string;
}) {
  const chunks = splitScriptForTts(script);
  const [audioSrcs, setAudioSrcs] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (audioSrcs.length > 0 && audioRef.current) {
      void audioRef.current.play().catch(() => {
        // Playback may require a fresh user gesture.
      });
      return;
    }

    if (chunks.length === 0) {
      await showToast({
        title: "No audio script",
        text: "Nothing to synthesize.",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    setAudioSrcs([]);
    setCurrentIndex(0);

    try {
      const srcs: string[] = [];
      for (let index = 0; index < chunks.length; index++) {
        setLoadingLabel(`Generating part ${index + 1} of ${chunks.length}…`);
        const audio = await synthesizeAudio(chunks[index]!);
        srcs.push(`data:${audio.contentType};base64,${audio.audioBase64}`);
      }
      setAudioSrcs(srcs);
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

  useEffect(() => {
    const audio = audioRef.current;
    const src = audioSrcs[currentIndex];
    if (!audio || !src || loading) {
      return;
    }

    audio.load();
    void audio.play().catch(() => {
      // Autoplay may be blocked until the user interacts.
    });
  }, [audioSrcs, currentIndex, loading]);

  const handleEnded = () => {
    if (currentIndex < audioSrcs.length - 1) {
      setCurrentIndex((value) => value + 1);
    }
  };

  const buttonLabel = loading
    ? loadingLabel || "Generating audio…"
    : audioSrcs.length > 1 && currentIndex < audioSrcs.length - 1
      ? `Playing part ${currentIndex + 1} of ${audioSrcs.length}`
      : label;

  return (
    <>
      <Button
        label={buttonLabel}
        icon="Play"
        onClick={() => void handlePlay()}
        disabled={loading}
      />
      {loading && <LoadingState />}
      {audioSrcs[currentIndex] && !loading && (
        <audio
          ref={audioRef}
          controls
          src={audioSrcs[currentIndex]}
          onEnded={handleEnded}
        />
      )}
    </>
  );
}
