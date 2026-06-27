import { TextBlock } from "attio/client";
import type { ReactNode } from "react";
import { splitDisplayBlocks } from "@recruiting-copilot/core/utils/format-prose";

/** One Attio TextBlock per line/paragraph — Section must not wrap these in a Fragment. */
export function displayBlocks(text: string, keyPrefix: string, empty = "None listed."): ReactNode[] {
  const blocks = splitDisplayBlocks(text);
  if (blocks.length === 0) {
    return [<TextBlock key={`${keyPrefix}-empty`} align="left">{empty}</TextBlock>];
  }

  return blocks.map((block, index) => (
    <TextBlock key={`${keyPrefix}-${index}`} align="left">
      {block}
    </TextBlock>
  ));
}

export function displayBulletBlocks(
  items: string[],
  keyPrefix: string,
  empty = "None listed.",
): ReactNode[] {
  if (items.length === 0) {
    return [<TextBlock key={`${keyPrefix}-empty`} align="left">{empty}</TextBlock>];
  }

  return items.map((item, index) => (
    <TextBlock key={`${keyPrefix}-${index}`} align="left">
      • {item}
    </TextBlock>
  ));
}
