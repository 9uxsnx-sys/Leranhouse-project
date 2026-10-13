"""Audience tab — "where does traffic come from?" (org-wide).

All four cards are Tier B — they read `analytics_events` (`page_view`), so they
stay empty until the app has collected traffic.
Metric map: docs/08-features/analytics/implementation-plan.md §4 → Audience.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlmodel import Session, text

from src.services.analytics.tabs._shared import (
    bars_card,
    bucket_key,
    bucket_starts,
    merge_series,
    parse_range,
    table_card,
    trend_card,
)

PAGE_VIEW = "page_view"
TOP_SOURCES = 5
TOP_PAGES = 8


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
    start = now - timedelta(days=days)
    buckets = bucket_starts(days, granularity, now)
    params = {
        "org_id": org_id,
        "granularity": granularity,
        "start_ts": start,
        "end_ts": now,
        # The top-pages "change" column compares against the previous equal window.
        "prev_start_ts": start - timedelta(days=days),
        "page_view": PAGE_VIEW,
    }

    return {
        "traffic_trend": _traffic_trend(session, params, buckets, granularity),
        "sources": _sources(session, params),
        "devices": _devices(session, params),
        "top_pages": _top_pages(session, params),
    }


def _traffic_trend(session, params, buckets, granularity) -> dict[str, Any]:
    rows = _rows(
        session,
        """
        SELECT date_trunc(:granularity, created_at) AS bucket,
               COUNT(*) AS visits,
               COUNT(DISTINCT visitor_id) AS visitors
        FROM analytics_events
        WHERE org_id = :org_id
          AND event_name = :page_view
          AND created_at >= :start_ts AND created_at < :end_ts
        GROUP BY 1
        """,
        params,
    )
    by_key = {
        bucket_key(row[0], granularity): {
            "visits": int(row[1] or 0),
            "visitors": int(row[2] or 0),
        }
        for row in rows
    }
    data = merge_series(buckets, granularity, by_key, {"visits": 0, "visitors": 0})
    return trend_card(
        "Traffic over time",
        data,
        "label",
        [
            {"key": "visits", "name": "Visits"},
            {"key": "visitors", "name": "Unique visitors"},
        ],
    )


def _sources(session, params) -> dict[str, Any]:
    """Visits by referrer host. No referrer = Direct."""
    rows = _rows(
        session,
        """
        SELECT CASE
                   WHEN COALESCE(referrer, '') = '' THEN 'Direct'
                   ELSE regexp_replace(
                       split_part(regexp_replace(referrer, '^https?://', ''), '/', 1),
                       '^www\\.', ''
                   )
               END AS source,
               COUNT(*) AS visits
        FROM analytics_events
        WHERE org_id = :org_id
          AND event_name = :page_view
          AND created_at >= :start_ts AND created_at < :end_ts
        GROUP BY 1
        ORDER BY visits DESC
        LIMIT :limit
        """,
        {**params, "limit": TOP_SOURCES},
    )
    data = [{"name": row[0], "value": int(row[1] or 0)} for row in rows]
    return bars_card("Sources", data, "name", [{"key": "value", "name": "Visits"}])


def _devices(session, params) -> dict[str, Any]:
    """Share of visits per device — the `device` column is parsed at ingest."""
    rows = _rows(
        session,
        """
        SELECT COALESCE(device, 'unknown') AS device, COUNT(*) AS visits
        FROM analytics_events
        WHERE org_id = :org_id
          AND event_name = :page_view
          AND created_at >= :start_ts AND created_at < :end_ts
        GROUP BY 1
        ORDER BY visits DESC
        """,
        params,
    )
    total = sum(int(row[1] or 0) for row in rows)
    data = [
        {
            "name": str(row[0]).capitalize(),
            "value": round(100 * int(row[1] or 0) / total) if total else 0,
        }
        for row in rows
    ]
    return bars_card(
        "Devices", data, "name", [{"key": "value", "name": "Share"}], fmt="percent"
    )


def _top_pages(session, params) -> dict[str, Any]:
    """Most-viewed paths, with the change vs the previous equal-length window.

    No "average time" column: `page_view` carries no dwell measurement, so the
    card would show 0. We add it only if the client starts reporting it.
    """
    rows = _rows(
        session,
        """
        WITH current_window AS (
            SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
            FROM analytics_events
            WHERE org_id = :org_id
              AND event_name = :page_view
              AND created_at >= :start_ts AND created_at < :end_ts
              AND path IS NOT NULL
            GROUP BY path
        ),
        previous_window AS (
            SELECT path, COUNT(*) AS views
            FROM analytics_events
            WHERE org_id = :org_id
              AND event_name = :page_view
              AND created_at >= :prev_start_ts AND created_at < :start_ts
              AND path IS NOT NULL
            GROUP BY path
        )
        SELECT c.path,
               c.views,
               c.visitors,
               COALESCE((100.0 * (c.views - p.views) / NULLIF(p.views, 0))::int, 0) AS change
        FROM current_window c
        LEFT JOIN previous_window p ON p.path = c.path
        ORDER BY c.views DESC
        LIMIT :limit
        """,
        {**params, "limit": TOP_PAGES},
    )
    columns = [
        {"key": "path", "header": "Page", "variant": "mono"},
        {"key": "views", "header": "Views", "align": "right", "sortable": True},
        {"key": "visitors", "header": "Visitors", "align": "right", "sortable": True},
        {
            "key": "change",
            "header": "Change",
            "align": "right",
            "sortable": True,
            "variant": "delta",
        },
    ]
    data = [
        {
            "path": row[0],
            "views": int(row[1] or 0),
            "visitors": int(row[2] or 0),
            "change": int(row[3] or 0),
        }
        for row in rows
    ]
    return table_card("Top pages", columns, data)
