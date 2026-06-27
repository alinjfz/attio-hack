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

1. Start the API server:
   ```bash
   pnpm api:dev
   ```
2. Expose it (demo):
   ```bash
   ngrok http 3001
   ```
3. Set environment variables in n8n:
   - `API_PUBLIC_URL` — e.g. `https://abc123.ngrok.app`
   - `WEBHOOK_SECRET` — same value as in `.env`
4. Import [`recruiting-copilot.json`](../n8n/recruiting-copilot.json) into n8n.
5. Activate the workflow and POST a test payload to the n8n webhook URL:

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
