# Quick Start

> Status: as-built · Last verified: 2026-11-15

Run LearnHouse locally with Docker for PostgreSQL/Redis and local processes for the three apps.

---

## Prerequisites

- Docker Desktop, running
- [Bun](https://bun.sh/): `bun --version`
- [uv](https://docs.astral.sh/uv/): `uv --version`

---

## 1. Start

From the repository root:

```bash
git clone <repo-url>
cd learnhouse-dev
bun run apps/cli/bin/learnhouse.ts dev --admin-email admin@school.dev --admin-password admin123456
```

The CLI:

1. Checks `apps/api/.env`, `apps/web/.env.local`, and `apps/collab/.env`. If required keys are missing it lists them and offers to append dev defaults — it does not fail fast.
2. Starts PostgreSQL and Redis containers (reusing them if already running).
3. Installs missing dependencies (`bun install` per app, `uv sync` for the API).
4. Starts the API on 1338, web on 3000, and collab on 4000 with hot reload.

If Docker or the env prompt stops the command, fix the reported item and re-run the same command.

---

## 2. Open the app

Go to http://localhost:3000 and sign in with the credentials passed above (`admin@school.dev` / `admin123456`). They are used by the first-run auto-install, which only runs when the database has no organization.

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:1338 |
| API docs (development mode) | http://localhost:1338/docs |
| Collab WebSocket | ws://localhost:4000 |
| PostgreSQL | localhost:**5434** |

---

## 3. Next steps

- [Development Setup](./development-setup.md) — env files, demo seed, restart controls
- [Environment Variables](../05-developer-guide/environment-variables.md) — every variable the apps read
- [CLI Reference](../05-developer-guide/cli.md) — all commands and flags
- [Architecture Overview](../02-architecture/overview.md) — how the pieces fit together
