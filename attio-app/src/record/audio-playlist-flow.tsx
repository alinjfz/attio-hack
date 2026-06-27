import { showDialog } from "attio/client";
import type { CombinedAudioPreview } from "@recruiting-copilot/core/pipeline/batch-summarize-audio";
import { CombinedAudioDialog } from "./combined-audio-dialog";

export async function openCombinedAudioDialog(options: {
  title: string;
  preview: CombinedAudioPreview;
}): Promise<void> {
  await showDialog({
    title: options.title,
    Dialog: ({ hideDialog }) => (
      <CombinedAudioDialog
        hideDialog={hideDialog}
        preview={options.preview}
        title={options.title}
      />
    ),
  });
}
