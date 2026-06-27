/** Normalise draft text so paragraphs and line breaks render cleanly. */
export function normalizeDraftParagraphs(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
  const normalised = normalizeDraftParagraphs(text);
  if (!normalised) {
    return "No draft generated.";
  }
  return normalised
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
}
