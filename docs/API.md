# API reference

## DraftBundle schema

```json
{
  "twoLiner": "string",
  "fitReasoning": { "pros": ["string"], "cons": ["string"] },
  "gapAnalysis": [{ "area": "string", "gap": "string", "severity": "high|medium|low" }],
  "hmNote": "string",
  "clientSubmittalDraft": "string",
  "candidateEmailDraft": "string",
  "webBullets": [{ "text": "string", "source": "https://..." }]
}
```

## Attio custom fields

| Object | Slug | Type |
|--------|------|------|
| Role | `title`, `description` | text |
| Person | `cv_text`, `linkedin_url`, `role` | text / record ref |
| Person | `fit_score`, `fit_tier`, `two_liner` | number / select / text |

## Webhook (Phase 3)

`POST /webhook/research` — see Phase 3 implementation in `api/src/index.ts`.
