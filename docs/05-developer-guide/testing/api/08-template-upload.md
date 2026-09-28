# Template: File Upload

Use this template when adding an endpoint that accepts file uploads — thumbnails, documents, content files, avatars, etc.

---

## Examples

- Community thumbnail upload
- Course thumbnail upload (image or video)
- User avatar upload
- Content file upload (PDF, DOCX)
- Bulk import file upload (CSV, JSON)

---

## Checklist

### Happy Path
- [ ] Upload a valid file (PNG, JPG, PDF) returns 200 with the file URL/identifier
- [ ] The returned URL/identifier points to the stored file
- [ ] Listing the resource shows the file URL/identifier
- [ ] Replacing an existing file returns 200 with the new URL

### Error/Edge Cases
- [ ] Upload without a file (missing multipart field) returns 200 or 400 (depends on endpoint design)
- [ ] Upload with an unsupported file type returns 400/422
- [ ] Upload with an oversized file returns 400/413
- [ ] Upload to a non-existent resource returns 404
- [ ] Upload with invalid org_id returns 404

### Authz Boundary
- [ ] Regular user cannot upload to a resource they don't own (403)
- [ ] User from another org cannot upload (403 or 404)
- [ ] Anonymous user cannot upload (401)

---

## Router-Level Template

```python
from io import BytesIO
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


def _upload_file(filename="test.png", content=b"fake-image", mime="image/png"):
    return (filename, BytesIO(content), mime)


class Test{Entity}Upload:

    async def test_upload_valid_file(self, client, db, org, admin_user):
        """Upload a valid image file returns 200 with the new URL."""
        # Create the resource in DB first
        {entity} = {Entity}(id=1, name="Test", org_id=org.id, ...)
        db.add({entity})
        db.commit()

        with patch(
            "src.routers.{domain}.{module}.check_resource_access",
            new_callable=AsyncMock,
        ):
            with patch(
                "src.routers.{domain}.{module}.upload_{entity}_file",
                new_callable=AsyncMock,
                return_value="https://cdn.example.com/new-file.png",
            ):
                response = await client.put(
                    "/api/v1/{domain}/{entity}_uuid/file",
                    files={{"file": _upload_file()}},
                )
        assert response.status_code == 200
        assert "new-file.png" in response.json()["file_url"]

    async def test_upload_no_file(self, client):
        """Upload without a file is handled gracefully."""
        with patch(
            "src.routers.{domain}.{module}.check_resource_access",
            new_callable=AsyncMock,
        ):
            response = await client.put(
                "/api/v1/{domain}/{entity}_uuid/file"
            )
        # Depends on endpoint design: 200 (no-op) or 400 (missing file)
        assert response.status_code in (200, 400)

    async def test_upload_nonexistent_resource(self, client):
        """Uploading to a non-existent resource returns 404."""
        with patch(
            "src.routers.{domain}.{module}.check_resource_access",
            new_callable=AsyncMock,
        ):
            response = await client.put(
                "/api/v1/{domain}/nonexistent/file",
                files={{"file": _upload_file()}},
            )
        assert response.status_code == 404

    async def test_anonymous_cannot_upload(self, db):
        """Anonymous user cannot upload files."""
        app = FastAPI()
        app.include_router({domain}_router, prefix="/api/v1/{domain}")
        app.dependency_overrides[get_db_session] = lambda: db
        app.dependency_overrides[get_current_user] = lambda: AnonymousUser()
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.put(
                "/api/v1/{domain}/{entity}_uuid/file",
                files={{"file": _upload_file()}},
            )
        assert response.status_code == 401
        app.dependency_overrides.clear()
```

---

## Real Codebase Example

From [test_communities_router.py](../../../../../apps/api/src/tests/routers/test_communities_router.py), lines 231-289:

```python
async def test_community_thumbnail_endpoint_branches(self, client, db, org, admin_user):
    community = Community(
        id=21, name="Community With Thumb", ...,
        thumbnail_image="old-thumb.png", org_id=org.id,
        community_uuid="community_thumb",
    )
    db.add(community)
    db.commit()

    with patch("src.routers.communities.communities.check_resource_access",
               new_callable=AsyncMock), \
         patch("src.routers.communities.communities.upload_community_thumbnail",
               new_callable=AsyncMock, return_value="new-thumb.png"):
        response = await client.put(
            "/api/v1/communities/community_thumb/thumbnail",
            files={{"thumbnail": _upload_file()}},
        )
    assert response.status_code == 200
    assert response.json()["thumbnail_image"] == "new-thumb.png"
```
