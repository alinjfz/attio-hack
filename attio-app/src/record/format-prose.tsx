import { TextBlock } from "attio/client";
import { formatDraftForDisplay } from "@recruiting-copilot/core/utils/format-prose";

export function DraftTextBlock({ text }: { text: string }) {
  return <TextBlock>{formatDraftForDisplay(text)}</TextBlock>;
}
