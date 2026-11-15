# Realtime Collaboration Server

> Status: as-built · Last verified: 2026-11-15

> The collab server (`apps/collab/`) provides real-time board editing with Yjs CRDTs over Hocuspocus. It authenticates JWTs, caches document state in Redis, and persists to PostgreSQL through the backend API.

---

## Overview

- **Entry point:** `apps/collab/src/index.ts` (package `@learnhouse/collab`)
- **Hocuspocus** WebSocket server on port **4000** (`COLLAB_PORT`)
- **Yjs** document state, cached in **Redis** for 1 hour and debounced to **PostgreSQL** through the backend
- **JWT** verification using the same secret as the API (`LEARNHOUSE_AUTH_JWT_SECRET_KEY`, HS256)

```
Browser (Yjs client)
   │ WebSocket
   ▼
Hocuspocus (apps/collab, port 4000)
   ├── Redis         collab:ydoc:{board_uuid}, TTL 3600s
   └── Backend API   /api/v1/boards/{uuid}/ydoc (X-Internal-Key)
```

---

## Request Flow

1. Client connects to `ws://<host>:4000`.
2. `onRequest` serves health checks and applies per-IP rate limiting.
3. `onAuthenticate` verifies the JWT and calls the backend to check board membership.
4. `onConnect` rejects the connection when the board already has 10 concurrent users.
5. Document state is written to Redis immediately and flushed to the DB after a 5-second debounce.
6. On load, Redis is tried first; on a miss the DB is read and Redis is warmed.

---

## Configuration

Environment variables (see `apps/collab/.env.example`):

| Variable | Default | Notes |
|----------|---------|-------|
| `COLLAB_PORT` | `4000` | WebSocket port |
| `LEARNHOUSE_API_URL` | `http://localhost:8000` in code | Backend base URL; the example file uses `http://localhost:1338` (the API's configured port) |
| `LEARNHOUSE_AUTH_JWT_SECRET_KEY` | — | **Required**; server exits at startup if unset |
| `COLLAB_INTERNAL_KEY` | — | **Required**; sent as `X-Internal-Key` to backend internal endpoints |
| `LEARNHOUSE_REDIS_URL` | `redis://localhost:6379` | Redis connection (read by the code; not listed in `.env.example`) |
| `COLLAB_TRUST_PROXY` | `false` | Only `"true"` makes the server read `x-forwarded-for` |

`dotenv/config` is imported first, so a local `.env` is loaded automatically.

---

## Authentication

- JWT is verified with `jsonwebtoken` using `HS256` and the backend secret.
- The document name must match `board:{board_uuid}`; anything else is rejected.
- Membership is checked with `GET {LEARNHOUSE_API_URL}/api/v1/boards/{board_uuid}/membership` using the user's Bearer token.
- The authenticated user object returned to Hocuspocus is `{ id: payload.sub, name: membership.username || 'Unknown', role: membership.role }`.

```typescript
const boardUuid = documentName.match(/^board:(.+)$/)?.[1] ?? null
const response = await fetchWithTimeout(
  `${API_URL}/api/v1/boards/${boardUuid}/membership`,
  { headers: { Authorization: `Bearer ${token}` } },
)
```

---

## Rate Limiting and Concurrency

| Limit | Value | Where |
|-------|-------|-------|
| Connection attempts per IP | 30 per 60-second window | `onRequest` |
| Concurrent users per board | 10 | `onConnect` |

- Rate-limit entries are cleaned up every 5 minutes.
- `x-forwarded-for` is ignored unless `COLLAB_TRUST_PROXY=true`, preventing clients from rotating spoofed IPs.
- Health checks: `GET /` and `GET /health` return `{"status":"ok"}` from `onRequest`.

---

## Persistence

| Layer | Behavior |
|-------|----------|
| Redis | Key `collab:ydoc:{board_uuid}`, `SETEX` with TTL `3600` seconds on every store; read first on load. |
| Database | Debounced `PUT {API_URL}/api/v1/boards/{board_uuid}/ydoc` after `DB_FLUSH_DELAY = 5000` ms, with `X-Internal-Key` and `Content-Type: application/octet-stream`. |

- Outbound HTTP calls use a 10-second timeout (`FETCH_TIMEOUT_MS`).
- Shutdown (`SIGINT`/`SIGTERM`) destroys the server, flushes every pending state directly (15-second timeout per request, independent of Redis), quits Redis and exits.
- If the backend flush fails, the error is logged and the process keeps running.

---

## Internal API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/v1/boards/{board_uuid}/membership` | GET | Verify the user can access the board | JWT (user token) |
| `/api/v1/boards/{board_uuid}/ydoc` | PUT | Persist Yjs state | `X-Internal-Key` |
| `/api/v1/boards/{board_uuid}/ydoc` | GET | Load Yjs state | `X-Internal-Key` |

---

## Development

Dependencies and scripts live in **`apps/collab/package.json`** — check that file rather than relying on a copy here. The Hocuspocus packages are `^4.0.0`, with `yjs` `^13.6.20`, `jsonwebtoken` `^9.0.2`, `ioredis` `^5.9.3` and `dotenv` `^17.0.0`; `tsx` and `typescript` are dev dependencies.

There is no root `package.json`, so there is no root-level `bun run dev`. Either:

```bash
# Run just the collab server
cd apps/collab
bun run dev      # tsx watch src/index.ts
bun run start    # tsx src/index.ts
bun run build    # tsc
```

or start the whole local environment (Postgres + Redis + API + web + collab) with the dev CLI:

```bash
npx learnhouse dev   # implemented in apps/cli/src/commands/dev.ts
```

`bun run tsx watch src/index.ts` is not a valid command — `tsx` is invoked by the package scripts, not by `bun run`.
