# Development Setup

> Status: as-built · Last verified: 2026-11-15

Docker runs only PostgreSQL and Redis; the API, web app, and collab server run as local processes with hot reload, orchestrated by the repo CLI.

---

## 1. Architecture

| Component | What it is | Runs as |
|-----------|-----------|---------|
| `apps/api` | FastAPI backend | local process (`uv run python app.py`) |
| `apps/web` | Next.js frontend | local process (`next dev --webpack`) |
| `apps/collab` | Hocuspocus/Yjs server for boards | local process (`tsx watch src/index.ts`) |
| `learnhouse-db-dev` | PostgreSQL with pgvector | Docker container |
| `learnhouse-redis-dev` | Redis | Docker container |

The CLI (`apps/cli`) checks env files, starts the containers, installs missing dependencies, spawns the three servers, and provides restart hotkeys.

---

## 2. Prerequisites

| Tool | Why | Check |
|------|-----|-------|
| Docker Desktop | PostgreSQL + Redis containers | `docker info` |
| Bun | web, collab, and the CLI | `bun --version` |
| uv | Python dependency manager for the API | `uv --version` |

Docker must be running before you start the dev command.

---

## 3. Ports and URLs

| Service | Host port | URL |
|---------|-----------|-----|
| Web | 3000 | http://localhost:3000 |
| API | 1338 | http://localhost:1338 |
| Swagger UI / ReDoc | 1338 | http://localhost:1338/docs, `/redoc` (development mode only) |
| Collab WebSocket | 4000 | ws://localhost:4000 |
| PostgreSQL | **5434** | mapped to 5432 inside the container |
| Redis | 6379 | — |

The API port is `LEARNHOUSE_PORT`, falling back to `hosting_config.port` in `apps/api/config/config.yaml`.

### Admin account

The example command below passes `admin@school.dev` / `admin123456`. Auto-install uses those credentials on the first run against an empty database; once an organization exists the values are ignored.

---

## 4. Start dev mode

From the repository root:

```bash
bun run apps/cli/bin/learnhouse.ts dev --admin-email admin@school.dev --admin-password admin123456
```

What happens:

1. The three env files are checked. If required keys are missing, the CLI lists them and offers to append defaults (or you can abort and set them yourself).
2. When the containers are not already running, admin credentials are prompted for (unless passed as flags), and `.learnhouse/docker-compose.dev.yml` is written and started.
3. Containers are reused if they are already running.
4. `bun install` runs in `apps/web` / `apps/collab` when `node_modules` is absent; `uv sync` runs in `apps/api` when `.venv` is absent.
5. API (1338), web (3000), and collab (4000) start with hot reload.

The first startup also runs the API's auto-install: `SQLModel.metadata.create_all` plus default roles and organization/admin creation when the database has no organization.

### Interactive controls

Available only in a real terminal (not an IDE background terminal):

| Key | Action |
|-----|--------|
| `ra` | restart API |
| `rw` | restart web |
| `rc` | restart collab |
| `rb` | restart all |
| `q` / `Ctrl+C` | stop the app servers (containers stay up) |

---

## 5. Stop and restart

Stop the app servers: press `q` or `Ctrl+C`.

Stop the containers:

```bash
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev down
```

Start them again without the CLI:

```bash
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev up -d
```

Reset the dev database (deletes data):

```bash
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev down -v
```

---

## 6. Environment files

| File | Purpose |
|------|---------|
| `apps/api/.env` | DB/Redis connection strings, JWT secret, admin seed, port |
| `apps/web/.env.local` | Backend URL (and optional runtime overrides) |
| `apps/collab/.env` | API URL, JWT secret, internal key, port |

The dev command does not fail fast on missing variables: it lists them, then either appends dev defaults or exits if you choose to abort. See [Environment Variables](../05-developer-guide/environment-variables.md) for the full list.

---

## 7. Demo seed

The seeder is a Python entry point, not a Bun script. Run it from `apps/api`:

```bash
cd apps/api
uv run python -m src.services.seed --demo
```

| Flag | Effect |
|------|--------|
| `--demo` | Required confirmation |
| `--reset` | Deletes the `demo` organization, its rows, its content folder, and seeded user avatars before re-seeding |
| `--assets-dir <path>` | Alternate image source; defaults to `apps/api/seed-assets` |
| `--seed-activity-translations` / `--seed-collection-translations` / `--seed-community-translations` / `--seed-podcast-translations` | Run one translation backfill instead of the demo seed |

Notes:

- `LEARNHOUSE_DEVELOPMENT_MODE=true` is required; the seeder refuses to run otherwise.
- If the `demo` org already exists, the seeder refuses unless you pass `--reset`.
- The reset is scoped to the demo organization — it does not wipe unrelated organizations or the whole `content/` directory.
- Seeded content is written under `apps/api/content` (working directory), and the command prints the demo URL plus the owner login (`owner@koodook.academy` / `Demo12345`).

---

## 8. Running a service manually

From the app folder:

```bash
# API
cd apps/api && uv run python app.py

# Web (same flag the CLI uses)
cd apps/web && bunx next dev --webpack

# Collab
cd apps/collab && bun run dev
```

The API expects to run with `apps/api` as the working directory (it resolves `config/`, `src/`, and `migrations/` relative to it).

---

## 9. Troubleshooting

- **DB connection refused** — the dev database is on **5434**; make sure `apps/api/.env` uses `localhost:5434` and the `learnhouse-db-dev` container is running.
- **Port already in use** — check 3000, 1338, 4000, 5434, and 6379; stop the conflicting process.
- **`/docs` 404** — set `LEARNHOUSE_DEVELOPMENT_MODE=true`.
- **Collab exits** — both `LEARNHOUSE_AUTH_JWT_SECRET_KEY` and `COLLAB_INTERNAL_KEY` must be present and match the API.

Full symptom-by-symptom guide: [Troubleshooting](../05-developer-guide/troubleshooting.md).
