import {
  buildAudioSummaryNoteContent,
  buildHmNoteContent,
  buildRejectionEmailNoteContent,
  buildSilverMedalistNoteContent,
  createNote,
  patchPerson,
  type AttioRestConfig,
} from "../clients/attio-rest.js";
import type { GeminiClientLike } from "../clients/gemini.js";
import type { DraftBundle } from "../schemas/draft-bundle.js";
import type { FitResult } from "../schemas/fit-result.js";
import type { WritebackMode, WritebackOptions } from "../schemas/writeback-options.js";
import { generateListSummaryScript } from "./summarize-list.js";

export interface ApplyWritebackInput {
  recordId: string;
  candidateName: string;
  fit: FitResult;
  bundle: DraftBundle;
  mode: WritebackMode;
  options: WritebackOptions;
  roleTitle?: string;
}

export interface ApplyWritebackResult {
  audioSummary?: {
    script: string;
  };
}

export interface ApplyWritebackDeps {
  attioConfig: AttioRestConfig;
  slngApiKey?: string;
  geminiClient?: GeminiClientLike;
  geminiModel?: string;
}

export async function applyWriteback(
  input: ApplyWritebackInput,
  deps: ApplyWritebackDeps,
): Promise<ApplyWritebackResult> {
  const result: ApplyWritebackResult = {};

  let audioScript: string | undefined;
  if (input.options.createSlngSummary && deps.geminiClient) {
    audioScript = await generateListSummaryScript(
      [
        {
          name: input.candidateName,
          fitScore: input.fit.score,
          fitTier: input.fit.tier,
          twoLiner: input.bundle.twoLiner,
        },
      ],
      deps.geminiClient,
      deps.geminiModel,
    );
  }

  if (input.mode === "approve") {
    await patchPerson(deps.attioConfig, input.recordId, {
      fitScore: input.fit.score,
      fitTier: input.fit.tier,
      twoLiner: input.bundle.twoLiner,
    });

    if (audioScript) {
      try {
        await patchPerson(deps.attioConfig, input.recordId, {
          audioSummaryScript: audioScript,
        });
      } catch {
        // Optional field — run pnpm seed:attio if missing.
      }
    }
  } else if (audioScript) {
    try {
      await patchPerson(deps.attioConfig, input.recordId, {
        audioSummaryScript: audioScript,
      });
    } catch {
      // Optional field — run pnpm seed:attio if missing.
    }
  }

  if (input.options.createHmNote) {
    await createNote(deps.attioConfig, {
      recordId: input.recordId,
      title: "HM Internal Note",
      content: buildHmNoteContent(
        input.bundle.hmNote,
        input.bundle.fitReasoning.pros,
        input.bundle.fitReasoning.cons,
      ),
    });
  }

  if (
    input.options.createRejectionEmail &&
    input.bundle.rejectionEmailDraft.trim().length > 0
  ) {
    await createNote(deps.attioConfig, {
      recordId: input.recordId,
      title: "Rejection Email Draft",
      content: buildRejectionEmailNoteContent(input.bundle.rejectionEmailDraft),
    });
  }

  if (input.options.markPotentialCandidateLater) {
    await createNote(deps.attioConfig, {
      recordId: input.recordId,
      title: "Silver medalist — future pipeline",
      content: buildSilverMedalistNoteContent({
        candidateName: input.candidateName,
        roleTitle: input.roleTitle,
        fitScore: input.fit.score,
        fitTier: input.fit.tier,
        pros: input.bundle.fitReasoning.pros,
        cons: input.bundle.fitReasoning.cons,
      }),
    });
  }

  if (audioScript) {
    await createNote(deps.attioConfig, {
      recordId: input.recordId,
      title: "Audio summary script (SLNG)",
      content: buildAudioSummaryNoteContent(audioScript),
    });

    result.audioSummary = { script: audioScript };
  }

  return result;
}
