# Architecture Overview

> Status: as-built · Last verified: 2026-11-15

> High-level system architecture of LearnHouse.

---

## System Diagram

```
                        Browser
                           │
          ┌────────────────┼─────────────────┐
          │                                  │
  Next.js web (3000)                 Yjs client (boards)
  App Router + proxy.ts                      │ WebSocket
          │ HTTP/REST                        ▼
          │                        Hocuspocus collab (4000)
          ▼                                  │ Redis (6379)
  FastAPI api (1338) ◄───────────────────────┘
          │
     ┌────┴─────┐
     ▼          ▼
 PostgreSQL   Redis
 (pgvector)   (cache)
```

Ports: API `1338` and frontend `3000` come from `apps/api/config/config.yaml`; collab `4000` from `COLLAB_PORT`; Redis `6379`. The dev CLI maps PostgreSQL to `5434` on the host.

---

## The Apps

### `apps/api` — FastAPI Backend

- Python/FastAPI with SQLModel and PostgreSQL + pgvector
- JWT authentication, API tokens and RBAC
- Single REST API under `/api/v1` (`apps/api/src/router.py`)
- Swagger (`/docs`) and ReDoc (`/redoc`) are served **only when `development_mode` is enabled**
- Business logic in `apps/api/src/services/`, routes in `apps/api/src/routers/`

### `apps/web` — Next.js Frontend

- Next.js 16 App Router with React Server Components
- Two layouts: `(withmenu)` for learner pages and `dash` for the admin dashboard
- SWR for client data fetching
- A local `components/ui` kit **ported from Medusa UI design tokens** — no Medusa package dependency
- `proxy.ts` middleware resolves tenancy and rewrites paths

### `apps/collab` — Realtime Server

- Yjs synchronization over Hocuspocus WebSockets on port 4000
- Powers collaborative boards; state cached in Redis and persisted through the API

### `apps/cli` — LearnHouse CLI

- `learnhouse` npm package for setup/deploy/operate and local dev
- Manages Docker containers, environment files, health checks and the dev process tree

### `apps/mcp`

- Placeholder only (`apps/mcp/.env.example`); no server source yet

---

## Key Design Decisions

### Two Layouts, One UI Kit

| Layout | Routes | Audience |
|--------|--------|----------|
| `(withmenu)` | `/orgs/[orgslug]/*` | Learners |
| `dash` | `/orgs/[orgslug]/dash/*` | Administrators |

Both route groups render inside the shared `components/ui` kit. Layouts and providers are not interchangeable — do not move a dashboard component into the learner layout or vice versa.

### Payments Are Implemented

Payments are part of the product and available in every deployment mode (not EE-only):

- Provider enum: `PaymentProviderEnum.CHARGILY` (`apps/api/src/db/payments/enums.py`); methods `edahabia`, `cib`, `chargily_app`.
- API: `apps/api/src/routers/payments.py` (checkout, orders, overview, payout report, access grants, payment settings) and `apps/api/src/routers/payments_webhooks.py` (`POST /payments/webhook/chargily/{org_uuid}`).
- Admin UI: `/orgs/[orgslug]/dash/payments/[subpage]`; learner checkout: `/orgs/[orgslug]/store`.
- Entitlements gate paid resources (`EntitlementSourceEnum`: `purchase`, `manual`, `usergroup`, `free`).
- Stripe keys and `services/payments/providers/stripe.ts` also exist, but Chargily is the provider registered in the backend enum.

Resource access is `public` (any signed-in user), `users_only` (linked user groups) or `paid` (active entitlement) — see `AccessTypeEnum`.

### Multi-Tenancy

`hosting_config.tenancy` selects **`single`** or **`multi`**:

- `single` — always serves the default org on any hostname (localhost or self-hosted VPS); host-only cookies.
- `multi` — `slug.{domain}` subdomain detection plus per-org custom domains; requires EE or `LEARNHOUSE_SAAS=true` and a routable domain.

Each organization gets its own courses, users, branding (fonts, colors, logos), custom domains and SSO configuration (`sso` is an EE-only feature).

### Deployment Modes

`src/core/deployment_mode.py` resolves **`saas` → `ee` → `oss`**. EE-only features are `sso`, `audit_logs`, `analytics_advanced` and `scorm`; SaaS additionally applies plan-based gating and usage limits.

---

## Data Flow

```
User action → Next.js page → service function (@services) → FastAPI router
            → service layer → SQLModel → PostgreSQL (pgvector)
```

1. A page renders data (Server Component) or calls a service function (client component + SWR).
2. Services send requests to the backend (`getAPIUrl()` or the `/api/v1` proxy).
3. The router applies auth/RBAC/plan dependencies, then delegates to a service.
4. The service reads/writes SQLModel entities and returns the serialized response.
