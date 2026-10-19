"""Monthly payout report for the Payments -> Payouts tab.

Business rules (see docs/08-features/payments/teacher-payout-plan.md):

- Gross revenue = paid orders whose ``paid_at`` falls inside the month.
- Costs = gateway fees (from the orders) + manually entered operating costs.
- Net profit = max(0, gross - costs).
- Teacher pool = 40% of net profit, platform pool = the rest.
- A teacher's payout is their attributed revenue / total gross revenue × the
  teacher pool (pro-rata by revenue contribution).

Revenue attribution:

- A course order belongs to that course.
- A collection order is split evenly across the member courses snapshotted in
  ``price_snapshot["courses"]`` (membership may have changed since).
- Each course's share goes to its active MAINTAINERs, falling back to its
  CREATOR(s); content with no authors is unattributed (platform keeps it).
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import HTTPException, Request
from sqlmodel import Session, select

from src.db.payments.enums import PaymentOrderStatusEnum
from src.db.payments.payment_orders import PaymentOrder
from src.db.payments.payout_costs import PayoutCost
from src.db.resource_authors import (
    ResourceAuthor,
    ResourceAuthorshipEnum,
    ResourceAuthorshipStatusEnum,
)
from src.db.users import AnonymousUser, APITokenUser, PublicUser, User
from src.services.payments.entitlements import authorize_org_admin

TEACHER_SHARE = 0.40
COST_FIELDS = ("hosting", "marketing", "other")


def _round(value: float) -> int:
    """Half-up rounding that mirrors Math.round in the dashboard."""
    return int(value + 0.5)


def _parse_month(value: Optional[str]) -> tuple[str, datetime, datetime]:
    token = value or datetime.now().strftime("%Y-%m")
    try:
        start = datetime.strptime(token, "%Y-%m")
    except ValueError:
        raise HTTPException(
            status_code=422, detail="Month must be formatted as YYYY-MM"
        )

    if start.month == 12:
        end = datetime(start.year + 1, 1, 1)
    else:
        end = datetime(start.year, start.month + 1, 1)
    return token, start, end


def _load_teachers(
    db_session: Session, resource_uuids: list[str]
) -> dict[str, list[int]]:
    """Resolve the payout owner(s) for each resource.

    MAINTAINERs win when present; otherwise CREATORs. Contributors and
    reporters never receive payouts.
    """
    if not resource_uuids:
        return {}

    rows = db_session.exec(
        select(ResourceAuthor).where(
            ResourceAuthor.resource_uuid.in_(resource_uuids),  # type: ignore[attr-defined]
            ResourceAuthor.authorship_status == ResourceAuthorshipStatusEnum.ACTIVE,
        )
    ).all()

    maintainers: dict[str, list[int]] = {}
    creators: dict[str, list[int]] = {}
    for row in rows:
        if row.authorship == ResourceAuthorshipEnum.MAINTAINER:
            maintainers.setdefault(row.resource_uuid, []).append(row.user_id)
        elif row.authorship == ResourceAuthorshipEnum.CREATOR:
            creators.setdefault(row.resource_uuid, []).append(row.user_id)

    resolved: dict[str, list[int]] = {}
    for uuid in resource_uuids:
        owners = maintainers.get(uuid) or creators.get(uuid) or []
        # De-duplicate while keeping a deterministic order.
        resolved[uuid] = sorted(set(owners))
    return resolved


def _load_users(db_session: Session, user_ids: list[int]) -> dict[int, User]:
    if not user_ids:
        return {}
    rows = db_session.exec(select(User).where(User.id.in_(user_ids))).all()  # type: ignore[attr-defined]
    return {int(user.id): user for user in rows if user.id is not None}


def _order_units(order: PaymentOrder) -> list[str]:
    """Split an order into the content units its revenue is attributed to."""
    if order.resource_type == "collection":
        snapshot = order.price_snapshot or {}
        members = snapshot.get("courses") or []
        return [uuid for uuid in members if isinstance(uuid, str)]
    if order.resource_uuid:
        return [order.resource_uuid]
    return []


def _entry(
    db_session: Session, org_id: int, month: str, create: bool
) -> Optional[PayoutCost]:
    row = db_session.exec(
        select(PayoutCost).where(
            PayoutCost.org_id == org_id,
            PayoutCost.month == month,
        )
    ).first()
    if row or not create:
        return row

    now = str(datetime.now())
    row = PayoutCost(
        org_id=org_id,
        month=month,
        hosting=0,
        marketing=0,
        other=0,
        creation_date=now,
        update_date=now,
    )
    db_session.add(row)
    return row


def _build_report(db_session: Session, org_id: int, month: str) -> dict:
    token, start, end = _parse_month(month)

    orders = db_session.exec(
        select(PaymentOrder).where(
            PaymentOrder.org_id == org_id,
            PaymentOrder.status == PaymentOrderStatusEnum.PAID,
            PaymentOrder.paid_at.is_not(None),
            PaymentOrder.paid_at >= start,
            PaymentOrder.paid_at < end,
        )
    ).all()

    gross_revenue = sum(int(order.amount or 0) for order in orders)
    gateway_fees = 0
    for order in orders:
        # `fees_on_merchant` is the part the merchant actually pays; fall back
        # to the total gateway fee when Chargily did not split it.
        fee = int(order.fees_on_merchant or 0) or int(order.fees or 0)
        gateway_fees += max(0, fee)

    allocations: list[tuple[str, int]] = []
    for order in orders:
        units = _order_units(order)
        if not units:
            continue
        amount = int(order.amount or 0)
        base, remainder = divmod(amount, len(units))
        for index, uuid in enumerate(units):
            allocations.append((uuid, base + (1 if index < remainder else 0)))

    teacher_map = _load_teachers(
        db_session, sorted({uuid for uuid, _ in allocations})
    )

    per_teacher: dict[int, dict] = {}
    attributed_revenue = 0
    for uuid, amount in allocations:
        owners = teacher_map.get(uuid) or []
        if not owners:
            continue
        attributed_revenue += amount
        base, remainder = divmod(amount, len(owners))
        for index, user_id in enumerate(owners):
            entry = per_teacher.setdefault(
                user_id, {"gross": 0, "courses": set()}
            )
            entry["gross"] += base + (1 if index < remainder else 0)
            entry["courses"].add(uuid)

    cost_row = _entry(db_session, org_id, token, create=False)
    manual_costs = {
        field: int(getattr(cost_row, field) or 0) if cost_row else 0
        for field in COST_FIELDS
    }
    total_costs = gateway_fees + sum(manual_costs.values())
    net_profit = max(0, gross_revenue - total_costs)
    teacher_pool = _round(net_profit * TEACHER_SHARE)
    platform_pool = net_profit - teacher_pool

    users = _load_users(db_session, sorted(per_teacher))

    teachers: list[dict] = []
    for user_id, data in per_teacher.items():
        share = (data["gross"] / gross_revenue) if gross_revenue else 0.0
        user = users.get(user_id)
        name = " ".join(
            part for part in [getattr(user, "first_name", ""), getattr(user, "last_name", "")] if part
        ).strip()
        teachers.append(
            {
                "user_id": user_id,
                "name": name or (getattr(user, "username", "") or f"User {user_id}"),
                "email": getattr(user, "email", "") or "",
                "courses": len(data["courses"]),
                "gross": data["gross"],
                "share": share,
                "payout": _round(teacher_pool * share),
            }
        )
    teachers.sort(key=lambda item: item["payout"], reverse=True)

    return {
        "month": token,
        "currency": "DZD",
        "gross_revenue": gross_revenue,
        "gateway_fees": gateway_fees,
        "manual_costs": manual_costs,
        "total_costs": total_costs,
        "net_profit": net_profit,
        "teacher_share_percent": int(TEACHER_SHARE * 100),
        "teacher_pool": teacher_pool,
        "platform_pool": platform_pool,
        "attributed_revenue": attributed_revenue,
        "unattributed_revenue": max(0, gross_revenue - attributed_revenue),
        "order_count": len(orders),
        "teachers": teachers,
    }


async def get_payout_report(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    db_session: Session,
    month: Optional[str] = None,
) -> dict:
    await authorize_org_admin(current_user, org_id, db_session)
    return _build_report(db_session, org_id, month or datetime.now().strftime("%Y-%m"))


async def update_payout_costs(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    month: str,
    costs: dict,
    db_session: Session,
) -> dict:
    await authorize_org_admin(current_user, org_id, db_session)
    token, _, _ = _parse_month(month)

    cleaned: dict[str, int] = {}
    for field in COST_FIELDS:
        value = int(costs.get(field) or 0)
        if value < 0:
            raise HTTPException(
                status_code=422, detail=f"{field} cannot be negative"
            )
        cleaned[field] = value

    row = _entry(db_session, org_id, token, create=True)
    assert row is not None
    for field, value in cleaned.items():
        setattr(row, field, value)
    row.update_date = str(datetime.now())
    db_session.add(row)
    db_session.commit()

    return _build_report(db_session, org_id, token)
