# Test Infrastructure

> Status: as-built · Last verified: 2026-11-15

This document describes the test framework, database setup, and fixture hierarchy used by every test in this project. Read this first before writing any test.

---

## Test Framework

| Component | Technology | Notes |
|-----------|-----------|-------|
| Test runner | pytest 9.0.3 | `asyncio_mode = "auto"` |
| Async support | pytest-asyncio 1.3.0 | Async tests run automatically |
| HTTP client | httpx | `AsyncClient` with `ASGITransport` for router tests |
| Database | SQLite (in-memory) | JSONB-to-JSON remapping for PostgreSQL compatibility |
| Mocking | `unittest.mock` | `AsyncMock` for async patches |
| Coverage | pytest-cov 7.1.0 | `fail_under = 25` (no branch coverage) |

Configuration in `pyproject.toml` (the suite has no `testpaths`; pytest discovers from the working directory, so run it from `apps/api`):

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
markers = [
    "asyncio: mark test as async",
]
filterwarnings = [
    "ignore::DeprecationWarning",
    "ignore::UserWarning",
    # ... targeted ignores for crypt/utcnow/instrumentation warnings ...
]

[tool.coverage.run]
source = ["src"]
omit = [
    "src/tests/*",
    "src/services/ai/*",
    "src/routers/ai/*",
    "src/routers/code_execution.py",
    "src/routers/stream.py",
]

[tool.coverage.report]
fail_under = 25
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "if __name__",
]
```

### Markers

- `asyncio` is the only custom marker registered, and it is optional: `asyncio_mode = "auto"` already runs `async def` tests. Some modules still decorate with `@pytest.mark.asyncio`.
- `@pytest.mark.parametrize` (built-in) is used in a few modules (for example `src/tests/analytics/test_shared.py`).
- There are no `unit` / `integration` / `slow` markers — do not use them expecting a filter.

### Where Fixtures Live

- `apps/api/src/tests/conftest.py` — shared DB, org, role, user, course, and bypass fixtures.
- `apps/api/src/tests/analytics/conftest.py` — a Postgres-only `pg_engine` / `pg` pair for the analytics SQL tests. It skips (does not fail) when Postgres is unreachable.

The suite currently has 174 `test_*.py` modules under `apps/api/src/tests`.

---

## Database Setup

Tests use an **in-memory SQLite database** with JSONB-to-JSON remapping. This means:

- **Fast**: No disk I/O, no Docker dependency
- **Isolated**: Each test run starts fresh
- **Portable**: No PostgreSQL installation required

The `engine` fixture creates the in-memory database and creates all tables from `SQLModel.metadata`:

```python
@pytest.fixture
def engine():
    """In-memory SQLite engine (schema made SQLite-compatible at import)."""
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Test modules import additional model modules during collection, after the
    # import-time rewrite above has already run. Re-apply before create_all so
    # late-registered tables (e.g. payments) are SQLite-compatible too.
    _make_schema_sqlite_compatible()
    SQLModel.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine):
    """Yields a SQLModel Session bound to the in-memory engine."""
    with Session(engine) as session:
        yield session
```

`_make_schema_sqlite_compatible()` is defined at the top of `conftest.py` and also runs once at import, so every module that builds its own engine benefits. It rewrites `JSONB` columns to `JSON` and strips Postgres-cast server defaults such as `'{}'::jsonb`.

---

## Fixture Hierarchy

All shared fixtures are defined in `apps/api/src/tests/conftest.py`. They follow a strict dependency chain:

```
engine (SQLite in-memory)
  └── db (SQLModel Session)
       ├── org / other_org
       ├── admin_role / user_role
       ├── admin_user / regular_user / anonymous_user
       ├── course
       │    └── chapter
       │         └── activity
       └── collection
```

### Database Fixtures

| Fixture | Type | Dependencies | Purpose |
|---------|------|-------------|---------|
| `engine` | `Engine` | none | In-memory SQLite engine with JSONB remapping |
| `db` | `Session` | `engine` | SQLModel session for database operations |

### Organization Fixtures

| Fixture | Type | Dependencies | Purpose |
|---------|------|-------------|---------|
| `org` | `Organization` | `db` | Primary test org (id=1, slug="test-org") |
| `other_org` | `Organization` | `db` | Secondary org (id=2, slug="other-org") for cross-org isolation tests |

```python
@pytest.fixture
def org(db):
    """Primary test organization."""
    o = Organization(
        id=1, name="Test Org", slug="test-org",
        email="test@org.com", org_uuid="org_test",
        creation_date=str(datetime.now()), update_date=str(datetime.now()),
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return o


@pytest.fixture
def other_org(db):
    """Secondary organization for cross-org isolation tests."""
    o = Organization(
        id=2, name="Other Org", slug="other-org",
        email="other@org.com", org_uuid="org_other",
        creation_date=str(datetime.now()), update_date=str(datetime.now()),
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return o
```

### Role Fixtures

Two org-scoped roles are pre-configured:

| Fixture | Type | Rights Level | Role Type |
|---------|------|-------------|-----------|
| `admin_role` | `Role` (id=1, "Admin") | Full CRUD on all domains | `TYPE_ORGANIZATION` |
| `user_role` | `Role` (id=4, "User") | Read-only on most domains | `TYPE_ORGANIZATION` |

```python
ADMIN_RIGHTS = Rights(
    courses=_full_permission_with_own(),
    users=_full_permission(),
    usergroups=_full_permission(),
    collections=_full_permission(),
    organizations=_full_permission(),
    coursechapters=_full_permission(),
    activities=_full_permission(),
    roles=_full_permission(),
    dashboard=DashboardPermission(action_access=True),
    communities=_full_permission(),
    discussions=_full_permission_with_own(),
    podcasts=_full_permission_with_own(),
    boards=_full_permission_with_own(),
    playgrounds=_full_permission_with_own(),
)

USER_RIGHTS = Rights(
    courses=_readonly_permission_with_own(),
    users=_readonly_permission(),
    # ... all read-only, dashboard access = False
)
```

### User Fixtures

| Fixture | Type | Dependencies | Purpose |
|---------|------|-------------|---------|
| `admin_user` | `PublicUser` | `db`, `org`, `admin_role` | Admin user in test org |
| `regular_user` | `PublicUser` | `db`, `org`, `user_role` | Regular user in test org |
| `anonymous_user` | `AnonymousUser` | none | Unauthenticated user |

### Domain Fixtures

| Fixture | Type | Dependencies | Purpose |
|---------|------|-------------|---------|
| `course` | `Course` | `db`, `org` | Published, public course (id=1) |
| `chapter` | `Chapter` | `db`, `org`, `course` | Chapter linked to course |
| `activity` | `Activity` | `db`, `org`, `course`, `chapter` | Published dynamic activity |
| `collection` | `Collection` | `db`, `org`, `course` | Public collection containing the course |

### Request / Bypass Fixtures

| Fixture | Purpose | When to Use | When NOT to Use |
|---------|---------|-------------|-----------------|
| `mock_request` | Minimal Starlette `Request` for service functions | Testing service functions that require a request object | Router tests (the client handles this) |
| `bypass_rbac` | Patches `check_resource_access` to no-op | Testing service logic unrelated to authorization | Testing authorization logic itself |
| `bypass_webhooks` | Patches `dispatch_webhooks` to no-op | Testing service logic that triggers webhooks | Testing webhook delivery itself |
| `bypass_analytics` | Patches `analytics.track` to no-op | Testing service logic that tracks analytics | Testing analytics tracking itself |

```python
@pytest.fixture
def bypass_rbac():
    """Patches check_resource_access to a no-op AsyncMock."""
    with patch(
        "src.security.rbac.check_resource_access",
        new_callable=AsyncMock,
    ) as mock:
        yield mock
```

---

## Environment Setup

The test environment is configured automatically in `conftest.py` before any app imports:

```python
# Must be set before any app imports
os.environ["TESTING"] = "true"

# Valid JWT secret (32+ characters for HS256)
os.environ["LEARNHOUSE_AUTH_JWT_SECRET_KEY"] = (
    "test-secret-key-for-unit-tests-32chars!"
)
```

The `TESTING` environment variable triggers the application to use SQLite instead of PostgreSQL. The JWT secret is set to a known value so that auth tokens can be generated deterministically in tests.

---

## Common Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Forgetting `app.dependency_overrides.clear()` | Tests leak state across cases | Always clear overrides in a `yield` fixture (see 02-writing-router-tests.md) |
| Using `engine` fixture directly | Tests are not isolated | Use `db` fixture instead — it creates a fresh session |
| Importing app modules before setting `TESTING` | App tries to connect to PostgreSQL | Ensure `TESTING` is set in conftest.py before any `from src...` imports |
| Not using `bypass_rbac` in service tests | Tests fail on auth checks unrelated to the feature | Use bypass fixtures for focused testing |
| Forgetting `new_callable=AsyncMock` | Mock doesn't work with async functions | Always use `new_callable=AsyncMock` for async patches |
