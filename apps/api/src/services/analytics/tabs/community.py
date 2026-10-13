"""Community tab — "is the community alive?" (community-scoped).

Two charts plus one detail table whose *view* is picked by the action-row cycle
button (`view` = contributors | discussions | questions).
Every card narrows to the community passed as `entity` (a community uuid); `all`
drops the filter and aggregates the whole org.
Metric map: docs/08-features/analytics/implementation-plan.md §4 → Community.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlmodel import Session, text

from src.db.communities.discussions import DISCUSSION_LABELS
from src.services.analytics.tabs._shared import (
    bars_card,
    bucket_expr,
    bucket_key,
    bucket_starts,
    date_bounds,
    merge_series,
    parse_range,
    table_card,
    trend_card,
)

CONTRIBUTOR_LIMIT = 25
DISCUSSION_LIMIT = 25
QUESTION_LIMIT = 25

VIEWS = ("contributors", "discussions", "questions")

_LABEL_NAMES = {label["id"]: label["name"] for label in DISCUSSION_LABELS}
_NAME = "COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username)"

_CONTRIBUTOR_COLUMNS = [
    {"key": "name", "header": "Member", "variant": "person"},
    {"key": "discussions", "header": "Discussions", "align": "right", "sortable": True},
    {"key": "comments", "header": "Comments", "align": "right", "sortable": True},
    {"key": "reactions", "header": "Reactions", "align": "right", "sortable": True},
]

_DISCUSSION_COLUMNS = [
    {"key": "title", "header": "Discussion"},
    {"key": "label", "header": "Label", "width": "150px"},
    {"key": "replies", "header": "Replies", "align": "right", "sortable": True},
    {"key": "upvotes", "header": "Upvotes", "align": "right", "sortable": True},
]

_QUESTION_COLUMNS = [
    {"key": "title", "header": "Question"},
    {"key": "author", "header": "Asked by", "width": "180px"},
    {"key": "age", "header": "Age", "align": "right", "width": "120px"},
    {"key": "upvotes", "header": "Upvotes", "align": "right", "sortable": True},
]


def _rows(session: Session, sql: str, params: dict[str, Any]) -> list[Any]:
    return list(session.exec(text(sql), params=params).all())


def _community_filter(entity: str) -> tuple[str, dict[str, Any]]:
    if entity and entity not in ("", "all"):
        return "AND com.community_uuid = :community_uuid", {"community_uuid": entity}
    return "", {}


def _pretty_label(raw: Any) -> str:
    label = str(raw or "general")
    return _LABEL_NAMES.get(label, label.title())


def _age(value: Any, now: datetime) -> str:
    if not value:
        return "—"
    try:
        created = datetime.fromisoformat(str(value))
    except ValueError:
        return "—"
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    seconds = max(0, (now - created).total_seconds())
    if seconds < 3600:
        return f"{int(seconds // 60)}m"
    if seconds < 86400:
        return f"{int(seconds // 3600)}h"
    return f"{int(seconds // 86400)}d"


def board(
    session: Session,
    org_id: int,
    range_token: str | None,
    entity: str = "all",
    q: str = "",
    page: int = 1,
    view: str = "contributors",
) -> dict[str, Any]:
    days, granularity = parse_range(range_token)
    now = datetime.now(timezone.utc)
    start_date, end_date = date_bounds(days, now)
    buckets = bucket_starts(days, granularity, now)
    community_clause, community_params = _community_filter(entity)
    params = {
        "org_id": org_id,
        "granularity": granularity,
        "start": start_date,
        "end": end_date,
        "community_clause": community_clause,
        **community_params,
    }

    return {
        "community_activity_trend": _activity_trend(session, params, buckets, granularity),
        "community_by_label": _by_label(session, params),
        "community_detail_table": _detail_table(session, params, view, now),
    }


def _activity_trend(session, params, buckets, granularity) -> dict[str, Any]:
    discussion_bucket = bucket_expr("d.creation_date", granularity)
    comment_bucket = bucket_expr("c.creation_date", granularity)
    by_key: dict[str, dict[str, Any]] = {}

    for row in _rows(
        session,
        f"""
        SELECT {discussion_bucket} AS bucket, COUNT(*) AS discussions
        FROM discussion d
        JOIN community com ON com.id = d.community_id
        WHERE d.org_id = :org_id
          AND NULLIF(d.creation_date, '') IS NOT NULL
          AND d.creation_date >= :start AND d.creation_date < :end
          {params['community_clause']}
        GROUP BY 1
        """,
        params,
    ):
        by_key.setdefault(bucket_key(row[0], granularity), {})["discussions"] = int(row[1] or 0)

    for row in _rows(
        session,
        f"""
        SELECT {comment_bucket} AS bucket, COUNT(*) AS comments
        FROM discussioncomment c
        JOIN discussion d ON d.id = c.discussion_id
        JOIN community com ON com.id = d.community_id
        WHERE d.org_id = :org_id
          AND NULLIF(c.creation_date, '') IS NOT NULL
          AND c.creation_date >= :start AND c.creation_date < :end
          {params['community_clause']}
        GROUP BY 1
        """,
        params,
    ):
        by_key.setdefault(bucket_key(row[0], granularity), {})["comments"] = int(row[1] or 0)

    data = merge_series(buckets, granularity, by_key, {"discussions": 0, "comments": 0})
    return trend_card(
        "Activity over time",
        data,
        "label",
        [
            {"key": "discussions", "name": "Discussions"},
            {"key": "comments", "name": "Comments"},
        ],
    )


def _by_label(session, params) -> dict[str, Any]:
    rows = _rows(
        session,
        f"""
        SELECT COALESCE(NULLIF(d.label, ''), 'general') AS label, COUNT(*) AS value
        FROM discussion d
        JOIN community com ON com.id = d.community_id
        WHERE d.org_id = :org_id
          AND NULLIF(d.creation_date, '') IS NOT NULL
          AND d.creation_date >= :start AND d.creation_date < :end
          {params['community_clause']}
        GROUP BY 1
        ORDER BY value DESC
        """,
        params,
    )
    data = [{"name": _pretty_label(row[0]), "value": int(row[1] or 0)} for row in rows]
    return bars_card("Discussions by label", data, "name", [{"key": "value", "name": "Discussions"}])


def _detail_table(session, params, view: str, now: datetime) -> dict[str, Any]:
    if view not in VIEWS:
        view = VIEWS[0]
    if view == "discussions":
        return _top_discussions(session, params)
    if view == "questions":
        return _unanswered(session, params, now)
    return _contributors(session, params)


def _contributors(session, params) -> dict[str, Any]:
    """Who contributes most — discussions + comments they *wrote*, plus reactions."""
    rows = _rows(
        session,
        f"""
        SELECT {_NAME} AS name,
               COALESCE(disc.created, 0) AS discussions,
               COALESCE(com.written, 0) AS comments,
               COALESCE(reactions.n, 0) AS reactions
        FROM "user" u
        LEFT JOIN (
            SELECT d.author_id, COUNT(*) AS created
            FROM discussion d
            JOIN community com ON com.id = d.community_id
            WHERE d.org_id = :org_id
              AND NULLIF(d.creation_date, '') IS NOT NULL
              AND d.creation_date >= :start AND d.creation_date < :end
              {params['community_clause']}
            GROUP BY d.author_id
        ) disc ON disc.author_id = u.id
        LEFT JOIN (
            SELECT c.author_id, COUNT(*) AS written
            FROM discussioncomment c
            JOIN discussion d ON d.id = c.discussion_id
            JOIN community com ON com.id = d.community_id
            WHERE d.org_id = :org_id
              AND NULLIF(c.creation_date, '') IS NOT NULL
              AND c.creation_date >= :start AND c.creation_date < :end
              {params['community_clause']}
            GROUP BY c.author_id
        ) com ON com.author_id = u.id
        LEFT JOIN (
            SELECT r.user_id, COUNT(*) AS n
            FROM discussionreaction r
            JOIN discussion d ON d.id = r.discussion_id
            JOIN community com ON com.id = d.community_id
            WHERE d.org_id = :org_id
              AND NULLIF(r.creation_date, '') IS NOT NULL
              AND r.creation_date >= :start AND r.creation_date < :end
              {params['community_clause']}
            GROUP BY r.user_id
        ) reactions ON reactions.user_id = u.id
        WHERE disc.created IS NOT NULL
           OR com.written IS NOT NULL
           OR reactions.n IS NOT NULL
        ORDER BY (COALESCE(disc.created, 0) + COALESCE(com.written, 0) + COALESCE(reactions.n, 0)) DESC
        LIMIT :limit
        """,
        {**params, "limit": CONTRIBUTOR_LIMIT},
    )
    data = [
        {
            "name": row[0],
            "discussions": int(row[1] or 0),
            "comments": int(row[2] or 0),
            "reactions": int(row[3] or 0),
        }
        for row in rows
    ]
    return table_card("", _CONTRIBUTOR_COLUMNS, data)


def _top_discussions(session, params) -> dict[str, Any]:
    rows = _rows(
        session,
        f"""
        SELECT d.title,
               COALESCE(NULLIF(d.label, ''), 'general') AS label,
               COUNT(c.id) AS replies,
               d.upvote_count AS upvotes
        FROM discussion d
        JOIN community com ON com.id = d.community_id
        LEFT JOIN discussioncomment c ON c.discussion_id = d.id
        WHERE d.org_id = :org_id
          AND NULLIF(d.creation_date, '') IS NOT NULL
          AND d.creation_date >= :start AND d.creation_date < :end
          {params['community_clause']}
        GROUP BY d.id, d.title, d.label, d.upvote_count
        ORDER BY upvotes DESC, replies DESC
        LIMIT :limit
        """,
        {**params, "limit": DISCUSSION_LIMIT},
    )
    data = [
        {
            "title": row[0],
            "label": _pretty_label(row[1]),
            "replies": int(row[2] or 0),
            "upvotes": int(row[3] or 0),
        }
        for row in rows
    ]
    return table_card("", _DISCUSSION_COLUMNS, data)


def _unanswered(session, params, now: datetime) -> dict[str, Any]:
    rows = _rows(
        session,
        f"""
        SELECT d.title, {_NAME} AS author, d.creation_date, d.upvote_count
        FROM discussion d
        JOIN community com ON com.id = d.community_id
        JOIN "user" u ON u.id = d.author_id
        LEFT JOIN discussioncomment c ON c.discussion_id = d.id
        WHERE d.org_id = :org_id
          AND COALESCE(NULLIF(d.label, ''), 'general') = 'question'
          AND NULLIF(d.creation_date, '') IS NOT NULL
          AND d.creation_date >= :start AND d.creation_date < :end
          {params['community_clause']}
        GROUP BY d.id, u.id
        HAVING COUNT(c.id) = 0
        ORDER BY d.upvote_count DESC, d.creation_date DESC
        LIMIT :limit
        """,
        {**params, "limit": QUESTION_LIMIT},
    )
    data = [
        {
            "title": row[0],
            "author": row[1],
            "age": _age(row[2], now),
            "upvotes": int(row[3] or 0),
        }
        for row in rows
    ]
    return table_card("", _QUESTION_COLUMNS, data)
