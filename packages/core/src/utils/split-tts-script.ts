/** Max chars per SLNG request — keeps base64 under Attio server RPC limits (~300KB). */
export const TTS_CHUNK_MAX_CHARS = 50;

/** Remove generic Gemini filler from spoken scripts. */
export function cleanTtsScript(script: string): string {
  return script
    .replace(
      /Reviewing (?:the )?[A-Za-z][\w'’-]*(?:'s)? profile reveals[^.]+\.\s*/gi,
      "",
    )
    .replace(/^Let's (?:take a look|review)[^.]+\.\s*/i, "")
    .trim();
}

/** Split a script into sentence-bounded chunks for separate TTS calls. */
export function splitScriptForTts(
  script: string,
  maxChars = TTS_CHUNK_MAX_CHARS,
): string[] {
  const cleaned = cleanTtsScript(script);
  if (!cleaned) {
    return [];
  }
  if (cleaned.length <= maxChars) {
    return [cleaned];
  }

  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [cleaned];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const part = sentence.trim();
    if (!part) {
      continue;
    }

    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (part.length <= maxChars) {
      current = part;
      continue;
    }

    for (let index = 0; index < part.length; index += maxChars) {
      chunks.push(part.slice(index, index + maxChars).trim());
    }
    current = "";
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.filter(Boolean);
}
