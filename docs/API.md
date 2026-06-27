# API reference

## DraftBundle JSON schema

```typescript
{
  twoLiner: string;
  fitReasoning: { pros: string[]; cons: string[] };
  gapAnalysis: Array<{ area: string; gap: string; severity: "high" | "medium" | "low" }>;
  hmNote: string;
  clientSubmittalDraft: string;
  candidateEmailDraft: string;
  webBullets: Array<{ text: string; source?: string }>;
}
```

Zod source: `packages/core/src/schemas/draft-bundle.ts`

## ResearchResult

```typescript
{
  fit: { score: number; tier: "Strong" | "Good" | "Weak" | "Unknown"; rawSimilarity: number };
  bundle: DraftBundle;
}
```

## Attio server functions

| Function | Input | Output | Writes Attio? |
|----------|-------|--------|---------------|
| `save-cv-text.server.ts` | `recordId`, `cvText` | `void` | Yes (`cv_text`) |
| `research-candidate.server.ts` | `recordId` | `ResearchResult` | No |
| `approve-writeback.server.ts` | `recordId`, `fit`, `bundle` | `void` | Yes (fields + note) |
| `summarize-list.server.ts` | `{ candidates[] }` | `{ script, audioBase64, contentType }` | No |

### `research-candidate.server.ts`

Loads Person + linked Role via Attio REST, runs `runResearch()` with Superlinked + Gemini (+ Tavily when `ENABLE_TAVILY=true`).

**Errors:**
- Missing Role link or description
- Empty CV
- Missing partner API keys

### `approve-writeback.server.ts`

PATCH `fit_score`, `fit_tier`, `two_liner` and POST markdown HM note with pros/cons.

## Webhook API (n8n only)

### `GET /health`

```json
{ "ok": true, "service": "recruiting-copilot-api", "version": "0.0.1" }
```

### `POST /webhook/research`

**Auth:** `X-Webhook-Secret: <WEBHOOK_SECRET>`

**Body:**

```json
{
  "recordId": "optional_attio_person_id",
  "roleDescription": "required",
  "cvText": "required",
  "candidateName": "required",
  "linkedinUrl": "optional",
  "roleTitle": "optional",
  "approve": false
}
```

**Response:** `ResearchResult` JSON

When `approve: true` and `recordId` are set, the API also writes fit fields and HM note using `ATTIO_API_TOKEN`.

### `POST /tts`

**Auth:** `X-Webhook-Secret: <WEBHOOK_SECRET>`

**Body:**

```json
{ "text": "Alex Morgan scores 75 percent, Good fit. …" }
```

**Response:**

```json
{
  "id": "uuid",
  "url": "https://your-api/tts/uuid",
  "downloadUrl": "https://your-api/tts/uuid?download=1",
  "contentType": "audio/wav"
}
```

Requires `SLNG_API_KEY` on the api server. For public playback URLs from Attio or n8n, run `pnpm api:public` (Cloudflare tunnel) and use the printed `API_PUBLIC_URL`.

## Attio custom field slugs

| Object | Slug | Type |
|--------|------|------|
| Role (`roles`) | `title`, `description` | text |
| Person | `cv_text`, `linkedin_url` | text |
| Person | `role` | record reference → Role |
| Person | `fit_score` | number |
| Person | `fit_tier` | select (`strong`, `good`, `weak`, `unknown`) |
| Person | `two_liner` | text |

## CLI smoke test

```bash
pnpm research:smoke -- --cv packages/core/fixtures/sample-cv.txt --role packages/core/fixtures/sample-role.txt
```

Requires `SUPERLINKED_CLUSTER_URL`, `SUPERLINKED_API_KEY`, and `GEMINI_API_KEY` in `.env`.
