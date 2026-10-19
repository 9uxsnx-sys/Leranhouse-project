"""Service tests for the monthly payout report."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from sqlmodel import select

from src.db.payments.enums import PaymentOrderStatusEnum
from src.db.payments.payment_orders import PaymentOrder
from src.db.payments.payout_costs import PayoutCost
from src.db.resource_authors import (
    ResourceAuthor,
    ResourceAuthorshipEnum,
    ResourceAuthorshipStatusEnum,
)
from src.services.payments.payouts import get_payout_report, update_payout_costs

MONTH = "2026-10"


def _make_order(
    db,
    org,
    user_id: int,
    *,
    order_uuid: str,
    amount: int,
    resource_uuid: str = "course_test",
    resource_type: str = "course",
    price_snapshot=None,
    fees: int = 0,
    fees_on_merchant: int = 0,
    status: PaymentOrderStatusEnum = PaymentOrderStatusEnum.PAID,
    paid_at: datetime | None = datetime(2026, 10, 15, 12, 0, 0),
) -> PaymentOrder:
    order = PaymentOrder(
        order_uuid=order_uuid,
        org_id=org.id,
        user_id=user_id,
        resource_uuid=resource_uuid,
        resource_type=resource_type,
        resource_name="Sold resource",
        amount=amount,
        currency="DZD",
        price_snapshot=price_snapshot,
        fees=fees,
        fees_on_merchant=fees_on_merchant,
        status=status,
        paid_at=paid_at,
        creation_date="2026-10-15T12:00:00",
        update_date="2026-10-15T12:00:00",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def _author(
    db,
    resource_uuid: str,
    user_id: int,
    authorship: ResourceAuthorshipEnum,
    status: ResourceAuthorshipStatusEnum = ResourceAuthorshipStatusEnum.ACTIVE,
):
    db.add(
        ResourceAuthor(
            resource_uuid=resource_uuid,
            user_id=user_id,
            authorship=authorship,
            authorship_status=status,
            creation_date=str(datetime.now()),
            update_date=str(datetime.now()),
        )
    )
    db.commit()


@pytest.fixture
def authorized(org, admin_user):
    with patch(
        "src.services.payments.payouts.authorize_org_admin",
        new_callable=AsyncMock,
        return_value=(org, admin_user.id),
    ) as mock:
        yield mock


class TestPayoutReport:
    async def test_course_revenue_is_attributed_to_its_creator(
        self, db, org, admin_user, regular_user, course, authorized, mock_request
    ):
        _author(db, course.course_uuid, admin_user.id, ResourceAuthorshipEnum.CREATOR)
        _make_order(db, org, regular_user.id, order_uuid="order_1", amount=1000)

        report = await get_payout_report(
            mock_request, admin_user, org.id, db, month=MONTH
        )

        assert report["gross_revenue"] == 1000
        assert report["order_count"] == 1
        assert report["attributed_revenue"] == 1000
        assert report["unattributed_revenue"] == 0
        assert len(report["teachers"]) == 1

        teacher = report["teachers"][0]
        assert teacher["user_id"] == admin_user.id
        assert teacher["name"] == "Admin User"
        assert teacher["gross"] == 1000
        assert teacher["courses"] == 1
        assert teacher["share"] == 1.0
        # No costs → net profit = 1000 → teacher pool = 400.
        assert report["teacher_pool"] == 400
        assert report["platform_pool"] == 600
        assert teacher["payout"] == 400

    async def test_maintainer_takes_precedence_over_creator(
        self, db, org, admin_user, regular_user, course, authorized, mock_request
    ):
        _author(db, course.course_uuid, admin_user.id, ResourceAuthorshipEnum.CREATOR)
        _author(
            db, course.course_uuid, regular_user.id, ResourceAuthorshipEnum.MAINTAINER
        )
        _make_order(db, org, regular_user.id, order_uuid="order_1", amount=800)

        report = await get_payout_report(
            mock_request, admin_user, org.id, db, month=MONTH
        )

        assert [t["user_id"] for t in report["teachers"]] == [regular_user.id]
        assert report["teachers"][0]["gross"] == 800

    async def test_inactive_or_contributor_authors_are_not_paid(
        self, db, org, admin_user, regular_user, course, authorized, mock_request
    ):
        _author(
            db,
            course.course_uuid,
            admin_user.id,
            ResourceAuthorshipEnum.CREATOR,
            ResourceAuthorshipStatusEnum.INACTIVE,
        )
        _author(
            db, course.course_uuid, regular_user.id, ResourceAuthorshipEnum.CONTRIBUTOR
        )
        _make_order(db, org, regular_user.id, order_uuid="order_1", amount=800)

        report = await get_payout_report(
            mock_request, admin_user, org.id, db, month=MONTH
        )

        assert report["teachers"] == []
        assert report["unattributed_revenue"] == 800

    async def test_gateway_fees_reduce_net_profit(
        self, db, org, admin_user, regular_user, course, authorized, mock_request
    ):
        _author(db, course.course_uuid, admin_user.id, ResourceAuthorshipEnum.CREATOR)
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_fees",
            amount=1000,
            fees=100,
        )
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_merchant_fees",
            amount=2000,
            fees=400,
            fees_on_merchant=50,
        )

        report = await get_payout_report(
            mock_request, admin_user, org.id, db, month=MONTH
        )

        assert report["gross_revenue"] == 3000
        # 100 from the first order + 50 (merchant part) from the second.
        assert report["gateway_fees"] == 150
        assert report["total_costs"] == 150
        assert report["net_profit"] == 2850
        assert report["teacher_pool"] == 1140

    async def test_collection_revenue_is_split_across_members(
        self, db, org, admin_user, regular_user, course, authorized, mock_request
    ):
        from src.db.courses.courses import Course

        second = Course(
            id=2,
            name="Second Course",
            description="Another course",
            public=True,
            published=True,
            open_to_contributors=False,
            org_id=org.id,
            course_uuid="course_second",
            creation_date=str(datetime.now()),
            update_date=str(datetime.now()),
        )
        db.add(second)
        db.commit()

        _author(db, course.course_uuid, admin_user.id, ResourceAuthorshipEnum.CREATOR)
        _author(db, second.course_uuid, regular_user.id, ResourceAuthorshipEnum.CREATOR)
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_bundle",
            amount=1001,
            resource_uuid="collection_test",
            resource_type="collection",
            price_snapshot={"courses": ["course_test", "course_second"]},
        )

        report = await get_payout_report(
            mock_request, admin_user, org.id, db, month=MONTH
        )

        by_user = {t["user_id"]: t for t in report["teachers"]}
        # 1001 splits into 501 / 500 across the two members.
        assert by_user[admin_user.id]["gross"] == 501
        assert by_user[regular_user.id]["gross"] == 500
        assert report["attributed_revenue"] == 1001
        # Shares are rounded proportionally to the pool (400 for 1001 gross).
        assert report["teacher_pool"] == 400
        assert by_user[admin_user.id]["share"] == pytest.approx(501 / 1001)
        assert by_user[admin_user.id]["payout"] == 200
        assert by_user[regular_user.id]["payout"] == 200

    async def test_collection_without_snapshot_is_unattributed(
        self, db, org, admin_user, regular_user, authorized, mock_request
    ):
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_legacy_bundle",
            amount=900,
            resource_uuid="collection_legacy",
            resource_type="collection",
            price_snapshot=None,
        )

        report = await get_payout_report(
            mock_request, admin_user, org.id, db, month=MONTH
        )

        assert report["teachers"] == []
        assert report["unattributed_revenue"] == 900

    async def test_only_paid_orders_inside_the_month_count(
        self, db, org, admin_user, regular_user, course, authorized, mock_request
    ):
        _author(db, course.course_uuid, admin_user.id, ResourceAuthorshipEnum.CREATOR)
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_october",
            amount=1000,
            paid_at=datetime(2026, 10, 1, 0, 0, 0),
        )
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_september",
            amount=5000,
            paid_at=datetime(2026, 9, 30, 23, 59, 59),
        )
        _make_order(
            db,
            org,
            regular_user.id,
            order_uuid="order_failed",
            amount=7000,
            status=PaymentOrderStatusEnum.FAILED,
        )

        report = await get_payout_report(
            mock_request, admin_user, org.id, db, month=MONTH
        )

        assert report["gross_revenue"] == 1000
        assert report["order_count"] == 1

    async def test_manual_costs_are_persisted_and_reduce_the_pool(
        self, db, org, admin_user, regular_user, course, authorized, mock_request
    ):
        _author(db, course.course_uuid, admin_user.id, ResourceAuthorshipEnum.CREATOR)
        _make_order(db, org, regular_user.id, order_uuid="order_1", amount=10000)

        report = await update_payout_costs(
            mock_request,
            admin_user,
            org.id,
            MONTH,
            {"hosting": 1000, "marketing": 2000, "other": 500},
            db,
        )

        assert report["manual_costs"] == {
            "hosting": 1000,
            "marketing": 2000,
            "other": 500,
        }
        assert report["total_costs"] == 3500
        assert report["net_profit"] == 6500
        assert report["teacher_pool"] == 2600
        assert report["platform_pool"] == 3900

        stored = db.exec(select(PayoutCost)).one()
        assert stored.month == MONTH

        # A second update mutates the same row.
        await update_payout_costs(
            mock_request,
            admin_user,
            org.id,
            MONTH,
            {"hosting": 0, "marketing": 0, "other": 0},
            db,
        )
        rows = db.exec(select(PayoutCost)).all()
        assert len(rows) == 1
        assert rows[0].hosting == 0

    async def test_negative_costs_are_rejected(
        self, db, org, admin_user, authorized, mock_request
    ):
        with pytest.raises(HTTPException) as exc_info:
            await update_payout_costs(
                mock_request,
                admin_user,
                org.id,
                MONTH,
                {"hosting": -1},
                db,
            )

        assert exc_info.value.status_code == 422

    async def test_invalid_month_is_rejected(
        self, db, org, admin_user, authorized, mock_request
    ):
        with pytest.raises(HTTPException) as exc_info:
            await get_payout_report(
                mock_request, admin_user, org.id, db, month="nonsense"
            )

        assert exc_info.value.status_code == 422

    async def test_empty_month_returns_zeroed_report(
        self, db, org, admin_user, authorized, mock_request
    ):
        report = await get_payout_report(
            mock_request, admin_user, org.id, db, month=MONTH
        )

        assert report["gross_revenue"] == 0
        assert report["net_profit"] == 0
        assert report["teacher_pool"] == 0
        assert report["teachers"] == []
