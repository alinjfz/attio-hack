import { showDialog } from "attio/client";
import type { AudioSegmentPreview } from "@recruiting-copilot/core/pipeline/batch-summarize-audio";
import { AudioPlaylistDialog } from "./audio-playlist-dialog";
import { SingleAudioDialog } from "./single-audio-dialog";

export async function openAudioPlaylistDialog(options: {
  title: string;
  segments: AudioSegmentPreview[];
}): Promise<void> {
  await showDialog({
    title: options.title,
    Dialog: ({ hideDialog }) => (
      <AudioPlaylistDialog hideDialog={hideDialog} segments={options.segments} />
    ),
  });
}

export async function openSingleAudioDialog(options: {
  script: string;
  candidateName?: string;
}): Promise<void> {
  await showDialog({
    title: "SLNG audio summary",
    Dialog: ({ hideDialog }) => (
      <SingleAudioDialog
        hideDialog={hideDialog}
        script={options.script}
        candidateName={options.candidateName}
      />
    ),
  });
}
