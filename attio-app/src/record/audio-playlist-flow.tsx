import { showDialog } from "attio/client";
import type { AudioSegment } from "../server/batch-summarize-audio.server";
import { AudioPlaylistDialog } from "./audio-playlist-dialog";

export async function openAudioPlaylistDialog(options: {
  title: string;
  segments: AudioSegment[];
}): Promise<void> {
  await showDialog({
    title: options.title,
    Dialog: ({ hideDialog }) => (
      <AudioPlaylistDialog hideDialog={hideDialog} segments={options.segments} />
    ),
  });
}
