# Backend Architecture Overview

> Status: as-built · Last verified: 2026-11-15

> The FastAPI backend is the core of LearnHouse. It exposes a REST API under `/api/v1` and is organized as routers → services → database models.

---

## Technology Stack

Versions come from `apps/api/pyproject.toml`:

| Component | Dependency | Version |
|-----------|------------|---------|
| Framework | `fastapi` | 0.136.1 |
| Language | Python (`requires-python`) | >=3.14.3,<3.14.4 |
| ORM | `sqlmodel` | 0.0.38 |
| Migrations | `alembic` | 1.18.4 |
| Password hashing | `pwdlib[argon2]` | 0.3.0 |
| JWT | `pyjwt[crypto]` | 2.12.1 |
| Redis client | `redis` | 7.4.0 |
| Server | `uvicorn` | 0.46.0 |
| Database driver | `psycopg2-binary` | 2.9.12 |
| Embeddings | `pgvector` | 0.4.2 |
| Testing | `pytest` | 9.0.3 |
| Package manager | `uv` (`uv.lock`) | — |

The dev CLI starts PostgreSQL as `pgvector/pgvector:pg16` (see [project structure](../project-structure.md)). S3 access uses `boto3`/`botocore`; email uses `resend` or SMTP; AI uses `google-genai`.

---

## Directory Layout

```
apps/api/
├── app.py                  # FastAPI application entrypoint
├── cli.py                  # Typer installer CLI
├── alembic.ini
├── pyproject.toml
├── config/
│   ├── config.py           # LearnHouseConfig loading (env → YAML)
│   └── config.yaml         # Defaults / local development values
├── migrations/             # Alembic env.py + versions
├── scripts/migrate.py      # Data migration utility
└── src/
    ├── core/
    │   ├── events/         # startup/shutdown, DB engine, auto-install, logs
    │   ├── middleware/cors.py
    │   ├── deployment_mode.py  # saas / ee / oss detection
    │   └── ee_hooks.py        # EE hook points
    ├── db/                 # SQLModel models
    ├── routers/            # Per-domain FastAPI routers
    ├── router.py           # The single /api/v1 router
    ├── security/           # auth, API tokens, CSRF helpers, RBAC, plan/feature gates
    ├── services/           # Business logic
    └── tests/              # pytest suite
```

The Enterprise Edition code is **not** in this repository: it is overlaid at `apps/api/ee/` at build time and gitignored.

---

## Application Entrypoint (`apps/api/app.py`)

1. `get_learnhouse_config()` runs at import time and loads `LearnHouseConfig`.
2. Sentry is initialized only when `general_config.sentry_config.dsn` is set (`traces_sample_rate` 1.0 in development mode, else 0.1).
3. The FastAPI app is created with `version="1.2.0"` and a **lifespan context manager** — not `add_event_handler`:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await startup_app(app)()
    yield
    await shutdown_app(app)()

app = FastAPI(
    title=learnhouse_config.site_name,
    description=learnhouse_config.site_description,
    docs_url="/docs" if learnhouse_config.general_config.development_mode else None,
    redoc_url="/redoc" if learnhouse_config.general_config.development_mode else None,
    version="1.2.0",
    lifespan=lifespan,
)
```

4. Middleware: `configure_cors(app)` → `GZipMiddleware(minimum_size=1000)` → `register_ee_middlewares(app)`.
5. Content delivery: `content_files_router` when `hosting_config.content_delivery.type == "s3api"`, otherwise `local_content_router`.
6. `app.include_router(v1_router)` plus a public `GET /` returning a welcome message.

Swagger (`/docs`) and ReDoc (`/redoc`) are served **only in development mode**.

---

## Three-Layer Architecture

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Routers | `src/routers/` | HTTP concerns: input validation, dependency injection (auth, RBAC, DB session), response serialization. Kept thin. |
| Services | `src/services/` | Business logic: CRUD, RBAC enforcement (`check_resource_access`), cache invalidation, webhooks, analytics. |
| Models | `src/db/` | SQLModel tables plus read/create/update schemas and enums (access types, lock types, payment statuses…). |

---

## Configuration

`config/config.py` merges environment variables over `config/config.yaml` into `LearnHouseConfig`:

| Group | Fields (as-built) |
|-------|-------------------|
| `general_config` | `development_mode`, `sentry_config.dsn`, `saas_mode`, `env` |
| `hosting_config` | `tenancy` (`multi`/`single`), `domain`, `frontend_domain`, `ssl`, `port`, `use_default_org`, `allowed_origins`, `allowed_regexp`, `self_hosted`, `cookie_config.domain`, `content_delivery` |
| `security_config` | `auth_jwt_secret_key` only (required, min 32 chars) |
| `database_config` | `sql_connection_string` |
| `redis_config` | `redis_connection_string` |
| `mailing_config` | `email_provider` (`resend`/`smtp`), system address and provider credentials |
| `ai_config` | `gemini_api_key`, `is_ai_enabled` |
| `payments_config` | Stripe keys (`stripe_secret_key`, publishable key, webhook/connect secrets, client id) |
| `tinybird_config` | Optional; enabled when an API URL is set |
| `judge0_config` | Optional; enabled when an API URL is set |

CORS does **not** live in `security_config`: origins are `hosting_config.allowed_origins` / `allowed_regexp`. There is no log-level field in the config model.

**Tenancy** is a single `hosting_config.tenancy` knob. When unset, it is inferred: SaaS, or EE with a shared dotted cookie domain, on a real (non-localhost) domain and not marked self-hosted/dev → `multi`; anything else → `single`. `multi` requires EE or `LEARNHOUSE_SAAS=true` plus a routable domain.

---

## Deployment Modes

`src/core/deployment_mode.py` is the single source of truth, with priority **saas > ee > oss**:

| Mode | Condition | Behavior |
|------|-----------|----------|
| `saas` | `general_config.saas_mode` | Plan-based gating and usage limits |
| `ee` | `apps/api/ee` present (and license check passes when available) | All features, unlimited |
| `oss` | EE folder absent (or license invalid) | EE-only features blocked |

`EE_ONLY_FEATURES` is `{sso, audit_logs, analytics_advanced, scorm}`. **Payments is not EE-only** — it is LearnHouse's own stack and stays available in every mode (`src/db/payments/`).

---

## Enterprise Edition Hooks

`src/core/ee_hooks.py` imports the EE module dynamically and exposes:

| Function | Purpose |
|----------|---------|
| `is_ee_available()` | `ee/` directory exists and `LEARNHOUSE_DISABLE_EE` is not `1` |
| `get_ee_hooks()` | Imports `ee.hooks`, returns `None` when unavailable |
| `register_ee_middlewares(app)` | Calls `hooks.register_middlewares(app)` |
| `register_ee_routers(v1_router)` | Calls `hooks.register_routers(v1_router)` |
| `run_ee_startup(app)` | Calls `hooks.on_startup(app)` |
| `is_multi_org_allowed()` | True for `ee` and `saas` modes |
| `check_ee_activity_paid_access(...)` | Delegates paid-activity checks, falls back to `True` |

All hooks degrade gracefully when the EE folder is missing.

---

## Middleware and Request Lifecycle

```
Request
  → CORS (tenancy-aware)
  → GZip (responses > 1KB)
  → EE middlewares (if present)
  → FastAPI router match (/api/v1/...)
  → Dependencies:
       get_db_session()        # src/core/events/database.py
       get_current_user()      # src/security/auth.py
       RBAC / plan gates       # src/security/rbac, src/security/features_utils
  → Route handler → service → SQLModel/PostgreSQL → response
```

- Authentication is applied per route (or per router in `src/router.py`) via `Depends(...)`; there is no global auth middleware.
- Rate limiting is applied inside auth flows (`check_login_rate_limit`, `check_refresh_rate_limit`, `check_email_verification_rate_limit` from `src/services/security/rate_limiting.py`), not as a global middleware.
- RBAC dependencies live in `src/security/rbac/dependencies.py` (`require_read_access`, `require_write_access`); plan gates in `src/security/features_utils/plan_check.py`.
