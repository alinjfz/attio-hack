# n8n workflow — Recruiting Copilot mirror

The n8n path is **isolated** from the Attio app. If n8n or `api/` is down, the Attio demo still works.

## Architecture

```
Webhook (n8n) → POST api/webhook/research → packages/core runResearch() → JSON bundle
                                                      ↓
                                            Manual approval in n8n
                                                      ↓
                                            Optional Attio REST write (approve: true)
```

## Setup

### 1. Install dependencies (from repo root)

```bash
pnpm install   # project deps (n8n runs via Docker or npx — not bundled in node_modules)
```

### 2. Start local services

Terminal A — webhook API (uses `packages/core`, respects `ENABLE_TAVILY=false`):

```bash
pnpm api:dev
```

Terminal B — n8n UI (requires [Docker](https://docs.docker.com/get-docker/)):

```bash
pnpm n8n:dev
```

No Docker? Use the npx fallback (downloads n8n on first run):

```bash
pnpm n8n:dev:npx
```

Open **http://localhost:5678** (first run creates a local owner account). Workflow data is stored in `.n8n-data/` (gitignored).

Import the workflow:

```bash
pnpm n8n:import
```

Or import manually in the n8n UI: **Workflows → Import from file** → `n8n/recruiting-copilot.json`.

### 3. Configure n8n environment

In n8n **Settings → Variables** (or workflow node URLs):

| Variable | Example |
|----------|---------|
| `API_PUBLIC_URL` | `http://localhost:3001` |
| `WEBHOOK_SECRET` | same as `.env` |

For a public demo, expose the API:

```bash
ngrok http 3001
```

### 4. Activate and test

```json
{
  "recordId": "person_record_id_optional",
  "roleDescription": "Senior engineer role brief…",
  "cvText": "Candidate CV text…",
  "candidateName": "Alex Morgan",
  "linkedinUrl": "https://linkedin.com/in/alex"
}
```

## Validation

- Attio app works with `api/` stopped.
- `curl -H "X-Webhook-Secret: $WEBHOOK_SECRET" …` returns `{ fit, bundle }`.
- n8n execution log shows formatted review summary.

## Attio write-back from n8n

Add an HTTP Request node after manual approval:

```
POST {{API_PUBLIC_URL}}/webhook/research
```

Include `"approve": true` and `"recordId"` in the body to PATCH fields and POST the HM note via Attio REST (requires `ATTIO_API_TOKEN` in `api/` env).
