import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { textToSpeech } from "../src/clients/slng.js";
import { splitScriptForTts } from "../src/utils/split-tts-script.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

const apiKey = process.env.SLNG_API_KEY;
if (!apiKey) {
  throw new Error("Missing SLNG_API_KEY in .env");
}

const sample =
  "For Cruz Jacobs, we have an experienced Backend Engineer with six years in Java. Cruz is also expanding into frontend with React side projects.";

async function main() {
  console.log("SLNG TTS smoke test…");

  const chunks = splitScriptForTts(sample);
  console.log(`Chunks: ${chunks.length}`);

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]!;
    const result = await textToSpeech(chunk, { apiKey });
    const bytes = Math.round((result.audioBase64.length * 3) / 4);
    console.log(`  chunk ${index + 1}: ${chunk.length} chars → ~${bytes} bytes audio`);
    writeFileSync(
      resolve(__dirname, "../fixtures/tts-smoke-" + (index + 1) + ".wav"),
      Buffer.from(result.audioBase64, "base64"),
    );
  }

  console.log("OK — audio written to packages/core/fixtures/tts-smoke-*.wav");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
