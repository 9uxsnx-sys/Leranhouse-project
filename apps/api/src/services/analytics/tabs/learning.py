"""Learning tab — "are learners using the content?" (org-wide).

Metric map: docs/08-features/analytics/implementation-plan.md §4 → Learning.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlmodel import Session, text

from src.services.analytics.tabs._common import completion_by_course_rows
from src.services.analytics.tabs._shared import (
    bars_card,
    bucket_expr,
    bucket_key,
    bucket_starts,
    date_bounds,
    merge_series,
    parse_range,
    trend_card,
)

RUN_TYPE_COURSE = "RUN_TYPE_COURSE"
STATUS_COMPLETED = "STATUS_COMPLETED"
TIME_ON_ACTIVITY = "time_on_activity"


def _rows(session: Session, sql: str, params: dict[str, Any]) -> list[Any]:
    return list(session.exec(text(sql), params=params).all())


def _pretty_activity_type(raw: str) -> str:
    """`TYPE_VIDEO` → `Video`, so the axis reads like the product, not the enum."""
    return str(raw).replace("TYPE_", "").replace("_", " ").title()


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
        # analytics_events.created_at is a real timestamptz, so it takes real datetimes.
        "start_ts": now - timedelta(days=days),
        "end_ts": now,
        "run_type": RUN_TYPE_COURSE,
        "completed": STATUS_COMPLETED,
        "time_event": TIME_ON_ACTIVITY,
    }

    return {
        "learning_trend": _learning_trend(session, params, buckets, granularity),
        "completion_by_course": _completion_by_course(session, params),
        "lesson_dropoff": _lesson_dropoff(session, params),
        "time_on_activity": _time_on_activity(session, params),
        "content_type_effectiveness": _content_type_effectiveness(session, params),
    }


def _learning_trend(session, params, buckets, granularity) -> dict[str, Any]:
    """Starts + completions per bucket.

    A run counts as *started* in the bucket where its **first** step landed, and
    as *completed* in the bucket of its **last** step. Runs have no
    `completed_at` column, so the last step is the best available proxy for when
    a learner actually finished.
    """
    first_bucket = bucket_expr("first_step", granularity)
    last_bucket = bucket_expr("last_step", granularity)
    by_key: dict[str, dict[str, Any]] = {}

    for row in _rows(
        session,
        f"""
        SELECT {first_bucket} AS bucket, COUNT(*) AS starts
        FROM (
            SELECT r.id, MIN(s.creation_date) AS first_step
            FROM trailrun r
            JOIN trailstep s ON s.trailrun_id = r.id
            WHERE r.org_id = :org_id AND r.run_type::text = :run_type
            GROUP BY r.id
        ) runs
        WHERE NULLIF(first_step, '') IS NOT NULL
          AND first_step >= :start AND first_step < :end
        GROUP BY 1
        """,
        params,
    ):
        by_key.setdefault(bucket_key(row[0], granularity), {})["starts"] = int(row[1] or 0)

    for row in _rows(
        session,
        f"""
        SELECT {last_bucket} AS bucket, COUNT(*) AS completions
        FROM (
            SELECT r.id, MAX(s.creation_date) AS last_step
            FROM trailrun r
            JOIN trailstep s ON s.trailrun_id = r.id
            WHERE r.org_id = :org_id
              AND r.run_type::text = :run_type
              AND r.status::text = :completed
            GROUP BY r.id
        ) runs
        WHERE NULLIF(last_step, '') IS NOT NULL
          AND last_step >= :start AND last_step < :end
        GROUP BY 1
        """,
        params,
    ):
        by_key.setdefault(bucket_key(row[0], granularity), {})["completions"] = int(row[1] or 0)

    data = merge_series(buckets, granularity, by_key, {"starts": 0, "completions": 0})
    return trend_card(
        "Course starts & completions",
        data,
        "label",
        [
            {"key": "starts", "name": "Course starts"},
            {"key": "completions", "name": "Completions"},
        ],
    )


def _completion_by_course(session, params) -> dict[str, Any]:
    """Same numbers as Overview, rendered vertically there and here as bars."""
    return bars_card(
        "Completion by course",
        completion_by_course_rows(session, params),
        "name",
        [{"key": "value", "name": "Completion"}],
        fmt="percent",
    )


def _lesson_dropoff(session, params) -> dict[str, Any]:
    """Distinct learners per **lesson position**, as 10% buckets of the course.

    Position comes from the join tables (`coursechapter.order` for the chapter,
    `chapteractivity.order` for the activity inside it) — neither `chapter` nor
    `activity` carries an order column.
    """
    rows = _rows(
        session,
        """
        WITH activity_position AS (
            SELECT a.id AS activity_id,
                   ROW_NUMBER() OVER (
                       PARTITION BY a.course_id ORDER BY cc.order, ca.order
                   ) AS pos,
                   COUNT(*) OVER (PARTITION BY a.course_id) AS total
            FROM activity a
            JOIN chapteractivity ca ON ca.activity_id = a.id
            JOIN coursechapter cc ON cc.chapter_id = ca.chapter_id
        )
        SELECT (LEAST(9, FLOOR(100.0 * (ap.pos - 1) / GREATEST(ap.total - 1, 1) / 10)) * 10)::int AS bin,
               COUNT(DISTINCT s.user_id) AS learners
        FROM trailstep s
        JOIN activity_position ap ON ap.activity_id = s.activity_id
        WHERE s.org_id = :org_id
          AND s.complete = true
          AND NULLIF(s.creation_date, '') IS NOT NULL
          AND s.creation_date >= :start AND s.creation_date < :end
        GROUP BY 1
        """,
        params,
    )
    by_bin = {int(row[0]): int(row[1] or 0) for row in rows}
    data = [
        {"label": f"{i * 10}–{i * 10 + 10}%", "value": by_bin.get(i * 10, 0)}
        for i in range(10)
    ]
    return bars_card("Lesson drop-off", data, "label", [{"key": "value", "name": "Learners"}])


def _time_on_activity(session, params) -> dict[str, Any]:
    """Average minutes per content type, from `time_on_activity` events (Tier B).

    The event carries `activity_uuid` in `properties`, so we join back to
    `activity` to get the type. Returns empty until events exist.
    """
    rows = _rows(
        session,
        """
        SELECT a.activity_type::text AS activity_type,
               (AVG(e.duration_ms) / 60000.0)::int AS minutes
        FROM analytics_events e
        JOIN activity a ON a.activity_uuid = e.properties->>'activity_uuid'
        WHERE e.org_id = :org_id
          AND e.event_name = :time_event
          AND e.duration_ms IS NOT NULL
          AND e.created_at >= :start_ts AND e.created_at < :end_ts
        GROUP BY 1
        ORDER BY minutes DESC
        """,
        params,
    )
    data = [
        {"name": _pretty_activity_type(row[0]), "value": int(row[1] or 0)}
        for row in rows
    ]
    return bars_card(
        "Time on activity",
        data,
        "name",
        [{"key": "value", "name": "Minutes"}],
        fmt="minutes",
    )


def _content_type_effectiveness(session, params) -> dict[str, Any]:
    """Completion rate per content type — the content-quality signal."""
    rows = _rows(
        session,
        """
        SELECT a.activity_type::text AS activity_type,
               (100.0 * COUNT(*) FILTER (WHERE s.complete) / COUNT(*))::int AS rate
        FROM trailstep s
        JOIN activity a ON a.id = s.activity_id
        WHERE s.org_id = :org_id
          AND NULLIF(s.creation_date, '') IS NOT NULL
          AND s.creation_date >= :start AND s.creation_date < :end
        GROUP BY 1
        ORDER BY rate DESC
        """,
        params,
    )
    data = [
        {"name": _pretty_activity_type(row[0]), "value": int(row[1] or 0)}
        for row in rows
    ]
    return bars_card(
        "Content type effectiveness",
        data,
        "name",
        [{"key": "value", "name": "Completion"}],
        fmt="percent",
    )
