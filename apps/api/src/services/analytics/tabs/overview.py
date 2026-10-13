"""Overview tab — "is the platform healthy right now?" (org-wide).

Metric map: docs/08-features/analytics/implementation-plan.md §4 → Overview.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, text

from src.services.analytics.tabs._common import completion_by_course_rows
from src.services.analytics.tabs._shared import (
    bars_card,
    bucket_expr,
    bucket_key,
    bucket_starts,
    date_bounds,
    has_date,
    merge_series,
    parse_range,
    ranked_card,
    trend_card,
)

RUN_TYPE_COURSE = "RUN_TYPE_COURSE"
STATUS_COMPLETED = "STATUS_COMPLETED"


def _rows(session: Session, sql: str, params: dict[str, Any]) -> list[Any]:
    return list(session.exec(text(sql), params=params).all())


def board(
    session: Session,
    org_id: int,
    range_token: str | None,
    entity: str = "all",
    q: str = "",
    page: int = 1,
    view: str = "",
) -> dict[str, Any]:
    days, granularity = parse_range(range_token)
    now = datetime.now(timezone.utc)
    start_date, end_date = date_bounds(days, now)
    buckets = bucket_starts(days, granularity, now)
    params = {
        "org_id": org_id,
        "start": start_date,
        "end": end_date,
        "run_type": RUN_TYPE_COURSE,
        "completed": STATUS_COMPLETED,
    }

    return {
        "activity_trend": _activity_trend(session, params, buckets, granularity),
        "enrollments_trend": _enrollments_trend(session, params, buckets, granularity),
        "enrollment_stage": _enrollment_stage(session, params),
        "top_courses": _top_courses(session, params),
        "completion_by_course": _completion_by_course(session, params),
    }


def _activity_trend(session, params, buckets, granularity) -> dict[str, Any]:
    """Active learners (distinct `trailstep` users) + new signups, per bucket."""
    bucket = bucket_expr("creation_date", granularity)
    by_key: dict[str, dict[str, Any]] = {}

    for row in _rows(
        session,
        f"""
        SELECT {bucket} AS bucket, COUNT(DISTINCT user_id) AS learners
        FROM trailstep
        WHERE org_id = :org_id
          AND {has_date('creation_date')}
          AND creation_date >= :start AND creation_date < :end
        GROUP BY 1
        """,
        params,
    ):
        by_key.setdefault(bucket_key(row[0], granularity), {})["learners"] = int(row[1] or 0)

    for row in _rows(
        session,
        f"""
        SELECT {bucket} AS bucket, COUNT(*) AS signups
        FROM userorganization
        WHERE org_id = :org_id
          AND {has_date('creation_date')}
          AND creation_date >= :start AND creation_date < :end
        GROUP BY 1
        """,
        params,
    ):
        by_key.setdefault(bucket_key(row[0], granularity), {})["signups"] = int(row[1] or 0)

    data = merge_series(buckets, granularity, by_key, {"learners": 0, "signups": 0})
    return trend_card(
        "Activity over time",
        data,
        "label",
        [
            {"key": "learners", "name": "Active learners"},
            {"key": "signups", "name": "New signups"},
        ],
    )


def _enrollments_trend(session, params, buckets, granularity) -> dict[str, Any]:
    """Course runs created per bucket."""
    bucket = bucket_expr("creation_date", granularity)
    rows = _rows(
        session,
        f"""
        SELECT {bucket} AS bucket, COUNT(*) AS value
        FROM trailrun
        WHERE org_id = :org_id
          AND run_type::text = :run_type
          AND {has_date('creation_date')}
          AND creation_date >= :start AND creation_date < :end
        GROUP BY 1
        """,
        params,
    )
    by_key = {bucket_key(row[0], granularity): {"value": int(row[1] or 0)} for row in rows}
    data = merge_series(buckets, granularity, by_key, {"value": 0})
    return bars_card("Enrollments over time", data, "label", [{"key": "value", "name": "Enrollments"}])


def _enrollment_stage(session, params) -> dict[str, Any]:
    """Ordered funnel for the window: Enrolled → Started → Completed."""
    row = _rows(
        session,
        """
        SELECT
            COUNT(*) AS enrolled,
            COUNT(*) FILTER (WHERE step_count > 0) AS started,
            COUNT(*) FILTER (WHERE status::text = :completed) AS completed
        FROM (
            SELECT r.id, r.status,
                   (SELECT COUNT(*) FROM trailstep s WHERE s.trailrun_id = r.id) AS step_count
            FROM trailrun r
            WHERE r.org_id = :org_id
              AND r.run_type::text = :run_type
              AND NULLIF(r.creation_date, '') IS NOT NULL
              AND r.creation_date >= :start AND r.creation_date < :end
        ) runs
        """,
        params,
    )[0]

    data = [
        {"label": "Enrolled", "value": int(row[0] or 0)},
        {"label": "Started", "value": int(row[1] or 0)},
        {"label": "Completed", "value": int(row[2] or 0)},
    ]
    return bars_card("Enrollment by stage", data, "label", [{"key": "value", "name": "Users"}])


def _top_courses(session, params) -> dict[str, Any]:
    rows = _rows(
        session,
        """
        SELECT c.name AS name, COUNT(*) AS value
        FROM trailrun r
        JOIN course c ON c.id = r.course_id
        WHERE r.org_id = :org_id
          AND r.run_type::text = :run_type
          AND r.course_id IS NOT NULL
          AND r.creation_date >= :start AND r.creation_date < :end
        GROUP BY c.name
        ORDER BY value DESC
        LIMIT 5
        """,
        params,
    )
    data = [{"name": row[0], "value": int(row[1] or 0)} for row in rows]
    return ranked_card("Top courses", data, "name", "value")


def _completion_by_course(session, params) -> dict[str, Any]:
    return ranked_card(
        "Completion by course",
        completion_by_course_rows(session, params),
        "name",
        "value",
        fmt="percent",
    )
