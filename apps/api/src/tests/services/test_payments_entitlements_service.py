"""Service tests for paid resource entitlements (manual grant / revoke)."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from sqlmodel import select

from src.db.payments.enums import EntitlementStatusEnum
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
