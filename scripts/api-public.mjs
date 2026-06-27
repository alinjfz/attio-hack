#!/usr/bin/env node
/**
 * Start api/ and a Cloudflare quick tunnel together for Attio SLNG audio.
 * One command — keeps API + tunnel in sync.
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");

function readEnvValue(name) {
  try {
    const match = readFileSync(envPath, "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
    return match?.[1]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

const port = readEnvValue("PORT") ?? "3001";
const localUrl = `http://127.0.0.1:${port}`;

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

  const portLine = contents.match(/^PORT=\d+$/m)?.[0] ?? `PORT=${port}`;
  let updated;
  if (withoutOld.includes(portLine)) {
    const idx = withoutOld.indexOf(portLine) + portLine.length;
    updated = `${withoutOld.slice(0, idx)}\nAPI_PUBLIC_URL=${publicUrl}${withoutOld.slice(idx)}`;
  } else {
    updated = `${withoutOld}\nAPI_PUBLIC_URL=${publicUrl}\n`;
  }

  writeFileSync(envPath, `${updated.endsWith("\n") ? updated : `${updated}\n`}`);
}

async function waitForApi(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${localUrl}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // API not up yet.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
  }
  return false;
}

function printAttioInstructions(publicUrl) {
  console.log("");
  console.log("════════════════════════════════════════════════════════");
  console.log("  SLNG audio is ready. Copy this into Attio app settings:");
  console.log(`  api_public_url  →  ${publicUrl}`);
  console.log("  webhook_secret  →  must match WEBHOOK_SECRET in .env exactly");
  console.log("");
  console.log("  Leave this terminal running while demoing audio in Attio.");
  console.log("  If you restart this command, update api_public_url again.");
  console.log("════════════════════════════════════════════════════════");
  console.log("");
}

async function startTunnel() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      ["--yes", "cloudflared", "tunnel", "--url", localUrl],
      { stdio: ["ignore", "pipe", "pipe"], shell: false },
    );

    let resolved = false;

    function scanLine(line) {
      const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (match && !resolved) {
        resolved = true;
        const publicUrl = match[0];
        updateEnvPublicUrl(publicUrl);
        printAttioInstructions(publicUrl);
        resolve({ child, publicUrl });
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
        reject(new Error(`Tunnel exited before a public URL was assigned (code ${code ?? 0}).`));
      }
    });
  });
}

console.log("Starting API on port", port, "…");

const api = spawn("pnpm", ["--filter", "@recruiting-copilot/api", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

api.on("exit", (code) => {
  process.exit(code ?? 0);
});

console.log(`Waiting for ${localUrl}/health …`);
const apiUp = await waitForApi();
if (!apiUp) {
  console.error("API failed to start on port", port);
  api.kill("SIGTERM");
  process.exit(1);
}

console.log("API is up. Starting Cloudflare tunnel …");

const { child: tunnel } = await startTunnel();

process.on("SIGINT", () => {
  tunnel.kill("SIGINT");
  api.kill("SIGINT");
});

tunnel.on("exit", () => {
  api.kill("SIGTERM");
});
