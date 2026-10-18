"""Service tests for the org payment orders list."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from src.db.payments.enums import PaymentOrderStatusEnum
from src.db.payments.payment_orders import PaymentOrder
from src.services.payments.orders import list_org_orders


def _make_order(db, org, user_id: int, **overrides) -> PaymentOrder:
    order = PaymentOrder(
        order_uuid=overrides.pop("order_uuid", "order_test"),
        org_id=org.id,
        user_id=user_id,
        resource_uuid=overrides.pop("resource_uuid", "course_test"),
        resource_type="course",
        resource_name=overrides.pop("resource_name", "Test Course"),
        amount=overrides.pop("amount", 1500),
        currency="DZD",
        status=overrides.pop("status", PaymentOrderStatusEnum.PAID),
        creation_date=overrides.pop("creation_date", "2026-10-18T10:00:00"),
        update_date="2026-10-18T10:00:00",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@pytest.fixture
def authorized(org, admin_user):
    with patch(
        "src.services.payments.orders.authorize_org_admin",
        new_callable=AsyncMock,
        return_value=(org, admin_user.id),
    ) as mock:
        yield mock


class TestOrgOrders:
    async def test_lists_orders_with_user_and_amount(
        self, db, org, admin_user, regular_user, authorized, mock_request
    ):
        _make_order(db, org, regular_user.id)

        result = await list_org_orders(mock_request, admin_user, org.id, db)

        assert result["total"] == 1
        item = result["items"][0]
        assert item["order_uuid"] == "order_test"
        assert item["status"] == "paid"
        assert item["amount"] == 1500
        assert item["currency"] == "DZD"
        assert item["user"]["username"] == "regular"
        assert item["resource_name"] == "Test Course"

    async def test_filters_by_status(
        self, db, org, admin_user, regular_user, authorized, mock_request
    ):
        _make_order(db, org, regular_user.id, order_uuid="order_paid")
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_failed",
            status=PaymentOrderStatusEnum.FAILED,
        )

        paid = await list_org_orders(
            mock_request, admin_user, org.id, db, status="paid"
        )
        assert paid["total"] == 1
        assert paid["items"][0]["order_uuid"] == "order_paid"

        failed = await list_org_orders(
            mock_request, admin_user, org.id, db, status="failed"
        )
        assert failed["total"] == 1
        assert failed["items"][0]["order_uuid"] == "order_failed"

    async def test_search_matches_user_and_resource(
        self, db, org, admin_user, regular_user, authorized, mock_request
    ):
        _make_order(db, org, regular_user.id)

        by_user = await list_org_orders(
            mock_request, admin_user, org.id, db, search="regular"
        )
        assert by_user["total"] == 1

        by_resource = await list_org_orders(
            mock_request, admin_user, org.id, db, search="Test Course"
        )
        assert by_resource["total"] == 1

        none = await list_org_orders(
            mock_request, admin_user, org.id, db, search="nobody"
        )
        assert none["total"] == 0

    async def test_orders_are_isolated_per_org(
        self, db, org, other_org, admin_user, regular_user, authorized, mock_request
    ):
        _make_order(db, other_org, regular_user.id, order_uuid="order_other_org")

        result = await list_org_orders(mock_request, admin_user, org.id, db)
        assert result["total"] == 0

    async def test_unknown_status_is_rejected(
        self, db, org, admin_user, authorized, mock_request
    ):
        with pytest.raises(HTTPException) as exc:
            await list_org_orders(
                mock_request, admin_user, org.id, db, status="not-a-status"
            )
        assert exc.value.status_code == 422
