# Writing Integration Tests

Integration tests validate **cross-layer behavior** — how the router, service, database, and external dependencies work together. Unlike router tests (which mock the service layer) and service tests (which bypass auth and external services), integration tests leave the full stack connected.

---

## When to Write Integration Tests

Write integration tests when you:
- Need to test **the full stack** without mocks (router + service + DB)
- Test **admin API endpoints** that bypass normal user auth
- Test **webhook delivery** — verify that dispatching a webhook actually calls the external endpoint
- Test **complex workflows** that span multiple layers (e.g., course import → analysis → confirmation)
- Need to verify **database constraints** and **triggers**

---

## Standard Pattern

Integration tests typically create **real database entities** rather than mocking the service layer:

```python
async def test_full_community_thumbnail_upload_flow(
    self, client, db, org, admin_user
):
    """Test the full flow: create community → upload thumbnail → verify."""
    # Create a real community in the DB
    community = Community(
        id=1, name="Community With Thumb", description="Desc",
        public=True, thumbnail_image="", org_id=org.id,
        community_uuid="community_thumb", ...
    )
    db.add(community)
    db.commit()

    # Mock only the external service (S3 upload), not the business logic
    with patch(
        "src.routers.communities.communities.upload_community_thumbnail",
        new_callable=AsyncMock,
        return_value="new-thumb.png",
    ):
        with patch(
            "src.routers.communities.communities.check_resource_access",
            new_callable=AsyncMock,
        ):
            response = await client.put(
                "/api/v1/communities/community_thumb/thumbnail",
                files={"thumbnail": ("thumb.png", BytesIO(b"data"), "image/png")},
            )

    assert response.status_code == 200
    assert response.json()["thumbnail_image"] == "new-thumb.png"

    # Verify DB was updated
    db.refresh(community)
    assert community.thumbnail_image == "new-thumb.png"
```

---

## Testing Admin API Endpoints

Admin endpoints use a special admin auth dependency. Test them by overriding the admin auth:

```python
from src.security.admin_auth import get_admin_user

@pytest.fixture
def admin_app(db, admin_user):
    app = FastAPI()
    app.include_router(admin_router, prefix="/api/v1/admin")
    app.dependency_overrides[get_db_session] = lambda: db
    app.dependency_overrides[get_admin_user] = lambda: admin_user
    yield app
    app.dependency_overrides.clear()


async def test_admin_can_list_all_users(self, admin_app, client):
    response = await client.get("/api/v1/admin/users")
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
```

---

## Testing Webhook Delivery

When testing webhooks, you need to:
1. Mock the **outgoing HTTP call** (to prevent actual network requests)
2. Verify the **event was dispatched** with the correct payload
3. Test **retry logic** when the webhook target is unreachable

```python
async def test_webhook_dispatch_on_course_publish(
    db, org, course, admin_user
):
    """Publishing a course should dispatch a webhook."""
    events_dispatched = []

    with patch(
        "src.services.webhooks.dispatch.dispatch_webhooks",
        new_callable=AsyncMock,
        side_effect=lambda event, payload: events_dispatched.append(event),
    ):
        result = await publish_course(
            request=mock_request,
            course_uuid=course.course_uuid,
            current_user=admin_user,
            db_session=db,
        )

    assert result.published is True
    assert "course.published" in events_dispatched


async def test_webhook_retry_on_failure(self):
    """If webhook target returns 500, the system should retry."""
    call_count = 0

    async def failing_webhook(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise ConnectionError("Service unavailable")
        return {"status": "ok"}

    with patch(
        "src.services.webhooks.dispatch.dispatch_webhooks",
        new_callable=AsyncMock,
        side_effect=failing_webhook,
    ):
        result = await trigger_webhook("course.published", {...})
        assert result["status"] == "ok"
        assert call_count == 3  # 2 retries + 1 success
```

---

## Testing Cross-Layer Error Propagation

Test that errors from the service layer propagate correctly through the router to the HTTP response:

```python
async def test_service_error_propagates_to_http_response(
    self, client, db, org, admin_user
):
    """A 404 from the service layer should become a 404 HTTP response."""
    # The service function raises HTTPException
    with patch(
        "src.routers.communities.communities.get_community",
        new_callable=AsyncMock,
        side_effect=HTTPException(
            status_code=404, detail="Community not found"
        ),
    ):
        response = await client.get("/api/v1/communities/nonexistent")

    assert response.status_code == 404
    assert response.json()["detail"] == "Community not found"
```

---

## Testing Database Constraints

Integration tests can verify that database-level constraints work:

```python
async def test_unique_constraint_on_course_name(
    db, org, admin_user, bypass_rbac, bypass_webhooks, bypass_analytics
):
    """Creating two courses with the same name in the same org should fail."""
    await create_course(
        request=mock_request,
        course_object=CourseCreate(name="Unique", description="...", public=True),
        current_user=admin_user,
        db_session=db,
    )

    with pytest.raises(Exception) as exc_info:
        await create_course(
            request=mock_request,
            course_object=CourseCreate(name="Unique", description="...", public=True),
            current_user=admin_user,
            db_session=db,
        )
    assert "unique" in str(exc_info.value).lower() or "duplicate" in str(exc_info.value).lower()
```

---

## When NOT to Write Integration Tests

| Situation | Better Approach |
|-----------|----------------|
| Testing simple CRUD logic | Service test (03) — faster, more isolated |
| Testing endpoint wiring | Router test (02) — mocks service layer |
| Testing authz rules | Security test (04) — focused on permissions |
| Testing external API calls | External API template (12) — mock the external service |

Integration tests are **slower and more complex**. Use them only when you need the full stack connected.

---

## Rules Summary

| Rule | Why |
|------|-----|
| Create real DB entities for integration tests | Tests the full persistence layer |
| Mock only external services (S3, Stripe, Resend) | Keeps tests fast and deterministic |
| Test error propagation from service to HTTP | Ensures users see the right error messages |
| Test webhook retry and failure behavior | External services will fail in production |
| Don't use integration tests when a service/router test suffices | Integration tests are slower and more brittle |
