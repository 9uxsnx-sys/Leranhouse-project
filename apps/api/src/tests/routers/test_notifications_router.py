"""
Router tests for src/routers/notifications.py

Covers: feed, unread count, mark as read, mark all as read, events catalog,
        template save/toggle, announcements CRUD.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from src.core.events.database import get_db_session
from src.routers.notifications import router as notifications_router
from src.security.auth import get_current_user


@pytest.fixture
def app(db, admin_user):
    app = FastAPI()
    app.include_router(notifications_router, prefix="/api/v1")
    app.dependency_overrides[get_db_session] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: admin_user
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
async def client(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


class TestFeedEndpoints:
    async def test_get_feed(self, client):
        response = await client.get("/api/v1/notifications?org_id=1")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "total" in data

    async def test_get_unread_count(self, client):
        response = await client.get("/api/v1/notifications/unread-count?org_id=1")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data

    async def test_mark_as_read_returns_404_for_nonexistent(self, client):
        response = await client.patch("/api/v1/notifications/99999/read")
        assert response.status_code == 404

    async def test_mark_all_as_read(self, client):
        response = await client.post("/api/v1/notifications/read-all?org_id=1")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data


class TestEventsCatalogEndpoints:
    async def test_get_event_catalog(self, client):
        response = await client.get("/api/v1/notifications/events?org_id=1")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            entry = data[0]
            assert "event_type" in entry
            assert "is_enabled" in entry
            assert "is_customized" in entry

    async def test_save_template_override(self, client, db, org):
        response = await client.put(
            "/api/v1/notifications/events/course_completed/template?org_id=1",
            json={
                "title_template": "Custom Title",
                "body_template": "Custom body",
                "link_url": "https://example.com",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # Verify the override was saved
        from src.db.notifications import NotificationTemplate
        from sqlmodel import select

        row = db.exec(
            select(NotificationTemplate).where(
                NotificationTemplate.org_id == org.id,
                NotificationTemplate.event_type == "course_completed",
            )
        ).first()
        assert row is not None
        assert row.title_template == "Custom Title"

    async def test_update_existing_override(self, client, db, org):
        from src.db.notifications import NotificationTemplate
        from sqlmodel import select

        existing = NotificationTemplate(
            org_id=org.id,
            event_type="course_completed",
            category="Learning Progress",
            title_template="Original",
        )
        db.add(existing)
        db.commit()

        response = await client.put(
            "/api/v1/notifications/events/course_completed/template?org_id=1",
            json={"title_template": "Updated Title"},
        )
        assert response.status_code == 200

        row = db.exec(
            select(NotificationTemplate).where(
                NotificationTemplate.org_id == org.id,
                NotificationTemplate.event_type == "course_completed",
            )
        ).first()
        assert row.title_template == "Updated Title"

    async def test_toggle_event(self, client, db, org):
        response = await client.put(
            "/api/v1/notifications/events/course_completed/toggle?org_id=1",
            json={"is_enabled": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_enabled"] is False

    async def test_toggle_existing_event(self, client, db, org):
        from src.db.notifications import NotificationTemplate

        existing = NotificationTemplate(
            org_id=org.id,
            event_type="course_completed",
            category="Learning Progress",
            is_enabled=True,
        )
        db.add(existing)
        db.commit()

        response = await client.put(
            "/api/v1/notifications/events/course_completed/toggle?org_id=1",
            json={"is_enabled": False},
        )
        assert response.status_code == 200


class TestAnnouncementEndpoints:
    async def test_create_announcement(self, client, db, org, admin_user):
        response = await client.post(
            "/api/v1/notifications/announcements?org_id=1",
            json={
                "title": "Test Announcement",
                "body": "This is a test announcement.",
                "recipient_user_ids": [admin_user.id],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["recipient_count"] == 1
        assert "notification_id" in data

    async def test_create_announcement_missing_recipients(self, client):
        response = await client.post(
            "/api/v1/notifications/announcements?org_id=1",
            json={
                "title": "Test",
                "body": "Body",
                "recipient_user_ids": [],
            },
        )
        assert response.status_code == 400
        assert "recipient" in response.json()["detail"].lower()

    async def test_list_announcements(self, client, db, org, admin_user):
        # Create one announcement first
        from src.services.notifications.service import create_announcement

        create_announcement(
            org_id=org.id,
            title="Existing Ann",
            body="Existing body",
            recipient_user_ids=[admin_user.id],
            db_session=db,
        )
        db.commit()

        response = await client.get("/api/v1/notifications/announcements?org_id=1")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert data["announcements"][0]["title"] == "Existing Ann"

    async def test_list_announcements_pagination(self, client):
        response = await client.get(
            "/api/v1/notifications/announcements?org_id=1&page=1&limit=5"
        )
        assert response.status_code == 200
