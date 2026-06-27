import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

import {
  createGeminiClient,
  createSIEClient,
  runResearch,
  ResearchResultSchema,
} from "../src/index.js";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return undefined;
  }
  return process.argv[index + 1];
}

async function main() {
  const cvPath = readArg("--cv") ?? resolve(__dirname, "../fixtures/sample-cv.txt");
  const rolePath = readArg("--role") ?? resolve(__dirname, "../fixtures/sample-role.txt");

  const cvText = readFileSync(cvPath, "utf8");
  const roleDescription = readFileSync(rolePath, "utf8");

  const clusterUrl = process.env.SUPERLINKED_CLUSTER_URL;
  const superlinkedKey = process.env.SUPERLINKED_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!clusterUrl || !superlinkedKey) {
    throw new Error("Missing SUPERLINKED_CLUSTER_URL or SUPERLINKED_API_KEY in .env");
  }
  if (!geminiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env — required for live smoke test");
  }

  const model = process.env.SUPERLINKED_MODEL ?? "BAAI/bge-m3";
  const sieClient = await createSIEClient({
    clusterUrl,
    apiKey: superlinkedKey,
    model,
  });

  const result = await runResearch(
    {
      roleDescription,
      cvText,
      candidateName: "Alex Morgan",
      roleTitle: "Senior Full-Stack Engineer",
    },
    {
      scoreFit: { sieClient, model },
      generateDrafts: {
        geminiClient: createGeminiClient({ apiKey: geminiKey }),
        model: process.env.GEMINI_MODEL,
      },
    },
  );

  const validated = ResearchResultSchema.parse(result);
  console.log(JSON.stringify(validated, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
