# Project Structure

> Status: as-built · Last verified: 2026-11-15

> How the repository is organized.

---

## Top Level

There is **no root `package.json`** and no shared `packages/` folder — each app owns its own dependencies, lockfile and build.

| Path | What it is |
|------|------------|
| `apps/api/` | FastAPI backend (Python, managed with `uv`) |
| `apps/web/` | Next.js 16 frontend (TypeScript) |
| `apps/cli/` | `learnhouse` deployment/dev CLI (TypeScript, published to npm) |
| `apps/collab/` | Hocuspocus/Yjs realtime server (TypeScript) |
| `apps/mcp/` | MCP server placeholder — currently only `.env.example` |
| `docs/` | This documentation set |
| `docker/` | Container helpers (`nginx.conf`, `start.sh`) |
| `Dockerfile` | Root production image |
| `.learnhouse/` | **Generated at runtime**, not checked in (see below) |

---

## `apps/api` — FastAPI Backend

| Path | Purpose |
|------|---------|
| `app.py` | FastAPI app, lifespan, middleware, router wiring |
| `cli.py` | Typer installer CLI |
| `config/config.py` + `config/config.yaml` | `LearnHouseConfig` loading (env → YAML) |
| `src/router.py` | Single `v1_router` with prefix `/api/v1` |
| `src/routers/` | Route handlers, grouped by domain |
| `src/services/` | Business logic |
| `src/db/` | SQLModel models (domain subpackages + flat modules) |
| `src/security/` | Auth, RBAC, plan/feature gates |
| `src/core/` | Events (startup/DB), CORS middleware, `deployment_mode.py`, `ee_hooks.py` |
| `src/tests/` | pytest suite (`conftest.py`, router/security tests) |
| `migrations/` | Alembic environment and versions |
| `scripts/migrate.py` | Data migration helper |
| `pyproject.toml` | Python dependencies and pytest config |

> There is no `src/api/` and no `apps/api/tests/` — routes live in `src/routers/` and tests in `src/tests/`.

---

## `apps/web` — Next.js Frontend

| Path | Purpose |
|------|---------|
| `app/` | App Router pages and route handlers |
| `app/api/` | Route handlers: `health`, `revalidate`, `robots`, `sitemap`, catch-all `v1/[...path]` backend proxy |
| `components/ui/` | Local UI kit (ported from Medusa UI tokens; no Medusa dependency) |
| `components/Dashboard/` | Admin dashboard components, grouped by page |
| `components/Objects/` | Shared domain UI (courses, activities, communities, menus…) |
| `components/Contexts/` | React context providers (auth, org, course, i18n, podcasts…) |
| `services/` | Typed API service layer (see [services](./frontend/services.md)) |
| `lib/` | Shared utilities (auth, i18n, SEO, fonts, constants) |
| `hooks/` | Cross-page React hooks |
| `locales/` | Translation JSON files |
| `public/` | Static assets |
| `styles/globals.css` | Global CSS and design tokens |
| `ee/` | Enterprise-only frontend code (multi-tenant resolver) |
| `proxy.ts` | Next.js middleware: tenancy resolution and rewrites |
| `next.config.js` | Next.js config (Sentry-wrapped) |

---

## `apps/cli` — LearnHouse CLI

| Path | Purpose |
|------|---------|
| `bin/learnhouse.ts` | CLI source entry (built to `dist/bin/learnhouse.js`) |
| `src/commands/` | Commands: `setup`, `start`, `stop`, `status`, `dev`, `logs`, `backup`, `restore`, `update`, `doctor`, `shell`, … |
| `src/services/` | Docker, config store, env checks, health, version checks |
| `src/templates/` | Generated Caddyfile, Nginx and env templates |
| `tests/` | Vitest unit + e2e tests |

Built with `tsup`; the npm package name is `learnhouse`.

---

## `apps/collab` — Realtime Server

A single entry file, `src/index.ts`, running the Hocuspocus server (package `@learnhouse/collab`). See [collab-server](./collab-server.md) for protocol details and commands.

---

## `apps/mcp`

Only `apps/mcp/.env.example` exists at the moment — there is no server source in this repository.

---

## `docs/`

Numbered sections (`01-getting-started` … `10-changelog`), each with a `README.md` index.

---

## `.learnhouse/` — Runtime Only

`.learnhouse/` is **created at runtime** by the dev CLI, not stored in the repo:

- `apps/cli/src/commands/dev.ts` writes `.learnhouse/docker-compose.dev.yml` next to the project (Postgres `pgvector/pgvector:pg16` on port 5434 plus Redis on 6379) before spawning the apps.
- `apps/cli/src/services/config-store.ts` keeps installed deployments under `~/.learnhouse/<name>`.

Do not commit `.learnhouse/`, and do not treat it as a shared configuration folder.
