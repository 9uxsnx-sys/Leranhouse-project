> Status: as-built · Last verified: 2026-11-15

# Features

> Deep-dive documentation for feature areas that span several layers of the platform: database, backend services, API endpoints, frontend components and third-party integrations.

Unlike the admin or user guides, which explain how to use a feature, these pages explain how it works internally.

## Payments

| Document | Description |
|----------|-------------|
| [Overview](./payments/overview.md) | Payment architecture: Chargily Pay v2 integration, the paid product page and store, access gating and transaction records |
| [Progress & Roadmap](./payments/progress.md) | What is shipped, what stopped where, and the ordered list of remaining payments work |
| [Chargily Integration](./payments/chargily-integration.md) | Chargily Pay v2 API integration: checkout creation, webhook handling, signature verification, sandbox testing |

## Analytics

| Document | Description |
|----------|-------------|
| [Overview](./analytics/overview.md) | The 7-tab Analytics area: metric catalog, tiers and UI rules |
| [Implementation Plan](./analytics/implementation-plan.md) | The shipped build contract: API surface, event schema and the per-card metric map |

## AI

| Document | Description |
|----------|-------------|
| [Overview](./ai/overview.md) | AI Copilot features, Magic Blocks, course planning assistance, RAG system and embedding pipeline |

## Communities

| Document | Description |
|----------|-------------|
| [Overview](./communities/overview.md) | Community access control model, publish/unpublish, public/restricted, course linking, moderation and discussions |

## Notifications

| Document | Description |
|----------|-------------|
| [Overview](./notifications/overview.md) | In-app notifications: events and categories, audience rules, per-org template overrides with EN/FR/AR defaults, snapshot rendering and the dashboard tabs |

## Video and Media

| Document | Description |
|----------|-------------|
| [Cloudflare Stream Integration](./video/cloudflare-stream-integration.md) | Video upload, encoding and streaming via Cloudflare Stream |

## Internationalization and RTL

| Document | Description |
|----------|-------------|
| [RTL and Direction](./i18n-rtl/rtl-plan.md) | English / French / Arabic with bidirectional layout: direction plumbing, logical properties and what is not built yet |
| [Localisation Progress](./i18n-rtl/progress.md) | As-built status per surface, verification commands and open decisions |
| [Content Localization](./i18n-rtl/content-localization.md) | Course metadata, SEO, chapters and lessons: `course_translation`, `extra_metadata.translations`, fallback chain, dashboard editors and learner surfaces |
| [Collections Localization](./i18n-rtl/collections-localization.md) | `collection_translation`, `?locale=` on every read, locale-aware editors, Translations tab and fallback notice |
| [Podcasts Localization](./i18n-rtl/podcasts-localization.md) | `podcast_translation` and `podcast_episode_translation`, localized `/meta` and episode lists, locale-aware editors |

## Demo Data

| Document | Description |
|----------|-------------|
| [Seed Manifest](./demo-seed/seed-manifest.md) | Countable list of every table and row the demo seeder creates, plus copy voice rules and the asset contract |
| [Seed Plan](./demo-seed/seed-plan.md) | One-command demo seeder that fills a demo org with courses, lessons, enrollments, podcasts, community and analytics |

## Dashboard Polish

| Document | Description |
|----------|-------------|
| [Consistency Plan](./dashboard-polish/consistency-plan.md) | Delivered dashboard consistency sweep: shared primitives, unified filters and selects, translation-ready strings |
| [Glossary](./dashboard-polish/glossary.md) | Shared vocabulary for dashboard sections, actions and icons |

## Navigation

| Document | Description |
|----------|-------------|
| [User Breadcrumbs](./navigation/user-breadcrumbs-plan.md) | Learner-side breadcrumbs: one trail per screen resolved from the route plus page-registered entity names |

## Home Page

| Document | Description |
|----------|-------------|
| [Home Page Layout](./home-page/home-page.md) | Learner home page: 4 content sections, responsive grid, trending endpoint and "See All" routing |

## How features relate to the code

Each feature in this section touches the same layers:

```
Frontend (Next.js)         → UI components, pages, state management
API (FastAPI routers)      → Endpoints, request validation, response formatting
Services (FastAPI)         → Business logic, third-party API clients
Database (PostgreSQL)      → Schema, indexes, queries, migrations
External services          → Chargily Pay v2, LLM providers, Cloudflare
```

- **Single source of truth.** Payment state lives in the database and is managed by the backend; the frontend reflects it.
- **Idempotent processing.** Webhook handlers and payment events are safe to process more than once.
- **Feature gating.** Resource access is enforced by backend checks and mirrored in the frontend UI.

> See the [Architecture Overview](../02-architecture/overview.md) for the full system design context.
