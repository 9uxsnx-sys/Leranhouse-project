# Writing Service Tests

Service tests validate **business logic** directly by calling service functions with a real database session. They are faster than router tests (no HTTP overhead) and provide more precise control over test setup.

---

## When to Write Service Tests

Write service tests when you:
- Add a **new service function** (CRUD, business logic, validation)
- Add **database-level logic** (queries, filters, state changes)
- Need to test **specific error conditions** (duplicate names, missing relations, constraint violations)
- Want to test logic **without HTTP overhead**

---

## Standard Pattern

### 1. Use Bypass Fixtures

Service functions often call RBAC checks, webhook dispatches, or analytics tracking internally. Use the bypass fixtures from `conftest.py` to disable these for focused testing:

```python
from src.services.courses.courses import create_course

async def test_create_course_succeeds(
    db: Session, org, admin_user, bypass_rbac, bypass_webhooks, bypass_analytics
):
    """Test creating a course with valid data."""
    course_data = CourseCreate(
        name="Python 101",
        description="Beginner Python course",
        public=True,
    )
    mock_request = MockRequest()  # From mock_request fixture

    result = await create_course(
        request=mock_request,
        course_object=course_data,
        current_user=admin_user,
        db_session=db,
    )

    assert result.name == "Python 101"
    assert result.public is True
    assert result.org_id == org.id
```

### 2. Test Database State

Service tests can verify database state directly after calling the service function:

```python
async def test_create_course_persists_to_db(
    db, org, admin_user, bypass_rbac, bypass_webhooks, bypass_analytics
):
    course_data = CourseCreate(name="Python 101", description="...", public=True)
    result = await create_course(
        request=MockRequest(),
        course_object=course_data,
        current_user=admin_user,
        db_session=db,
    )

    # Verify the course was actually stored in the database
    stored = db.get(Course, result.id)
    assert stored is not None
    assert stored.name == "Python 101"
    assert stored.org_id == org.id
```

### 3. Test Error Conditions

Use `pytest.raises` for expected exceptions:

```python
import pytest
from fastapi import HTTPException

async def test_create_course_with_empty_name_raises_error(
    db, org, admin_user, bypass_rbac, bypass_webhooks, bypass_analytics
):
    course_data = CourseCreate(name="", description="...", public=True)
    mock_request = MockRequest()

    with pytest.raises(HTTPException) as exc_info:
        await create_course(
            request=mock_request,
            course_object=course_data,
            current_user=admin_user,
            db_session=db,
        )
    assert exc_info.value.status_code == 400
```

---

## Testing Cross-Org Isolation

This is one of the most important patterns. Always verify that a user from org A cannot access org B's resources:

```python
async def test_cross_org_isolation(
    db, org, other_org, regular_user, bypass_rbac
):
    """User from org cannot access other_org's resources."""
    # Create a resource in other_org
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

## Testing Business Logic

For functions with actual logic (not just CRUD), test the specific behaviors:

```python
async def test_course_publish_toggle(
    db, org, admin_user, course, bypass_rbac, bypass_webhooks
):
    """Test that publishing a course makes it visible to anonymous users."""
    # Start with unpublished course
    course.published = False
    db.commit()

    # Publish
    result = await publish_course(
        request=mock_request,
        course_uuid=course.course_uuid,
        current_user=admin_user,
        db_session=db,
    )
    assert result.published is True

    # Verify anonymous can now see it
    visible = await get_public_courses(db_session=db)
    assert any(c.id == course.id for c in visible)
```

---

## Service Test vs Router Test: Which One?

| Scenario | Router Test | Service Test |
|----------|-------------|--------------|
| New endpoint | Required | Optional |
| New service function | Optional | **Required** |
| Business logic change | Optional | **Required** |
| Auth/authz change | **Required** | **Required** |
| Database query change | Optional | **Required** |
| Error/edge case handling | Both work | **Faster** |
| Cross-org isolation | Both work | **Faster** |

**Rule of thumb**: Test the **service function** for business logic correctness. Test the **router** to confirm the endpoint wiring is correct. For most features, you need both — but the service test should cover more scenarios.

---

## Rules Summary

| Rule | Why |
|------|-----|
| Use bypass fixtures for focused testing | Isolates the service logic from unrelated concerns |
| Test database state directly | Catches persistence issues that mock-based tests miss |
| Use `pytest.raises(HTTPException)` for errors | Matches how FastAPI handles errors at the router level |
| Always test cross-org isolation | Multi-tenant security failures are critical bugs |
| Prefer service tests over router tests for logic | Faster execution, more precise control |
