import type { DraftBundle } from "../schemas/draft-bundle.js";

export function formatGapAnalysisLine(
  gap: DraftBundle["gapAnalysis"][number],
): string {
  return `${gap.area}: ${gap.gap}`;
}

export function formatGapAnalysisLines(gaps: DraftBundle["gapAnalysis"]): string[] {
  if (gaps.length === 0) {
    return ["No major gaps flagged."];
  }
  return gaps.map(formatGapAnalysisLine);
}
