# Project Structure

> How the monorepo is organized.

---

## Top-Level Layout

```
learnhouse-dev/
├── apps/
│   ├── api/               # FastAPI backend (Python)
│   ├── web/               # Next.js frontend (TypeScript)
│   ├── collab/            # Yjs/Hocuspocus realtime server (TypeScript)
│   └── cli/               # Development CLI (TypeScript)
├── packages/
│   └── ...                # Shared packages
├── docs/                  # Documentation
├── .learnhouse/           # Docker compose configs
└── medusa/                # Vendored Medusa e-commerce (UI reference only)
```

---

## `apps/api` --- FastAPI Backend

```
apps/api/
├── src/
│   ├── api/
│   │   └── v1/            # API route handlers
│   ├── db/
│   │   ├── models/        # SQLModel database models
│   │   └── migrations/    # Alembic migration files
│   ├── services/          # Business logic layer
│   ├── middleware/        # Auth, CORS, rate limiting
│   ├── router.py          # Route registration
│   └── app.py             # FastAPI application entry
├── tests/
├── pyproject.toml
└── .env                   # Environment configuration
```

### Key Files

| File | Purpose |
|------|---------|
| `src/router.py` | Registers all API routers |
| `src/app.py` | FastAPI app creation, middleware, startup events |
| `src/api/v1/` | Versioned API route handlers |
| `src/db/models/` | Database models (SQLModel) |
| `src/services/` | Business logic called by routes |
| `pyproject.toml` | Python dependencies (uv) |

---

## `apps/web` --- Next.js Frontend

```
apps/web/
├── app/
│   ├── orgs/
│   │   └── [orgslug]/
│   │       ├── (withmenu)/    # User Part (Medusa redesign)
│   │       │   ├── layout.tsx # Sidebar menu layout
│   │       │   ├── page.tsx   # Home
│   │       │   ├── courses/
│   │       │   ├── course/[uuid]/
│   │       │   ├── communities/
│   │       │   ├── boards/
│   │       │   └── ...
│   │       └── dash/          # Admin Dashboard (original design)
│   │           ├── layout.tsx # Admin layout
│   │           ├── page.tsx   # Dashboard home
│   │           ├── courses/
│   │           ├── analytics/
│   │           ├── org/settings/
│   │           └── ...
│   ├── auth/                  # Authentication pages
│   └── api/                   # API proxy routes
├── components/
│   ├── Dashboard/             # Admin components
│   │   └── Pages/Course/      # Course edit components
│   ├── Objects/               # Shared UI objects
│   │   └── Thumbnails/        # Card components
│   ├── ui/                    # UI components (Medusa)
│   └── ...                    # Other components
├── contexts/                  # React contexts
├── services/                  # API service functions
├── lib/                       # Utility functions
├── public/                    # Static assets
├── package.json
└── .env.local                 # Environment config
```

### Key Files

| File | Purpose |
|------|---------|
| `app/` | Next.js App Router pages |
| `components/` | React components |
| `components/ui/` | Medusa design system components |
| `components/Dashboard/Pages/Course/` | Course editor components |
| `services/` | API service layer (calls backend) |
| `contexts/` | Auth, Course, Org, I18n contexts |
| `proxy.ts` | API request proxy middleware |

---

## `apps/cli` --- Development CLI

```
apps/cli/
├── src/
│   ├── commands/
│   │   ├── dev.ts          # Dev server orchestrator
│   │   └── setup.ts        # Setup command
│   └── bin/
│       └── learnhouse.ts   # CLI entry point
├── package.json
└── .env
```

---

## `apps/collab` --- Realtime Server

```
apps/collab/
├── src/
│   ├── index.ts            # Server entry (Hocuspocus)
│   └── extensions/         # Hocuspocus extensions
├── package.json
└── .env
```

---

## `docs/` --- Documentation

```
docs/
├── README.md               # Entry point
├── 01-getting-started/     # Setup guides
├── 02-architecture/        # System design
├── 03-user-guide/          # Learner documentation
├── 04-admin-guide/         # Admin documentation
├── 05-developer-guide/     # Developer documentation
├── 06-api-reference/       # API reference
├── 07-ui-reference/        # UI component reference
├── 08-features/            # Feature documentation
├── 09-contributing/        # Contribution guide
├── 10-changelog/           # Release history
├── DOCUMENTATION-PLAN.md   # Documentation plan
└── _archive/               # Old docs (kept for reference)
```
