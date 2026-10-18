"""Service tests for course access management (learner inventory)."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from sqlmodel import select

from src.db.trail_runs import TrailRun
from src.db.trail_steps import TrailStep
from src.db.trails import Trail
from src.services.courses.access import (
    bulk_enroll_course_users,
    bulk_unenroll_course_users,
    list_course_access_users,
)

COURSE_UUID = "course_test"


def _make_trail(db, org, user_id: int) -> Trail:
    trail = Trail(
        org_id=org.id,
        user_id=user_id,
        trail_uuid=f"trail_{user_id}",
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(trail)
    db.commit()
    db.refresh(trail)
    return trail


def _make_run(db, org, course, trail: Trail, user_id: int) -> TrailRun:
    run = TrailRun(
        trail_id=trail.id,
        course_id=course.id,
        org_id=org.id,
        user_id=user_id,
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@pytest.fixture
def authorized():
    with patch(
        "src.services.courses.access.check_resource_access",
        new_callable=AsyncMock,
    ) as mock:
        yield mock


class TestCourseAccessUsers:
    async def test_lists_enrolled_and_available_separately(
        self, db, org, course, admin_user, regular_user, authorized, mock_request
    ):
        trail = _make_trail(db, org, regular_user.id)
        _make_run(db, org, course, trail, regular_user.id)

        enrolled = await list_course_access_users(
            mock_request, COURSE_UUID, admin_user, db, list_filter="enrolled"
        )
        assert enrolled["total"] == 1
        assert enrolled["items"][0]["user"]["username"] == "regular"
        assert enrolled["items"][0]["enrolled_at"] is not None
        assert enrolled["items"][0]["role"]["name"] == "User"

        available = await list_course_access_users(
            mock_request, COURSE_UUID, admin_user, db, list_filter="available"
        )
        assert available["total"] == 1
        assert available["items"][0]["user"]["username"] == "admin"

    async def test_search_filters_available_users(
        self, db, org, course, admin_user, regular_user, authorized, mock_request
    ):
        result = await list_course_access_users(
            mock_request,
            COURSE_UUID,
            admin_user,
            db,
            list_filter="available",
            search="regu",
        )
        assert result["total"] == 1
        assert result["items"][0]["user"]["username"] == "regular"

    async def test_bulk_enroll_is_idempotent(
        self, db, org, course, admin_user, regular_user, authorized, mock_request
    ):
        first = await bulk_enroll_course_users(
            mock_request, COURSE_UUID, [regular_user.id], admin_user, db
        )
        assert first == {"enrolled": [regular_user.id], "already_enrolled": [], "skipped": []}

        second = await bulk_enroll_course_users(
            mock_request, COURSE_UUID, [regular_user.id], admin_user, db
        )
        assert second == {
            "enrolled": [],
            "already_enrolled": [regular_user.id],
            "skipped": [],
        }

    async def test_bulk_enroll_skips_non_members(
        self, db, org, course, admin_user, authorized, mock_request
    ):
        result = await bulk_enroll_course_users(
            mock_request, COURSE_UUID, [999], admin_user, db
        )
        assert result["skipped"] == [999]

    async def test_bulk_unenroll_removes_run_and_progress(
        self, db, org, course, admin_user, regular_user, authorized, mock_request
    ):
        trail = _make_trail(db, org, regular_user.id)
        run = _make_run(db, org, course, trail, regular_user.id)
        step = TrailStep(
            complete=True,
            teacher_verified=False,
            grade="0",
            trailrun_id=run.id,
            trail_id=trail.id,
            course_id=course.id,
            org_id=org.id,
            user_id=regular_user.id,
            creation_date=str(datetime.now()),
            update_date=str(datetime.now()),
        )
        db.add(step)
        db.commit()

        result = await bulk_unenroll_course_users(
            mock_request, COURSE_UUID, [regular_user.id], admin_user, db
        )
        assert result == {"removed": [regular_user.id], "not_enrolled": []}

        assert db.exec(
            select(TrailRun).where(TrailRun.user_id == regular_user.id)
        ).all() == []
        assert db.exec(
            select(TrailStep).where(TrailStep.user_id == regular_user.id)
        ).all() == []

        again = await bulk_unenroll_course_users(
            mock_request, COURSE_UUID, [regular_user.id], admin_user, db
        )
        assert again == {"removed": [], "not_enrolled": [regular_user.id]}

    async def test_unknown_course_returns_404(
        self, db, org, admin_user, authorized, mock_request
    ):
        with pytest.raises(HTTPException) as exc:
            await list_course_access_users(
                mock_request, "course_missing", admin_user, db
            )
        assert exc.value.status_code == 404
