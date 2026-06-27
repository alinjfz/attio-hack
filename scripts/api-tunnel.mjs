#!/usr/bin/env node
/**
 * Expose local api/ (port 3001) to the internet for Attio SLNG audio hosting.
 * Uses Cloudflare quick tunnel — no ngrok account required.
 *
 * Prerequisite: pnpm api:dev running in another terminal.
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");
const port = process.env.PORT ?? "3001";
const localUrl = `http://127.0.0.1:${port}`;

async function waitForApi(maxAttempts = 15) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${localUrl}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // API not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

function updateEnvPublicUrl(publicUrl) {
  let contents;
  try {
    contents = readFileSync(envPath, "utf8");
  } catch {
    console.error(`Could not read ${envPath}. Create .env from .env.example first.`);
    process.exit(1);
  }

  const withoutOld = contents
    .split("\n")
    .filter((line) => !line.startsWith("API_PUBLIC_URL="))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  const n8nBlock = withoutOld.includes("# ── n8n webhook API");
  let updated;
  if (n8nBlock) {
    updated = withoutOld.replace(
      /(# ── n8n webhook API[^\n]*\n(?:.*\n)*?PORT=\d+\n)/,
      `$1API_PUBLIC_URL=${publicUrl}\n`,
    );
    if (updated === withoutOld) {
      updated = `${withoutOld}\nAPI_PUBLIC_URL=${publicUrl}\n`;
    }
  } else {
    updated = `${withoutOld}\nAPI_PUBLIC_URL=${publicUrl}\n`;
  }

  writeFileSync(envPath, `${updated}\n`);
}

function printAttioInstructions(publicUrl) {
  console.log("");
  console.log("────────────────────────────────────────────────────────");
  console.log("  Public API URL (also saved to .env as API_PUBLIC_URL):");
  console.log(`  ${publicUrl}`);
  console.log("");
  console.log("  In Attio → App settings → Optional integrations, set:");
  console.log(`    API public URL  →  ${publicUrl}`);
  console.log("    Webhook secret  →  same as WEBHOOK_SECRET in .env");
  console.log("");
  console.log("  Keep this terminal open while using SLNG audio in Attio.");
  console.log("────────────────────────────────────────────────────────");
  console.log("");
}

console.log(`Checking ${localUrl}/health …`);
const apiUp = await waitForApi();
if (!apiUp) {
  console.error("");
  console.error("API is not running. Start it first in another terminal:");
  console.error("  pnpm api:dev");
  console.error("");
  process.exit(1);
}

console.log("API is up. Starting Cloudflare quick tunnel (no account needed)…");
console.log("");

const child = spawn(
  "npx",
  ["--yes", "cloudflared", "tunnel", "--url", localUrl],
  { stdio: ["ignore", "pipe", "pipe"], shell: false },
);

let publicUrl;
let resolved = false;

function maybeResolve(url) {
  if (resolved || !url) {
    return;
  }
  resolved = true;
  publicUrl = url;
  updateEnvPublicUrl(publicUrl);
  printAttioInstructions(publicUrl);
}

function scanLine(line) {
  const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  if (match) {
    maybeResolve(match[0]);
  }
}

child.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  for (const line of text.split("\n")) {
    scanLine(line);
  }
});

child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  process.stderr.write(text);
  for (const line of text.split("\n")) {
    scanLine(line);
  }
});

child.on("exit", (code) => {
  if (!resolved) {
    console.error("Tunnel exited before a public URL was assigned.");
  }
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
});
