#!/usr/bin/env node
/**
 * Smoke-test the recruiting webhook API (standalone path — no Attio, no n8n required).
 * Usage: node scripts/n8n-smoke.mjs [--api-only] [--n8n-url http://localhost:5678/webhook-test/recruiting-copilot]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(resolve(root, ".env"));

const args = process.argv.slice(2);
const apiOnly = args.includes("--api-only");
const n8nUrlIdx = args.indexOf("--n8n-url");
const n8nUrl = n8nUrlIdx >= 0 ? args[n8nUrlIdx + 1] : null;

const port = process.env.PORT ?? "3001";
const envApiBase = process.env.API_PUBLIC_URL?.replace(/\/$/, "");
// host.docker.internal is for n8n-in-Docker → API-on-host; smoke runs on the host itself
const apiBase =
  envApiBase && !envApiBase.includes("host.docker.internal")
    ? envApiBase
    : `http://localhost:${port}`;
const secret = process.env.WEBHOOK_SECRET;

const payload = JSON.parse(
  readFileSync(resolve(root, "n8n/sample-payload.json"), "utf8"),
);

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

async function checkHealth() {
  const res = await fetch(`${apiBase}/health`);
  if (!res.ok) fail(`GET /health → ${res.status}`);
  const body = await res.json();
  if (!body.ok) fail("GET /health returned ok:false");
  console.log(`✓ API healthy at ${apiBase}`);
}

async function runResearch() {
  if (!secret) fail("WEBHOOK_SECRET is not set in .env");

  const res = await fetch(`${apiBase}/webhook/research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": secret,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(JSON.stringify(body, null, 2));
    fail(`POST /webhook/research → ${res.status}`);
  }

  if (!body.fit?.score || !body.bundle?.twoLiner) {
    console.error(JSON.stringify(body, null, 2));
    fail("Response missing fit.score or bundle.twoLiner");
  }

  console.log(`✓ Research complete — Fit ${body.fit.score}% (${body.fit.tier})`);
  console.log(`  Two-liner: ${body.bundle.twoLiner}`);
  console.log(`  Pros: ${body.bundle.fitReasoning.pros.length}`);
  console.log(`  Cons: ${body.bundle.fitReasoning.cons.length}`);
  console.log(`  Gaps: ${body.bundle.gapAnalysis.length}`);
  console.log(`  Web bullets: ${body.bundle.webBullets.length}`);
  return body;
}

async function triggerN8n() {
  if (!n8nUrl) return;
  const res = await fetch(n8nUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(text);
    fail(`n8n webhook → ${res.status}`);
  }
  console.log(`✓ n8n webhook responded (${res.status})`);
  try {
    const json = JSON.parse(text);
    if (json.reviewMarkdown) {
      console.log(`  reviewMarkdown: ${json.reviewMarkdown.slice(0, 120)}…`);
    }
  } catch {
    console.log(`  Response preview: ${text.slice(0, 200)}…`);
  }
}

console.log("Recruiting Copilot — standalone API smoke test\n");

await checkHealth();
await runResearch();

if (!apiOnly) {
  const defaultN8n =
    process.env.N8N_WEBHOOK_URL &&
    `${process.env.N8N_WEBHOOK_URL.replace(/\/$/, "")}/webhook/recruiting-copilot`;
  await triggerN8n(n8nUrl ?? defaultN8n);
}

console.log("\nAll checks passed.");
