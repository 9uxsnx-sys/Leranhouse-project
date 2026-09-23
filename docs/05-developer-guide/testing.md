# Testing Strategy

> LearnHouse uses pytest for backend testing with an in-memory SQLite database, AsyncMock patches for external services, and reusable fixtures that cover the full RBAC and domain model landscape.

---

## Test Framework

| Component | Technology | Notes |
|-----------|-----------|-------|
| Test runner | pytest | asyncio_mode="auto" |
| HTTP client | httpx | AsyncClient for router tests |
| Database | SQLite (in-memory) | JSONB-to-JSON remapping |
| Mocking | unittest.mock | AsyncMock for async patches |
| Coverage | pytest-cov | Minimum 25% threshold |

Configuration in `pyproject.toml`:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["src/tests"]

[tool.coverage.run]
source = ["src"]
branch = true

[tool.coverage.report]
fail_under = 25
```

---

## Test Fixtures (`conftest.py`)

All shared fixtures are defined in `apps/api/src/tests/conftest.py`. They follow a consistent hierarchy:

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
    with Session(engine) as session:
        yield session
```

### Organization Fixtures

```python
@pytest.fixture
def org(db):
    """Primary test organization."""
    o = Organization(id=1, name="Test Org", slug="test-org", ...)
    db.add(o)
    db.commit()
    db.refresh(o)
    return o

@pytest.fixture
def other_org(db):
    """Secondary organization for cross-org isolation tests."""
    o = Organization(id=2, name="Other Org", slug="other-org", ...)
    ...
```

### Role Fixtures

Two roles are provided with pre-configured rights:

```python
ADMIN_RIGHTS = Rights(
    courses=_full_permission_with_own(),
    users=_full_permission(),
    collections=_full_permission(),
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
    dashboard=DashboardPermission(action_access=False),
    ...
)
```

### Rights Helpers

```python
def _full_permission() -> Permission:
    return Permission(
        action_create=True, action_read=True,
        action_update=True, action_delete=True,
    )

def _full_permission_with_own() -> PermissionsWithOwn:
    return PermissionsWithOwn(
        action_create=True, action_read=True, action_read_own=True,
        action_update=True, action_update_own=True,
        action_delete=True, action_delete_own=True,
    )

def _readonly_permission() -> Permission:
    return Permission(
        action_create=False, action_read=True,
        action_update=False, action_delete=False,
    )
```

### User Fixtures

```python
@pytest.fixture
def admin_user(db, org, admin_role):
    """Admin user with admin role in test org."""
    u = User(id=1, username="admin", email="admin@test.com", ...)
    db.add(u)
    db.commit()
    uo = UserOrganization(user_id=u.id, org_id=org.id, role_id=admin_role.id, ...)
    db.add(uo)
    db.commit()
    return PublicUser(id=u.id, username=u.username, ...)

@pytest.fixture
def regular_user(db, org, user_role):
    """Regular user with user role in test org."""
    ...

@pytest.fixture
def anonymous_user():
    return AnonymousUser()
```

### Bypass Fixtures

These fixtures patch external services to no-ops for focused testing:

```python
@pytest.fixture
def bypass_rbac():
    """Patches check_resource_access to a no-op AsyncMock."""
    with patch("src.security.rbac.check_resource_access", new_callable=AsyncMock) as mock:
        yield mock

@pytest.fixture
def bypass_webhooks():
    """Patches dispatch_webhooks to a no-op AsyncMock."""
    with patch("src.services.webhooks.dispatch.dispatch_webhooks", new_callable=AsyncMock) as mock:
        yield mock

@pytest.fixture
def bypass_analytics():
    """Patches analytics track to a no-op AsyncMock."""
    with patch("src.services.analytics.analytics.track", new_callable=AsyncMock) as mock:
        yield mock
```

---

## Writing Tests

### Test File Location

Tests live alongside the code they test in `apps/api/src/tests/`. The `conftest.py` ensures the `src/` directory is on the Python path:

```python
# conftest.py
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
os.environ["TESTING"] = "true"
```

### Test Patterns

#### Testing Service Functions

```python
import pytest
from sqlmodel import Session

async def test_create_chapter(db: Session, org, course, admin_user, bypass_rbac):
    """Test creating a chapter in a course."""
    chapter_data = ChapterCreate(
        name="Test Chapter",
        course_id=course.id,
        org_id=org.id,
    )
    
    mock_request = MockRequest()  # Minimal request object
    
    result = await create_chapter(
        request=mock_request,
        chapter_object=chapter_data,
        current_user=admin_user,
        db_session=db,
    )
    
    assert result.name == "Test Chapter"
    assert result.course_id == course.id
    assert result.chapter_uuid.startswith("chapter_")
```

#### Testing Router Endpoints

```python
import pytest
from httpx import AsyncClient, ASGITransport
from app import app

@pytest.mark.anyio
async def test_get_course(admin_user, course, bypass_rbac):
    """Test fetching a course by UUID."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Simulate authenticated user
        app.dependency_overrides[get_current_user] = lambda: admin_user
        
        response = await client.get(f"/api/v1/courses/{course.course_uuid}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Course"
        
        app.dependency_overrides.clear()
```

#### Testing RBAC

```python
async def test_cross_org_isolation(regular_user, other_org, course, bypass_rbac):
    """Verify a user from one org cannot access another org's resources."""
    # regular_user belongs to org, course belongs to org
    # other_org is a different org
    
    with pytest.raises(HTTPException) as exc_info:
        await get_course(
            request=mock_request,
            course_uuid="cross_org_course_uuid",
            current_user=regular_user,
            db_session=db,
        )
    assert exc_info.value.status_code == 403
```

---

## Running Tests

```bash
# Run all tests
cd apps/api
uv run pytest

# Run with verbose output
uv run pytest -v

# Run a specific test file
uv run pytest src/tests/test_chapters.py -v

# Run with coverage
uv run pytest --cov=src --cov-report=term-missing

# Run tests matching a keyword
uv run pytest -k "chapter"

# Stop on first failure
uv run pytest -x

# Run with print statements visible
uv run pytest -s
```

---

## Environment Setup for Tests

The test environment is configured automatically in `conftest.py`:

```python
# Must be set before any app imports
os.environ["TESTING"] = "true"

# Valid JWT secret (32+ characters for HS256)
os.environ["LEARNHOUSE_AUTH_JWT_SECRET_KEY"] = "test-secret-key-for-unit-tests-32chars!"
```

---

## Coverage Requirements

The project enforces a minimum 25% coverage threshold:

```toml
[tool.coverage.report]
fail_under = 25
```

Coverage is measured on the `src/` directory with branch coverage enabled.

---

## Best Practices

1. **Use bypass fixtures** — Use `bypass_rbac`, `bypass_webhooks`, and `bypass_analytics` when testing service logic unrelated to those concerns
2. **Test both success and failure** — Test 200/201 responses AND 401/403/404 errors
3. **Test cross-org isolation** — Always verify that users from org A cannot access org B's resources
4. **Test anonymous access** — Verify public resources are accessible and private resources are blocked
5. **Use `other_org`** — The `other_org` fixture exists specifically for cross-org isolation tests
6. **Clean up dependency overrides** — Always call `app.dependency_overrides.clear()` after router tests
7. **Prefer service-level tests** — Test service functions directly when possible, as they're faster than full HTTP round-trips
