import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createGeminiClient,
  createSIEClient,
  createTavilyClientIfEnabled,
  patchPerson,
  createNote,
  buildHmNoteContent,
  runResearch,
  ResearchResultSchema,
} from "@recruiting-copilot/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

const app = new Hono();

app.get("/health", (c) =>
  c.json({ ok: true, service: "recruiting-copilot-api", version: "0.0.1" }),
);

app.post("/webhook/research", async (c) => {
  const secret = c.req.header("X-Webhook-Secret");
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<{
    recordId?: string;
    roleDescription: string;
    cvText: string;
    candidateName: string;
    linkedinUrl?: string;
    roleTitle?: string;
    approve?: boolean;
  }>();

  if (!body.roleDescription || !body.cvText || !body.candidateName) {
    return c.json({ error: "roleDescription, cvText, and candidateName are required" }, 400);
  }

  const clusterUrl = process.env.SUPERLINKED_CLUSTER_URL;
  const superlinkedKey = process.env.SUPERLINKED_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!clusterUrl || !superlinkedKey || !geminiKey) {
    return c.json({ error: "Missing partner API configuration" }, 500);
  }

  const model = process.env.SUPERLINKED_MODEL ?? "BAAI/bge-m3";
  const sieClient = await createSIEClient({ clusterUrl, apiKey: superlinkedKey, model });

  const tavilyClient = await createTavilyClientIfEnabled();

  const result = await runResearch(
    {
      roleDescription: body.roleDescription,
      cvText: body.cvText,
      candidateName: body.candidateName,
      linkedinUrl: body.linkedinUrl,
      roleTitle: body.roleTitle,
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

  const validated = ResearchResultSchema.parse(result);

  if (body.approve && body.recordId && process.env.ATTIO_API_TOKEN) {
    const attioConfig = { apiToken: process.env.ATTIO_API_TOKEN };
    await patchPerson(attioConfig, body.recordId, {
      fitScore: validated.fit.score,
      fitTier: validated.fit.tier,
      twoLiner: validated.bundle.twoLiner,
    });
    await createNote(attioConfig, {
      recordId: body.recordId,
      title: "HM Internal Note",
      content: buildHmNoteContent(
        validated.bundle.hmNote,
        validated.bundle.fitReasoning.pros,
        validated.bundle.fitReasoning.cons,
      ),
    });
  }

  return c.json(validated);
});

const port = Number(process.env.PORT ?? 3001);

if (import.meta.url === `file://${process.argv[1]}`) {
  serve({ fetch: app.fetch, port }, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

export default app;
