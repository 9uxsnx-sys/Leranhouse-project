"""Service tests for paid resource entitlements (manual grant / revoke)."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from sqlmodel import select

from src.db.payments.enums import (
    EntitlementSourceEnum,
    EntitlementStatusEnum,
    PaymentOrderStatusEnum,
)
from src.db.payments.payment_orders import PaymentOrder
from src.db.payments.resource_entitlements import ResourceEntitlement
from src.services.payments.entitlements import (
    bulk_grant_entitlements,
    bulk_revoke_entitlements,
    list_entitlement_candidates,
    list_resource_entitlements,
)

COURSE_UUID = "course_test"


@pytest.fixture
def authorized(org, admin_user):
    with patch(
        "src.services.payments.entitlements.authorize_org_admin",
        new_callable=AsyncMock,
        return_value=(org, admin_user.id),
    ) as mock:
        yield mock


class TestResourceEntitlements:
    async def test_grant_list_and_revoke_roundtrip(
        self, db, org, course, admin_user, regular_user, authorized, mock_request
    ):
        before = await list_resource_entitlements(
            mock_request, admin_user, org.id, COURSE_UUID, db
        )
        assert before["total"] == 0

        candidates = await list_entitlement_candidates(
            mock_request, admin_user, org.id, COURSE_UUID, db
        )
        assert candidates["total"] == 2

        granted = await bulk_grant_entitlements(
            mock_request, admin_user, org.id, COURSE_UUID, [regular_user.id], db
        )
        assert granted == {"granted": [regular_user.id], "already": [], "skipped": []}

        after = await list_resource_entitlements(
            mock_request, admin_user, org.id, COURSE_UUID, db
        )
        assert after["total"] == 1
        item = after["items"][0]
        assert item["user"]["username"] == "regular"
        assert item["role"]["name"] == "User"
        assert item["source"] == "manual"
        assert item["status"] == "active"
        assert item["enrolled_at"] is not None

        candidates_after = await list_entitlement_candidates(
            mock_request, admin_user, org.id, COURSE_UUID, db
        )
        assert candidates_after["total"] == 1
        assert candidates_after["items"][0]["user"]["username"] == "admin"

        revoked = await bulk_revoke_entitlements(
            mock_request, admin_user, org.id, COURSE_UUID, [regular_user.id], db
        )
        assert revoked == {"revoked": [regular_user.id], "not_found": []}

        final = await list_resource_entitlements(
            mock_request, admin_user, org.id, COURSE_UUID, db
        )
        assert final["total"] == 0

        # Audit trail: the row is kept with status=revoked.
        rows = db.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.user_id == regular_user.id
            )
        ).all()
        assert len(rows) == 1
        assert rows[0].status == EntitlementStatusEnum.REVOKED
        assert rows[0].revoked_at is not None
        assert rows[0].revoke_reason == "manual"

    async def test_grant_twice_reports_already(
        self, db, org, course, admin_user, regular_user, authorized, mock_request
    ):
        await bulk_grant_entitlements(
            mock_request, admin_user, org.id, COURSE_UUID, [regular_user.id], db
        )
        again = await bulk_grant_entitlements(
            mock_request, admin_user, org.id, COURSE_UUID, [regular_user.id], db
        )
        assert again == {
            "granted": [],
            "already": [regular_user.id],
            "skipped": [],
        }
        assert len(
            db.exec(
                select(ResourceEntitlement).where(
                    ResourceEntitlement.user_id == regular_user.id,
                    ResourceEntitlement.status == EntitlementStatusEnum.ACTIVE,
                )
            ).all()
        ) == 1


class TestCollectionEntitlements:
    async def test_grant_and_list_for_collection(
        self, db, org, collection, admin_user, regular_user, authorized, mock_request
    ):
        granted = await bulk_grant_entitlements(
            mock_request,
            admin_user,
            org.id,
            collection.collection_uuid,
            [regular_user.id],
            db,
        )
        assert granted == {"granted": [regular_user.id], "already": [], "skipped": []}

        listed = await list_resource_entitlements(
            mock_request, admin_user, org.id, collection.collection_uuid, db
        )
        assert listed["total"] == 1

        entitlement = db.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.user_id == regular_user.id
            )
        ).one()
        assert entitlement.resource_type == "collection"

    async def test_unknown_collection_is_rejected(
        self, db, org, admin_user, regular_user, authorized, mock_request
    ):
        with pytest.raises(HTTPException) as exc:
            await bulk_grant_entitlements(
                mock_request,
                admin_user,
                org.id,
                "collection_missing",
                [regular_user.id],
                db,
            )

        assert exc.value.status_code == 404

    async def test_grant_skips_non_members(
        self, db, org, course, admin_user, authorized, mock_request
    ):
        result = await bulk_grant_entitlements(
            mock_request, admin_user, org.id, COURSE_UUID, [999], db
        )
        assert result == {"granted": [], "already": [], "skipped": [999]}

    async def test_revoke_without_entitlement_reports_not_found(
        self, db, org, course, admin_user, regular_user, authorized, mock_request
    ):
        result = await bulk_revoke_entitlements(
            mock_request, admin_user, org.id, COURSE_UUID, [regular_user.id], db
        )
        assert result == {"revoked": [], "not_found": [regular_user.id]}

    async def test_resource_from_another_org_is_rejected(
        self, db, org, other_org, course, admin_user, mock_request
    ):
        with patch(
            "src.services.payments.entitlements.authorize_org_admin",
            new_callable=AsyncMock,
            return_value=(other_org, admin_user.id),
        ):
            with pytest.raises(HTTPException) as exc:
                await list_resource_entitlements(
                    mock_request, admin_user, other_org.id, COURSE_UUID, db
                )
        assert exc.value.status_code == 404


def _make_order(db, org, collection, user_id: int, order_uuid: str) -> PaymentOrder:
    order = PaymentOrder(
        order_uuid=order_uuid,
        org_id=org.id,
        user_id=user_id,
        resource_uuid=collection.collection_uuid,
        resource_type="collection",
        amount=2500,
        currency="DZD",
        status=PaymentOrderStatusEnum.PAID,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def _grant(
    db,
    org,
    user_id: int,
    resource_uuid: str,
    resource_type: str = "course",
    *,
    order_id: int | None = None,
    source: EntitlementSourceEnum = EntitlementSourceEnum.PURCHASE,
) -> ResourceEntitlement:
    row = ResourceEntitlement(
        org_id=org.id,
        user_id=user_id,
        resource_uuid=resource_uuid,
        resource_type=resource_type,
        source=source,
        order_id=order_id,
        status=EntitlementStatusEnum.ACTIVE,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


class TestCollectionAccessRevoke:
    """Revoking a bundle must revoke exactly what its order granted."""

    async def test_revoke_collection_cascades_granting_order(
        self, db, org, collection, course, admin_user, regular_user, authorized, mock_request
    ):
        bundle_order = _make_order(db, org, collection, regular_user.id, "order_bundle")
        other_order = _make_order(db, org, collection, regular_user.id, "order_other")

        _grant(
            db,
            org,
            regular_user.id,
            collection.collection_uuid,
            "collection",
            order_id=bundle_order.id,
        )
        _grant(
            db,
            org,
            regular_user.id,
            course.course_uuid,
            "course",
            order_id=bundle_order.id,
        )
        _grant(
            db,
            org,
            regular_user.id,
            "course_individually_bought",
            "course",
            order_id=other_order.id,
        )
        _grant(
            db,
            org,
            regular_user.id,
            "course_manual_grant",
            "course",
            source=EntitlementSourceEnum.MANUAL,
        )

        result = await bulk_revoke_entitlements(
            mock_request,
            admin_user,
            org.id,
            collection.collection_uuid,
            [regular_user.id],
            db,
        )
        assert result == {"revoked": [regular_user.id], "not_found": []}

        rows = {
            row.resource_uuid: row
            for row in db.exec(
                select(ResourceEntitlement).where(
                    ResourceEntitlement.user_id == regular_user.id
                )
            ).all()
        }
        assert rows[collection.collection_uuid].status == EntitlementStatusEnum.REVOKED
        assert rows[course.course_uuid].status == EntitlementStatusEnum.REVOKED
        assert (
            rows["course_individually_bought"].status == EntitlementStatusEnum.ACTIVE
        )
        assert rows["course_manual_grant"].status == EntitlementStatusEnum.ACTIVE
        assert rows[course.course_uuid].revoked_at is not None

    async def test_revoke_manual_collection_grant_does_not_cascade(
        self, db, org, collection, course, admin_user, regular_user, authorized, mock_request
    ):
        _grant(
            db,
            org,
            regular_user.id,
            collection.collection_uuid,
            "collection",
            source=EntitlementSourceEnum.MANUAL,
        )
        _grant(
            db,
            org,
            regular_user.id,
            course.course_uuid,
            "course",
            source=EntitlementSourceEnum.MANUAL,
        )

        result = await bulk_revoke_entitlements(
            mock_request,
            admin_user,
            org.id,
            collection.collection_uuid,
            [regular_user.id],
            db,
        )
        assert result == {"revoked": [regular_user.id], "not_found": []}

        rows = {
            row.resource_uuid: row
            for row in db.exec(
                select(ResourceEntitlement).where(
                    ResourceEntitlement.user_id == regular_user.id
                )
            ).all()
        }
        assert rows[collection.collection_uuid].status == EntitlementStatusEnum.REVOKED
        assert rows[course.course_uuid].status == EntitlementStatusEnum.ACTIVE
