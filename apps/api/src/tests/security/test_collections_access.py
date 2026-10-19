"""
RBAC tests for the three-mode access model on ``collection_`` resources.

Collections mirror courses: draft / public / users_only / paid.
"""

import pytest

from src.db.payments.enums import AccessTypeEnum
from src.db.payments.resource_entitlements import ResourceEntitlement
from src.security.rbac.resource_access import ResourceAccessChecker
from src.security.rbac.types import AccessAction, AccessContext

COLLECTION_UUID = "collection_test"


def _set(db, collection, **fields):
    for key, value in fields.items():
        setattr(collection, key, value)
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection


async def _read(db, request, user):
    checker = ResourceAccessChecker(request, db, user)
    return await checker.check_access(
        COLLECTION_UUID, AccessAction.READ, AccessContext.PUBLIC_VIEW
    )


class TestCollectionAccess:
    async def test_anonymous_can_read_published_public_collection(
        self, db, collection, anonymous_user, mock_request
    ):
        decision = await _read(db, mock_request, anonymous_user)
        assert decision.allowed is True
        assert decision.via_public is True

    async def test_anonymous_cannot_read_draft_collection(
        self, db, collection, anonymous_user, mock_request
    ):
        _set(db, collection, published=False)

        decision = await _read(db, mock_request, anonymous_user)
        assert decision.allowed is False

    async def test_anonymous_cannot_read_paid_collection_even_if_public_flag_is_set(
        self, db, collection, anonymous_user, mock_request
    ):
        # A stale `public=True` must never bypass the paywall (regression guard).
        _set(db, collection, public=True, published=True, access_type=AccessTypeEnum.PAID)

        decision = await _read(db, mock_request, anonymous_user)
        assert decision.allowed is False

    async def test_user_without_entitlement_is_denied_on_paid_collection(
        self, db, collection, regular_user, mock_request
    ):
        _set(
            db,
            collection,
            public=False,
            published=True,
            access_type=AccessTypeEnum.PAID,
            price_amount=1500,
        )

        decision = await _read(db, mock_request, regular_user)
        assert decision.allowed is False
        assert "Payment" in decision.reason

    async def test_user_with_active_entitlement_can_read_paid_collection(
        self, db, org, collection, regular_user, mock_request
    ):
        _set(
            db,
            collection,
            public=False,
            published=True,
            access_type=AccessTypeEnum.PAID,
            price_amount=1500,
        )
        db.add(
            ResourceEntitlement(
                org_id=org.id,
                user_id=regular_user.id,
                resource_uuid=COLLECTION_UUID,
                resource_type="collection",
                status="ACTIVE",
            )
        )
        db.commit()

        decision = await _read(db, mock_request, regular_user)
        assert decision.allowed is True
        assert decision.via_entitlement is True

    async def test_users_only_collection_denied_without_usergroup(
        self, db, collection, regular_user, mock_request
    ):
        _set(
            db,
            collection,
            public=False,
            published=True,
            access_type=AccessTypeEnum.USERS_ONLY,
        )

        decision = await _read(db, mock_request, regular_user)
        assert decision.allowed is False

    async def test_regular_user_can_read_published_public_collection(
        self, db, collection, regular_user, mock_request
    ):
        decision = await _read(db, mock_request, regular_user)
        assert decision.allowed is True

    async def test_admin_can_read_draft_collection(
        self, db, collection, admin_user, mock_request
    ):
        _set(db, collection, published=False)

        decision = await _read(db, mock_request, admin_user)
        assert decision.allowed is True
        assert decision.via_admin is True
