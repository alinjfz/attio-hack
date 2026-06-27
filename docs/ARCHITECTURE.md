# Architecture

Recruiting Copilot uses a shared core pipeline consumed by two isolated paths:

```mermaid
flowchart TB
  subgraph attioPath [Attio demo path]
    UI[Record widget + actions]
    SF[Server functions]
    Core[packages/core]
    UI --> SF --> Core
    SF --> AttioREST[Attio REST API]
  end

  subgraph integrations [Partner APIs via core]
    Core --> SIE[Superlinked SIE]
    Core --> Gemini[Gemini API]
    Core --> Tavily[Tavily API]
  end

  subgraph n8nPath [n8n side path]
    n8nWF[n8n workflow]
    API[api/ webhook]
    n8nWF --> API --> Core
    API --> AttioREST
  end
```

## Data flow

1. Recruiter triggers research on a Person record (widget, action, or bulk).
2. Server function loads linked Role `description` + Person `cv_text` via GraphQL.
3. `runResearch()` scores fit (Superlinked) and generates drafts (Gemini).
4. Optional Tavily enrichment when CV is thin.
5. Recruiter reviews bundle in approval dialog — edit, Approve, or Reject.
6. On approve only: PATCH Person fields + POST HM note via Attio REST.

## Isolation guarantees

- The Attio app never calls `api/` — only n8n does.
- `api/` failure does not affect Attio server functions.
- Secrets stay in server functions and the standalone API process.
