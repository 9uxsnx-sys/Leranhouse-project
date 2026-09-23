# Backend Architecture Overview

> The FastAPI backend is the core of the LearnHouse platform, providing a RESTful API organized in a three-layer architecture: routers → services → database models.

---

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | FastAPI | 0.136.1 |
| Language | Python | 3.14.3 |
| ORM | SQLModel | 0.0.38 |
| Database | PostgreSQL | 16 (with pgvector) |
| Migrations | Alembic | 1.18.4 |
| Password Hashing | pwdlib (Argon2) | — |
| JWT | PyJWT | — |
| Redis | redis-py | — |
| Package Manager | uv | — |
| Testing | pytest | — |

The backend lives in `apps/api/` within the monorepo and serves as the single source of truth for all data operations, authentication, authorization, content delivery, and business logic.

---

## Directory Layout

```
apps/api/
├── app.py                 # FastAPI application entrypoint
├── cli.py                 # Typer CLI for installation
├── alembic.ini            # Alembic configuration
├── pyproject.toml         # Python dependencies & project metadata
├── config/
│   └── config.py          # Configuration loading (LearnHouseConfig)
├── migrations/            # Alembic migration scripts
│   ├── env.py             # Alembic environment (dynamic model import)
│   └── versions/          # Individual migration files
├── scripts/
│   └── migrate.py         # Data migration utility (roles, org configs)
└── src/
    ├── api/               # (legacy, unused — routers live in src/routers/)
    ├── core/
    │   ├── events/
    │   │   ├── events.py      # Startup/shutdown lifecycle
    │   │   └── database.py    # Database engine & session management
    │   ├── middleware/
    │   │   └── cors.py        # Tenancy-aware CORS configuration
    │   └── ee_hooks.py        # Enterprise Edition hook points
    ├── db/                    # SQLModel database models
    ├── routers/               # FastAPI route handlers
    ├── security/              # Authentication & authorization
    │   ├── auth.py            # JWT auth, API token validation
    │   ├── security.py        # Password hashing
    │   ├── rbac/              # Role-based access control
    │   ├── org_auth.py        # Organization-level auth helpers
    │   ├── superadmin.py      # Superadmin checks
    │   ├── api_token_utils.py # API token rejection utilities
    │   └── features_utils/    # Plan-based feature gating
    ├── services/              # Business logic layer
    └── tests/                 # Test suite (conftest.py + router tests)
```

---

## Application Entrypoint (`app.py`)

The FastAPI application is created in `apps/api/app.py` and follows this initialization sequence:

1. **Configuration**: Loads `LearnHouseConfig` from environment variables
2. **Sentry**: Initializes Sentry SDK if a DSN is configured (traces sample rate: 1.0 in dev, 0.1 in production)
3. **FastAPI app**: Created with title, description, version `1.2.0`; Swagger docs only available in dev mode
4. **Middleware stack**: CORS (tenancy-aware) → GZip (min 1KB) → EE middlewares
5. **Lifecycle events**: Startup (DB connection, auto-install, periodic tasks) and shutdown (graceful cleanup)
6. **Content routers**: S3-based content delivery or local file serving depending on configuration
7. **API router**: Registers the `v1_router` with all domain routes

```python
# Simplified from apps/api/app.py
app = FastAPI(
    title=learnhouse_config.site_name,
    version="1.2.0",
    docs_url="/docs" if dev_mode else None,
)

configure_cors(app)
app.add_middleware(GZipMiddleware, minimum_size=1000)
register_ee_middlewares(app)

app.add_event_handler("startup", startup_app(app))
app.add_event_handler("shutdown", shutdown_app(app))

# Content delivery (S3 or local)
if config.content_delivery.type == "s3api":
    app.include_router(content_files_router)
else:
    app.include_router(local_content_router)

app.include_router(v1_router)
```

---

## Three-Layer Architecture

### 1. Routers (Presentation Layer)

Routers in `src/routers/` handle HTTP request/response concerns:
- Input validation via Pydantic/SQLModel schemas
- FastAPI dependency injection for auth, RBAC, database sessions
- Route decoration with tags, prefixes, and dependency chains
- Response serialization

Routers should be thin — they delegate all business logic to the service layer.

### 2. Services (Business Logic Layer)

Services in `src/services/` contain all business logic:
- CRUD operations with proper error handling
- RBAC checks via `check_resource_access()`
- Cross-cutting concerns (cache invalidation, webhook dispatch, analytics)
- Complex operations like reordering, transfer, and migration

Services accept `Request`, `Session`, and domain-specific parameters, and return Pydantic/SQLModel response objects.

### 3. Database Models (Data Access Layer)

SQLModel models in `src/db/` define:
- Table schemas with column types, indexes, and foreign keys
- Pydantic read/create/update schemas for API serialization
- Enum types for constrained values (activity types, lock types, role types)

---

## Configuration

Configuration is loaded from environment variables via `LearnHouseConfig` in `config/config.py`. Key configuration groups:

| Group | Purpose |
|-------|---------|
| `general_config` | Environment, dev mode, Sentry, log level |
| `hosting_config` | Port, content delivery, cookie domain, CORS |
| `security_config` | JWT secret key, allowed origins |
| `redis_config` | Redis connection string |
| `database_config` | SQL connection string |

---

## Middleware Pipeline

1. **CORS** — Tenancy-aware; single-tenant mode allows all origins, multi-tenant mode uses a regex whitelist
2. **GZip** — Compresses responses over 1KB
3. **EE Middlewares** — Enterprise Edition extensions (registered via hook)
4. **Authentication** — Applied per-route via `Depends(get_current_user)`
5. **RBAC** — Applied per-route via `Depends(require_read_access(...))` or called from services
6. **Rate Limiting** — Applied to sensitive endpoints (login, refresh, email verification)

---

## Deployment Modes

### Single Tenancy (Self-Hosted)

- Permissive CORS: matches any `http(s)://` origin
- Simplified auth flows (no subdomain handling)
- All features included without plan checks

### Multi Tenancy (SaaS)

- Strict CORS: configured `LEARNHOUSE_ALLOWED_REGEXP`
- Subdomain-based organization routing
- Plan-based feature gating (standard, pro, enterprise)
- Email verification required for new accounts
- Cookie domain handling for subdomain isolation

---

## Enterprise Edition (EE)

The platform supports an Enterprise Edition via hook points in `src/core/ee_hooks.py`:
- `register_ee_routers(v1_router)` — adds EE-specific API routes
- `register_ee_middlewares(app)` — adds EE-specific middleware
- `register_ee_event_handlers(app)` — adds EE lifecycle hooks

EE features include payments, advanced analytics, and premium integrations. The EE module is conditionally imported and gracefully degrades when absent.

---

## Request Lifecycle

```
Client Request
    │
    ▼
CORS Middleware ──► GZip Middleware ──► EE Middlewares
    │
    ▼
FastAPI Router Matching
    │
    ▼
Dependency Chain:
  ├── get_db_session()          → SQLModel Session
  ├── get_current_user()        → JWT / API Token / Anonymous
  ├── require_*_access()        → RBAC check
  └── require_plan_for_*()      → Plan gate
    │
    ▼
Route Handler (thin, delegates to service)
    │
    ▼
Service Layer (business logic, RBAC, cache, webhooks)
    │
    ▼
Database (SQLModel / PostgreSQL)
    │
    ▼
Response (Pydantic serialization)
```
