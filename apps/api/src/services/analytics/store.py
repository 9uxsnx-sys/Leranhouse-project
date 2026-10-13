"""Persist Tier-B analytics events to PostgreSQL.

`analytics_events` is the read source for the org-wide Analytics area at
/dash/analytics. The legacy per-course suite keeps reading Tinybird, so both
destinations are written — see docs/08-features/analytics/implementation-plan.md
(§3 for the schema, §6 Phase 2 for the dual-write rationale).
"""

from __future__ import annotations

import re
from typing import Optional

from sqlmodel import Session

from src.db.analytics_events import AnalyticsEvent

# Lightweight UA parse — keeps the dependency list unchanged.
_TABLET_RE = re.compile(r"iPad|Tablet", re.IGNORECASE)
_MOBILE_RE = re.compile(r"Mobile|Android|iPhone|iPod", re.IGNORECASE)
_BROWSERS = (
    ("Edge", re.compile(r"Edg/", re.IGNORECASE)),
    ("Chrome", re.compile(r"Chrome/", re.IGNORECASE)),
    ("Safari", re.compile(r"Safari/", re.IGNORECASE)),
    ("Firefox", re.compile(r"Firefox/", re.IGNORECASE)),
)


def parse_user_agent(user_agent: str) -> tuple[Optional[str], Optional[str]]:
    """Return ``(device, browser)`` from a raw User-Agent header."""
    if not user_agent:
        return None, None

    if _TABLET_RE.search(user_agent):
        device = "tablet"
    elif _MOBILE_RE.search(user_agent):
        device = "mobile"
    else:
        device = "desktop"

    browser = next((name for name, pattern in _BROWSERS if pattern.search(user_agent)), None)
    return device, browser


def _duration_ms(properties: dict) -> Optional[int]:
    """`time_on_activity` reports `seconds_spent`; the column is milliseconds."""
    seconds = properties.get("seconds_spent")
    if seconds is None:
        return None
    try:
        value = int(float(seconds) * 1000)
    except (TypeError, ValueError):
        return None
    return value if value > 0 else None


def record_event(
    db_session: Session,
    *,
    org_id: int,
    event_name: str,
    session_id: str = "",
    user_id: Optional[int] = None,
    visitor_id: str = "",
    properties: Optional[dict] = None,
    user_agent: str = "",
) -> AnalyticsEvent:
    """Insert one event row. Returns the persisted model.

    The caller owns error handling: this writes to the request's session so a
    failure surfaces instead of silently losing data.
    """
    props = dict(properties or {})
    device, browser = parse_user_agent(user_agent)

    row = AnalyticsEvent(
        org_id=org_id,
        user_id=user_id,
        # Fallback keeps the NOT NULL contract for older clients that don't send one.
        visitor_id=visitor_id or (f"user_{user_id}" if user_id else "anonymous"),
        session_id=session_id or "",
        event_name=event_name,
        path=props.get("path"),
        referrer=props.get("referrer"),
        device=device,
        browser=browser,
        duration_ms=_duration_ms(props),
        properties=props,
    )
    db_session.add(row)
    db_session.commit()
    db_session.refresh(row)
    return row
