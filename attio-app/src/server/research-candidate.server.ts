import { ATTIO_API_TOKEN } from "attio/server";
import {
  createGeminiClient,
  createSIEClient,
  createTavilyClient,
  getPersonContext,
  type ResearchResult,
  runResearch,
} from "@recruiting-copilot/core";

export default async function researchCandidate(recordId: string): Promise<ResearchResult> {
  const context = await getPersonContext({ apiToken: ATTIO_API_TOKEN }, recordId);

  if (!context.roleRecordId || !context.roleDescription?.trim()) {
    throw new Error("Link this person to a Role with a job description before researching.");
  }

  if (!context.cvText.trim()) {
    throw new Error("Add CV text to this person before researching.");
  }

  const clusterUrl = process.env.SUPERLINKED_CLUSTER_URL;
  const superlinkedKey = process.env.SUPERLINKED_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!clusterUrl || !superlinkedKey) {
    throw new Error("Missing Superlinked configuration in app secrets.");
  }
  if (!geminiKey) {
    throw new Error("Missing GEMINI_API_KEY in app secrets.");
  }

  const model = process.env.SUPERLINKED_MODEL ?? "BAAI/bge-m3";
  const sieClient = await createSIEClient({
    clusterUrl,
    apiKey: superlinkedKey,
    model,
  });

  const tavilyClient =
    process.env.ENABLE_TAVILY === "true" && process.env.TAVILY_API_KEY
      ? createTavilyClient({ apiKey: process.env.TAVILY_API_KEY })
      : undefined;

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
        model: process.env.GEMINI_MODEL,
      },
      tavilyClient,
    },
  );
}
