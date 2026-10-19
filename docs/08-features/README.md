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
| [Progress & Roadmap](./payments/progress.md) | What is shipped, what stopped where, and the ordered list of remaining payments work |
| [Chargily Integration](./payments/chargily-integration.md) | Chargily Pay v2 API integration plan: checkout creation, webhook handling, signature verification, sandbox testing |
| [Teacher Payout Plan](./payments/teacher-payout-plan.md) | Teacher revenue share system: 40/60 pro-rata distribution, earnings ledger, monthly payout calculation, admin/teacher dashboards |

### Collections

| Document | Description |
|----------|-------------|
| [Implementation Plan](./collections/implementation-plan.md) | Course-grade collections: full media parity, add/remove course table, three access modes, purchase fan-out to per-course entitlements, and the phased delivery plan |

### AI

| Document | Description |
|----------|-------------|
| [Overview](./ai/overview.md) | AI Copilot features, Magic Blocks, course planning assistance, RAG system, embedding pipeline |

### Communities

| Document | Description |
|----------|-------------|
| [Overview](./communities/overview.md) | Community access control model (3 dimensions), publish/unpublish, public/restricted, course linking, moderation, discussions |

### Video & Media

| Document | Description |
|----------|-------------|
| [Cloudflare Stream Integration](./video/cloudflare-stream-integration.md) | Video upload, encoding, and streaming via Cloudflare Stream |
| [Video Protection & DRM](./video/video-protection-drm.md) | Multi-tier content protection strategy: signed URLs, DRM, screen recording prevention, offline downloads, CDN cost savings |

### Mobile App

| Document | Description |
|----------|-------------|
| [Mobile App Architecture](./mobile-app/mobile-app-architecture.md) | Cross-platform mobile app with Capacitor — same Next.js codebase, native features, app store distribution |

### Desktop App

| Document | Description |
|----------|-------------|
| [Desktop App Architecture](./desktop-app/desktop-app-architecture.md) | Cross-platform desktop app with Capacitor Electron — native OS protection, offline playback, app store distribution |

### Demo Data

| Document | Description |
|----------|-------------|
| [Seed Plan](./demo-seed/seed-plan.md) | One-command demo seeder: fills a demo org with realistic courses, lessons, enrollments, podcasts, community and analytics so the platform can be demoed "fully alive" on demand |

### Dashboard Polish

| Document | Description |
|----------|-------------|
| [Consistency Plan](./dashboard-polish/consistency-plan.md) | Delivered dashboard consistency sweep: shared `ActionRow` / `PageTabs` / `ConceptIcon` / `SectionIcon` primitives, unified filters and selects, and translation-ready strings across en / fr / ar (Phase 5 guardrails pending) |

### Navigation

| Document | Description |
|----------|-------------|
| [User Breadcrumbs Plan](./navigation/user-breadcrumbs-plan.md) | Learner-side breadcrumbs: one trail per screen resolved from the route plus page-registered entity names (`Home > Courses > Course > Lesson`), translated across en / fr / ar; inline-only surfaces (community feed, podcast episodes) intentionally add no crumb |

### Internationalization & RTL

| Document | Description |
|----------|-------------|
| [RTL Plan](./i18n-rtl/rtl-plan.md) | English / French / Arabic with accurate bidirectional layout: direction plumbing shipped (SSR `lang`/`dir`, `DirectionProvider`, Arabic font); logical-property refactor and QA pending |

### Planned (Future)

| Document | Description |
|----------|-------------|
| [PostHog Integration](./analytics/posthog-integration-plan.md) | PostHog analytics platform: product analytics, session replay, feature flags, A/B testing, surveys, error tracking |
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
         (paymentorder,
          resourceentitlement,
          payment_webhook_event)
```

- The frontend initiates checkout via Koodook API endpoints (never talks directly to Chargily).
- The backend creates Chargily checkouts, handles webhook callbacks, and manages the payment lifecycle.
- `paymentorder` records every checkout, `resourceentitlement` records every access grant, `payment_webhook_event` guarantees idempotent webhook processing.
- Access is enforced through resource flags, backend checks, and frontend UI gating.

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
