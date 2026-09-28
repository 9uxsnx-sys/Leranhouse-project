# Test Infrastructure

This document describes the test framework, database setup, and fixture hierarchy used by every test in this project. Read this first before writing any test.

---

## Test Framework

| Component | Technology | Notes |
|-----------|-----------|-------|
| Test runner | pytest | `asyncio_mode = "auto"` |
| HTTP client | httpx | `AsyncClient` with `ASGITransport` for router tests |
| Database | SQLite (in-memory) | JSONB-to-JSON remapping for PostgreSQL compatibility |
| Mocking | `unittest.mock` | `AsyncMock` for async patches |
| Coverage | pytest-cov | Minimum 25% threshold, branch coverage enabled |

Configuration in `pyproject.toml`:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
testpaths = ["src/tests"]

[tool.coverage.run]
source = ["src"]
branch = true

[tool.coverage.report]
fail_under = 25
```

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
    """In-memory SQLite engine with JSONB-to-JSON remapping."""
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    for table in SQLModel.metadata.tables.values():
        for col in table.columns:
            if isinstance(col.type, JSONB):
                col.type = JSON()  # SQLite doesn't support JSONB
    SQLModel.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine):
    """Yields a SQLModel Session bound to the in-memory engine."""
    with Session(engine) as session:
        yield session
```

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

Two roles are pre-configured with full permission sets:

| Fixture | Type | Rights Level | Role Type |
|---------|------|-------------|-----------|
| `admin_role` | `Role` | Full CRUD on all domains | `TYPE_ORGANIZATION` |
| `user_role` | `Role` | Read-only on most domains | `TYPE_ORGANIZATION` |

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
