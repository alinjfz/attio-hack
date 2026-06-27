import { ATTIO_API_TOKEN } from "attio/server";
import { getPersonContext, type PersonContext } from "@recruiting-copilot/core/attio";
import { createGeminiClient } from "@recruiting-copilot/core/clients/gemini";
import { createFetchSIEClient } from "@recruiting-copilot/core/clients/sie";
import { createTavilyClientIfEnabled } from "@recruiting-copilot/core/config/features";
import { runResearch } from "@recruiting-copilot/core/pipeline/run-research";
import type { ResearchResult } from "@recruiting-copilot/core/schemas/draft-bundle";
import { readRuntimeEnv, readRuntimeEnvFlag } from "./runtime-env";

export type ResearchCandidateContext = Pick<
  PersonContext,
  "name" | "cvText" | "linkedinUrl" | "roleRecordId" | "roleDescription" | "roleTitle"
>;

async function loadContext(
  recordId: string,
  preloaded?: ResearchCandidateContext,
): Promise<PersonContext> {
  if (preloaded) {
    return { recordId, ...preloaded };
  }

  try {
    return await getPersonContext({ apiToken: ATTIO_API_TOKEN }, recordId);
  } catch (error) {
    if (error instanceof Error && error.message.includes("403")) {
      throw new Error(
        "Attio API key lacks read scopes. Use Research from the Recruiting Copilot widget, or grant Records + Object Configuration read scopes under Workspace settings → Developers → recruiting-copilot → Scopes.",
      );
    }
    throw error;
  }
}

export default async function researchCandidate(
  recordId: string,
  preloaded?: ResearchCandidateContext,
): Promise<ResearchResult> {
  const context = await loadContext(recordId, preloaded);

  if (!context.roleRecordId || !context.roleDescription?.trim()) {
    throw new Error("Link this person to a Role with a job description before researching.");
  }

  if (!context.cvText.trim()) {
    throw new Error("Add CV text to this person before researching.");
  }

  const clusterUrl = await readRuntimeEnv("SUPERLINKED_CLUSTER_URL");
  const superlinkedKey = await readRuntimeEnv("SUPERLINKED_API_KEY");
  const geminiKey = await readRuntimeEnv("GEMINI_API_KEY");

  if (!clusterUrl || !superlinkedKey) {
    throw new Error(
      "Missing Superlinked configuration. Set superlinked_cluster_url and superlinked_api_key in the Recruiting Copilot app settings (Attio → Apps → recruiting-copilot → Settings).",
    );
  }
  if (!geminiKey) {
    throw new Error(
      "Missing gemini_api_key. Set it in the Recruiting Copilot app settings (Attio → Apps → recruiting-copilot → Settings).",
    );
  }

  const model = (await readRuntimeEnv("SUPERLINKED_MODEL")) ?? "BAAI/bge-m3";
  const sieClient = createFetchSIEClient({
    clusterUrl,
    apiKey: superlinkedKey,
  });

  const tavilyClient = await createTavilyClientIfEnabled({
    enableTavily: await readRuntimeEnvFlag("ENABLE_TAVILY"),
    tavilyApiKey: await readRuntimeEnv("TAVILY_API_KEY"),
  });

  return runResearch(
    {
      roleDescription: context.roleDescription,
      cvText: context.cvText,
      candidateName: context.name,
      linkedinUrl: context.linkedinUrl,
      roleTitle: context.roleTitle,
    },
    {
      scoreFit: { sieClient, model },
      generateDrafts: {
        geminiClient: createGeminiClient({ apiKey: geminiKey }),
        model: await readRuntimeEnv("GEMINI_MODEL"),
      },
      tavilyClient,
    },
  );
}
