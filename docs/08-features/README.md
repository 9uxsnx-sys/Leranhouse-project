# Features

> Deep-dive documentation for significant feature areas that span multiple parts of the Koodook codebase — payments, AI, realtime collaboration, and SEO.

---

## What This Section Covers

The documents in this section describe cross-cutting feature areas that touch multiple layers of the platform (database, backend services, API endpoints, frontend components, and third-party integrations). Unlike the admin or user guides — which explain how to *use* features — these documents explain how features *work* internally: the architecture, data flow, integration points, and design decisions behind each major capability.

## Quick Links

### Payments

| Document | Description |
|----------|-------------|
| [Overview](./payments/overview.md) | Payment system architecture: Chargily Pay v2 integration, course purchase flow, access gating, transaction records, refunds |
| [Chargily Integration](./payments/chargily-integration.md) | Chargily Pay v2 API integration plan: checkout creation, webhook handling, signature verification, sandbox testing |

### AI

| Document | Description |
|----------|-------------|
| [Overview](./ai/overview.md) | AI Copilot features, Magic Blocks, course planning assistance, RAG system, embedding pipeline |

### Planned (Future)

| Document | Description |
|----------|-------------|
| `realtime.md` | Yjs-based realtime collaboration with Hocuspocus server |
| `seo.md` | SEO system: metadata, sitemaps, Open Graph, JSON-LD |

## How Features Relate to the Platform Architecture

Each feature in this section integrates across the following layers:

```
Frontend (Next.js)         → UI components, pages, state management
API (FastAPI routers)      → Endpoints, request validation, response formatting
Services (FastAPI)         → Business logic, third-party API clients
Database (PostgreSQL)      → Schema, indexes, queries, migrations
External Services          → Chargily Pay v2, LLM providers, Tinybird
```

### Payment System Architecture

```
User Browser ──► Koodook API ──► Chargily Pay v2
                    │
                    ▼
              PostgreSQL
         (payment_orders,
          course_purchases)
```

- The frontend initiates checkout via Koodook API endpoints (never talks directly to Chargily).
- The backend creates Chargily invoices, handles webhook callbacks, and manages the payment lifecycle.
- Database tables (`payment_orders`, `course_purchases`) record every transaction and access grant.
- Access is enforced through database flags, backend middleware, and frontend UI gating.

### AI System Architecture

```
Editor (Frontend) ──► AI API ──► LLM Provider (Gemini)
                              │
                              ▼
                         Vector DB
                     (pgvector embeddings)
```

- AI Copilot and Magic Blocks use the LLM provider for content generation.
- The RAG system retrieves relevant course content via pgvector similarity search and grounds LLM responses in that content.
- An embedding pipeline extracts, chunks, and indexes course content on save.

### Key Design Principles

- **Single source of truth.** Payment state lives in the database, managed by the backend. The frontend reflects the database state.
- **Idempotent processing.** Webhook handlers and payment events must be safe to process multiple times.
- **Feature gating.** Organization-level feature flags control which features are available (payments, AI, communities, etc.).
- **Extensibility.** Payment providers and LLM providers are abstracted behind interfaces, making future swaps possible.

---

> See the [Architecture Overview](../02-architecture/overview.md) for the full system design context.
