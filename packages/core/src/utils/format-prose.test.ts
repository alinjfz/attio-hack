import { describe, expect, it } from "vitest";
import {
  ensureParagraphBreaks,
  formatDraftForDisplay,
  formatDraftForNote,
  splitDisplayBlocks,
} from "./format-prose.js";

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

  it("inserts paragraph breaks into single-line email drafts", () => {
    const text =
      "Subject: Candidate Dear Alex, Ali is a strong fit. Best regards, Recruiter";
    const formatted = ensureParagraphBreaks(text);
    expect(formatted).toContain("Subject: Candidate");
    expect(formatted).toContain("\n\nDear Alex,");
    expect(formatted).toContain("\n\nBest regards,");
  });

  it("splits display blocks line by line for Attio TextBlock rendering", () => {
    const blocks = splitDisplayBlocks("Line one\nLine two");
    expect(blocks).toEqual(["Line one", "Line two"]);
  });
});
