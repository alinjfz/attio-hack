import { ATTIO_API_TOKEN } from "attio/server";
import {
  buildHmNoteContent,
  createNote,
  patchPerson,
} from "@recruiting-copilot/core/attio";
import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";

export interface ApproveWritebackInput {
  recordId: string;
  fit: FitResult;
  bundle: DraftBundle;
}

export default async function approveWriteback(input: ApproveWritebackInput): Promise<void> {
  const config = { apiToken: ATTIO_API_TOKEN };

  await patchPerson(config, input.recordId, {
    fitScore: input.fit.score,
    fitTier: input.fit.tier,
    twoLiner: input.bundle.twoLiner,
  });

  await createNote(config, {
    recordId: input.recordId,
    title: "HM Internal Note",
    content: buildHmNoteContent(
      input.bundle.hmNote,
      input.bundle.fitReasoning.pros,
      input.bundle.fitReasoning.cons,
    ),
  });
}
