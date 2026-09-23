# Common Development Issues

> Practical solutions for frequent issues encountered when setting up and running the LearnHouse development environment.

---

## Database Issues

### PostgreSQL Connection Refused

**Error**: `psycopg2.OperationalError: connection to server on host "localhost" (::1), port 5434 failed: Connection refused`

**Causes**:
- Docker containers not running
- Port conflict (another service on 5434)
- Containers still starting up

**Solutions**:

```bash
# 1. Check if containers are running
docker ps | findstr learnhouse

# 2. View container logs
docker logs learnhouse-db-dev

# 3. Restart containers
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev restart db

# 4. Full reset if needed
docker compose -f .learnhouse/docker-compose.dev.yml -p learnhouse-dev down
docker volume rm learnhouse-dev_learnhouse_db_dev_data
# Then re-run the dev CLI
```

### Wrong Port (5432 vs 5434)

The development database uses port **5434** (not the PostgreSQL default 5432) to avoid conflicts with locally installed PostgreSQL instances.

Check your `apps/api/.env`:
```
LEARNHOUSE_SQL_CONNECTION_STRING=postgresql://learnhouse:learnhouse@localhost:5434/learnhouse
```

### Alembic Migration Fails

**Error**: `sqlalchemy.exc.ProgrammingError: (psycopg2.errors.UndefinedTable) relation "organization" does not exist`

**Solutions**:

```bash
# 1. Check migration status
cd apps/api
uv run alembic current

# 2. Apply all pending migrations
uv run alembic upgrade head

# 3. If migrations are out of sync, stamp current state
uv run alembic stamp head

# 4. For a fresh database (will lose data):
uv run alembic downgrade base
uv run alembic upgrade head
```

### Enum Type Migration Issues

PostgreSQL enum migrations require the `alembic_postgresql_enum` extension. If you see errors about enum types:

```bash
# Ensure the package is installed
uv add alembic_postgresql_enum

# The extension is configured in migrations/env.py:
# from alembic_postgresql_enum import ...
```

---

## Docker Issues

### Docker Not Installed

**Error**: `Docker is not installed. Please install Docker and try again.`

**Solution**: Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).

### Docker Not Running

**Error**: `Docker is not running. Please start Docker and try again.`

**Solutions**:
- Start Docker Desktop from your applications menu
- On Linux: `sudo systemctl start docker`
- Wait for the Docker daemon to fully initialize

### Port Conflicts

**Error**: `port is already allocated`

**Solutions**:

```bash
# Check which process is using the port
netstat -ano | findstr :5434
netstat -ano | findstr :1338
netstat -ano | findstr :3000
netstat -ano | findstr :6379

# Kill the process (replace <PID> with the actual PID)
taskkill /PID <PID> /F

# Or stop a competing Docker container
docker stop <container_name>
```

### Container Health Check Fails

**Error**: `Health checks failed` or `Database did not become ready in time`

**Solutions**:

```bash
# 1. Check container logs
docker logs learnhouse-db-dev
docker logs learnhouse-redis-dev

# 2. Check if enough resources allocated to Docker
# Docker Desktop → Settings → Resources → Increase memory/CPUs

# 3. Try running health checks manually
docker exec learnhouse-db-dev pg_isready -U learnhouse
docker exec learnhouse-redis-dev redis-cli ping

# 4. Slow startup on macOS/Windows is normal — increase the wait timeout
# in apps/cli/src/commands/dev.ts, increase maxAttempts from 30
```

---

## Python / uv Issues

### uv Not Installed

**Error**: `'uv' is not recognized as an internal or external command`

**Solution**: Install uv:

```bash
# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Virtual Environment Issues

**Error**: `ImportError: No module named 'src'`

**Solutions**:

```bash
# 1. Ensure virtual environment exists
cd apps/api
uv sync  # Creates .venv and installs all dependencies

# 2. Activate the virtual environment
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux

# 3. Verify Python path
uv run python -c "import sys; print(sys.path)"
```

### Dependency Conflicts

**Error**: `ResolutionError` or dependency version conflicts

**Solutions**:

```bash
# 1. Sync exact versions from lockfile
cd apps/api
uv sync --frozen

# 2. Full reinstall
rm -rf .venv
uv sync

# 3. Check pyproject.toml for version constraints
# Look for incompatible version ranges
```

### SQLite Test Database Issues

**Error**: `(sqlite3.OperationalError) no such column: <column_name>`

The test environment uses SQLite in-memory, which has limitations compared to PostgreSQL:

- **JSONB columns** are automatically remapped to JSON (handled in `conftest.py`)
- **Enum types** are stored as strings
- **Array columns** are not supported — use JSON instead
- **Full-text search** features are PostgreSQL-specific

If you add a new model or column, ensure the test fixtures in `conftest.py` are updated accordingly.

---

## Redis Issues

### Redis Connection Refused

**Error**: `redis.exceptions.ConnectionError: Error -2 connecting to redis://localhost:6379`

**Solutions**:

```bash
# 1. Check if Redis container is running
docker ps | findstr redis

# 2. View Redis logs
docker logs learnhouse-redis-dev

# 3. Test Redis connection
docker exec learnhouse-redis-dev redis-cli ping
# Should return: PONG
```

### Redis Not Configured (Graceful Degradation)

The platform is designed to work without Redis — it degrades gracefully:

- **Session revocation**: Fails open (JWTs still honor `exp` and `password_changed_at`)
- **Refresh token replay**: Fails open (tokens still honor expiration)
- **Collab caching**: Falls back to direct database reads

If Redis is unavailable, set `LEARNHOUSE_REDIS_URL` to an empty string in `apps/api/.env`.

---

## API Server Issues

### Server Won't Start

**Error**: `uvicorn.error: Can't connect to '0.0.0.0:1338'`

**Solutions**:

```bash
# 1. Check if port is in use
netstat -ano | findstr :1338

# 2. Change the port in .env
LEARNHOUSE_API_PORT=1339

# 3. Check the .env file exists and has required variables
cat apps/api/.env

# Required: LEARNHOUSE_SQL_CONNECTION_STRING, LEARNHOUSE_JWT_SECRET
```

### JWT Secret Not Set

**Error**: `ValueError: JWT secret key is not configured`

**Solution**: Set `LEARNHOUSE_AUTH_JWT_SECRET_KEY` in `apps/api/.env`. The key must be at least 32 characters for HS256.

### CORS Errors in Browser

**Error**: `Access to fetch at 'http://localhost:1338/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solutions**:

1. Ensure CORS origins are configured in `apps/api/.env`:
   ```
   LEARNHOUSE_ALLOWED_REGEXP=http://localhost:3000
   ```

2. In single-tenancy mode, all origins are allowed automatically

3. If the error persists, check the CORS middleware configuration in `src/core/middleware/cors.py`

---

## Web Frontend Issues

### API Connection Refused

**Error**: `Failed to fetch` or `Network Error` in the browser console

**Solutions**:

```bash
# 1. Ensure the API server is running
# Check the CLI output for [api] logs

# 2. Verify NEXT_PUBLIC_API_URL in apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:1338

# 3. Check the API proxy configuration in apps/web/
```

### Next.js Build Errors

**Error**: TypeScript compilation errors during `next dev`

**Solutions**:

```bash
# 1. Clear Next.js cache
rm -rf apps/web/.next

# 2. Reinstall dependencies
cd apps/web && rm -rf node_modules && bun install

# 3. Check for TypeScript errors
cd apps/web && bun run tsc --noEmit
```

---

## Collaboration Server Issues

### WebSocket Connection Failed

**Error**: `WebSocket connection to 'ws://localhost:4000/' failed`

**Solutions**:

```bash
# 1. Ensure collab server is running
# Check CLI output for [collab] logs

# 2. Verify the port
netstat -ano | findstr :4000

# 3. Check NEXT_PUBLIC_WS_URL in apps/web/.env.local
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### Collab Authentication Fails

**Error**: `Authentication required` or `Invalid token` in collab logs

**Solutions**:

1. Ensure `LEARNHOUSE_AUTH_JWT_SECRET_KEY` is the same in both `apps/api/.env` and `apps/collab/.env`
2. Ensure `COLLAB_INTERNAL_KEY` is set in `apps/collab/.env`
3. Verify the backend API is reachable from the collab server (`LEARNHOUSE_API_URL`)

---

## Git / Monorepo Issues

### Merge Conflicts in Migrations

When multiple branches add Alembic migrations, you may get revision ID conflicts:

```bash
# 1. Check current revision
cd apps/api
uv run alembic current

# 2. Resolve by running the latest migration head
uv run alembic upgrade head

# 3. If branches have diverged migration chains, you may need to
# manually edit migration dependencies or create a merge point
```

### Node_modules Not Found

**Error**: `Cannot find module '@hocuspocus/server'` or similar

**Solution**: Install dependencies from the monorepo root or per-app:

```bash
# From monorepo root
bun install

# Or per-app
cd apps/web && bun install
cd apps/collab && bun install
```

---

## Logs and Debugging

### Enabling Debug Logs

```bash
# Set log level in apps/api/.env
LEARNHOUSE_LOG_LEVEL=DEBUG

# Or via environment variable when running
LEARNHOUSE_LOG_LEVEL=DEBUG uv run python app.py
```

### Sentry Error Tracking

If Sentry is configured, errors are automatically reported. Configure in `apps/api/.env`:

```
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
```

Sentry is only initialized when a DSN is present. In production, the sample rate is 0.1; in dev mode, it's 1.0.

### Checking API Responses

```bash
# Test a public endpoint
curl http://localhost:1338/api/v1/instance

# Test with authentication
curl -H "Authorization: Bearer <token>" http://localhost:1338/api/v1/users/me

# Test with verbose output
curl -v http://localhost:1338/api/v1/health
```

### Common HTTP Status Codes

| Code | Meaning | Common Cause |
|------|---------|-------------|
| 401 | Unauthorized | Missing or expired JWT |
| 402 | Payment Required | Resource behind a paid UserGroup |
| 403 | Forbidden | Insufficient RBAC permissions |
| 404 | Not Found | Invalid UUID or resource doesn't exist |
| 422 | Validation Error | Invalid request body |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unhandled exception (check Sentry/logs) |
