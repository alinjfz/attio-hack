import {
  createGeminiClient,
  generateListSummaryScript,
  isSlngEnabled,
  textToSpeech,
} from "@recruiting-copilot/core";

export interface SummarizeListInput {
  candidates: Array<{
    name: string;
    fitScore: number;
    fitTier: string;
    twoLiner?: string;
  }>;
}

export interface SummarizeListResult {
  script: string;
  audioBase64: string;
  contentType: string;
}

export default async function summarizeList(
  input: SummarizeListInput,
): Promise<SummarizeListResult> {
  if (!isSlngEnabled()) {
    throw new Error("SLNG audio summary is disabled. Set ENABLE_SLNG=true and SLNG_API_KEY.");
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const slngKey = process.env.SLNG_API_KEY;

  if (!geminiKey) {
    throw new Error("Missing GEMINI_API_KEY in app secrets.");
  }
  if (!slngKey) {
    throw new Error("Missing SLNG_API_KEY in app secrets.");
  }

  const topCandidates = input.candidates
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 3);

  if (topCandidates.length === 0) {
    throw new Error("No candidates with fit scores to summarize.");
  }

  const script = await generateListSummaryScript(
    topCandidates,
    createGeminiClient({ apiKey: geminiKey }),
    process.env.GEMINI_MODEL,
  );

  const audio = await textToSpeech(script, { apiKey: slngKey });

  return {
    script,
    audioBase64: audio.audioBase64,
    contentType: audio.contentType,
  };
}
