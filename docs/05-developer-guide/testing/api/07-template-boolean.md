# Template: Boolean Toggle

Use this template when adding a **boolean field** that controls visibility, access, or state — such as publish/unpublish, enable/disable, lock/unlock, or feature flag.

---

## Examples

- `published` on Community (the original use case from chat history)
- `locked` on Discussion
- `featured` on Course
- `open_to_contributors` on Course
- `email_verified` on User

---

## Checklist

### Happy Path
- [ ] Admin can set the field to `true` (publish, enable, lock)
- [ ] Admin can set the field to `false` (unpublish, disable, unlock)
- [ ] Admin listing shows the field value in the response
- [ ] Field can be toggled multiple times without error

### Authz Boundary
- [ ] Regular user cannot change the field (403)
- [ ] User from another org cannot change the field (403 or 404)
- [ ] (For publish) Only users with write permission can publish

### Error/Edge Cases
- [ ] Setting an invalid value (e.g., string instead of boolean) returns 422
- [ ] Setting the field on a non-existent resource returns 404
- [ ] (For publish) Publishing an already-published resource is idempotent

### Anonymous Access (Critical for publish/unpublish)
- [ ] Anonymous user **cannot** see resources when the field is `false` (unpublished/disabled)
- [ ] Anonymous user **can** see resources when the field is `true` (published/enabled)
- [ ] Admin can always see resources regardless of field value

---

## Router-Level Template

```python
"""Router tests for publish/unpublish on {domain}."""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from src.core.events.database import get_db_session
from src.security.auth import get_current_user


@pytest.fixture
def app(db, admin_user):
    app = FastAPI()
    app.include_router({domain}_router, prefix="/api/v1/{domain}")
    app.dependency_overrides[get_db_session] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: admin_user
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
async def client(app):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


class Test{Entity}Toggle:
    """Tests for the '{field_name}' boolean toggle on {Entity}."""

    # ── PHASE A: Happy Path ──────────────────────────────────

    async def test_admin_can_set_field_true(self, client):
        """Admin sets {field_name}=true (publish)."""
        with patch(
            "src.routers.{domain}.{module}.update_{entity}",
            new_callable=AsyncMock,
            return_value=_mock_{entity}(**{f"{{'{field_name}': True}}" }),
        ):
            response = await client.put(
                "/api/v1/{domain}/{entity}_test",
                json={{"{field_name}": True}},
            )
        assert response.status_code == 200
        assert response.json()["{field_name}"] is True

    async def test_admin_can_set_field_false(self, client):
        """Admin sets {field_name}=false (unpublish)."""
        with patch(
            "src.routers.{domain}.{module}.update_{entity}",
            new_callable=AsyncMock,
            return_value=_mock_{entity}(**{f"{{'{field_name}': False}}" }),
        ):
            response = await client.put(
                "/api/v1/{domain}/{entity}_test",
                json={{"{field_name}": False}},
            )
        assert response.status_code == 200
        assert response.json()["{field_name}"] is False

    async def test_listing_shows_field_value(self, client):
        """The listing endpoint returns the field value."""
        with patch(
            "src.routers.{domain}.{module}.get_{entities}_by_org",
            new_callable=AsyncMock,
            return_value=[_mock_{entity}(**{f"{{'{field_name}': True}}" })],
        ):
            response = await client.get(
                "/api/v1/{domain}/org/1/page/1/limit/10"
            )
        assert response.status_code == 200
        data = response.json()
        assert data[0]["{field_name}"] is True

    # ── PHASE B: Authz Boundary ─────────────────────────────

    async def test_regular_user_cannot_toggle(
        self, db, regular_user
    ):
        """Regular user gets 403 when trying to toggle the field."""
        app = FastAPI()
        app.include_router({domain}_router, prefix="/api/v1/{domain}")
        app.dependency_overrides[get_db_session] = lambda: db
        app.dependency_overrides[get_current_user] = lambda: regular_user
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.put(
                "/api/v1/{domain}/{entity}_test",
                json={{"{field_name}": True}},
            )
        assert response.status_code == 403
        app.dependency_overrides.clear()

    # ── PHASE C: Error/Edge Cases ───────────────────────────

    async def test_invalid_value_returns_422(self, client):
        """Setting a non-boolean value returns 422."""
        response = await client.put(
            "/api/v1/{domain}/{entity}_test",
            json={{"{field_name}": "not-a-boolean"}},
        )
        assert response.status_code == 422

    async def test_nonexistent_resource_returns_404(self, client):
        """Toggling on a non-existent resource returns 404."""
        with patch(
            "src.routers.{domain}.{module}.update_{entity}",
            new_callable=AsyncMock,
            side_effect=HTTPException(status_code=404, detail="Not found"),
        ):
            response = await client.put(
                "/api/v1/{domain}/nonexistent",
                json={{"{field_name}": True}},
            )
        assert response.status_code == 404

    # ── PHASE D: Anonymous Access ───────────────────────────

    async def test_anonymous_cannot_see_when_false(self, db):
        """Anonymous listing excludes resources with {field_name}=false."""
        app = FastAPI()
        app.include_router({domain}_router, prefix="/api/v1/{domain}")
        app.dependency_overrides[get_db_session] = lambda: db
        app.dependency_overrides[get_current_user] = lambda: AnonymousUser()
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch(
                "src.routers.{domain}.{module}.get_{entities}_by_org",
                new_callable=AsyncMock,
                return_value=[],  # Empty: unpublished resources are hidden
            ):
                response = await client.get(
                    "/api/v1/{domain}/org/1/page/1/limit/10"
                )
        assert response.status_code == 200
        assert len(response.json()) == 0
        app.dependency_overrides.clear()

    async def test_anonymous_can_see_when_true(self, db):
        """Anonymous listing includes resources with {field_name}=true."""
        app = FastAPI()
        app.include_router({domain}_router, prefix="/api/v1/{domain}")
        app.dependency_overrides[get_db_session] = lambda: db
        app.dependency_overrides[get_current_user] = lambda: AnonymousUser()
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            with patch(
                "src.routers.{domain}.{module}.get_{entities}_by_org",
                new_callable=AsyncMock,
                return_value=[_mock_{entity}(**{f"{{'{field_name}': True}}" })],
            ):
                response = await client.get(
                    "/api/v1/{domain}/org/1/page/1/limit/10"
                )
        assert response.status_code == 200
        assert len(response.json()) == 1
        app.dependency_overrides.clear()
```

---

## Service-Level Template

```python
"""Service tests for {field_name} toggle on {Entity}."""


class Test{Entity}ToggleService:

    async def test_toggle_true_updates_database(
        self, db, org, admin_user, {entity}, bypass_rbac, bypass_webhooks
    ):
        """Setting {field_name}=true persists to the database."""
        {entity}.{field_name} = False
        db.commit()

        result = await update_{entity}(
            request=mock_request,
            {entity}_uuid={entity}.{entity}_uuid,
            update_data={{"{field_name}": True}},
            current_user=admin_user,
            db_session=db,
        )
        assert result.{field_name} is True

        # Verify database was updated
        db.refresh({entity})
        assert {entity}.{field_name} is True

    async def test_toggle_is_idempotent(
        self, db, org, admin_user, {entity}, bypass_rbac, bypass_webhooks
    ):
        """Toggling to the same value twice does not error."""
        {entity}.{field_name} = True
        db.commit()

        result = await update_{entity}(
            request=mock_request,
            {entity}_uuid={entity}.{entity}_uuid,
            update_data={{"{field_name}": True}},
            current_user=admin_user,
            db_session=db,
        )
        assert result.{field_name} is True
        # No exception raised
```

---

## Real Codebase Example: Community publish/unpublish

This pattern was applied to the Community model in the project. The flow was:

1. Add `published` column to `Community` model (SQL: `ALTER TABLE community ADD COLUMN published BOOLEAN NOT NULL DEFAULT FALSE`)
2. Add index: `CREATE INDEX ix_community_published ON community (published)`
3. The listing endpoint (`get_communities_by_org`) filters out unpublished communities for anonymous users
4. The update endpoint (`update_community`) accepts `{"published": true/false}` to toggle visibility
5. Tests validated: admin toggle, anonymous filtering, cross-org isolation, and 404 for missing resources

The full test scenarios from that implementation:

```python
# Test 1: Admin lists communities → sees published: false
# Test 2: Admin publishes → published: true
# Test 3: Admin unpublishes → published: false
# Test 4: Anonymous sees nothing when unpublished
# Test 5: Anonymous sees community when published
```
