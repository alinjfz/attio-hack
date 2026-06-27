# Recruiting Copilot

Attio holds the context. We research candidates, score semantic fit, and draft HM notes and submittals — nothing writes to the CRM until a human approves.

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm test
cd attio-app && pnpm dev
```

## Partner technologies

| Partner | Role |
|---------|------|
| Attio | CRM data model, UI surfaces, approval write-back |
| Superlinked SIE | Semantic fit scoring via embeddings |
| Gemini | Draft generation (2-liner, HM note, submittal, email) |
| Tavily | Web research fallback (Phase 3) |
| n8n | Isolated workflow mirror (Phase 3) |
| SLNG | Audio list summary (Phase 3) |
| Aikido | Repo security scan (submission) |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Partner setup](docs/PARTNERS.md)
- [API reference](docs/API.md)

## Mock data setup

In your Attio hackathon workspace:

1. Create a **Role** custom object with `title` and `description` fields.
2. Extend **Person** with `cv_text`, `role` (record ref → Role), `fit_score`, `fit_tier`, `two_liner`.
3. Create a **Recruiting** list with 3+ candidates linked to roles.

## Security

Connect the repo to [Aikido](https://www.aikido.dev) for automated security scanning. Screenshot the report for submission.
