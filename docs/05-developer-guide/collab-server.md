# Realtime Collaboration Server

> The collaboration server provides real-time multi-user editing for boards using Yjs (CRDT) via Hocuspocus, with JWT authentication, Redis caching, and debounced database persistence.

---

## Overview

The collab server lives in `apps/collab/` and runs as a standalone Node.js process on port 4000. It uses:

- **Hocuspocus** — WebSocket-based Yjs server
- **Yjs** — CRDT (Conflict-free Replicated Data Type) for real-time collaboration
- **Redis** — Caching of document state (1 hour TTL)
- **PostgreSQL** — Persistent storage via the backend API
- **JWT** — Authentication using the same secret as the backend

---

## Architecture

```
Browser (Yjs client)
    │
    ▼  WebSocket (ws://)
┌─────────────────────┐
│  Hocuspocus Server  │  Port 4000
│  apps/collab/       │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
  Redis      Backend API
  (cache)    (persistence)
               │
               ▼
           PostgreSQL
```

### Request Flow

1. Client connects via WebSocket to `ws://localhost:4000`
2. `onRequest` handler checks rate limits (30 connections/IP/minute)
3. `onAuthenticate` verifies JWT and board membership via backend API
4. `onConnect` enforces max 10 concurrent users per board
5. Changes are stored to Redis immediately and debounced to DB every 5 seconds
6. On reconnect, state is loaded from Redis (fast) or DB (fallback)

---

## Key Configuration

Environment variables for `apps/collab/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `COLLAB_PORT` | `4000` | WebSocket server port |
| `LEARNHOUSE_API_URL` | `http://localhost:8000` | Backend API URL |
| `LEARNHOUSE_AUTH_JWT_SECRET_KEY` | — | JWT signing secret (must match backend) |
| `COLLAB_INTERNAL_KEY` | — | Internal key for backend-to-backend calls |
| `LEARNHOUSE_REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `COLLAB_TRUST_PROXY` | `false` | Whether to trust `x-forwarded-for` header |

---

## Authentication

### JWT Verification

The collab server verifies JWTs using the same secret and algorithm as the backend:

```typescript
import jwt from 'jsonwebtoken'

async onAuthenticate({ token, documentName }: onAuthenticatePayload) {
    if (!token) throw new Error('Authentication required')
    
    const payload = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] })
    
    const boardUuid = extractBoardUuid(documentName)
    if (!boardUuid) throw new Error('Invalid document name')
    
    // Verify board membership via backend API
    const response = await fetchWithTimeout(
        `${API_URL}/api/v1/boards/${boardUuid}/membership`,
        { headers: { Authorization: `Bearer ${token}` } },
    )
    
    if (!response.ok) throw new Error('Not authorized for this board')
    
    return {
        user: {
            id: payload.sub,
            name: membership.username,
            role: membership.role,
        },
    }
}
```

### Board Membership

Membership is verified by calling the backend API endpoint `/api/v1/boards/{board_uuid}/membership`. The backend performs RBAC checks and returns user metadata.

### Document Naming Convention

Documents are named using the format `board:{board_uuid}`:

```typescript
function extractBoardUuid(documentName: string): string | null {
    const match = documentName.match(/^board:(.+)$/)
    return match ? match[1] : null
}
```

---

## Rate Limiting

In-memory rate limiting is applied per IP address:

```typescript
const RATE_LIMIT_WINDOW_MS = 60_000  // 1 minute
const RATE_LIMIT_MAX = 30             // max connections per IP

function isRateLimited(ip: string): boolean {
    // Tracks connection attempts with sliding window
    // Returns true if exceeded
}
```

Stale entries are cleaned up every 5 minutes. The `x-forwarded-for` header is only trusted when `COLLAB_TRUST_PROXY=true` to prevent IP spoofing.

---

## Data Persistence

### Two-Tier Storage

```
Write Path:
Client change → Redis (immediate, TTL 1h)
             → PostgreSQL (debounced, 5s delay)

Read Path:
Client connect → Redis (fast cache hit)
               → PostgreSQL (fallback, then warm Redis cache)
```

### Redis Cache

```typescript
const REDIS_YDOC_TTL = 3600  // 1 hour
const redisYdocKey = (boardUuid: string) => `collab:ydoc:${boardUuid}`

// Write: immediate Redis update
await redis.setex(redisYdocKey(boardUuid), REDIS_YDOC_TTL, Buffer.from(state))

// Read: try Redis first
const cached = await redis.getBuffer(redisYdocKey(boardUuid))
if (cached && cached.byteLength > 0) return new Uint8Array(cached)
```

### Debounced Database Persistence

Changes are debounced to avoid flooding the database:

```typescript
const DB_FLUSH_DELAY = 5000  // 5 seconds

function scheduleDbFlush(boardUuid: string, state: Uint8Array) {
    // Cancel any existing pending flush
    const existing = pendingFlushes.get(boardUuid)
    if (existing) clearTimeout(existing.timer)
    
    // Schedule new flush
    const timer = setTimeout(async () => {
        await fetch(`${API_URL}/api/v1/boards/${boardUuid}/ydoc`, {
            method: 'PUT',
            headers: {
                'X-Internal-Key': INTERNAL_KEY,
                'Content-Type': 'application/octet-stream',
            },
            body: state,
        })
    }, DB_FLUSH_DELAY)
    
    pendingFlushes.set(boardUuid, { timer, state: new Uint8Array(state) })
}
```

### Graceful Shutdown

On shutdown, all pending writes are flushed before the process exits:

```typescript
async function gracefulShutdown() {
    // Stop accepting new connections
    await server.destroy()
    
    // Flush all pending writes
    for (const [boardUuid, { state }] of pendingFlushes) {
        await fetch(`${API_URL}/api/v1/boards/${boardUuid}/ydoc`, {
            method: 'PUT',
            headers: { 'X-Internal-Key': INTERNAL_KEY },
            body: state,
        })
    }
    
    if (redis) await redis.quit()
    process.exit(0)
}
```

---

## Concurrency Limits

| Limit | Value | Enforced In |
|-------|-------|-------------|
| Max connections per IP | 30/minute | `onRequest` handler |
| Max concurrent users per board | 10 | `onConnect` handler |

```typescript
async onConnect({ documentName, instance }: onConnectPayload) {
    const boardUuid = extractBoardUuid(documentName)
    if (!boardUuid) return
    
    const doc = instance.documents.get(documentName)
    if (doc && doc.getConnectionsCount() >= MAX_BOARD_USERS) {
        throw new Error(`Board is full (max ${MAX_BOARD_USERS} concurrent users)`)
    }
}
```

---

## Health Checks

The server exposes health check endpoints at `/` and `/health`:

```typescript
async onRequest({ request, response }: onRequestPayload) {
    if (request.url === '/' || request.url === '/health') {
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ status: 'ok' }))
        throw null  // Stops hook chain
    }
}
```

---

## Development

### Running

The collab server is started automatically by the dev CLI (`bun run dev`). To start manually:

```bash
cd apps/collab
bun run tsx watch src/index.ts
```

### Dependencies

```json
{
    "dependencies": {
        "@hocuspocus/server": "^2.x",
        "@hocuspocus/extension-database": "^2.x",
        "yjs": "^13.x",
        "jsonwebtoken": "^9.x",
        "ioredis": "^5.x"
    }
}
```

### Internal API Endpoints Used

The collab server communicates with the backend via these internal endpoints:

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/v1/boards/{board_uuid}/membership` | GET | Verify user has board access | JWT (user token) |
| `/api/v1/boards/{board_uuid}/ydoc` | PUT | Persist ydoc state to DB | `X-Internal-Key` |
| `/api/v1/boards/{board_uuid}/ydoc` | GET | Load ydoc state from DB | `X-Internal-Key` |
