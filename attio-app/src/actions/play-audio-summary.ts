import type { App } from "attio";
import { showToast } from "attio/client";
import { openCombinedAudioDialog } from "../record/audio-playlist-flow";
import personCombinedAudio from "../server/person-combined-audio.server";

export const playAudioSummaryAction: App.Record.Action = {
  id: "play-audio-summary",
  label: "Generate audio summary",
  icon: "Play",
  objects: ["people"],
  onTrigger: async ({ recordId }) => {
    try {
      const preview = await personCombinedAudio(recordId);
      await openCombinedAudioDialog({
        title: "SLNG audio summary",
        preview,
      });
    } catch (error) {
      await showToast({
        title: "No audio summary",
        text: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    }
  },
};
