"""
Tests for src/services/notifications/service.py

Covers: notify, create_notification, create_announcement, get_notification_feed,
        get_announcements, get_unread_count, mark_as_read, mark_all_as_read,
        audience resolvers, _build_params.
"""

from unittest.mock import patch

import pytest
from sqlmodel import select

from src.db.notifications import Notification, NotificationRecipient
from src.db.users import User
from src.services.notifications.service import (
    AUDIENCE_RULES,
    _build_params,
    _resolve_assignment_student,
    _resolve_certificate_student,
    _resolve_course_enrolled_users,
    _resolve_enrolled_student,
    create_announcement,
    create_notification,
    get_announcements,
    get_notification_feed,
    get_unread_count,
    mark_all_as_read,
    mark_as_read,
    notify,
)


class TestResolveEnrolledStudent:
    def test_uses_flat_user_id(self, db, org, admin_user):
        user_ids = _resolve_enrolled_student(
            {"user_id": admin_user.id}, db
        )
        assert user_ids == [admin_user.id]

    def test_falls_back_to_user_uuid(self, db, org, admin_user):
        user_ids = _resolve_enrolled_student(
            {"user": {"user_uuid": admin_user.user_uuid}}, db
        )
        assert user_ids == [admin_user.id]

    def test_returns_empty_for_missing_data(self, db):
        assert _resolve_enrolled_student({}, db) == []


class TestResolveAssignmentStudent:
    def test_uses_flat_user_id(self, db, org, admin_user):
        user_ids = _resolve_assignment_student(
            {"user_id": admin_user.id}, db
        )
        assert user_ids == [admin_user.id]

    def test_returns_empty_for_missing_data(self, db):
        assert _resolve_assignment_student({}, db) == []


class TestResolveCertificateStudent:
    def test_uses_flat_user_id(self, db, org, admin_user):
        user_ids = _resolve_certificate_student(
            {"user_id": admin_user.id}, db
        )
        assert user_ids == [admin_user.id]

    def test_returns_empty_for_missing_data(self, db):
        assert _resolve_certificate_student({}, db) == []


class TestResolveCourseEnrolledUsers:
    def test_returns_empty_without_course_uuid(self, db):
        assert _resolve_course_enrolled_users({}, db) == []


class TestBuildParams:
    def test_uses_course_name(self):
        params = _build_params("course_completed", {"course_name": "Math 101"})
        assert params["course_name"] == "Math 101"

    def test_falls_back_to_name_key(self):
        params = _build_params("course_completed", {"name": "Physics 101"})
        assert params["course_name"] == "Physics 101"

    def test_extracts_grade(self):
        params = _build_params("assignment_graded", {"grade": 85})
        assert params["grade"] == 85

    def test_does_not_store_sensitive_fields(self):
        params = _build_params("user_signed_up", {"password": "secret"})
        assert "password" not in params

    def test_extracts_course_subobject(self):
        params = _build_params(
            "course_completed",
            {"course": {"id": 1, "name": "Python"}, "course_name": "Python"},
        )
        assert params.get("course", {}).get("name") == "Python"


class TestCreateNotification:
    def test_creates_notification_with_recipients(self, db, org, admin_user):
        note = create_notification(
            org_id=org.id,
            event_type="test_event",
            category="Test",
            params={"key": "value"},
            recipient_user_ids=[admin_user.id],
            title="Test Title",
            body="Test body",
            source="system",
            db_session=db,
        )
        db.commit()

        assert note is not None
        assert note.title == "Test Title"
        assert note.body == "Test body"
        assert note.event_type == "test_event"
        assert note.source == "system"

        # Check recipient
        recipients = db.exec(
            select(NotificationRecipient).where(
                NotificationRecipient.notification_id == note.id
            )
        ).all()
        assert len(recipients) == 1
        assert recipients[0].user_id == admin_user.id

    def test_multiple_recipients(self, db, org, admin_user, regular_user):
        note = create_notification(
            org_id=org.id,
            event_type="broadcast",
            category="Broadcast",
            params={},
            recipient_user_ids=[admin_user.id, regular_user.id],
            title="Broadcast",
            body="To everyone",
            db_session=db,
        )
        db.commit()

        recipients = db.exec(
            select(NotificationRecipient).where(
                NotificationRecipient.notification_id == note.id
            )
        ).all()
        assert len(recipients) == 2

    def test_announcement_source_default(self, db, org, admin_user):
        note = create_notification(
            org_id=org.id,
            event_type="announcement",
            category="Announcement",
            params={},
            recipient_user_ids=[admin_user.id],
            title="Ann",
            body="Body",
            db_session=db,
        )
        db.commit()
        assert note.source == "announcement"


class TestNotify:
    def test_sends_notification_for_registered_event(self, db, org, admin_user):
        notify(
            "course_completed",
            org.id,
            {"user_id": admin_user.id, "course_name": "Math 101"},
            db_session=db,
        )
        db.commit()

        notes = db.exec(select(Notification)).all()
        assert len(notes) == 1
        assert notes[0].title == "Course Completed"
        assert "Math 101" in notes[0].body

    def test_no_notification_for_unregistered_event(self, db, org):
        notify("ping", org.id, {}, db_session=db)
        db.commit()

        notes = db.exec(select(Notification)).all()
        assert len(notes) == 0

    def test_no_notification_when_disabled(self, db, org, admin_user):
        from src.db.notifications import NotificationTemplate

        override = NotificationTemplate(
            org_id=org.id,
            event_type="course_completed",
            category="Learning Progress",
            is_enabled=False,
        )
        db.add(override)
        db.commit()

        notify(
            "course_completed",
            org.id,
            {"user_id": admin_user.id, "course_name": "Math 101"},
            db_session=db,
        )
        db.commit()

        notes = db.exec(select(Notification)).all()
        assert len(notes) == 0

    def test_notification_uses_org_template_override(self, db, org, admin_user):
        from src.db.notifications import NotificationTemplate

        override = NotificationTemplate(
            org_id=org.id,
            event_type="course_completed",
            category="Learning Progress",
            title_template="Custom: {{course_name}}",
            body_template="Great job on {{course_name}}!",
        )
        db.add(override)
        db.commit()

        notify(
            "course_completed",
            org.id,
            {"user_id": admin_user.id, "course_name": "Algebra"},
            db_session=db,
        )
        db.commit()

        notes = db.exec(select(Notification)).all()
        assert len(notes) == 1
        assert notes[0].title == "Custom: Algebra"
        assert notes[0].body == "Great job on Algebra!"


class TestCreateAnnouncement:
    def test_creates_announcement(self, db, org, admin_user):
        note = create_announcement(
            org_id=org.id,
            title="System Maintenance",
            body="The platform will be down tonight.",
            recipient_user_ids=[admin_user.id],
            db_session=db,
        )
        db.commit()

        assert note is not None
        assert note.title == "System Maintenance"
        assert note.source == "announcement"
        assert note.event_type == "announcement"

    def test_announcement_has_recipients(self, db, org, admin_user):
        note = create_announcement(
            org_id=org.id,
            title="Test",
            body="Test body",
            recipient_user_ids=[admin_user.id],
            db_session=db,
        )
        db.commit()

        recipients = db.exec(
            select(NotificationRecipient).where(
                NotificationRecipient.notification_id == note.id
            )
        ).all()
        assert len(recipients) == 1


class TestGetNotificationFeed:
    def test_returns_empty_feed_for_new_user(self, db, org, admin_user):
        feed = get_notification_feed(admin_user.id, org.id, db_session=db)
        assert feed["total"] == 0
        assert feed["notifications"] == []

    def test_returns_notifications(self, db, org, admin_user):
        create_notification(
            org_id=org.id,
            event_type="test",
            category="Test",
            params={},
            recipient_user_ids=[admin_user.id],
            title="Notif 1",
            body="Body 1",
            db_session=db,
        )
        db.commit()

        feed = get_notification_feed(admin_user.id, org.id, db_session=db)
        assert feed["total"] == 1
        assert feed["notifications"][0]["title"] == "Notif 1"

    def test_feed_contains_title_and_body(self, db, org, admin_user):
        create_notification(
            org_id=org.id,
            event_type="test",
            category="Test",
            params={},
            recipient_user_ids=[admin_user.id],
            title="Hello World",
            body="This is the body",
            db_session=db,
        )
        db.commit()

        feed = get_notification_feed(admin_user.id, org.id, db_session=db)
        n = feed["notifications"][0]
        assert n["title"] == "Hello World"
        assert n["body"] == "This is the body"
        assert n["source"] is not None

    def test_does_not_return_other_users_notifications(self, db, org, admin_user, regular_user):
        create_notification(
            org_id=org.id,
            event_type="test",
            category="Test",
            params={},
            recipient_user_ids=[regular_user.id],
            title="For Regular",
            body="Secret",
            db_session=db,
        )
        db.commit()

        feed = get_notification_feed(admin_user.id, org.id, db_session=db)
        assert feed["total"] == 0


class TestGetAnnouncements:
    def test_returns_empty_when_no_announcements(self, db, org):
        result = get_announcements(org.id, db_session=db)
        assert result["total"] == 0
        assert result["announcements"] == []

    def test_returns_announcements(self, db, org, admin_user):
        create_announcement(
            org_id=org.id,
            title="Announcement 1",
            body="Body 1",
            recipient_user_ids=[admin_user.id],
            db_session=db,
        )
        db.commit()

        result = get_announcements(org.id, db_session=db)
        assert result["total"] == 1
        assert result["announcements"][0]["title"] == "Announcement 1"

    def test_announcements_have_title_and_body(self, db, org, admin_user):
        create_announcement(
            org_id=org.id,
            title="Maintenance",
            body="Downtime tonight",
            recipient_user_ids=[admin_user.id],
            db_session=db,
        )
        db.commit()

        result = get_announcements(org.id, db_session=db)
        a = result["announcements"][0]
        assert a["title"] == "Maintenance"
        assert a["body"] == "Downtime tonight"

    def test_org_isolation(self, db, org, other_org, admin_user):
        create_announcement(
            org_id=org.id,
            title="Org 1 Ann",
            body="Org 1",
            recipient_user_ids=[admin_user.id],
            db_session=db,
        )
        db.commit()

        result_org2 = get_announcements(other_org.id, db_session=db)
        assert result_org2["total"] == 0


class TestUnreadCount:
    def test_zero_when_all_read(self, db, org, admin_user):
        count = get_unread_count(admin_user.id, org.id, db_session=db)
        assert count == 0

    def test_counts_unread(self, db, org, admin_user):
        create_notification(
            org_id=org.id,
            event_type="test",
            category="Test",
            params={},
            recipient_user_ids=[admin_user.id],
            title="Unread",
            body="Body",
            db_session=db,
        )
        db.commit()

        count = get_unread_count(admin_user.id, org.id, db_session=db)
        assert count == 1


class TestMarkAsRead:
    def test_mark_single_as_read(self, db, org, admin_user):
        note = create_notification(
            org_id=org.id,
            event_type="test",
            category="Test",
            params={},
            recipient_user_ids=[admin_user.id],
            title="Read me",
            body="Body",
            db_session=db,
        )
        db.commit()

        recipients = db.exec(
            select(NotificationRecipient).where(
                NotificationRecipient.notification_id == note.id
            )
        ).all()
        recipient_id = recipients[0].id

        result = mark_as_read(recipient_id, admin_user.id, db_session=db)
        assert result is True

        count = get_unread_count(admin_user.id, org.id, db_session=db)
        assert count == 0

    def test_returns_false_for_nonexistent(self, db, org, admin_user):
        result = mark_as_read(99999, admin_user.id, db_session=db)
        assert result is False


class TestMarkAllAsRead:
    def test_mark_all_as_read(self, db, org, admin_user):
        create_notification(
            org_id=org.id,
            event_type="test",
            category="Test",
            params={},
            recipient_user_ids=[admin_user.id],
            title="N1",
            body="B1",
            db_session=db,
        )
        create_notification(
            org_id=org.id,
            event_type="test",
            category="Test",
            params={},
            recipient_user_ids=[admin_user.id],
            title="N2",
            body="B2",
            db_session=db,
        )
        db.commit()

        count = mark_all_as_read(admin_user.id, org.id, db_session=db)
        assert count == 2

        unread = get_unread_count(admin_user.id, org.id, db_session=db)
        assert unread == 0
