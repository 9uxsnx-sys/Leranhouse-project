# LearnHouse — Development Environment Setup

This guide documents how to run the LearnHouse platform locally in **dev mode**
(not self-hosted/production). It captures the exact working configuration of
this machine, including the port conventions and known pitfalls.

---

## 1. Architecture overview

The platform is a monorepo with 4 apps. In dev mode, **Docker runs only the
infrastructure** (PostgreSQL + Redis) and the three app servers run as local
processes with hot reload:

| Component | What it is | Runs as |
|-----------|-----------|---------|
| `apps/api` | FastAPI backend | local process (`uv run python app.py`) |
| `apps/web` | Next.js frontend | local process (`next dev --turbopack`) |
| `apps/collab` | Yjs/Hocuspocus realtime server | local process (`tsx watch src/index.ts`) |
| `learnhouse-db-dev` | PostgreSQL (pgvector) | Docker container |
| `learnhouse-redis-dev` | Redis | Docker container |

The CLI (`apps/cli`) orchestrates all of this: it checks env files, starts the
containers if needed, auto-installs missing dependencies, spawns the three
servers, and gives you restart controls.

---

## 2. Prerequisites

| Tool | Why | Check with |
|------|-----|-----------|
| Docker Desktop | runs PostgreSQL + Redis containers | `docker version` |
| Bun | installs/runs web, collab, and the CLI itself | `bun --version` |
| uv | Python package manager for the API | `uv --version` |

---

## 3. Ports and access URLs

> ⚠️ **Critical:** a **native PostgreSQL on the host already occupies port
> 5432** on this machine. That is why the Docker DB is mapped to **5434**.
> Never change this back to 5432.

| Service | Host port | URL |
|---------|-----------|-----|
| Web app (main UI) | 3000 | http://localhost:3000 |
| API | 1338 | http://localhost:1338 |
| API docs (Swagger) | 1338 | http://localhost:1338/docs |
| API docs (ReDoc) | 1338 | http://localhost:1338/redoc |
| Collab (websocket) | 4000 | ws://localhost:4000 |
| PostgreSQL | **5434** (→ 5432 in container) | — |
| Redis | 6379 | — |

### Default admin account

```
Email:    admin@school.dev
Password: admin123456
```

Course creation and management are only visible when logged in as admin.

---

## 4. Start dev mode (everyday workflow)

From the repository root:

```bash
bun run apps/cli/bin/learnhouse.ts dev --admin-email admin@school.dev --admin-password admin123456
```

What happens:

1. Env files are validated (`checkDevEnv`).
2. If the `learnhouse-db-dev` / `learnhouse-redis-dev` containers are **not**
   running, they are created from `.learnhouse/docker-compose.dev.yml` and
   started. If they are already running, they are **reused** (data preserved).
3. Missing `node_modules` / `.venv` are auto-installed via `bun install` /
   `uv sync`.
4. API (port 1338), Web (port 3000), Collab (port 4000) start with hot reload.
5. Admin credentials are injected as `LEARNHOUSE_INITIAL_ADMIN_EMAIL` /
   `LEARNHOUSE_INITIAL_ADMIN_PASSWORD` (used on first DB setup).

### Interactive controls (when run in a real terminal)

| Key | Action |
|-----|--------|
| `ra` | restart API |
| `rw` | restart web |
| `rc` | restart collab |
| `rb` | restart all |
| `q` / `Ctrl+C` | stop the dev servers (containers stay running) |

> Note: when run from this IDE's background terminal the key controls are
> unavailable (no TTY); stop it via the terminal instead.

---

## 5. Stop and restart

**Stop only the app servers** (containers keep running for the next session):

```bash
# Press q or Ctrl+C in the dev session
```

**Stop the containers too:**

```bash
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev down
```

**Clean restart (fresh containers, keeps data volume):**

```bash
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev up -d
```

**Reset the database completely (wipes dev data):**

```bash
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev down -v
# then re-run the dev command above
```

---

## 6. Environment files

| File | Purpose |
|------|---------|
| `apps/api/.env` | API config — DB connection string, JWT, admin seed, ports |
| `apps/web/.env.local` | Web config — API URL, NextAuth secrets |
| `apps/collab/.env` | Collab config — API URL, internal key |

The dev CLI validates these exist and fails fast if any is missing.

---

## 7. Troubleshooting

### API fails with "connection refused" or "password authentication failed"

Almost always a **port mismatch** between the API `.env` and the DB container.

- API `.env` must use `localhost:5434`:
  ```
  LEARNHOUSE_SQL_CONNECTION_STRING=postgresql://learnhouse:learnhouse@localhost:5434/learnhouse
  ```
- The DB container must be published on host port **5434**:
  ```
  docker port learnhouse-db-dev        # expect: 5432/tcp -> 0.0.0.0:5434
  ```
- If the volume was created with a different password, reset it:
  ```
  docker exec learnhouse-db-dev psql -U learnhouse -h localhost -d learnhouse \
    -c "ALTER USER learnhouse WITH PASSWORD 'learnhouse';"
  ```

### ⚠️ Do NOT use `npx learnhouse dev`

The **published npm CLI** (`npx learnhouse dev`) regenerates
`.learnhouse/docker-compose.dev.yml` with the DB on host port **5432:5432**,
which conflicts with the native PostgreSQL on this machine and breaks the
API. Always use the repo's own CLI:

```bash
bun run apps/cli/bin/learnhouse.ts dev ...
```

The repo CLI is already patched (see `apps/cli/src/commands/dev.ts`,
`DEV_COMPOSE` template) to map **5434:5432**.

### Web loads but API calls fail in the browser

Check that http://localhost:1338/docs loads. If not, restart the API:
`Ctrl+C` the dev session and re-run the dev command, or press `ra` if you are
in a real terminal.

### Port already in use

| Port | Usual culprit | Fix |
|------|---------------|-----|
| 3000 | another Next/Vite dev server | stop it, or it will fail to bind |
| 1338 | another API instance | stop it |
| 5432 | **native host PostgreSQL** | leave it alone — dev DB must stay on 5434 |

---

## 8. Useful commands

```bash
# Show running containers
docker ps

# Inspect DB container port mapping
docker port learnhouse-db-dev

# Open a SQL shell into the dev database
docker exec -it learnhouse-db-dev psql -U learnhouse -d learnhouse

# Check Postgres health
docker exec learnhouse-db-dev pg_isready -U learnhouse

# Run the API alone (manual)
cd apps/api && uv run python app.py

# Run the web alone (manual)
cd apps/web && bun run dev
```

---

## 9. Version note

This repo is pinned at tag **`1.2.0`** (see `VERSION_DECISION.md`). The
published npm CLI may be newer and behave differently — one more reason to
always use the repo's own CLI from `apps/cli`.
