# CLI Reference

> Status: as-built · Last verified: 2026-11-15

The CLI lives in `apps/cli/` (TypeScript, run with Bun). It has two jobs: run the monorepo in development, and manage a Docker deployment under `~/.learnhouse/<name>`.

---

## Invocation

| Context | Command |
|---------|---------|
| Repo checkout (from the repository root) | `bun run apps/cli/bin/learnhouse.ts <command>` |
| Published npm package | `npx learnhouse <command>` |

The entry point is `apps/cli/bin/learnhouse.ts`. Running it without a command prints the banner and the command list.

---

## Commands

| Command | Flags | What it does |
|---------|-------|--------------|
| `setup` | `--ci`, `--name`, `--domain`, `--port`, `--admin-email`, `--admin-password`, `--channel stable\|dev`, `--no-start` | Interactive deployment wizard (or non-interactive with `--ci`); writes the install directory and optionally starts it |
| `start` | — | `docker compose up -d` for the detected install |
| `stop` | — | `docker compose down` for the detected install |
| `logs` | — | Streams compose logs, falling back to `docker logs` for running containers |
| `config` | — | Prints version, install directory, URL, and org slug |
| `env` | — | Category-based editor for the install's `.env`; offers a restart |
| `backup` | `[archive]`, `--restore` | Creates `<install>/backups/learnhouse-backup-<timestamp>.tar.gz` (database dump + `.env`), or restores with `backup <archive> --restore` |
| `restore` | `<archive>` | Restores a backup into the local Docker database |
| `deployments` | — | Lists deployments or sets container resource limits |
| `doctor` | — | Checks Docker, containers, restart counts, ports, DNS, disk, logs, and `.env` keys |
| `shell` | — | Opens `/bin/sh` in a selected running container |
| `update` | `-v, --version <version>`, `--migrate`, `--no-migrate` | Switches the image tag, restarts, optionally runs Alembic |
| `status` | — | Shows `docker compose ps` for the install |
| `health` | — | Container status, `pg_isready`, Redis ping, `GET /api/v1/health`, disk and resource usage |
| `dev` | `--ee`, `--admin-email <email>`, `--admin-password <password>` | Development mode (below) |

`setup --ci` requires `--admin-password`. If `--admin-password` is omitted outside `--ci`, the wizard prompts for it.

---

## Two operating modes

### Deployment commands

`setup`, `start`, `stop`, `logs`, `config`, `env`, `backup`, `restore`, `deployments`, `doctor`, `shell`, `update`, `status`, and `health` all resolve the install directory through `~/.learnhouse/<name>` (the most recent complete install, `~/.learnhouse/default`, or a legacy install in the current directory). The install contains:

```
~/.learnhouse/<name>/
  learnhouse.config.json     # version, deploymentId, domain/port, org slug
  docker-compose.yml         # app + db + redis (+ nginx/Caddy)
  .env                       # secrets and runtime settings
  extra/nginx.prod.conf      # or extra/Caddyfile when auto-SSL is enabled
```

### `dev`

`dev` is the only command that works on the source tree instead of an installed deployment.

```bash
# from the repository root
bun run apps/cli/bin/learnhouse.ts dev
bun run apps/cli/bin/learnhouse.ts dev --admin-email admin@school.dev --admin-password admin123456
bun run apps/cli/bin/learnhouse.ts dev --ee
```

What it does:

1. Checks `apps/api/.env`, `apps/web/.env.local`, and `apps/collab/.env`. Missing required keys are listed; choosing "Apply dev defaults" appends them (it does not abort automatically).
2. Requires Docker to be installed and running.
3. When the containers are not already running, prompts for admin email/password, then starts PostgreSQL + Redis from `.learnhouse/docker-compose.dev.yml`.
4. Waits for `pg_isready` and `redis-cli ping` (30 attempts, 1 s apart).
5. Runs `bun install` in `apps/web` and `apps/collab` when `node_modules` is missing, and `uv sync` in `apps/api` when `.venv` is missing.
6. Starts the services as child processes with hot reload.

| Service | Command | Port |
|---------|---------|------|
| API | `uv run python app.py` | 1338 |
| Web | `next dev --webpack` | 3000 |
| Collab | `tsx watch src/index.ts` | 4000 |

Infrastructure from `.learnhouse/docker-compose.dev.yml`:

| Service | Image | Host port |
|---------|-------|-----------|
| db | `pgvector/pgvector:pg16` (`learnhouse-db-dev`) | 5434 → 5432 |
| redis | `redis:8.6.1-alpine` (`learnhouse-redis-dev`) | 6379 |

Child processes receive `FORCE_COLOR=1`, `LEARNHOUSE_INITIAL_ADMIN_EMAIL`, `LEARNHOUSE_INITIAL_ADMIN_PASSWORD`, and `LEARNHOUSE_DISABLE_EE=1` (omitted with `--ee`).

Interactive controls (only in a real TTY): `ra` restart API, `rw` restart web, `rc` restart collab, `rb` restart all, `q` / `Ctrl+C` stop the servers. The DB and Redis containers are left running.

Container cleanup:

```bash
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev down
docker volume rm learnhouse-dev_learnhouse_db_dev_data   # wipes dev DB
```

---

## API CLI (Typer)

Separate from the TypeScript CLI, the API ships `apps/api/cli.py`:

```bash
cd apps/api
uv run python cli.py install          # interactive org + admin prompts
uv run python cli.py install --short  # default org "default" + admin from env
```

`install` calls `SQLModel.metadata.create_all(engine)` — it does not run Alembic — then installs default roles/permissions and creates the organization and admin user. `--short` requires `LEARNHOUSE_INITIAL_ADMIN_PASSWORD` and exits if it is missing.

The same `install(short=True)` runs automatically on API startup when the database contains no organization (`src/core/events/autoinstall.py`).

---

## Data migration script

`apps/api/scripts/migrate.py` performs data backfills that are not schema migrations. The migration name is a **positional argument**:

```bash
cd apps/api
uv run python scripts/migrate.py                       # run all
uv run python scripts/migrate.py communities           # one migration
uv run python scripts/migrate.py --show                # print current roles/features
uv run python scripts/migrate.py --dry-run             # preview changes
```

Accepted names: `communities`, `podcasts`, `colors`, `boards`, `playgrounds`.

The script reads `DATABASE_URL` (or `LEARNHOUSE_DB_URL`), **not** `LEARNHOUSE_SQL_CONNECTION_STRING`, and defaults to `localhost:5432`. In dev, set it explicitly:

```powershell
$env:DATABASE_URL="postgresql://learnhouse:learnhouse@localhost:5434/learnhouse"
uv run python scripts/migrate.py
```

---

## Ports

| Service | Port | Notes |
|---------|------|-------|
| API | 1338 | `LEARNHOUSE_PORT` overrides `config.yaml`'s `hosting_config.port` |
| Web | 3000 | Next.js dev server |
| Collab | 4000 | `COLLAB_PORT` |
| PostgreSQL (dev) | 5434 | Compose maps `5434:5432` |
| Redis (dev) | 6379 | Standard port |

---

## CLI troubleshooting

- `Docker is not installed` / `Docker is not running` — start Docker Desktop (or `sudo systemctl start docker`) and retry.
- `No LearnHouse installation found` — run `setup` first; deployment commands do not operate on the repo checkout.
- Port already in use — `netstat -ano | findstr :1338` (or `:3000`, `:4000`, `:5434`) then stop the conflicting process.
- Dependency installs — the CLI installs per app; there is no root `package.json`. Force a reinstall with `cd apps/web && bun install`, `cd apps/collab && bun install`, `cd apps/api && uv sync`.
