# Environment Variables

> Complete reference of all environment variables used across the platform.

---

## `apps/api/.env`

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LEARNHOUSE_SQL_CONNECTION_STRING` | PostgreSQL connection string | `postgresql://learnhouse:learnhouse@localhost:5434/learnhouse` | Yes |
| `LEARNHOUSE_JWT_SECRET` | JWT signing secret | --- | Yes |
| `LEARNHOUSE_JWT_EXPIRATION` | JWT token expiry | `86400` (24h) | No |
| `LEARNHOUSE_INITIAL_ADMIN_EMAIL` | Admin seed email | --- | Yes (first run) |
| `LEARNHOUSE_INITIAL_ADMIN_PASSWORD` | Admin seed password | --- | Yes (first run) |
| `LEARNHOUSE_REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` | No |
| `LEARNHOUSE_CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` | No |
| `LEARNHOUSE_API_PORT` | API server port | `1338` | No |
| `LEARNHOUSE_LOG_LEVEL` | Logging level | `INFO` | No |

## `apps/web/.env.local`

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:1338` | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret | --- | Yes |
| `NEXTAUTH_URL` | NextAuth.js base URL | `http://localhost:3000` | Yes |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for collab | `ws://localhost:4000` | No |

## `apps/collab/.env`

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `COLLAB_PORT` | Collab server port | `4000` | No |
| `API_URL` | Backend API URL | `http://localhost:1338` | Yes |
| `API_INTERNAL_KEY` | Internal API key for collab-auth | --- | Yes |

---

## Connection String Format

```
postgresql://<user>:<password>@<host>:<port>/<database>
```

Default dev values:
- User: `learnhouse`
- Password: `learnhouse`
- Host: `localhost`
- Port: `5434` (not 5432!)
- Database: `learnhouse`

---

## Setting Up Env Files

The dev CLI auto-creates missing env files with sensible defaults. If you need to reset them:

```bash
# Remove existing env files (they will be regenerated on next dev start)
rm apps/api/.env apps/web/.env.local apps/collab/.env
# Then re-run the dev command
bun run apps/cli/bin/learnhouse.ts dev --admin-email admin@school.dev --admin-password admin123456
```
