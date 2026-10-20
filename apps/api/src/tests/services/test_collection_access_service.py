"""Service tests for collection access management (learner inventory)."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest

from src.db.collection_users import CollectionUser
from src.db.collections import Collection
from src.db.payments.enums import EntitlementStatusEnum
from src.db.payments.resource_entitlements import ResourceEntitlement
from src.db.usergroup_resources import UserGroupResource
from src.db.usergroup_user import UserGroupUser
from src.db.usergroups import UserGroup
from src.db.users import AnonymousUser
from src.services.courses.collection_access import (
    bulk_enroll_collection_users,
    bulk_unenroll_collection_users,
    claim_collection,
    get_collection_access_state,
    list_collection_access_users,
    list_my_collections,
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


def _make_entitlement(db, org, user_id: int, resource_uuid: str = COLLECTION_UUID):
    row = ResourceEntitlement(
        org_id=org.id,
        user_id=user_id,
        resource_uuid=resource_uuid,
        resource_type="collection",
        status=EntitlementStatusEnum.ACTIVE,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _make_group_access(db, org, user_id: int, resource_uuid: str = COLLECTION_UUID):
    group = UserGroup(
        name="Learners",
        description="Test group",
        org_id=org.id,
        usergroup_uuid="usergroup_test",
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    db.add(
        UserGroupUser(
            usergroup_id=group.id,
            user_id=user_id,
            org_id=org.id,
            creation_date=str(datetime.now()),
            update_date=str(datetime.now()),
        )
    )
    db.add(
        UserGroupResource(
            usergroup_id=group.id,
            resource_uuid=resource_uuid,
            org_id=org.id,
            creation_date=str(datetime.now()),
            update_date=str(datetime.now()),
        )
    )
    db.commit()
    return group


@pytest.fixture
def catalog_readable():
    with patch(
        "src.services.courses.collection_access._check_catalog_read_access",
        new_callable=AsyncMock,
    ):
        yield


class TestCollectionAccessState:
    async def test_defaults_to_not_owned(
        self, db, org, collection, regular_user, catalog_readable, mock_request
    ):
        state = await get_collection_access_state(
            mock_request, COLLECTION_UUID, regular_user, db
        )
        assert state == {
            "claimed": False,
            "has_paid_access": False,
            "has_group_access": False,
            "owned": False,
        }

    async def test_public_claim_marks_owned(
        self, db, org, collection, regular_user, catalog_readable, mock_request
    ):
        _make_claim(db, collection, regular_user.id)

        state = await get_collection_access_state(
            mock_request, COLLECTION_UUID, regular_user, db
        )
        assert state["claimed"] is True
        assert state["owned"] is True

    async def test_paid_entitlement_marks_owned(
        self, db, org, collection, regular_user, catalog_readable, mock_request
    ):
        _make_entitlement(db, org, regular_user.id)

        state = await get_collection_access_state(
            mock_request, COLLECTION_UUID, regular_user, db
        )
        assert state["has_paid_access"] is True
        assert state["owned"] is True

    async def test_revoked_entitlement_is_not_owned(
        self, db, org, collection, regular_user, catalog_readable, mock_request
    ):
        row = _make_entitlement(db, org, regular_user.id)
        row.status = EntitlementStatusEnum.REVOKED
        db.add(row)
        db.commit()

        state = await get_collection_access_state(
            mock_request, COLLECTION_UUID, regular_user, db
        )
        assert state["has_paid_access"] is False
        assert state["owned"] is False

    async def test_group_access_is_reported_but_not_owned(
        self, db, org, collection, regular_user, catalog_readable, mock_request
    ):
        _make_group_access(db, org, regular_user.id)

        state = await get_collection_access_state(
            mock_request, COLLECTION_UUID, regular_user, db
        )
        assert state["has_group_access"] is True
        assert state["owned"] is False

    async def test_anonymous_user_owns_nothing(
        self, db, org, collection, catalog_readable, mock_request
    ):
        state = await get_collection_access_state(
            mock_request, COLLECTION_UUID, AnonymousUser(), db
        )
        assert state["owned"] is False


class TestMyCollections:
    async def test_lists_claimed_and_paid_collections_only(
        self, db, org, collection, regular_user, mock_request
    ):
        _make_claim(db, collection, regular_user.id)

        paid = Collection(
            id=2,
            name="Paid Bundle",
            description="A paid bundle",
            public=False,
            published=True,
            org_id=org.id,
            collection_uuid="collection_paid",
            creation_date=str(datetime.now()),
            update_date=str(datetime.now()),
        )
        unrelated = Collection(
            id=3,
            name="Unrelated Bundle",
            description="Not in the library",
            public=True,
            published=True,
            org_id=org.id,
            collection_uuid="collection_unrelated",
            creation_date=str(datetime.now()),
            update_date=str(datetime.now()),
        )
        db.add(paid)
        db.add(unrelated)
        db.commit()
        _make_entitlement(db, org, regular_user.id, resource_uuid="collection_paid")

        result = await list_my_collections(mock_request, org.id, regular_user, db)

        assert {item.collection_uuid for item in result} == {
            COLLECTION_UUID,
            "collection_paid",
        }

    async def test_excludes_draft_collections(
        self, db, org, collection, regular_user, mock_request
    ):
        _make_claim(db, collection, regular_user.id)
        collection.published = False
        db.add(collection)
        db.commit()

        result = await list_my_collections(mock_request, org.id, regular_user, db)

        assert result == []

    async def test_anonymous_has_empty_library(
        self, db, org, collection, mock_request
    ):
        result = await list_my_collections(
            mock_request, org.id, AnonymousUser(), db
        )
        assert result == []
