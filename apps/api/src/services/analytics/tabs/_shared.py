"""Shared helpers for the analytics tab queries.

Contract: docs/08-features/analytics/implementation-plan.md
- §1 conventions (dates are VARCHAR and may be '' → always NULLIF before casting)
- §2 the card payload shape every builder below produces

A card is self-describing: `kind` picks the frontend component and the rest of
the object *is* that component's props, so the tab bodies stay dumb.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

Granularity = Literal["day", "month"]
CardFormat = Literal["number", "percent", "minutes"]

RANGE_DAYS: dict[str, int] = {"7d": 7, "30d": 30, "90d": 90, "12m": 365}
DEFAULT_RANGE = "30d"

_ALLOWED_GRANULARITY = ("day", "month")


# ---------------------------------------------------------------------------
# Range + bucketing
# ---------------------------------------------------------------------------
def parse_range(value: str | None) -> tuple[int, Granularity]:
    """`(days, granularity)` for a range token. Unknown tokens fall back to 30d."""
    token = (value or "").strip()
    days = RANGE_DAYS.get(token, RANGE_DAYS[DEFAULT_RANGE])
    granularity: Granularity = "month" if token == "12m" else "day"
    return days, granularity


def window(days: int, end: datetime | None = None) -> tuple[datetime, datetime]:
    """Half-open `[start, end)` window ending now."""
    end = end or datetime.now(timezone.utc)
    return end - timedelta(days=days), end


def as_date(value: datetime) -> str:
    """`YYYY-MM-DD` — safe to compare lexicographically against the VARCHAR dates."""
    return value.strftime("%Y-%m-%d")


def date_bounds(days: int, end: datetime | None = None) -> tuple[str, str]:
    """Half-open date window as strings: ``[start_date, end_exclusive_date)``.

    The exclusive upper bound is the **next** day on purpose: the columns hold
    ISO-8601 strings that carry a time component, so comparing against today's
    date would silently exclude every row created today.
    """
    end = end or datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    return as_date(start), as_date(end + timedelta(days=1))


def bucket_expr(column: str, granularity: Granularity) -> str:
    """`date_trunc` over a VARCHAR date column that may hold an empty string.

    `column` is always an internal constant, never user input.
    """
    if granularity not in _ALLOWED_GRANULARITY:
        raise ValueError(f"unsupported granularity: {granularity}")
    return f"date_trunc('{granularity}', NULLIF({column}, '')::timestamp)"


def has_date(column: str) -> str:
    """Predicate matching rows whose date column is actually populated."""
    return f"NULLIF({column}, '') IS NOT NULL"


def bucket_starts(
    days: int, granularity: Granularity, end: datetime | None = None
) -> list[datetime]:
    """Contiguous bucket starts, oldest → newest, covering the window."""
    end = end or datetime.now(timezone.utc)
    start, _ = window(days, end)

    if granularity == "month":
        cursor = start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last = end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        starts: list[datetime] = []
        while cursor <= last:
            starts.append(cursor)
            cursor = (cursor + timedelta(days=32)).replace(day=1)
        return starts

    cursor = start.replace(hour=0, minute=0, second=0, microsecond=0)
    last = end.replace(hour=0, minute=0, second=0, microsecond=0)
    starts = []
    while cursor <= last:
        starts.append(cursor)
        cursor += timedelta(days=1)
    return starts


def _as_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value))


def bucket_key(value: Any, granularity: Granularity) -> str:
    """Stable grouping key used to merge SQL rows back onto the bucket list."""
    dt = _as_datetime(value)
    return dt.strftime("%Y-%m") if granularity == "month" else dt.strftime("%Y-%m-%d")


def bucket_label(value: Any, granularity: Granularity) -> str:
    """Human label for the chart axis."""
    dt = _as_datetime(value)
    return dt.strftime("%b") if granularity == "month" else dt.strftime("%d %b")


def merge_series(
    buckets: list[datetime],
    granularity: Granularity,
    rows_by_key: dict[str, dict[str, Any]],
    defaults: dict[str, Any],
) -> list[dict[str, Any]]:
    """Right-join the SQL results onto the contiguous bucket list, filling gaps.

    `rows_by_key` must be keyed by `bucket_key(...)`, so two queries can be
    merged into the same series before calling this.
    """
    points: list[dict[str, Any]] = []
    for bucket in buckets:
        point = {"label": bucket_label(bucket, granularity)}
        point.update({name: 0 for name in defaults})
        point.update(rows_by_key.get(bucket_key(bucket, granularity), {}))
        points.append(point)
    return points


# ---------------------------------------------------------------------------
# Card payload builders — the §2 contract
# ---------------------------------------------------------------------------
def trend_card(
    title: str,
    data: list[dict[str, Any]],
    x_key: str,
    series: list[dict[str, str]],
    *,
    heading: str | None = None,
    fmt: CardFormat = "number",
) -> dict[str, Any]:
    return _card("trend", title, heading, fmt, data=data, xKey=x_key, series=series)


def bars_card(
    title: str,
    data: list[dict[str, Any]],
    x_key: str,
    series: list[dict[str, str]],
    *,
    heading: str | None = None,
    fmt: CardFormat = "number",
) -> dict[str, Any]:
    return _card("bars", title, heading, fmt, data=data, xKey=x_key, series=series)


def ranked_card(
    title: str,
    data: list[dict[str, Any]],
    category_key: str,
    value_key: str,
    *,
    heading: str | None = None,
    fmt: CardFormat = "number",
) -> dict[str, Any]:
    return _card(
        "ranked",
        title,
        heading,
        fmt,
        data=data,
        categoryKey=category_key,
        valueKey=value_key,
    )


def table_card(
    title: str,
    columns: list[dict[str, Any]],
    rows: list[dict[str, Any]],
    *,
    heading: str | None = None,
    **extra: Any,
) -> dict[str, Any]:
    """`**extra` carries card-specific props the frontend reads (e.g. pagination)."""
    return _card("table", title, heading, "number", columns=columns, rows=rows, **extra)


def _card(
    kind: str,
    title: str,
    heading: str | None,
    fmt: str,
    **payload: Any,
) -> dict[str, Any]:
    card: dict[str, Any] = {"title": title, "kind": kind, "format": fmt}
    if heading:
        card["heading"] = heading
    card.update(payload)
    return card


def format_number(value: Any) -> str:
    """Compact display number (1.2k / 3.4M) — mirrors chartTheme.formatNumber."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return str(value)
    if abs(number) >= 1_000_000:
        return f"{number / 1_000_000:.1f}M".replace(".0M", "M")
    if abs(number) >= 1_000:
        return f"{number / 1_000:.1f}k".replace(".0k", "k")
    return f"{number:g}"
