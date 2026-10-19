"""Revenue aggregates for the Payments -> Overview tab.

Only `paid` orders contribute. `paid_at` is a real datetime column (unlike the
VARCHAR dates used by the analytics tabs), so buckets are filled in Python —
this keeps the query portable between PostgreSQL and the SQLite test database.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import Request
from sqlmodel import Session, select

from src.db.payments.enums import PaymentOrderStatusEnum
from src.db.payments.payment_orders import PaymentOrder
from src.db.users import AnonymousUser, APITokenUser, PublicUser
from src.services.analytics.tabs._shared import (
    DEFAULT_RANGE,
    RANGE_DAYS,
    bucket_key,
    bucket_label,
    bucket_starts,
    parse_range,
)
from src.services.payments.entitlements import authorize_org_admin


def _naive_utc(value: datetime) -> datetime:
    """Normalise to naive UTC so it can be bucketed next to `bucket_starts`."""
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _month_buckets(end: datetime) -> list[datetime]:
    """The last 12 calendar months, oldest first — 12 unique axis labels."""
    cursor = end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    buckets: list[datetime] = []
    for _ in range(12):
        buckets.append(cursor)
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    return list(reversed(buckets))


async def get_payments_overview(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    db_session: Session,
    range_token: str = DEFAULT_RANGE,
) -> dict:
    await authorize_org_admin(current_user, org_id, db_session)

    token = range_token if range_token in RANGE_DAYS else DEFAULT_RANGE
    days, granularity = parse_range(token)

    end = datetime.now(timezone.utc).replace(tzinfo=None)
    if granularity == "month":
        buckets = _month_buckets(end)
        start = buckets[0]
    else:
        start = end - timedelta(days=days)
        buckets = bucket_starts(days, granularity, end)

    orders = db_session.exec(
        select(PaymentOrder).where(
            PaymentOrder.org_id == org_id,
            PaymentOrder.status == PaymentOrderStatusEnum.PAID,
            PaymentOrder.paid_at.is_not(None),
            PaymentOrder.paid_at >= start,
            PaymentOrder.paid_at < end,
        )
    ).all()

    revenue = 0
    by_bucket: dict[str, dict[str, int]] = {}
    for order in orders:
        if order.paid_at is None:
            continue
        amount = int(order.amount or 0)
        revenue += amount
        key = bucket_key(_naive_utc(order.paid_at), granularity)
        bucket = by_bucket.setdefault(key, {"revenue": 0})
        bucket["revenue"] += amount

    series = [
        {
            "label": bucket_label(bucket, granularity),
            "revenue": by_bucket.get(bucket_key(bucket, granularity), {}).get("revenue", 0),
        }
        for bucket in buckets
    ]

    return {
        "range": token,
        "currency": "DZD",
        "revenue": revenue,
        "series": series,
    }
