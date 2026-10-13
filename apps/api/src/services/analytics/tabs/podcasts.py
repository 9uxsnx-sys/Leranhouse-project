"""Podcasts tab — "is anyone listening?" (podcast-scoped).

Every card narrows to the podcast passed as `entity` (a podcast uuid); `all`
drops the filter and aggregates the whole org.
`podcast_length_vs_listened` is Tier B — it needs `time_on_activity` events
carrying an `episode_uuid`, so it stays empty until the player emits them.
Metric map: docs/08-features/analytics/implementation-plan.md §4 → Podcasts.
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

RUN_TYPE_PODCAST = "RUN_TYPE_PODCAST"
TIME_ON_ACTIVITY = "time_on_activity"

TOP_EPISODES = 8
EPISODE_LIMIT = 100

_EPISODE_COLUMNS = [
    {"key": "title", "header": "Episode"},
    {"key": "status", "header": "Status", "width": "130px"},
    {"key": "duration", "header": "Duration", "align": "right", "width": "130px"},
    {"key": "plays", "header": "Plays", "align": "right", "sortable": True},
    {
        "key": "completion",
        "header": "Completion",
        "align": "right",
        "width": "150px",
        "sortable": True,
        "variant": "percent",
    },
]


def _rows(session: Session, sql: str, params: dict[str, Any]) -> list[Any]:
    return list(session.exec(text(sql), params=params).all())


def _podcast_filter(entity: str) -> tuple[str, dict[str, Any]]:
    if entity and entity not in ("", "all"):
        return "AND p.podcast_uuid = :podcast_uuid", {"podcast_uuid": entity}
    return "", {}


def _episode_label(number: Any, title: str) -> str:
    """`Ep 3 · Deep Dive` when a title is available, else just `Ep 3`."""
    if not title:
        return f"Ep {number}" if number else ""
    return f"Ep {number} · {title}" if number else str(title)


def _pretty_duration(seconds: Any) -> str:
    minutes, secs = divmod(int(seconds or 0), 60)
    return f"{minutes}m {secs:02d}s"


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
    podcast_clause, podcast_params = _podcast_filter(entity)
    params = {
        "org_id": org_id,
        "granularity": granularity,
        "start": start_date,
        "end": end_date,
        "start_ts": now - timedelta(days=days),
        "end_ts": now,
        "run_type": RUN_TYPE_PODCAST,
        "time_event": TIME_ON_ACTIVITY,
        "limit": TOP_EPISODES,
        "episode_limit": EPISODE_LIMIT,
        "podcast_clause": podcast_clause,
        **podcast_params,
    }

    return {
        "podcast_listening_trend": _listening_trend(session, params, buckets, granularity),
        "podcast_episode_plays": _episode_plays(session, params),
        "podcast_episode_completion": _episode_completion(session, params),
        "podcast_length_vs_listened": _length_vs_listened(session, params),
        "podcast_series_progress": _series_progress(session, params),
        "podcast_episodes": _episodes(session, params),
    }


def _listening_trend(session, params, buckets, granularity) -> dict[str, Any]:
    """Episode starts (per run) + completions (per completed episode step)."""
    start_bucket = bucket_expr("tr.creation_date", granularity)
    done_bucket = bucket_expr("s.creation_date", granularity)
    by_key: dict[str, dict[str, Any]] = {}

    for row in _rows(
        session,
        f"""
        SELECT {start_bucket} AS bucket, COUNT(*) AS starts
        FROM trailrun tr
        JOIN podcast p ON p.id = tr.podcast_id
        WHERE tr.org_id = :org_id
          AND tr.run_type::text = :run_type
          AND NULLIF(tr.creation_date, '') IS NOT NULL
          AND tr.creation_date >= :start AND tr.creation_date < :end
          {params['podcast_clause']}
        GROUP BY 1
        """,
        params,
    ):
        by_key.setdefault(bucket_key(row[0], granularity), {})["starts"] = int(row[1] or 0)

    for row in _rows(
        session,
        f"""
        SELECT {done_bucket} AS bucket, COUNT(*) AS completions
        FROM trailstep s
        JOIN podcastepisode ep ON ep.id = s.episode_id
        JOIN podcast p ON p.id = ep.podcast_id
        WHERE s.org_id = :org_id
          AND s.complete = true
          AND s.episode_id IS NOT NULL
          AND NULLIF(s.creation_date, '') IS NOT NULL
          AND s.creation_date >= :start AND s.creation_date < :end
          {params['podcast_clause']}
        GROUP BY 1
        """,
        params,
    ):
        by_key.setdefault(bucket_key(row[0], granularity), {})["completions"] = int(row[1] or 0)

    data = merge_series(buckets, granularity, by_key, {"starts": 0, "completions": 0})
    return trend_card(
        "Listening over time",
        data,
        "label",
        [
            {"key": "starts", "name": "Episode starts"},
            {"key": "completions", "name": "Completions"},
        ],
    )


def _episode_plays(session, params) -> dict[str, Any]:
    rows = _rows(
        session,
        f"""
        SELECT ep.episode_number, ep.title, COUNT(*) AS plays
        FROM trailstep s
        JOIN podcastepisode ep ON ep.id = s.episode_id
        JOIN podcast p ON p.id = ep.podcast_id
        WHERE s.org_id = :org_id
          AND s.episode_id IS NOT NULL
          AND NULLIF(s.creation_date, '') IS NOT NULL
          AND s.creation_date >= :start AND s.creation_date < :end
          {params['podcast_clause']}
        GROUP BY ep.id, ep.episode_number, ep.title
        ORDER BY plays DESC
        LIMIT :limit
        """,
        params,
    )
    data = [
        {"name": _episode_label(row[0], row[1]), "value": int(row[2] or 0)}
        for row in rows
    ]
    return ranked_card("Episode plays", data, "name", "value")


def _episode_completion(session, params) -> dict[str, Any]:
    """Listeners who finished ÷ listeners who started, per episode."""
    rows = _rows(
        session,
        f"""
        SELECT ep.episode_number, ep.title,
               COUNT(DISTINCT s.user_id) AS started,
               COUNT(DISTINCT s.user_id) FILTER (WHERE s.complete) AS completed
        FROM trailstep s
        JOIN podcastepisode ep ON ep.id = s.episode_id
        JOIN podcast p ON p.id = ep.podcast_id
        WHERE s.org_id = :org_id
          AND s.episode_id IS NOT NULL
          AND NULLIF(s.creation_date, '') IS NOT NULL
          AND s.creation_date >= :start AND s.creation_date < :end
          {params['podcast_clause']}
        GROUP BY ep.id, ep.episode_number, ep.title
        ORDER BY (100.0 * COUNT(DISTINCT s.user_id) FILTER (WHERE s.complete)
                  / GREATEST(COUNT(DISTINCT s.user_id), 1)) DESC
        LIMIT :limit
        """,
        params,
    )
    data = [
        {
            "name": _episode_label(row[0], row[1]),
            "value": round(100 * int(row[3] or 0) / int(row[2])) if row[2] else 0,
        }
        for row in rows
    ]
    return ranked_card("Episode completion", data, "name", "value", fmt="percent")


def _length_vs_listened(session, params) -> dict[str, Any]:
    """Declared episode length vs average listened, in minutes (Tier B join)."""
    rows = _rows(
        session,
        f"""
        SELECT ep.episode_number,
               (ep.duration_seconds / 60.0)::int AS length,
               COALESCE((AVG(e.duration_ms) / 60000.0)::int, 0) AS listened
        FROM podcastepisode ep
        JOIN podcast p ON p.id = ep.podcast_id
        LEFT JOIN analytics_events e
               ON e.org_id = :org_id
              AND e.event_name = :time_event
              AND e.properties->>'episode_uuid' = ep.episode_uuid
              AND e.created_at >= :start_ts AND e.created_at < :end_ts
        WHERE ep.org_id = :org_id
          {params['podcast_clause']}
        GROUP BY ep.id, ep.episode_number
        ORDER BY ep.episode_number
        LIMIT :limit
        """,
        params,
    )
    data = [
        {"name": _episode_label(row[0], ""), "length": int(row[1] or 0), "listened": int(row[2] or 0)}
        for row in rows
    ]
    return bars_card(
        "Episode length vs listened",
        data,
        "name",
        [
            {"key": "length", "name": "Episode length"},
            {"key": "listened", "name": "Avg listened"},
        ],
        fmt="minutes",
    )


def _series_progress(session, params) -> dict[str, Any]:
    """How far through the series each listener got → 4 quartile buckets."""
    rows = _rows(
        session,
        f"""
        WITH per_listener AS (
            SELECT s.user_id,
                   COUNT(DISTINCT s.episode_id) FILTER (WHERE s.complete) AS done
            FROM trailstep s
            JOIN podcastepisode ep ON ep.id = s.episode_id
            JOIN podcast p ON p.id = ep.podcast_id
            WHERE s.org_id = :org_id
              AND s.episode_id IS NOT NULL
              AND NULLIF(s.creation_date, '') IS NOT NULL
              AND s.creation_date >= :start AND s.creation_date < :end
              {params['podcast_clause']}
            GROUP BY s.user_id
        ),
        series AS (
            SELECT COUNT(*) AS total
            FROM podcastepisode ep
            JOIN podcast p ON p.id = ep.podcast_id
            WHERE ep.org_id = :org_id
              {params['podcast_clause']}
        )
        SELECT LEAST(3, FLOOR(100.0 * pl.done / GREATEST(series.total, 1) / 25))::int AS bucket,
               COUNT(*) AS listeners
        FROM per_listener pl, series
        GROUP BY 1
        """,
        params,
    )
    by_bin = {int(row[0]): int(row[1] or 0) for row in rows}
    labels = ["0–25%", "25–50%", "50–75%", "75–100%"]
    data = [{"name": labels[i], "value": by_bin.get(i, 0)} for i in range(4)]
    return bars_card("Series progress", data, "name", [{"key": "value", "name": "Listeners"}])


def _episodes(session, params) -> dict[str, Any]:
    rows = _rows(
        session,
        f"""
        SELECT ep.title,
               ep.published,
               ep.duration_seconds,
               COUNT(s.id) AS plays,
               COUNT(DISTINCT s.user_id) AS started,
               COUNT(DISTINCT s.user_id) FILTER (WHERE s.complete) AS completed
        FROM podcastepisode ep
        JOIN podcast p ON p.id = ep.podcast_id
        LEFT JOIN trailstep s ON s.episode_id = ep.id AND s.org_id = :org_id
        WHERE ep.org_id = :org_id
          {params['podcast_clause']}
        GROUP BY ep.id, ep.episode_number
        ORDER BY ep.episode_number
        LIMIT :episode_limit
        """,
        params,
    )
    data = [
        {
            "title": row[0],
            "status": "Published" if row[1] else "Draft",
            "duration": _pretty_duration(row[2]),
            "plays": int(row[3] or 0),
            "completion": round(100 * int(row[5] or 0) / int(row[4])) if row[4] else 0,
        }
        for row in rows
    ]
    return table_card("", _EPISODE_COLUMNS, data)
