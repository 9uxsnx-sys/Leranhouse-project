# Architecture Overview

> High-level system architecture of the Koodook platform.

---

## System Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (User)                         │
└────────────┬──────────────────────────────┬───────────────┘
             │                              │
    ┌────────▼────────┐          ┌─────────▼─────────┐
    │  Next.js (Web)   │          │  Yjs (Collab)     │
    │  Port 3000       │          │  Port 4000        │
    │  App Router      │          │  Hocuspocus       │
    └────────┬────────┘          │  WebSocket         │
             │                   └───────────────────┘
             │ HTTP/REST
    ┌────────▼────────┐
    │  FastAPI (API)   │
    │  Port 1338       │
    │  JWT Auth        │
    └────────┬────────┘
             │
    ┌────────▼────────┐     ┌──────────────┐
    │  PostgreSQL      │     │  Redis       │
    │  (pgvector)      │     │  (Cache)     │
    │  Port 5434       │     │  Port 6379   │
    └─────────────────┘     └──────────────┘
```

---

## The Four Apps

### `apps/api` --- FastAPI Backend

- Python FastAPI with SQLModel ORM
- PostgreSQL with pgvector extension for AI embeddings
- JWT-based authentication with OAuth2 support
- RESTful API with auto-generated OpenAPI docs at `/docs`
- Business logic in `apps/api/src/services/`
- Route definitions in `apps/api/src/routers/`

### `apps/web` --- Next.js Frontend

- Next.js 16 App Router with TypeScript
- Two distinct layouts: `(withmenu)` for user-facing pages and `dash` for admin dashboard
- SWR for data fetching and caching
- Medusa design system for UI components
- Proxy middleware for API requests

### `apps/collab` --- Realtime Collaboration Server

- Yjs document synchronization with Hocuspocus
- WebSocket connections on port 4000
- Powers collaborative whiteboards (Boards) and realtime features

### `apps/cli` --- Development CLI

- Orchestrates the dev environment
- Manages Docker containers, dependency installation, and process spawning
- Provides interactive controls (restart, stop) during development

---

## Key Design Decisions

### Two Separate Layouts

The frontend has two completely independent layouts:

| Layout | Routes | Design | Audience |
|--------|--------|--------|----------|
| `(withmenu)` | `/orgs/[orgslug]/*` | Medusa UI redesign | Learners |
| `dash` | `/orgs/[orgslug]/dash/*` | Original Learnhouse design | Admins |

These use different components, different layouts, and different design languages. **Never mix components between the two.**

### Pay-to-Access Model

Koodook is a paid learning platform:
- Users see course details but must **purchase** to access lesson content
- Payment integration planned via **Chargily Pay v2** (EDAHABIA/CIB)
- Courses can be Public (free), Users Only (group-restricted), or Paid (purchase required)

### Multi-Tenancy

The platform supports multiple organizations, each with:
- Their own courses, users, and content
- Custom branding (fonts, colors, logos)
- Custom domains
- Independent SSO configuration

---

## Data Flow

```
User Action -> Next.js Page -> API Service (SWR) -> FastAPI Endpoint -> Service Layer -> Database
                                                                                    |
                                                                              PostgreSQL (pgvector)
```

1. User interacts with a Next.js page
2. Page uses a service function from `@services/` to call the API
3. API validates authentication via JWT middleware
4. Request hits a router, which calls a service function
5. Service function queries the database via SQLModel
6. Response flows back through the same chain
