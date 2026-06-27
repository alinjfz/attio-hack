import { describe, expect, it } from "vitest";
import { formatDraftForDisplay, formatDraftForNote } from "./format-prose.js";

describe("format-prose", () => {
  it("formats note sections with paragraph spacing", () => {
    const note = formatDraftForNote("Email", "Hi there,\n\nThanks for applying.");
    expect(note).toContain("## Email");
    expect(note).toContain("Hi there,");
    expect(note).toContain("Thanks for applying.");
  });

  it("formats display text with blank lines between paragraphs", () => {
    const display = formatDraftForDisplay("Hello,\n\nWorld.");
    expect(display).toBe("Hello,\n\nWorld.");
  });
});
