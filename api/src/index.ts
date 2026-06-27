import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, service: "recruiting-copilot-api" }));

const port = Number(process.env.PORT ?? 3001);

if (import.meta.url === `file://${process.argv[1]}`) {
  serve({ fetch: app.fetch, port }, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

export default app;
