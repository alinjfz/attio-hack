/** Normalise draft text so paragraphs and line breaks render cleanly. */
export function normalizeDraftParagraphs(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Insert paragraph breaks when Gemini returns one long line of email copy. */
export function ensureParagraphBreaks(text: string): string {
  const normalised = normalizeDraftParagraphs(text);
  if (!normalised || normalised.includes("\n\n")) {
    return normalised;
  }

  return normalised
    .replace(/\s+(?=Subject:)/gi, "\n\n")
    .replace(/\s+(?=Dear )/gi, "\n\n")
    .replace(/\s+(?=Hi )/gi, "\n\n")
    .replace(/\s+(?=Hello )/gi, "\n\n")
    .replace(/\s+(?=Best regards,)/gi, "\n\n")
    .replace(/\s+(?=Kind regards,)/gi, "\n\n")
    .replace(/\s+(?=Sincerely,)/gi, "\n\n")
    .replace(/\s+(?=Thanks,)/gi, "\n\n")
    .replace(/([.!?])\s+(?=[A-Z])/g, "$1\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Split content into blocks for one Attio TextBlock each (TextBlock ignores \\n). */
export function splitDisplayBlocks(text: string): string[] {
  const normalised = ensureParagraphBreaks(text);
  if (!normalised) {
    return [];
  }

  if (normalised.includes("\n")) {
    return normalised
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [normalised];
}

/** Format draft text for Attio note markdown. */
export function formatDraftForNote(title: string, body: string, footer?: string): string {
  const sections = [`## ${title}`, "", normalizeDraftParagraphs(body)];
  if (footer) {
    sections.push("", "---", "", footer);
  }
  return sections.join("\n");
}

/** Format email-style drafts for on-screen preview (plain text with spacing). */
export function formatDraftForDisplay(text: string): string {
  const blocks = splitDisplayBlocks(text);
  if (blocks.length === 0) {
    return "No draft generated.";
  }
  return blocks.join("\n\n");
}
