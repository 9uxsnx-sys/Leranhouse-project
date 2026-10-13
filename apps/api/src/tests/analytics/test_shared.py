"""Unit tests for the pure helpers in `tabs/_shared.py`.

These need no database: they lock the range/bucketing contract and the card
payload shape that every tab and the frontend depend on. They run everywhere,
including on the SQLite-only CI.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from src.services.analytics.tabs._shared import (
    bars_card,
    bucket_expr,
    bucket_key,
    bucket_label,
    bucket_starts,
    date_bounds,
    format_number,
    has_date,
    merge_series,
    parse_range,
    ranked_card,
    table_card,
    trend_card,
    window,
)

END = datetime(2026, 3, 10, 15, 30, tzinfo=timezone.utc)


# ---------------------------------------------------------------------------
# Range parsing
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "token,expected",
    [
        ("7d", (7, "day")),
        ("30d", (30, "day")),
        ("90d", (90, "day")),
        ("12m", (365, "month")),
    ],
)
def test_parse_range_known_tokens(token, expected):
    assert parse_range(token) == expected


@pytest.mark.parametrize("token", [None, "", "  ", "bogus", "13d"])
def test_parse_range_unknown_falls_back_to_30d(token):
    assert parse_range(token) == (30, "day")


def test_parse_range_strips_whitespace():
    assert parse_range(" 7d ") == (7, "day")


# ---------------------------------------------------------------------------
# Window / dates
# ---------------------------------------------------------------------------
def test_window_is_half_open_and_ends_at_given_point():
    start, end = window(7, END)
    assert end == END
    assert (end - start).days == 7


def test_date_bounds_upper_bound_is_the_next_day():
    """The exclusive end is tomorrow so rows created *today* are never dropped."""
    start, end = date_bounds(7, END)
    assert start == "2026-03-03"
    assert end == "2026-03-11"


# ---------------------------------------------------------------------------
# Bucketing
# ---------------------------------------------------------------------------
def test_bucket_expr_casts_through_nullif():
    assert bucket_expr("creation_date", "day") == (
        "date_trunc('day', NULLIF(creation_date, '')::timestamp)"
    )
    assert bucket_expr("x", "month") == "date_trunc('month', NULLIF(x, '')::timestamp)"


def test_bucket_expr_rejects_unknown_granularity():
    with pytest.raises(ValueError):
        bucket_expr("x", "week")  # type: ignore[arg-type]


def test_has_date_guards_empty_strings():
    assert has_date("creation_date") == "NULLIF(creation_date, '') IS NOT NULL"


def test_bucket_starts_daily_is_contiguous_and_inclusive():
    starts = bucket_starts(2, "day", END)
    assert [s.strftime("%Y-%m-%d") for s in starts] == [
        "2026-03-08",
        "2026-03-09",
        "2026-03-10",
    ]


def test_bucket_starts_monthly_spans_the_window():
    starts = bucket_starts(365, "month", END)
    assert starts[0].strftime("%Y-%m") == "2025-03"
    assert starts[-1].strftime("%Y-%m") == "2026-03"
    assert len(starts) == 13
    assert all(s.day == 1 for s in starts)


def test_bucket_key_and_label_per_granularity():
    moment = datetime(2026, 3, 3, 9, 0, tzinfo=timezone.utc)
    assert bucket_key(moment, "day") == "2026-03-03"
    assert bucket_label(moment, "day") == "03 Mar"
    assert bucket_key(moment, "month") == "2026-03"
    assert bucket_label(moment, "month") == "Mar"


def test_bucket_key_accepts_iso_strings_too():
    assert bucket_key("2026-03-03T09:00:00", "day") == "2026-03-03"


# ---------------------------------------------------------------------------
# Series merge
# ---------------------------------------------------------------------------
def test_merge_series_fills_gaps_with_defaults():
    buckets = [datetime(2026, 3, 8), datetime(2026, 3, 9)]
    rows_by_key = {"2026-03-09": {"value": 5}}
    points = merge_series(buckets, "day", rows_by_key, {"value": 0})
    assert [p["value"] for p in points] == [0, 5]
    assert [p["label"] for p in points] == ["08 Mar", "09 Mar"]


def test_merge_series_overlays_every_declared_series():
    buckets = [datetime(2026, 3, 9)]
    points = merge_series(buckets, "day", {"2026-03-09": {"a": 1}}, {"a": 0, "b": 0})
    assert points[0] == {"label": "09 Mar", "a": 1, "b": 0}


# ---------------------------------------------------------------------------
# Card payload contract
# ---------------------------------------------------------------------------
def test_trend_card_shape():
    card = trend_card("T", [], "label", [{"key": "a", "name": "A"}])
    assert card == {
        "title": "T",
        "kind": "trend",
        "format": "number",
        "data": [],
        "xKey": "label",
        "series": [{"key": "a", "name": "A"}],
    }


def test_bars_card_shape():
    card = bars_card("T", [], "name", [{"key": "v", "name": "V"}], fmt="percent")
    assert card["kind"] == "bars"
    assert card["format"] == "percent"
    assert card["xKey"] == "name"


def test_ranked_card_shape():
    card = ranked_card("T", [], "name", "value", fmt="minutes")
    assert card["kind"] == "ranked"
    assert card["categoryKey"] == "name"
    assert card["valueKey"] == "value"
    assert card["format"] == "minutes"


def test_table_card_shape_and_extra_props():
    card = table_card("T", [{"key": "a"}], [{"a": 1}], page=2, pageSize=50, total=99)
    assert card["kind"] == "table"
    assert card["format"] == "number"
    assert card["columns"] == [{"key": "a"}]
    assert card["rows"] == [{"a": 1}]
    assert card["page"] == 2 and card["pageSize"] == 50 and card["total"] == 99


def test_heading_is_omitted_when_absent_and_kept_when_present():
    assert "heading" not in trend_card("T", [], "x", [])
    assert trend_card("T", [], "x", [], heading="H")["heading"] == "H"


# ---------------------------------------------------------------------------
# Display formatting
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "value,expected",
    [
        (0, "0"),
        (42, "42"),
        (999, "999"),
        (1000, "1k"),
        (1500, "1.5k"),
        (2_000_000, "2M"),
        (3_400_000, "3.4M"),
        ("oops", "oops"),
    ],
)
def test_format_number(value, expected):
    assert format_number(value) == expected
