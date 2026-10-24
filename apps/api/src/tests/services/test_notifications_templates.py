"""
Tests for src/services/notifications/templates.py

Covers: render_template, _flatten_params, get_effective_template,
        render_notification, get_event_catalog.
"""

from unittest.mock import patch

import pytest

from src.db.notifications import NotificationTemplate
from src.services.notifications.templates import (
    DEFAULT_TEMPLATES,
    get_effective_template,
    get_event_catalog,
    render_notification,
    render_template,
)


class TestRenderTemplate:
    def test_replaces_simple_placeholder(self):
        result = render_template("Hello {{name}}!", {"name": "Alice"})
        assert result == "Hello Alice!"

    def test_replaces_multiple_placeholders(self):
        result = render_template(
            "{{greeting}}, {{name}}! Score: {{score}}",
            {"greeting": "Hi", "name": "Bob", "score": 95},
        )
        assert result == "Hi, Bob! Score: 95"

    def test_leaves_unknown_placeholder_unchanged(self):
        result = render_template("Hello {{unknown}}!", {"name": "Alice"})
        assert result == "Hello {{unknown}}!"

    def test_flattens_nested_params(self):
        result = render_template(
            "Course: {{course_name}}",
            {"course": {"name": "Python 101"}, "course_name": "Python 101"},
        )
        assert result == "Course: Python 101"

    def test_handles_empty_template(self):
        assert render_template("", {}) == ""

    def test_handles_no_placeholders(self):
        assert render_template("Plain text", {}) == "Plain text"

    def test_none_value_leaves_placeholder(self):
        result = render_template("Hello {{name}}!", {"name": None})
        assert result == "Hello {{name}}!"


class TestGetEffectiveTemplate:
    def test_returns_builtin_when_no_db_rows(self, db, org):
        tmpl = get_effective_template(org.id, "course_completed", db)
        assert tmpl is not None
        assert tmpl["title"] == "Course Completed"
        assert tmpl["is_enabled"] is True

    def test_returns_none_for_event_without_template(self, db, org):
        tmpl = get_effective_template(org.id, "ping", db)
        assert tmpl is None

    def test_org_override_takes_precedence(self, db, org):
        override = NotificationTemplate(
            org_id=org.id,
            event_type="course_completed",
            category="Learning Progress",
            title_template="Override Title",
            body_template="Override body",
        )
        db.add(override)
        db.commit()

        tmpl = get_effective_template(org.id, "course_completed", db)
        assert tmpl["title"] == "Override Title"
        assert tmpl["body"] == "Override body"

    def test_platform_default_used_when_no_org_override(self, db, org):
        platform = NotificationTemplate(
            org_id=None,
            event_type="course_completed",
            category="Learning Progress",
            title_template="Platform Default Title",
            body_template="Platform default body",
        )
        db.add(platform)
        db.commit()

        tmpl = get_effective_template(org.id, "course_completed", db)
        assert tmpl["title"] == "Platform Default Title"

    def test_disabled_org_override_returns_disabled(self, db, org):
        override = NotificationTemplate(
            org_id=org.id,
            event_type="course_completed",
            category="Learning Progress",
            title_template="Override",
            is_enabled=False,
        )
        db.add(override)
        db.commit()

        tmpl = get_effective_template(org.id, "course_completed", db)
        assert tmpl is not None
        assert tmpl["is_enabled"] is False
        assert tmpl["title"] is None


class TestRenderNotification:
    def test_renders_builtin_template(self, db, org):
        title, body, category, link_url, is_enabled = render_notification(
            org.id, "course_completed", {"course_name": "Python 101"}, db
        )
        assert title == "Course Completed"
        assert "Python 101" in body
        assert is_enabled is True

    def test_returns_none_for_unknown_event(self, db, org):
        result = render_notification(org.id, "ping", {}, db)
        assert result == (None, None, None, None, False)

    def test_disabled_event_returns_disabled(self, db, org):
        override = NotificationTemplate(
            org_id=org.id,
            event_type="course_completed",
            category="Learning Progress",
            is_enabled=False,
        )
        db.add(override)
        db.commit()

        title, body, category, link_url, is_enabled = render_notification(
            org.id, "course_completed", {"course_name": "Python 101"}, db
        )
        assert is_enabled is False
        assert title is None

    def test_renders_org_override(self, db, org):
        override = NotificationTemplate(
            org_id=org.id,
            event_type="course_completed",
            category="Learning Progress",
            title_template="Custom: {{course_name}}",
            body_template="Well done on {{course_name}}!",
        )
        db.add(override)
        db.commit()

        title, body, _, _, is_enabled = render_notification(
            org.id, "course_completed", {"course_name": "Math 101"}, db
        )
        assert title == "Custom: Math 101"
        assert body == "Well done on Math 101!"
        assert is_enabled is True


class TestGetEventCatalog:
    def test_returns_all_events(self, db, org):
        catalog = get_event_catalog(org.id, db)
        assert len(catalog) == len(DEFAULT_TEMPLATES)
        event_types = [e["event_type"] for e in catalog]
        assert "course_completed" in event_types
        assert "ping" in event_types

    def test_catalog_entries_have_required_keys(self, db, org):
        catalog = get_event_catalog(org.id, db)
        for entry in catalog:
            assert "event_type" in entry
            assert "category" in entry
            assert "description" in entry
            assert "is_enabled" in entry
            assert "is_customized" in entry

    def test_catalog_reflects_org_override(self, db, org):
        override = NotificationTemplate(
            org_id=org.id,
            event_type="course_completed",
            category="Learning Progress",
            title_template="Custom Title",
        )
        db.add(override)
        db.commit()

        catalog = get_event_catalog(org.id, db)
        entry = next(e for e in catalog if e["event_type"] == "course_completed")
        assert entry["is_customized"] is True
        assert entry["title_template"] == "Custom Title"

    def test_catalog_org_isolation(self, db, org, other_org):
        """Override in one org should not affect another org's catalog."""
        override = NotificationTemplate(
            org_id=org.id,
            event_type="course_completed",
            category="Learning Progress",
            title_template="Org 1 Title",
        )
        db.add(override)
        db.commit()

        org1_entry = next(
            e for e in get_event_catalog(org.id, db)
            if e["event_type"] == "course_completed"
        )
        org2_entry = next(
            e for e in get_event_catalog(other_org.id, db)
            if e["event_type"] == "course_completed"
        )

        assert org1_entry["is_customized"] is True
        assert org2_entry["is_customized"] is False
