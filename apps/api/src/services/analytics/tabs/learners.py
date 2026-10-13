"""Learners tab — "what is this specific user doing?" (org-wide).

The tab is a single paginated table (`learners_table`, Tier A). Tapping a row
opens a learner-details dialog fed by its own endpoint (`learner_detail`), which
is not part of the tab payload — the dialog loads it on demand.
Metric map: docs/08-features/analytics/implementation-plan.md §4 → Learners.
"""

from __future__ import annotations

from typing import Any

from sqlmodel import Session, text

from src.services.analytics.tabs._shared import table_card

LEARNER_PAGE_SIZE = 50

# `user` is a reserved word in Postgres, hence the quoted identifier.
_NAME = "COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username)"

# Shared join + search predicate: name / username / email, case-insensitive.
_FROM_AND_SEARCH = f"""
    FROM "user" u
    JOIN userorganization uo ON uo.user_id = u.id AND uo.org_id = :org_id
    LEFT JOIN role r ON r.id = uo.role_id
    WHERE :q = ''
       OR u.username ILIKE :like
       OR u.email ILIKE :like
       OR {_NAME} ILIKE :like
"""

_COLUMNS = [
    {"key": "name", "header": "Name", "variant": "person"},
    {"key": "username", "header": "Username", "variant": "username"},
    {"key": "email", "header": "Email"},
    {"key": "role", "header": "Role", "width": "120px"},
    {"key": "verified", "header": "Status", "width": "130px", "variant": "status"},
    {"key": "joined", "header": "Joined", "align": "right", "variant": "date"},
]


def board(
    session: Session,
    org_id: int,
    range_token: str | None,
    entity: str = "all",
    q: str = "",
    page: int = 1,
    view: str = "",
) -> dict[str, Any]:
    """The Learners tab has no time series — `range_token` is accepted for the
    uniform board contract but ignored (a roster is not windowed)."""
    return {"learners_table": _learners_table(session, org_id, q, page)}


def _learners_table(session: Session, org_id: int, q: str, page: int) -> dict[str, Any]:
    query = (q or "").strip()
    page = max(1, int(page or 1))
    params = {
        "org_id": org_id,
        "q": query,
        "like": f"%{query}%",
        "limit": LEARNER_PAGE_SIZE,
        "offset": (page - 1) * LEARNER_PAGE_SIZE,
    }

    total = int(
        session.exec(text(f"SELECT count(*) {_FROM_AND_SEARCH}"), params=params).first()[0]
        or 0
    )

    rows = session.exec(
        text(
            f"""
            SELECT u.id,
                   {_NAME} AS name,
                   u.username,
                   u.email,
                   r.name AS role,
                   u.email_verified AS verified,
                   substring(uo.creation_date, 1, 10) AS joined
            {_FROM_AND_SEARCH}
            ORDER BY NULLIF(uo.creation_date, '')::timestamp DESC NULLS LAST
            LIMIT :limit OFFSET :offset
            """
        ),
        params=params,
    ).all()

    data = [
        {
            "id": row[0],
            "name": row[1],
            "username": row[2],
            "email": row[3],
            "role": row[4] or "-",
            "verified": bool(row[5]),
            "joined": row[6],
        }
        for row in rows
    ]
    return table_card(
        "",
        _COLUMNS,
        data,
        page=page,
        pageSize=LEARNER_PAGE_SIZE,
        total=total,
    )


def learner_detail(session: Session, org_id: int, user_id: int) -> dict[str, Any] | None:
    """One learner's profile + per-course progress. `None` when not in the org."""
    row = session.exec(
        text(
            f"""
            SELECT u.id,
                   {_NAME} AS name,
                   u.username,
                   u.email,
                   r.name AS role,
                   u.email_verified AS verified,
                   substring(uo.creation_date, 1, 10) AS joined,
                   (
                       SELECT MAX(NULLIF(ts.creation_date, '')::timestamp)
                       FROM trailstep ts
                       WHERE ts.user_id = u.id AND ts.org_id = :org_id
                   ) AS last_active
            FROM "user" u
            JOIN userorganization uo ON uo.user_id = u.id AND uo.org_id = :org_id
            LEFT JOIN role r ON r.id = uo.role_id
            WHERE u.id = :user_id
            """
        ),
        params={"org_id": org_id, "user_id": user_id},
    ).first()
    if row is None:
        return None

    courses = session.exec(
        text(
            """
            SELECT c.name,
                   COALESCE(COUNT(ca.id), 0) AS total,
                   COALESCE(MAX(done.completed), 0) AS completed
            FROM trailrun tr
            JOIN course c ON c.id = tr.course_id
            LEFT JOIN chapteractivity ca ON ca.course_id = tr.course_id
            LEFT JOIN (
                SELECT trailrun_id, COUNT(*) AS completed
                FROM trailstep
                WHERE complete = true
                GROUP BY trailrun_id
            ) done ON done.trailrun_id = tr.id
            WHERE tr.user_id = :user_id
              AND tr.org_id = :org_id
              AND tr.course_id IS NOT NULL
              AND tr.run_type::text = 'RUN_TYPE_COURSE'
            GROUP BY tr.id, c.name
            ORDER BY NULLIF(tr.creation_date, '')::timestamp DESC NULLS LAST
            """
        ),
        params={"org_id": org_id, "user_id": user_id},
    ).all()

    return {
        "user": {
            "id": row[0],
            "name": row[1],
            "username": row[2],
            "email": row[3],
            "role": row[4] or "-",
            "verified": bool(row[5]),
            "joined": row[6],
            "last_active": row[7].isoformat() if row[7] else None,
        },
        "courses": [
            {
                "name": course[0],
                "progress": int(100 * int(course[2] or 0) / int(course[1])) if course[1] else 0,
            }
            for course in courses
        ],
    }
