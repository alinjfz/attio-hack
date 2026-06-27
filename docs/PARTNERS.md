# Partner integrations

See the main [build plan](../recruiting_copilot_plan.md) for full setup details. Summary per sponsor:

## Attio

- **Docs:** [App SDK](https://docs.attio.com/sdk/guides/creating-an-app) · [REST API](https://docs.attio.com/rest-api/overview)
- **Setup:** `cd attio-app && pnpm dev` — install in hackathon workspace
- **Env:** `ATTIO_API_TOKEN` (auto-injected in server functions)

## Superlinked SIE

- **Docs:** [TypeScript SDK](https://superlinked.com/docs/reference/typescript-sdk/)
- **Setup:** `SUPERLINKED_API_KEY` + `SUPERLINKED_CLUSTER_URL` from hackathon Discord
- **Model:** `BAAI/bge-m3`
- **Note:** Cluster may cold-start (5–7 min); pre-warm before demo

## Gemini

- **Docs:** [Gemini API](https://ai.google.dev/gemini-api/docs)
- **Setup:** `GEMINI_API_KEY` from Google AI Studio
- **Model:** `gemini-2.5-flash`

## Tavily (Phase 3)

- **Docs:** [JS quickstart](https://docs.tavily.com/sdk/javascript/quick-start)
- **Env:** `TAVILY_API_KEY`, `ENABLE_TAVILY=true`

## n8n (Phase 3)

- **Docs:** [n8n docs](https://docs.n8n.io/)
- Import `n8n/recruiting-copilot.json`, point webhook at `API_PUBLIC_URL`

## SLNG (Phase 3)

- **Docs:** [Getting started](https://docs.slng.ai/getting-started)
- **Env:** `SLNG_API_KEY`, `ENABLE_SLNG=true`

## Aikido

- Connect GitHub repo at [aikido.dev](https://www.aikido.dev)
- Screenshot security report for README
