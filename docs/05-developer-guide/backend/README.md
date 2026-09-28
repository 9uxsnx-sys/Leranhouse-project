# Backend Developer Guide

> Technical documentation for the FastAPI backend — architecture, routers, services, database, and security.

---

## Reading Order

Read these documents **in order** to build a complete mental model of the backend:

```
01  overview.md        → Architecture, technology stack, request lifecycle
02  routers.md          → API route organization, dependency injection, endpoint patterns
03  services.md         → Business logic layer, RBAC integration, transaction patterns
04  database.md         → SQLModel models, migrations, query patterns, caching
05  security.md         → JWT auth, RBAC, feature gating, password hashing
```

---

## Quick Reference

| File | Covers |
|------|--------|
| [overview.md](./overview.md) | Three-layer architecture (routers → services → models), directory layout, middleware pipeline, deployment modes, request lifecycle |
| [routers.md](./routers.md) | Route registration in `v1_router`, per-domain router files, auth/RBAC dependency chains, route organization by domain |
| [services.md](./services.md) | Service layer principles, `check_resource_access()`, cross-cutting concerns (cache, webhooks, analytics), service directory structure |
| [database.md](./database.md) | PostgreSQL + SQLModel ORM, Alembic migrations, JSONB columns, Redis caching, engine/session configuration |
| [security.md](./security.md) | JWT access/refresh tokens, API token authentication, RBAC with resource-level checks, UserGroup locking, feature gating, password hashing |

---

## Key Concepts

| Concept | Where to Learn More |
|---------|---------------------|
| Three-layer architecture | [overview.md](./overview.md) |
| Route registration | [routers.md](./routers.md) |
| Business logic patterns | [services.md](./services.md) |
| Database models and migrations | [database.md](./database.md) |
| Authentication and RBAC | [security.md](./security.md) |
| Testing | [testing/README.md](../testing/README.md) |
