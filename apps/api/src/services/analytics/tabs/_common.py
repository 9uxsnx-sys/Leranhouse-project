"""Card queries shared by more than one tab.

Kept separate from `_shared.py` (which holds pure helpers) because these return
SQL-backed rows: one definition, so two tabs can never drift apart.
"""

from __future__ import annotations

from typing import Any

from sqlmodel import Session, text


def completion_by_course_rows(
    session: Session, params: dict[str, Any], *, limit: int = 6
) -> list[dict[str, Any]]:
    """Completion % per course, for runs created inside the window.

    Used by Overview (horizontal bars) and Learning (vertical bars) — same
    numbers, different card kind.
    """
    rows = session.exec(
        text(
            """
            SELECT c.name AS name,
                   (100.0 * COUNT(*) FILTER (WHERE r.status::text = :completed) / COUNT(*))::int AS value
            FROM trailrun r
            JOIN course c ON c.id = r.course_id
            WHERE r.org_id = :org_id
              AND r.run_type::text = :run_type
              AND r.course_id IS NOT NULL
              AND r.creation_date >= :start AND r.creation_date < :end
            GROUP BY c.name
            ORDER BY value DESC, c.name
            LIMIT :limit
            """
        ),
        params={**params, "limit": limit},
    ).all()
    return [{"name": row[0], "value": int(row[1] or 0)} for row in rows]
