"""Courses tab — "how is this course doing?" (course-scoped).

Every card narrows to the course passed as `entity` (a course uuid). When
`entity` is `all` the queries simply drop the course filter and aggregate the
whole org — so the same tab works for both the "All courses" and single-course
views.
Metric map: docs/08-features/analytics/implementation-plan.md §4 → Courses.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlmodel import Session, text

from src.services.analytics.tabs._shared import (
    bars_card,
    bucket_expr,
    bucket_key,
    bucket_starts,
    date_bounds,
    merge_series,
    parse_range,
    ranked_card,
    table_card,
    trend_card,
)

RUN_TYPE_COURSE = "RUN_TYPE_COURSE"
STATUS_COMPLETED = "STATUS_COMPLETED"
TIME_ON_ACTIVITY = "time_on_activity"

TOP_LESSONS = 8
STUDENT_LIMIT = 100

_NAME = "COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username)"

_STATUS_LABELS = {
    "STATUS_COMPLETED": "Completed",
    "STATUS_IN_PROGRESS": "In progress",
    "STATUS_PAUSED": "Paused",
    "STATUS_CANCELLED": "Cancelled",
}

_STUDENT_COLUMNS = [
    {"key": "name", "header": "Learner", "variant": "person"},
    {"key": "email", "header": "Email"},
    {"key": "enrolled", "header": "Enrolled", "width": "150px", "variant": "date"},
    {
        "key": "progress",
        "header": "Progress",
        "align": "right",
        "width": "120px",
        "sortable": True,
        "variant": "percent",
    },
    {"key": "status", "header": "Status", "width": "130px"},
]


def _rows(session: Session, sql: str, params: dict[str, Any]) -> list[Any]:
    return list(session.exec(text(sql), params=params).all())


def _course_filter(entity: str) -> tuple[str, dict[str, Any]]:
    """`(sql fragment, params)` narrowing to one course uuid, or nothing for `all`."""
    if entity and entity not in ("", "all"):
        return "AND c.course_uuid = :course_uuid", {"course_uuid": entity}
    return "", {}


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
    course_clause, course_params = _course_filter(entity)
    params = {
        "org_id": org_id,
        "granularity": granularity,
        "start": start_date,
        "end": end_date,
        "start_ts": now - timedelta(days=days),
        "end_ts": now,
        "run_type": RUN_TYPE_COURSE,
        "completed": STATUS_COMPLETED,
        "time_event": TIME_ON_ACTIVITY,
        "limit": TOP_LESSONS,
        "student_limit": STUDENT_LIMIT,
        "course_clause": course_clause,
        **course_params,
    }

    return {
        "course_enrollment_trend": _enrollment_trend(session, params, buckets, granularity),
        "course_completion_funnel": _completion_funnel(session, params),
        "course_learner_progress": _learner_progress(session, params),
        "course_lesson_dropoff": _lesson_dropoff(session, params),
        "course_time_per_lesson": _time_per_lesson(session, params),
        "course_students": _students(session, params),
    }


def _enrollment_trend(session, params, buckets, granularity) -> dict[str, Any]:
    """New enrollments (by run start) + active learners (by step) per bucket."""
    enroll_bucket = bucket_expr("tr.creation_date", granularity)
    active_bucket = bucket_expr("s.creation_date", granularity)
    by_key: dict[str, dict[str, Any]] = {}

    for row in _rows(
        session,
        f"""
        SELECT {enroll_bucket} AS bucket, COUNT(*) AS enrollments
        FROM trailrun tr
        JOIN course c ON c.id = tr.course_id
        WHERE tr.org_id = :org_id
          AND tr.run_type::text = :run_type
          AND NULLIF(tr.creation_date, '') IS NOT NULL
          AND tr.creation_date >= :start AND tr.creation_date < :end
          {params['course_clause']}
        GROUP BY 1
        """,
        params,
    ):
        by_key.setdefault(bucket_key(row[0], granularity), {})["enrollments"] = int(row[1] or 0)

    for row in _rows(
        session,
        f"""
        SELECT {active_bucket} AS bucket, COUNT(DISTINCT s.user_id) AS active
        FROM trailstep s
        JOIN course c ON c.id = s.course_id
        WHERE s.org_id = :org_id
          AND s.course_id IS NOT NULL
          AND NULLIF(s.creation_date, '') IS NOT NULL
          AND s.creation_date >= :start AND s.creation_date < :end
          {params['course_clause']}
        GROUP BY 1
        """,
        params,
    ):
        by_key.setdefault(bucket_key(row[0], granularity), {})["active"] = int(row[1] or 0)

    data = merge_series(buckets, granularity, by_key, {"enrollments": 0, "active": 0})
    return trend_card(
        "Enrollments over time",
        data,
        "label",
        [
            {"key": "enrollments", "name": "New enrollments"},
            {"key": "active", "name": "Active learners"},
        ],
    )


def _completion_funnel(session, params) -> dict[str, Any]:
    """Enrolled → Started → Halfway (≥50% of activities) → Completed.

    "Certified" needs the certificate table, so it is intentionally absent.
    """
    row = _rows(
        session,
        f"""
        WITH run_stats AS (
            SELECT tr.id,
                   tr.status::text AS status,
                   COUNT(DISTINCT ca.id) AS total,
                   COUNT(DISTINCT ts.activity_id) FILTER (WHERE ts.complete) AS done,
                   COUNT(DISTINCT ts.id) AS steps
            FROM trailrun tr
            JOIN course c ON c.id = tr.course_id
            LEFT JOIN chapteractivity ca ON ca.course_id = tr.course_id
            LEFT JOIN trailstep ts ON ts.trailrun_id = tr.id
            WHERE tr.org_id = :org_id
              AND tr.run_type::text = :run_type
              AND NULLIF(tr.creation_date, '') IS NOT NULL
              AND tr.creation_date >= :start AND tr.creation_date < :end
              {params['course_clause']}
            GROUP BY tr.id
        )
        SELECT COUNT(*),
               COUNT(*) FILTER (WHERE steps > 0),
               COUNT(*) FILTER (WHERE total > 0 AND done * 2 >= total),
               COUNT(*) FILTER (WHERE status = :completed)
        FROM run_stats
        """,
        params,
    )[0]

    data = [
        {"name": "Enrolled", "value": int(row[0] or 0)},
        {"name": "Started", "value": int(row[1] or 0)},
        {"name": "Halfway", "value": int(row[2] or 0)},
        {"name": "Completed", "value": int(row[3] or 0)},
    ]
    return bars_card("Completion funnel", data, "name", [{"key": "value", "name": "Learners"}])


def _learner_progress(session, params) -> dict[str, Any]:
    """Completion ratio per run → the 4 quartile buckets."""
    rows = _rows(
        session,
        f"""
        WITH run_stats AS (
            SELECT tr.id,
                   COUNT(DISTINCT ca.id) AS total,
                   COUNT(DISTINCT ts.activity_id) FILTER (WHERE ts.complete) AS done
            FROM trailrun tr
            JOIN course c ON c.id = tr.course_id
            LEFT JOIN chapteractivity ca ON ca.course_id = tr.course_id
            LEFT JOIN trailstep ts ON ts.trailrun_id = tr.id
            WHERE tr.org_id = :org_id
              AND tr.run_type::text = :run_type
              AND NULLIF(tr.creation_date, '') IS NOT NULL
              AND tr.creation_date >= :start AND tr.creation_date < :end
              {params['course_clause']}
            GROUP BY tr.id
        )
        SELECT LEAST(3, FLOOR(100.0 * done / GREATEST(total, 1) / 25))::int AS bucket,
               COUNT(*) AS learners
        FROM run_stats
        GROUP BY 1
        """,
        params,
    )
    by_bin = {int(row[0]): int(row[1] or 0) for row in rows}
    labels = ["0–25%", "25–50%", "50–75%", "75–100%"]
    data = [{"name": labels[i], "value": by_bin.get(i, 0)} for i in range(4)]
    return bars_card("Learner progress", data, "name", [{"key": "value", "name": "Learners"}])


def _lesson_dropoff(session, params) -> dict[str, Any]:
    """Distinct learners per lesson, in course order — the drop-off curve."""
    rows = _rows(
        session,
        f"""
        SELECT a.name AS name, COUNT(DISTINCT s.user_id) AS learners
        FROM trailstep s
        JOIN activity a ON a.id = s.activity_id
        JOIN course c ON c.id = s.course_id
        JOIN chapteractivity ca ON ca.activity_id = a.id
        JOIN coursechapter cc ON cc.chapter_id = ca.chapter_id AND cc.course_id = c.id
        WHERE s.org_id = :org_id
          AND s.complete = true
          AND s.course_id IS NOT NULL
          AND NULLIF(s.creation_date, '') IS NOT NULL
          AND s.creation_date >= :start AND s.creation_date < :end
          {params['course_clause']}
        GROUP BY a.id, a.name, c.name
        ORDER BY c.name, MIN(cc."order"), MIN(ca."order")
        LIMIT :limit
        """,
        params,
    )
    data = [{"name": row[0], "value": int(row[1] or 0)} for row in rows]
    return ranked_card("Lesson drop-off", data, "name", "value")


def _time_per_lesson(session, params) -> dict[str, Any]:
    """Average minutes per lesson from `time_on_activity` events (Tier B)."""
    rows = _rows(
        session,
        f"""
        SELECT a.name AS name, (AVG(e.duration_ms) / 60000.0)::int AS minutes
        FROM analytics_events e
        JOIN activity a ON a.activity_uuid = e.properties->>'activity_uuid'
        JOIN course c ON c.id = a.course_id
        WHERE e.org_id = :org_id
          AND e.event_name = :time_event
          AND e.duration_ms IS NOT NULL
          AND e.created_at >= :start_ts AND e.created_at < :end_ts
          {params['course_clause']}
        GROUP BY a.id, a.name
        ORDER BY minutes DESC
        LIMIT :limit
        """,
        params,
    )
    data = [{"name": row[0], "value": int(row[1] or 0)} for row in rows]
    return ranked_card("Time per lesson", data, "name", "value", fmt="minutes")


def _students(session, params) -> dict[str, Any]:
    rows = _rows(
        session,
        f"""
        SELECT {_NAME} AS name,
               u.email,
               substring(tr.creation_date, 1, 10) AS enrolled,
               CASE
                   WHEN COUNT(DISTINCT ca.id) > 0
                   THEN (100.0 * COUNT(DISTINCT ts.activity_id) FILTER (WHERE ts.complete)
                         / COUNT(DISTINCT ca.id))::int
                   ELSE 0
               END AS progress,
               tr.status::text AS status
        FROM trailrun tr
        JOIN "user" u ON u.id = tr.user_id
        JOIN course c ON c.id = tr.course_id
        LEFT JOIN chapteractivity ca ON ca.course_id = tr.course_id
        LEFT JOIN trailstep ts ON ts.trailrun_id = tr.id
        WHERE tr.org_id = :org_id
          AND tr.run_type::text = :run_type
          AND tr.course_id IS NOT NULL
          AND NULLIF(tr.creation_date, '') IS NOT NULL
          AND tr.creation_date >= :start AND tr.creation_date < :end
          {params['course_clause']}
        GROUP BY tr.id, u.id, c.name
        ORDER BY NULLIF(tr.creation_date, '')::timestamp DESC NULLS LAST
        LIMIT :student_limit
        """,
        params,
    )
    data = [
        {
            "name": row[0],
            "email": row[1],
            "enrolled": row[2],
            "progress": int(row[3] or 0),
            "status": _STATUS_LABELS.get(row[4], str(row[4])),
        }
        for row in rows
    ]
    return table_card("", _STUDENT_COLUMNS, data)
