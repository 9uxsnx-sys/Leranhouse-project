"""Service tests for collection access management (learner inventory)."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest

from src.db.collection_users import CollectionUser
from src.services.courses.collection_access import (
    bulk_enroll_collection_users,
    bulk_unenroll_collection_users,
    claim_collection,
    list_collection_access_users,
)

COLLECTION_UUID = "collection_test"


def _make_claim(db, collection, user_id: int) -> CollectionUser:
    claim = CollectionUser(
        collection_id=collection.id,
        user_id=user_id,
        org_id=collection.org_id,
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


@pytest.fixture
def authorized():
    with patch(
        "src.services.courses.collection_access.check_resource_access",
        new_callable=AsyncMock,
    ) as mock:
        yield mock


class TestCollectionAccessUsers:
    async def test_lists_enrolled_and_available_separately(
        self, db, org, collection, admin_user, regular_user, authorized, mock_request
    ):
        _make_claim(db, collection, regular_user.id)

        enrolled = await list_collection_access_users(
            mock_request, COLLECTION_UUID, admin_user, db, list_filter="enrolled"
        )
        assert enrolled["total"] == 1
        assert enrolled["items"][0]["user"]["username"] == "regular"
        assert enrolled["items"][0]["enrolled_at"] is not None

        available = await list_collection_access_users(
            mock_request, COLLECTION_UUID, admin_user, db, list_filter="available"
        )
        assert available["total"] == 1
        assert available["items"][0]["user"]["username"] == "admin"

    async def test_search_filters_available_users(
        self, db, org, collection, admin_user, regular_user, authorized, mock_request
    ):
        result = await list_collection_access_users(
            mock_request,
            COLLECTION_UUID,
            admin_user,
            db,
            list_filter="available",
            search="regu",
        )
        assert result["total"] == 1
        assert result["items"][0]["user"]["username"] == "regular"

    async def test_bulk_enroll_is_idempotent(
        self, db, org, collection, admin_user, regular_user, authorized, mock_request
    ):
        first = await bulk_enroll_collection_users(
            mock_request, COLLECTION_UUID, [regular_user.id], admin_user, db
        )
        assert first == {"enrolled": [regular_user.id], "already_enrolled": [], "skipped": []}

        second = await bulk_enroll_collection_users(
            mock_request, COLLECTION_UUID, [regular_user.id], admin_user, db
        )
        assert second == {
            "enrolled": [],
            "already_enrolled": [regular_user.id],
            "skipped": [],
        }

    async def test_bulk_enroll_skips_non_members(
        self, db, org, collection, admin_user, authorized, mock_request
    ):
        result = await bulk_enroll_collection_users(
            mock_request, COLLECTION_UUID, [999], admin_user, db
        )
        assert result["skipped"] == [999]

    async def test_bulk_unenroll_removes_claim(
        self, db, org, collection, admin_user, regular_user, authorized, mock_request
    ):
        _make_claim(db, collection, regular_user.id)

        result = await bulk_unenroll_collection_users(
            mock_request, COLLECTION_UUID, [regular_user.id], admin_user, db
        )
        assert result == {"removed": [regular_user.id], "not_enrolled": []}

        after = await list_collection_access_users(
            mock_request, COLLECTION_UUID, admin_user, db, list_filter="enrolled"
        )
        assert after["total"] == 0

    async def test_claim_is_idempotent(
        self, db, org, collection, admin_user, authorized, mock_request
    ):
        first = await claim_collection(mock_request, COLLECTION_UUID, admin_user, db)
        assert first == {"claimed": True, "already_claimed": False}

        second = await claim_collection(mock_request, COLLECTION_UUID, admin_user, db)
        assert second == {"claimed": False, "already_claimed": True}
