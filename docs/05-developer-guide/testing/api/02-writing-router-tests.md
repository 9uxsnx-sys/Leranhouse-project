# Writing Router Tests

Router tests validate that **HTTP endpoints** return the correct status codes, response bodies, and headers. They use `httpx.AsyncClient` with `ASGITransport` to call your FastAPI routes without starting a real server.

---

## When to Write Router Tests

Write router tests when you:
- Add a **new endpoint** (GET, POST, PUT, DELETE, PATCH)
- Change an **existing endpoint's request/response shape**
- Add **validation logic** in the router layer (path params, query params, request body)

---

## Standard Pattern

Every router test file follows this structure:

### 1. Create the `app` Fixture

Build a minimal FastAPI app with only the router being tested and override the database and auth dependencies:

```python
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from src.core.events.database import get_db_session
from src.security.auth import get_current_user
from src.routers.courses.courses import router as courses_router


@pytest.fixture
def app(db, admin_user):
    app = FastAPI()
    app.include_router(courses_router, prefix="/api/v1/courses")
    app.dependency_overrides[get_db_session] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: admin_user
    # Override additional dependencies as needed
    # app.dependency_overrides[require_courses_feature] = lambda: True
    yield app
    app.dependency_overrides.clear()  # CRITICAL: prevent state leakage
```

**Rules:**
- Always call `app.dependency_overrides.clear()` after the test
- Override only the dependencies your router uses
- If the router uses a feature gate (e.g., `require_courses_feature`), override it to return `True`

### 2. Create the `client` Fixture

```python
@pytest.fixture
async def client(app):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
```

### 3. Create Mock Response Helpers

Service functions are **mocked at the router level** to isolate the test to the HTTP layer. Create helper functions that return the expected response shape:

```python
def _mock_course_read(**overrides):
    """Build a minimal CourseRead for mocked service returns."""
    data = dict(
        id=1, name="Test Course", description="A test course",
        public=True, published=True, open_to_contributors=False,
        org_id=1, course_uuid="course_test",
        creation_date="2024-01-01", update_date="2024-01-01",
        authors=[],
    )
    data.update(overrides)
    return CourseRead(**data)
```

### 4. Write Test Methods

```python
class TestCoursesRouter:
    """Tests for /api/v1/courses endpoints."""

    async def test_create_course(self, client):
        with patch(
            "src.routers.courses.courses.create_course",
            new_callable=AsyncMock,
            return_value=_mock_course_read(),
        ):
            response = await client.post(
                "/api/v1/courses/?org_id=1",
                json={"name": "Test Course", "description": "A test course"},
            )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Course"
```

---

## Testing Patterns

### Mocking Service Layer

Always mock the service function that the router calls, not the router method itself:

```python
# CORRECT: Mock the service function the router imports
with patch("src.routers.courses.courses.create_course", ...):
    response = await client.post(...)

# WRONG: Mocking the wrong target
# with patch("src.routers.courses.courses.courses_router", ...):
```

To find the correct target path, look at the router file's imports:
```python
# In src/routers/courses/courses.py:
from src.services.courses.courses import create_course  # ← patch this path
```

### Testing File Upload

```python
from io import BytesIO

def _upload_file():
    return ("thumb.png", BytesIO(b"fake-image-content"), "image/png")

async def test_upload_thumbnail(self, client, db, org, admin_user):
    # Create a real community in the DB for the test
    community = Community(id=1, name="Test", ..., org_id=org.id, ...)
    db.add(community)
    db.commit()

    with patch("src.routers.communities.communities.upload_community_thumbnail",
               new_callable=AsyncMock, return_value="new-thumb.png"):
        with patch("src.routers.communities.communities.check_resource_access",
                   new_callable=AsyncMock):
            response = await client.put(
                "/api/v1/communities/community_test/thumbnail",
                files={"thumbnail": _upload_file()},
            )
    assert response.status_code == 200
    assert response.json()["thumbnail_image"] == "new-thumb.png"
```

### Testing Error Responses

```python
async def test_get_nonexistent_course(self, client):
    with patch(
        "src.routers.courses.courses.get_course",
        new_callable=AsyncMock,
        side_effect=HTTPException(status_code=404, detail="Course not found"),
    ):
        response = await client.get("/api/v1/courses/nonexistent")
    assert response.status_code == 404
    assert response.json()["detail"] == "Course not found"
```

### Testing Auth with Different Users

```python
@pytest.fixture
def app_with_user(db, regular_user):
    """Override the app fixture to use regular_user instead of admin_user."""
    app = FastAPI()
    app.include_router(courses_router, prefix="/api/v1/courses")
    app.dependency_overrides[get_db_session] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: regular_user
    yield app
    app.dependency_overrides.clear()

async def test_regular_user_cannot_delete(app_with_user, client):
    """Regular users should not be able to delete resources."""
    # The router's RBAC check will block the request
    response = await client.delete("/api/v1/courses/course_test")
    assert response.status_code == 403
```

---

## Complete Example

See the existing test file at [test_communities_router.py](../../../../../apps/api/src/tests/routers/test_communities_router.py) for a full working example with:

- `app` fixture with multiple routers
- `client` fixture
- Mock helpers for multiple entity types
- CRUD endpoints, file upload, error cases
- Real DB entities for integration-style tests

---

## Rules Summary

| Rule | Why |
|------|-----|
| Mock service functions, not router methods | The router IS the code under test |
| Always clear `dependency_overrides` | Prevents state leakage between tests |
| Use `new_callable=AsyncMock` for async patches | Sync mocks don't work with async functions |
| Test 200/201 AND 401/403/404 responses | Both success and error paths must be validated |
| Use helpers like `_mock_*()` for test data | Reduces duplication when response shape changes |
