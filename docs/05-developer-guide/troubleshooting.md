# Troubleshooting

> Status: as-built · Last verified: 2026-11-15

Commands assume the repository root unless a step says `cd apps/<app>`.

---

## Database

### `connection refused` on port 5434

The dev database is published on **5434** (`5434:5432` in `.learnhouse/docker-compose.dev.yml`). Common causes: containers stopped, another process on 5434, or Postgres still starting.

```powershell
docker ps
docker logs learnhouse-db-dev
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev restart db
```

Full reset (deletes dev data):

```powershell
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev down
docker volume rm learnhouse-dev_learnhouse_db_dev_data
```

### API connects to 5432 instead of 5434

`config.yaml` falls back to `...@localhost:5432/learnhouse`. The dev `.env` must override it:

```
LEARNHOUSE_SQL_CONNECTION_STRING=postgresql://learnhouse:learnhouse@localhost:5434/learnhouse
```

### Alembic errors (`relation "organization" does not exist`)

From `apps/api`:

```powershell
cd apps/api
uv run alembic current
uv run alembic upgrade head
```

Fresh database (destroys data): `uv run alembic downgrade base` then `uv run alembic upgrade head`.

### Enum migration errors

Postgres enum changes use `alembic-postgresql-enum`, which is already in `pyproject.toml`. Re-sync the environment rather than adding it:

```powershell
cd apps/api
uv sync
```

---

## Docker

The CLI prints `Docker is not installed. Please install Docker and try again.` or `Docker is not running. Please start Docker and try again.` and exits.

- Start Docker Desktop (or `sudo systemctl start docker` on Linux) and retry.
- `docker info` should return without error.

### `port is already allocated` / port in use

```powershell
netstat -ano | findstr :5434
netstat -ano | findstr :1338
netstat -ano | findstr :3000
netstat -ano | findstr :4000
netstat -ano | findstr :6379
taskkill /PID <PID> /F
```

### `Database did not become ready in time` / `Redis did not become ready in time`

The CLI polls `pg_isready` / `redis-cli ping` for ~30 attempts. Check manually:

```powershell
docker exec learnhouse-db-dev pg_isready -U learnhouse
docker exec learnhouse-redis-dev redis-cli ping
docker logs learnhouse-db-dev
docker logs learnhouse-redis-dev
```

Retry once Docker has settled if the first startup is slow.

---

## Python / uv

### `'uv' is not recognized`

Install uv, then close and reopen the terminal so `PATH` refreshes. Verify with `uv --version`.

### `ImportError: No module named 'src'`

Run the API from `apps/api` (the app resolves `config`, `src`, and `migrations` relative to that directory):

```powershell
cd apps/api
uv sync
uv run python app.py
```

### Dependency conflicts

```powershell
cd apps/api
uv sync --frozen
```

If the lockfile is stale, `uv sync` (without `--frozen`) updates `.venv` from `uv.lock`.

### Tests fail on SQLite

`apps/api/src/tests/conftest.py` sets `TESTING=true`, provides a 32+ character JWT secret, and builds an in-memory SQLite database. `JSONB` columns are remapped to `JSON` at import time — new Postgres-only column types need the same treatment in `conftest.py` before router tests will create the schema.

```powershell
cd apps/api
uv run pytest
```

---

## Redis

The API and collab use different variables:

| App | Variable |
|-----|----------|
| API | `LEARNHOUSE_REDIS_CONNECTION_STRING` |
| Collab | `LEARNHOUSE_REDIS_URL` |

Check the container:

```powershell
docker exec learnhouse-redis-dev redis-cli ping   # expect PONG
docker logs learnhouse-redis-dev
```

What degrades without Redis:

- Auth rate limiting **raises HTTP 500** (`Redis connection string not found`) when `LEARNHOUSE_REDIS_CONNECTION_STRING` is empty.
- Session revocation fails open (JWTs still honour `exp` and `password_changed_at`).
- Org/instance caches fall back to database reads.
- Collab logs Redis errors and persists ydoc state through the API instead.

---

## API server

### Port conflict / server will not start

The API port comes from `LEARNHOUSE_PORT`, falling back to `hosting_config.port` in `config.yaml` (`1338`).

```powershell
netstat -ano | findstr :1338
# then set LEARNHOUSE_PORT in apps/api/.env if you need another port
```

### `SECURITY ERROR: LEARNHOUSE_AUTH_JWT_SECRET_KEY must be set`

The API refuses to boot without a JWT secret of at least 32 characters. Generate one:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Set it as `LEARNHOUSE_AUTH_JWT_SECRET_KEY` in `apps/api/.env`.

### `/docs` and `/redoc` return 404

Both are only mounted when `LEARNHOUSE_DEVELOPMENT_MODE=true`. Check `apps/api/.env`.

### CORS errors in the browser

- In `single` tenancy the API accepts any well-formed `http(s)` origin.
- In `multi` tenancy CORS uses `LEARNHOUSE_ALLOWED_REGEXP`; `LEARNHOUSE_ALLOWED_ORIGINS` is the email-link allowlist, not the CORS list.
- If the error persists, confirm the request origin is `http://localhost:3000` and that the API restarted after the env change.

---

## Web frontend

### `Failed to fetch` / `Network Error`

1. Confirm the API responds at `http://localhost:1338/api/v1/health`.
2. Check `apps/web/.env.local`:

   ```
   NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL=http://localhost:1338
   ```

   Use `NEXT_PUBLIC_LEARNHOUSE_API_URL` only if you need to override the URL derived from the backend URL.

### Next.js build / type errors

```powershell
Remove-Item -Recurse -Force apps/web/.next
cd apps/web
bun install
bunx tsc --noEmit
```

### Realtime features do not connect

The browser reads `NEXT_PUBLIC_COLLAB_URL` (default `ws://localhost:4000`). Confirm the collab process is running and the variable points at it.

---

## Collaboration server

The collab server exits immediately when required configuration is missing:

```
[collab] FATAL: LEARNHOUSE_AUTH_JWT_SECRET_KEY is not set
[collab] FATAL: COLLAB_INTERNAL_KEY is not set
```

- `LEARNHOUSE_AUTH_JWT_SECRET_KEY` must be identical in `apps/api/.env` and `apps/collab/.env`.
- `COLLAB_INTERNAL_KEY` must also match; it is the `X-Internal-Key` used for ydoc persistence.
- `LEARNHOUSE_API_URL` must reach the API (`http://localhost:1338` in dev).
- `Invalid token` / `Not authorized for this board` means the JWT is expired or the user is not a board member.

### `EADDRINUSE :::4000`

Another collab instance is running. Only boards are affected; the API and web app keep working.

```powershell
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

Then restart the dev command (or press `rc` in a real terminal).

---

## Monorepo / installs

There is no root `package.json`. Install per app:

```powershell
cd apps/web; bun install
cd ../collab; bun install
cd ../cli; bun install
```

The dev command does this automatically when `node_modules` is missing, and runs `uv sync` when `apps/api/.venv` is missing.

### Migration branch conflicts

Alembic revision IDs can conflict when branches add migrations independently:

```powershell
cd apps/api
uv run alembic heads
```

If multiple heads are listed, create a merge revision (`uv run alembic merge -m "merge heads" <rev1> <rev2>`) or rebase the migration onto the current head.

---

## Logs and debugging

The dev command prefixes output: `[api]` (magenta), `[web]` (cyan), `[collab]` (yellow). Use `ra`, `rw`, `rc`, `rb` in a real terminal to restart a service, or `q` to stop everything.

### Sentry

| App | Variable |
|-----|----------|
| API | `LEARNHOUSE_SENTRY_DSN` |
| Web | `NEXT_PUBLIC_LEARNHOUSE_SENTRY_DSN` |
| Web build | `SENTRY_ORG` + `SENTRY_PROJECT` (source maps) |

The API samples 100% of traces in development mode and 10% otherwise. It only initialises Sentry when a DSN is configured.

### Checking endpoints

Use `curl.exe` in Windows PowerShell, `curl` elsewhere:

```bash
curl http://localhost:1338/api/v1/health
curl http://localhost:1338/api/v1/instance/info
curl -H "Authorization: Bearer <token>" http://localhost:1338/api/v1/users/profile
```

### Common status codes

| Code | Meaning | Common cause |
|------|---------|--------------|
| 401 | Unauthorized | Missing/expired JWT |
| 403 | Forbidden | RBAC permission or tenancy check |
| 404 | Not found | Unknown UUID, or `/docs` outside development mode |
| 422 | Validation error | Invalid request body |
| 429 | Too many requests | Auth/rate-limit window exceeded (needs Redis) |
| 500 | Internal error | Unhandled exception — check API logs |
