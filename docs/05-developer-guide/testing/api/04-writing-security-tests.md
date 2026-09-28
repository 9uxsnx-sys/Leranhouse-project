# Writing Security Tests

Security tests validate that **authorization and access control** rules are enforced correctly. These tests are critical for a multi-tenant platform — a bug here can expose data across organizations.

---

## When to Write Security Tests

Write security tests when you:
- Add a **new permission** or role type
- Change **access control logic** in any endpoint or service
- Add a **feature gate** (`require_courses_feature`, etc.)
- Add a **new resource type** that needs org isolation
- Want to verify **anonymous access** behavior

---

## The Four Security Scenarios

Every endpoint or service function must be tested against these four scenarios:

| Scenario | User Type | Expected Result |
|----------|-----------|-----------------|
| **Admin access** | `admin_user` (same org) | 200 (success) |
| **Regular user access** | `regular_user` (same org) | 200 or 403 (depends on permission) |
| **Cross-org access** | user from `other_org` | 403 or 404 |
| **Anonymous access** | `anonymous_user` | 401 or filtered results |

---

## Testing RBAC at the Service Level

```python
async def test_admin_can_create_course(
    db, org, admin_user, bypass_rbac, bypass_webhooks, bypass_analytics
):
    """Admin should be able to create a course in their org."""
    result = await create_course(
        request=mock_request,
        course_object=CourseCreate(name="New Course", description="...", public=True),
        current_user=admin_user,
        db_session=db,
    )
    assert result.name == "New Course"


async def test_regular_user_cannot_delete_course(
    db, org, course, regular_user, bypass_rbac
):
    """Regular users should not be able to delete courses."""
    with pytest.raises(HTTPException) as exc_info:
        await delete_course(
            request=mock_request,
            course_uuid=course.course_uuid,
            current_user=regular_user,
            db_session=db,
        )
    assert exc_info.value.status_code == 403


async def test_cross_org_isolation(
    db, org, other_org, course, regular_user, bypass_rbac
):
    """User from org cannot access other_org's course."""
    # Create a course in other_org
    other_course = Course(
        id=999, name="Other Course", org_id=other_org.id,
        course_uuid="course_other", ...
    )
    db.add(other_course)
    db.commit()

    with pytest.raises(HTTPException) as exc_info:
        await get_course(
            request=mock_request,
            course_uuid="course_other",
            current_user=regular_user,  # Belongs to org, not other_org
            db_session=db,
        )
    assert exc_info.value.status_code == 403
```

---

## Testing RBAC at the Router Level

For router tests, override the `get_current_user` dependency to simulate different users:

```python
@pytest.fixture
def admin_app(db, admin_user):
    app = FastAPI()
    app.include_router(courses_router, prefix="/api/v1/courses")
    app.dependency_overrides[get_db_session] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: admin_user
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
def user_app(db, regular_user):
    app = FastAPI()
    app.include_router(courses_router, prefix="/api/v1/courses")
    app.dependency_overrides[get_db_session] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: regular_user
    yield app
    app.dependency_overrides.clear()


class TestCoursesSecurity:
    async def test_admin_can_delete(self, admin_app, client):
        """Admin gets 200 when deleting."""
        with patch("src.routers.courses.courses.delete_course", ...):
            response = await client.delete("/api/v1/courses/course_test")
        assert response.status_code == 200

    async def test_regular_user_cannot_delete(self, user_app, client):
        """Regular user gets 403 when deleting."""
        response = await client.delete("/api/v1/courses/course_test")
        assert response.status_code == 403
```

---

## Testing Anonymous Access

Anonymous access testing verifies what unauthenticated users can see:

```python
@pytest.fixture
def anonymous_app(db):
    app = FastAPI()
    app.include_router(courses_router, prefix="/api/v1/courses")
    app.dependency_overrides[get_db_session] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: AnonymousUser()
    yield app
    app.dependency_overrides.clear()


async def test_anonymous_can_see_public_courses(self, anonymous_app, client):
    """Anonymous users can list public courses."""
    with patch("src.routers.courses.courses.get_courses_by_org",
               return_value=[_mock_course_read()]):
        response = await client.get("/api/v1/courses/org/1/page/1/limit/10")
    assert response.status_code == 200


async def test_anonymous_cannot_create(self, anonymous_app, client):
    """Anonymous users cannot create courses."""
    response = await client.post(
        "/api/v1/courses/?org_id=1",
        json={"name": "New", "description": "Test"},
    )
    assert response.status_code == 401
```

---

## Testing Feature Gates

Some endpoints are gated by feature flags:

```python
@pytest.fixture
def app_with_feature_gate(db, admin_user):
    app = FastAPI()
    app.include_router(courses_router, prefix="/api/v1/courses")
    app.dependency_overrides[get_db_session] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[require_courses_feature] = lambda: True
    yield app
    app.dependency_overrides.clear()


async def test_feature_gate_blocks_access(self, app, client):
    """When feature gate returns False, endpoint returns 403."""
    # Override the gate to return False
    app.dependency_overrides[require_courses_feature] = lambda: False
    response = await client.get("/api/v1/courses/org/1/page/1/limit/10")
    assert response.status_code == 403
```

---

## Rules Summary

| Rule | Why |
|------|-----|
| Test all four scenarios (admin, user, cross-org, anonymous) | One missing scenario = potential security hole |
| Use separate `app` fixtures for different users | Cleanly separates test setup for each role |
| Test at both service and router level | Service tests catch logic bugs, router tests catch wiring bugs |
| Verify response status AND response body | Some endpoints return 404 instead of 403 for security (resource hiding) |
| Test feature gates independently | Feature flags can silently disable endpoints |
