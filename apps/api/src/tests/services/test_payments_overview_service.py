"""Service tests for the Payments overview revenue aggregate."""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest

from src.db.payments.enums import PaymentOrderStatusEnum
from src.db.payments.payment_orders import PaymentOrder
from src.services.payments.overview import get_payments_overview


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _make_order(
    db,
    org,
    user_id: int,
    *,
    order_uuid: str,
    amount: int,
    status: PaymentOrderStatusEnum = PaymentOrderStatusEnum.PAID,
    paid_at: datetime | None = None,
) -> PaymentOrder:
    order = PaymentOrder(
        order_uuid=order_uuid,
        org_id=org.id,
        user_id=user_id,
        resource_uuid="course_test",
        resource_type="course",
        resource_name="Test Course",
        amount=amount,
        currency="DZD",
        status=status,
        paid_at=paid_at,
        creation_date="2026-10-18T10:00:00",
        update_date="2026-10-18T10:00:00",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@pytest.fixture
def authorized(org, admin_user):
    with patch(
        "src.services.payments.overview.authorize_org_admin",
        new_callable=AsyncMock,
        return_value=(org, admin_user.id),
    ) as mock:
        yield mock


class TestPaymentsOverview:
    async def test_sums_paid_orders_and_fills_every_day(
        self, db, org, admin_user, regular_user, authorized, mock_request
    ):
        now = _utc_now()
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_yesterday",
            amount=1500,
            paid_at=now - timedelta(days=1),
        )
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_today",
            amount=2500,
            paid_at=now - timedelta(hours=2),
        )

        result = await get_payments_overview(
            mock_request, admin_user, org.id, db, range_token="7d"
        )

        assert result["range"] == "7d"
        assert result["currency"] == "DZD"
        assert result["revenue"] == 4000
        # 7-day window → 8 contiguous daily buckets (including today).
        assert len(result["series"]) == 8
        assert sum(point["revenue"] for point in result["series"]) == 4000
        assert all("label" in point for point in result["series"])

    async def test_ignores_unpaid_and_out_of_range_orders(
        self, db, org, admin_user, regular_user, authorized, mock_request
    ):
        now = _utc_now()
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_in_range",
            amount=2000,
            paid_at=now - timedelta(days=2),
        )
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_failed",
            amount=9000,
            status=PaymentOrderStatusEnum.FAILED,
            paid_at=now - timedelta(days=2),
        )
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_pending",
            amount=7000,
            status=PaymentOrderStatusEnum.PENDING,
        )
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_too_old",
            amount=5000,
            paid_at=now - timedelta(days=45),
        )

        result = await get_payments_overview(
            mock_request, admin_user, org.id, db, range_token="30d"
        )

        assert result["revenue"] == 2000

    async def test_paid_order_without_paid_at_is_ignored(
        self, db, org, admin_user, regular_user, authorized, mock_request
    ):
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_no_paid_at",
            amount=3000,
            paid_at=None,
        )

        result = await get_payments_overview(
            mock_request, admin_user, org.id, db, range_token="30d"
        )

        assert result["revenue"] == 0

    async def test_twelve_months_uses_monthly_buckets(
        self, db, org, admin_user, regular_user, authorized, mock_request
    ):
        now = _utc_now()
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_recent",
            amount=1200,
            paid_at=now - timedelta(days=5),
        )

        result = await get_payments_overview(
            mock_request, admin_user, org.id, db, range_token="12m"
        )

        assert result["revenue"] == 1200
        assert len(result["series"]) == 12
        labels = [point["label"] for point in result["series"]]
        assert len(labels) == len(set(labels))

    async def test_orders_are_isolated_per_org(
        self, db, org, other_org, admin_user, regular_user, authorized, mock_request
    ):
        _make_order(
            db,
            other_org,
            regular_user.id,
            order_uuid="order_other_org",
            amount=8000,
            paid_at=_utc_now() - timedelta(days=1),
        )

        result = await get_payments_overview(
            mock_request, admin_user, org.id, db, range_token="30d"
        )

        assert result["revenue"] == 0

    async def test_unknown_range_falls_back_to_thirty_days(
        self, db, org, admin_user, authorized, mock_request
    ):
        result = await get_payments_overview(
            mock_request, admin_user, org.id, db, range_token="nonsense"
        )

        assert result["range"] == "30d"
