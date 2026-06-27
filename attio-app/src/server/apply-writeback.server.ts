import { ATTIO_API_TOKEN } from "attio/server";
import { applyWriteback } from "@recruiting-copilot/core/pipeline/apply-writeback";
import { createGeminiClient } from "@recruiting-copilot/core/clients/gemini";
import { isSlngEnabled } from "@recruiting-copilot/core/config/features";
import type { DraftBundle } from "@recruiting-copilot/core/schemas/draft-bundle";
import type { FitResult } from "@recruiting-copilot/core/schemas/fit-result";
import type {
  WritebackMode,
  WritebackOptions,
} from "@recruiting-copilot/core/schemas/writeback-options";
import { readRuntimeEnv, readRuntimeEnvFlag } from "./runtime-env";

export interface ApplyWritebackServerInput {
  recordId: string;
  candidateName: string;
  fit: FitResult;
  bundle: DraftBundle;
  mode: WritebackMode;
  options: WritebackOptions;
  roleTitle?: string;
}

export interface ApplyWritebackServerResult {
  audioSummary?: {
    script: string;
    audioBase64: string;
    contentType: string;
  };
}

export default async function applyWritebackServer(
  input: ApplyWritebackServerInput,
): Promise<ApplyWritebackServerResult> {
  const slngEnabled = await readRuntimeEnvFlag("ENABLE_SLNG");
  const slngKey = await readRuntimeEnv("SLNG_API_KEY");
  const geminiKey = await readRuntimeEnv("GEMINI_API_KEY");

  if (
    input.options.createSlngSummary &&
    !isSlngEnabled({ enableSlng: slngEnabled, slngApiKey: slngKey })
  ) {
    throw new Error(
      "SLNG audio summary is disabled. Turn on enable_slng and add slng_api_key in app settings.",
    );
  }

  if (input.options.createSlngSummary && !geminiKey) {
    throw new Error("Missing gemini_api_key in app settings (required for SLNG summary script).");
  }

  return applyWriteback(input, {
    attioConfig: { apiToken: ATTIO_API_TOKEN },
    slngApiKey: slngKey,
    geminiClient: geminiKey ? createGeminiClient({ apiKey: geminiKey }) : undefined,
    geminiModel: await readRuntimeEnv("GEMINI_MODEL"),
  });
}
