# Template: CRUD Resource

Use this template when adding a **new domain entity** that requires full Create, Read, Update, and Delete operations via the API.

---

## Examples

- Adding a `Discussion` model with CRUD endpoints
- Adding a `Playground` model with full management
- Adding a `Certificate` model with issue/revoke

---

## Checklist

### Happy Path
- [ ] Admin can CREATE the resource (`POST` → 200/201)
- [ ] Admin can LIST resources (`GET` → 200 with paginated results)
- [ ] Admin can GET a single resource by UUID (`GET /{uuid}` → 200)
- [ ] Admin can UPDATE the resource (`PUT /{uuid}` → 200)
- [ ] Admin can DELETE the resource (`DELETE /{uuid}` → 200)

### Authz Boundary
- [ ] Regular user with read permission can LIST and GET
- [ ] Regular user cannot CREATE, UPDATE, or DELETE (403)
- [ ] User from another org cannot access the resource (403 or 404)

### Error/Edge Cases
- [ ] GET non-existent UUID returns 404
- [ ] DELETE non-existent UUID returns 404
- [ ] CREATE with invalid data returns 422
- [ ] UPDATE with invalid data returns 422
- [ ] CREATE with duplicate unique field returns 400/409

### Anonymous Access
- [ ] Anonymous user cannot access private resources (401)
- [ ] Anonymous user can access public resources

---

## Router-Level Template

```python
"""Router tests for src/routers/{domain}/{router}.py."""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI, HTTPException
from httpx import ASGITransport, AsyncClient

from src.core.events.database import get_db_session
from src.security.auth import get_current_user


@pytest.fixture
def app(db, admin_user):
    app = FastAPI()
    app.include_router(
        {domain}_router, prefix="/api/v1/{domain}"
    )
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


def _mock_{entity}(**overrides):
    """Build a minimal {Entity}Read for mocked service returns."""
    data = dict(
        id=1,
        name="Test {Entity}",
        description="A test {entity}",
        org_id=1,
        {entity}_uuid="{entity}_test",
        creation_date="2024-01-01",
        update_date="2024-01-01",
    )
    data.update(overrides)
    return {Entity}Read(**data)


class Test{Entity}Router:
    """PHASE A: Happy Path CRUD"""

    async def test_create_{entity}(self, client):
        with patch(
            "src.routers.{domain}.{module}.create_{entity}",
            new_callable=AsyncMock,
            return_value=_mock_{entity}(),
        ):
            response = await client.post(
                "/api/v1/{domain}/?org_id=1",
                json={{"name": "Test {Entity}", "description": "A test {entity}"}},
            )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test {Entity}"

    async def test_list_{entities}(self, client):
        with patch(
            "src.routers.{domain}.{module}.get_{entities}_by_org",
            new_callable=AsyncMock,
            return_value=[_mock_{entity}()],
        ):
            response = await client.get(
                "/api/v1/{domain}/org/1/page/1/limit/10"
            )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_get_{entity}(self, client):
        with patch(
            "src.routers.{domain}.{module}.get_{entity}",
            new_callable=AsyncMock,
            return_value=_mock_{entity}(),
        ):
            response = await client.get(
                "/api/v1/{domain}/{entity}_test"
            )
        assert response.status_code == 200
        assert response.json()["name"] == "Test {Entity}"

    async def test_update_{entity}(self, client):
        with patch(
            "src.routers.{domain}.{module}.update_{entity}",
            new_callable=AsyncMock,
            return_value=_mock_{entity}(name="Updated"),
        ):
            response = await client.put(
                "/api/v1/{domain}/{entity}_test",
                json={{"name": "Updated"}},
            )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated"

    async def test_delete_{entity}(self, client):
        with patch(
            "src.routers.{domain}.{module}.delete_{entity}",
            new_callable=AsyncMock,
            return_value={{"deleted": True}},
        ):
            response = await client.delete(
                "/api/v1/{domain}/{entity}_test"
            )
        assert response.status_code == 200
        assert response.json()["deleted"] is True

    """PHASE B: Authz Boundary"""

    async def test_regular_user_cannot_create(
        self, db, regular_user
    ):
        """Override app with regular_user to test permission denial."""
        app = FastAPI()
        app.include_router(
            {domain}_router, prefix="/api/v1/{domain}"
        )
        app.dependency_overrides[get_db_session] = lambda: db
        app.dependency_overrides[get_current_user] = lambda: regular_user
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/{domain}/?org_id=1",
                json={{"name": "Test"}},
            )
        assert response.status_code == 403
        app.dependency_overrides.clear()

    """PHASE C: Error/Edge Cases"""

    async def test_get_nonexistent(self, client):
        with patch(
            "src.routers.{domain}.{module}.get_{entity}",
            new_callable=AsyncMock,
            side_effect=HTTPException(status_code=404, detail="Not found"),
        ):
            response = await client.get(
                "/api/v1/{domain}/nonexistent"
            )
        assert response.status_code == 404

    """PHASE D: Anonymous Access"""

    async def test_anonymous_cannot_create(self, db):
        app = FastAPI()
        app.include_router(
            {domain}_router, prefix="/api/v1/{domain}"
        )
        app.dependency_overrides[get_db_session] = lambda: db
        app.dependency_overrides[get_current_user] = lambda: AnonymousUser()
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/{domain}/?org_id=1",
                json={{"name": "Test"}},
            )
        assert response.status_code == 401
        app.dependency_overrides.clear()
```

---

## Service-Level Template

```python
"""Service tests for src/services/{domain}/{service}.py."""
import pytest
from fastapi import HTTPException

from src.services.{domain}.{service} import (
    create_{entity}, get_{entity}, update_{entity}, delete_{entity},
)


class Test{Entity}Service:

    async def test_create_{entity}_succeeds(
        self, db, org, admin_user, bypass_rbac, bypass_webhooks, bypass_analytics
    ):
        result = await create_{entity}(
            request=mock_request,
            {entity}_data={{...}},
            current_user=admin_user,
            db_session=db,
        )
        assert result.name == "Test {Entity}"
        assert result.org_id == org.id

    async def test_cross_org_isolation(
        self, db, org, other_org, regular_user, bypass_rbac
    ):
        """User from org cannot access other_org's {entity}."""
        with pytest.raises(HTTPException) as exc:
            await get_{entity}(
                request=mock_request,
                {entity}_uuid="other_org_{entity}_uuid",
                current_user=regular_user,
                db_session=db,
            )
        assert exc.value.status_code == 403

    async def test_get_nonexistent_returns_404(
        self, db, org, admin_user, bypass_rbac
    ):
        with pytest.raises(HTTPException) as exc:
            await get_{entity}(
                request=mock_request,
                {entity}_uuid="nonexistent",
                current_user=admin_user,
                db_session=db,
            )
        assert exc.value.status_code == 404
```
