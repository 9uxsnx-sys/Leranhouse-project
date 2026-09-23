# CLI Tool Reference

> The LearnHouse CLI provides development workflow orchestration — starting infrastructure (PostgreSQL, Redis), managing application services (API, Web, Collab), and automating setup tasks — all from a single command.

---

## Overview

The CLI lives in `apps/cli/` and is written in TypeScript, run via Bun. It serves as the primary development interface for the monorepo.

### Entry Point

```
apps/cli/src/bin/learnhouse.ts  →  bun run apps/cli/src/bin/learnhouse.ts
```

### Commands

| Command | Description |
|---------|-------------|
| `dev` | Start development environment (infra + services) |
| `setup` | Initial project setup |

---

## Dev Command

The `dev` command orchestrates the full development environment:

```bash
# Basic usage
bun run apps/cli/src/bin/learnhouse.ts dev

# With admin credentials (non-interactive)
bun run apps/cli/src/bin/learnhouse.ts dev \
    --admin-email admin@school.dev \
    --admin-password admin123456

# With Enterprise Edition
bun run apps/cli/src/bin/learnhouse.ts dev --ee
```

### What It Does

1. **Checks environment** — Validates Docker, env files, project structure
2. **Starts infrastructure** — PostgreSQL (pgvector) and Redis containers via Docker Compose
3. **Waits for health** — Polls until DB and Redis are ready
4. **Auto-installs dependencies** — `bun install` for web/collab, `uv sync` for API
5. **Starts application services** — API (uvicorn), Web (Next.js), Collab (Hocuspocus)
6. **Interactive controls** — Hotkey management of running services

### Infrastructure

The dev command generates a Docker Compose file at `.learnhouse/docker-compose.dev.yml`:

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    container_name: learnhouse-db-dev
    ports:
      - "5434:5432"    # Note: 5434, not 5432
    environment:
      - POSTGRES_USER=learnhouse
      - POSTGRES_PASSWORD=learnhouse
      - POSTGRES_DB=learnhouse
    volumes:
      - learnhouse_db_dev_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U learnhouse"]

  redis:
    image: redis:8.6.1-alpine
    container_name: learnhouse-redis-dev
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
```

### Container Lifecycle

- **First run**: Containers are created and started
- **Subsequent runs**: Existing containers are detected and reused
- **Shutdown**: Containers remain running for next session (fast restart)
- **Manual cleanup**:
  ```bash
  docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev down
  docker volume rm learnhouse-dev_learnhouse_db_dev_data  # Wipes DB
  ```

### Service Management

The CLI spawns three child processes:

| Service | Command | Color | Restart Key |
|---------|---------|-------|-------------|
| API | `uv run python app.py` | Magenta | `ra` |
| Web | `next dev --webpack` | Cyan | `rw` |
| Collab | `tsx watch src/index.ts` | Yellow | `rc` |

### Interactive Controls

Once running, the CLI provides hotkey controls:

```
────────────────────────────────────────────────────────────
  ra  restart api    rw  restart web    rc  restart collab
  rb  restart all    q   quit
────────────────────────────────────────────────────────────
```

| Key | Action |
|-----|--------|
| `r` then `a` | Restart API server |
| `r` then `w` | Restart Web server |
| `r` then `c` | Restart Collab server |
| `r` then `b` | Restart all servers |
| `q` | Shutdown gracefully |

### Environment Variables

The CLI sets these environment variables for child processes:

```typescript
serviceEnv = {
    FORCE_COLOR: '1',
    LEARNHOUSE_INITIAL_ADMIN_EMAIL: adminEmail,
    LEARNHOUSE_INITIAL_ADMIN_PASSWORD: adminPassword,
    LEARNHOUSE_DISABLE_EE: '1',  // Omitted when --ee is passed
}
```

### Health Checks

```typescript
// Waits up to 30 seconds for each service
const [dbReady, redisReady] = await Promise.all([
    waitForHealth('DB', 'docker', 
        ['exec', 'learnhouse-db-dev', 'pg_isready', '-U', 'learnhouse']),
    waitForHealth('Redis', 'docker',
        ['exec', 'learnhouse-redis-dev', 'redis-cli', 'ping']),
])
```

---

## API CLI (Typer)

The backend also includes a Typer-based CLI for installation operations in `apps/api/cli.py`:

```bash
# From apps/api/
uv run python cli.py install

# Non-interactive mode
uv run python cli.py install --short
```

### Install Command

The `install` command:
1. Creates database tables (runs all migrations)
2. Installs default elements (roles, permissions)
3. Creates the organization
4. Creates the admin user (reads `LEARNHOUSE_INITIAL_ADMIN_EMAIL` and `LEARNHOUSE_INITIAL_ADMIN_PASSWORD` env vars)

This runs automatically on first startup via the startup event handler.

---

## Data Migration Script

A standalone migration script lives at `apps/api/scripts/migrate.py` for data migrations that can't be handled by Alembic schema migrations:

```bash
# Show pending migrations
uv run python scripts/migrate.py --show

# Run all pending migrations
uv run python scripts/migrate.py

# Run a specific migration
uv run python scripts/migrate.py --migration communities

# Dry run (preview without applying)
uv run python scripts/migrate.py --dry-run
```

Handles migrations for:
- Communities & discussions permissions
- Podcasts permissions
- Boards permissions
- Playgrounds permissions
- Org config colors reset

---

## Default Ports

| Service | Port | Notes |
|---------|------|-------|
| PostgreSQL | 5434 | Mapped to container's 5432 |
| Redis | 6379 | Standard Redis port |
| API | 1338 | FastAPI (configurable via `LEARNHOUSE_API_PORT`) |
| Web | 3000 | Next.js |
| Collab | 4000 | Hocuspocus WebSocket |

---

## Troubleshooting CLI Issues

### Docker Not Available

```bash
# Check Docker
docker --version
docker info

# On macOS: Docker Desktop must be running
# On Linux: systemctl start docker
```

### Port Conflicts

```bash
# Check if ports are in use
netstat -an | findstr ":5434"
netstat -an | findstr ":1338"
netstat -an | findstr ":3000"

# Kill process on a port (Windows)
netstat -ano | findstr :1338
taskkill /PID <PID> /F
```

### Container Issues

```bash
# View logs
docker logs learnhouse-db-dev
docker logs learnhouse-redis-dev

# Reset containers
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev down
docker volume rm learnhouse-dev_learnhouse_db_dev_data

# Then restart the dev command
```

### Dependency Issues

```bash
# Force reinstall
cd apps/api && rm -rf .venv && uv sync
cd apps/web && rm -rf node_modules && bun install
cd apps/collab && rm -rf node_modules && bun install
```
