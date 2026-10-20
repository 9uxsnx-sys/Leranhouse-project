"""
Tests for src/services/courses/collections.py

Covers: get_collection, create_collection, update_collection,
        delete_collection, get_collections.
"""

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from sqlmodel import select

from src.db.collections import Collection, CollectionCreate, CollectionRead, CollectionUpdate
from src.db.collections_courses import CollectionCourse
from src.db.courses.courses import Course
from src.db.payments.enums import AccessTypeEnum
from src.db.podcasts.episodes import PodcastEpisode
from src.db.podcasts.podcasts import Podcast
from src.services.courses.collections import (
    add_course_to_collection,
    add_resource_to_collection,
    create_collection,
    delete_collection,
    get_collection,
    get_collection_courses,
    get_collection_members_page,
    get_collections,
    remove_course_from_collection,
    remove_resource_from_collection,
    update_collection,
)


def _make_course(db, org, *, id, name="Extra Course", course_uuid=None,
                 public=True, published=True):
    """Helper to insert an additional course."""
    c = Course(
        id=id,
        name=name,
        description=f"Description for {name}",
        public=public,
        published=published,
        access_type=(
            AccessTypeEnum.PUBLIC if public else AccessTypeEnum.USERS_ONLY
        ),
        open_to_contributors=False,
        org_id=org.id,
        course_uuid=course_uuid or f"course_{id}",
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def _make_collection(db, org, *, id, name="Extra Collection",
                     collection_uuid=None, public=True, published=True):
    """Helper to insert an additional collection."""
    c = Collection(
        id=id,
        name=name,
        description=f"Description for {name}",
        public=public,
        published=published,
        access_type=(
            AccessTypeEnum.PUBLIC if public else AccessTypeEnum.USERS_ONLY
        ),
        org_id=org.id,
        collection_uuid=collection_uuid or f"collection_{id}",
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def _make_podcast(
    db, org, *, id=71, name="Podcast Member", podcast_uuid="podcast_member",
    public=True, published=True, episodes=2,
):
    """Helper to insert an additional podcast with episodes."""
    podcast = Podcast(
        id=id,
        name=name,
        description=f"Description for {name}",
        public=public,
        published=published,
        access_type=(
            AccessTypeEnum.PUBLIC if public else AccessTypeEnum.USERS_ONLY
        ),
        org_id=org.id,
        podcast_uuid=podcast_uuid,
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(podcast)
    db.commit()
    db.refresh(podcast)

    for index in range(episodes):
        db.add(
            PodcastEpisode(
                podcast_id=podcast.id,
                org_id=org.id,
                title=f"Episode {index + 1}",
                episode_uuid=f"episode_{podcast.podcast_uuid}_{index + 1}",
                published=published,
                order=index,
                creation_date=str(datetime.now()),
                update_date=str(datetime.now()),
            )
        )
    db.commit()
    return podcast


def _link_course_to_collection(db, collection, course, org):
    """Helper to create a CollectionCourse join row."""
    link = CollectionCourse(
        collection_id=collection.id,
        course_id=course.id,
        resource_type="course",
        resource_uuid=course.course_uuid,
        org_id=org.id,
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(link)
    db.commit()


class TestGetCollection:
    """Tests for get_collection()."""

    @pytest.mark.asyncio
    async def test_get_collection_found(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        result = await get_collection(
            mock_request, "collection_test", admin_user, db
        )

        assert isinstance(result, CollectionRead)
        assert result.name == "Test Collection"
        assert len(result.courses) == 1

    @pytest.mark.asyncio
    async def test_get_collection_not_found(
        self, db, org, admin_user, mock_request, bypass_rbac
    ):
        with pytest.raises(HTTPException) as exc_info:
            await get_collection(
                mock_request, "nonexistent_uuid", admin_user, db
            )

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_get_collection_anonymous_only_public_courses(
        self, db, org, course, collection, anonymous_user, mock_request,
        bypass_rbac,
    ):
        private_course = _make_course(
            db, org, id=50, name="Private Course",
            course_uuid="course_private", public=False,
        )
        _link_course_to_collection(db, collection, private_course, org)

        result = await get_collection(
            mock_request, "collection_test", anonymous_user, db
        )

        course_ids = [c.id for c in result.courses]
        assert course.id in course_ids
        assert private_course.id not in course_ids

    @pytest.mark.asyncio
    async def test_get_collection_paid_is_browsable_by_non_buyers(
        self, db, org, course, collection, regular_user, anonymous_user, mock_request
    ):
        # A paid bundle is a product page: metadata and members must be visible
        # before the learner pays. Content stays protected per course.
        collection.public = False
        collection.published = True
        collection.access_type = AccessTypeEnum.PAID
        collection.price_amount = 1500
        db.add(collection)
        db.commit()
        db.refresh(collection)

        for viewer in (regular_user, anonymous_user):
            result = await get_collection(
                mock_request, "collection_test", viewer, db
            )
            assert result.name == "Test Collection"
            assert len(result.courses) == 1
            assert result.access_type == AccessTypeEnum.PAID

    @pytest.mark.asyncio
    async def test_get_collection_users_only_stays_hidden(
        self, db, org, collection, regular_user, mock_request
    ):
        collection.public = False
        collection.published = True
        collection.access_type = AccessTypeEnum.USERS_ONLY
        db.add(collection)
        db.commit()
        db.refresh(collection)

        with pytest.raises(HTTPException) as exc_info:
            await get_collection(mock_request, "collection_test", regular_user, db)

        assert exc_info.value.status_code == 403


class TestCreateCollection:
    """Tests for create_collection()."""

    @pytest.mark.asyncio
    async def test_create_collection(
        self, db, org, course, admin_user, mock_request, bypass_rbac,
        bypass_webhooks,
    ):
        payload = CollectionCreate(
            name="New Collection",
            description="Brand new",
            public=True,
            courses=[course.id],
        )

        result = await create_collection(
            mock_request, payload, admin_user, db, org_id=org.id
        )

        assert isinstance(result, CollectionRead)
        assert result.name == "New Collection"
        assert len(result.courses) == 1

        # Verify persisted in DB
        stored = db.exec(
            select(Collection).where(
                Collection.collection_uuid == result.collection_uuid
            )
        ).first()
        assert stored is not None


    @pytest.mark.asyncio
    async def test_create_collection_course_access_denied_raises_403(
        self, db, org, course, admin_user, mock_request, bypass_webhooks
    ):
        payload = CollectionCreate(
            name="Forbidden Collection",
            description="",
            public=True,
            courses=[course.id],
        )

        with patch(
            "src.services.courses.collections.check_resource_access",
            new_callable=AsyncMock,
            side_effect=[None, HTTPException(status_code=403, detail="Forbidden")],
        ):
            with pytest.raises(HTTPException) as exc_info:
                await create_collection(
                    mock_request, payload, admin_user, db, org_id=org.id
                )

        assert exc_info.value.status_code == 403


class TestUpdateCollection:
    """Tests for update_collection()."""

    @pytest.mark.asyncio
    async def test_update_collection_name(
        self, db, org, course, collection, admin_user, mock_request,
        bypass_rbac,
    ):
        payload = CollectionUpdate(name="Updated Name", courses=[course.id])

        result = await update_collection(
            mock_request, payload, "collection_test", admin_user, db
        )

        assert result.name == "Updated Name"

    @pytest.mark.asyncio
    async def test_update_collection_not_found(
        self, db, org, admin_user, mock_request, bypass_rbac
    ):
        payload = CollectionUpdate(name="X", courses=[])

        with pytest.raises(HTTPException) as exc_info:
            await update_collection(
                mock_request, payload, "nonexistent_uuid", admin_user, db
            )

        assert exc_info.value.status_code == 404


class TestDeleteCollection:
    """Tests for delete_collection()."""

    @pytest.mark.asyncio
    async def test_delete_collection(
        self, db, org, course, collection, admin_user, mock_request,
        bypass_rbac,
    ):
        result = await delete_collection(
            mock_request, "collection_test", admin_user, db
        )

        assert result == {"detail": "Collection deleted"}

        remaining = db.get(Collection, 1)
        assert remaining is None

    @pytest.mark.asyncio
    async def test_delete_collection_not_found(
        self, db, org, admin_user, mock_request, bypass_rbac
    ):
        with pytest.raises(HTTPException) as exc_info:
            await delete_collection(
                mock_request, "nonexistent_uuid", admin_user, db
            )

        assert exc_info.value.status_code == 404


class TestGetCollections:
    """Tests for get_collections()."""

    @pytest.mark.asyncio
    async def test_get_collections_authenticated(
        self, db, org, course, collection, admin_user, mock_request,
        bypass_rbac,
    ):
        result = await get_collections(
            mock_request, org.id, admin_user, db
        )

        assert len(result) >= 1
        names = [c.name for c in result]
        assert "Test Collection" in names

    @pytest.mark.asyncio
    async def test_get_collections_empty_org_returns_empty_list(
        self, db, other_org, admin_user, mock_request, bypass_rbac
    ):
        result = await get_collections(mock_request, other_org.id, admin_user, db)
        assert result == []

    @pytest.mark.asyncio
    async def test_get_collections_anonymous_only_public(
        self, db, org, course, collection, anonymous_user, mock_request,
        bypass_rbac,
    ):
        _make_collection(
            db, org, id=60, name="Private Collection",
            collection_uuid="collection_private", public=False,
        )

        result = await get_collections(
            mock_request, org.id, anonymous_user, db
        )

        names = [c.name for c in result]
        assert "Test Collection" in names
        assert "Private Collection" not in names

    @pytest.mark.asyncio
    async def test_get_collections_hides_drafts_from_learners(
        self, db, org, course, collection, regular_user, mock_request,
        bypass_rbac,
    ):
        _make_collection(
            db, org, id=61, name="Draft Collection",
            collection_uuid="collection_draft", published=False,
        )

        result = await get_collections(mock_request, org.id, regular_user, db)

        names = [c.name for c in result]
        assert "Test Collection" in names
        assert "Draft Collection" not in names

    @pytest.mark.asyncio
    async def test_get_collections_shows_drafts_to_admins(
        self, db, org, course, collection, admin_user, mock_request,
        bypass_rbac,
    ):
        _make_collection(
            db, org, id=62, name="Admin Draft",
            collection_uuid="collection_admin_draft", published=False,
        )

        result = await get_collections(mock_request, org.id, admin_user, db)

        names = [c.name for c in result]
        assert "Admin Draft" in names

    @pytest.mark.asyncio
    async def test_get_collections_paginates(self, db, org, course, collection,
                                             admin_user, mock_request,
                                             bypass_rbac):
        for index in range(3):
            _make_collection(
                db, org, id=70 + index, name=f"Paged {index}",
                collection_uuid=f"collection_paged_{index}",
            )

        result = await get_collections(
            mock_request, org.id, admin_user, db, page=1, limit=2
        )

        assert len(result) == 2


class TestCollectionMembership:
    """Tests for add/remove and the content table payload."""

    @pytest.mark.asyncio
    async def test_update_without_courses_keeps_membership(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        payload = CollectionUpdate(name="Renamed Only")

        result = await update_collection(
            mock_request, payload, "collection_test", admin_user, db
        )

        assert result.name == "Renamed Only"
        assert [c.id for c in result.courses] == [course.id]
        links = db.exec(
            select(CollectionCourse).where(
                CollectionCourse.collection_id == collection.id
            )
        ).all()
        assert len(links) == 1

    @pytest.mark.asyncio
    async def test_update_with_courses_replaces_membership(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        second = _make_course(db, org, id=51, name="Second", course_uuid="course_second")

        result = await update_collection(
            mock_request,
            CollectionUpdate(courses=[course.id, second.id]),
            "collection_test",
            admin_user,
            db,
        )

        assert sorted(c.id for c in result.courses) == sorted([course.id, second.id])

    @pytest.mark.asyncio
    async def test_add_course(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        second = _make_course(db, org, id=52, name="Second", course_uuid="course_second")

        result = await add_course_to_collection(
            mock_request, "collection_test", second.course_uuid, admin_user, db
        )

        assert second.id in [c.id for c in result.courses]

    @pytest.mark.asyncio
    async def test_add_private_course_is_rejected(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        private = _make_course(
            db, org, id=53, name="Private", course_uuid="course_private", public=False
        )

        with pytest.raises(HTTPException) as exc_info:
            await add_course_to_collection(
                mock_request, "collection_test", private.course_uuid, admin_user, db
            )

        assert exc_info.value.status_code == 422

    @pytest.mark.asyncio
    async def test_add_draft_course_to_published_collection_is_rejected(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        draft = _make_course(
            db, org, id=55, name="Draft", course_uuid="course_draft",
            public=True, published=False,
        )

        with pytest.raises(HTTPException) as exc_info:
            await add_course_to_collection(
                mock_request, "collection_test", draft.course_uuid, admin_user, db
            )

        assert exc_info.value.status_code == 422
        assert "published" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_add_duplicate_course_is_rejected(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        with pytest.raises(HTTPException) as exc_info:
            await add_course_to_collection(
                mock_request, "collection_test", course.course_uuid, admin_user, db
            )

        assert exc_info.value.status_code == 409

    @pytest.mark.asyncio
    async def test_add_cross_org_course_is_rejected(
        self, db, org, other_org, course, collection, admin_user, mock_request,
        bypass_rbac,
    ):
        foreign = _make_course(
            db, other_org, id=54, name="Foreign", course_uuid="course_foreign"
        )

        with pytest.raises(HTTPException) as exc_info:
            await add_course_to_collection(
                mock_request, "collection_test", foreign.course_uuid, admin_user, db
            )

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_remove_course(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        result = await remove_course_from_collection(
            mock_request, "collection_test", course.course_uuid, admin_user, db
        )

        assert result.courses == []

    @pytest.mark.asyncio
    async def test_remove_last_course_from_paid_collection_is_rejected(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        collection.access_type = AccessTypeEnum.PAID
        collection.price_amount = 1500
        db.add(collection)
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            await remove_course_from_collection(
                mock_request, "collection_test", course.course_uuid, admin_user, db
            )

        assert exc_info.value.status_code == 422

    @pytest.mark.asyncio
    async def test_get_collection_courses_counts_lessons(
        self, db, org, course, collection, chapter, activity, admin_user,
        mock_request, bypass_rbac,
    ):
        rows = await get_collection_courses(
            mock_request, "collection_test", admin_user, db
        )

        assert len(rows) == 1
        assert rows[0].course_uuid == course.course_uuid
        assert rows[0].lessons == 1

    @pytest.mark.asyncio
    async def test_get_collection_courses_search(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        rows = await get_collection_courses(
            mock_request, "collection_test", admin_user, db, search="nomatch"
        )

        assert rows == []

    @pytest.mark.asyncio
    async def test_members_page_lists_linked_rows_with_total(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        page = await get_collection_members_page(
            mock_request, "collection_test", admin_user, db
        )

        assert page.total == 1
        assert len(page.items) == 1
        assert page.items[0].course_uuid == course.course_uuid

    @pytest.mark.asyncio
    async def test_members_page_available_excludes_members(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        extra = _make_course(db, org, id=91, name="Addable Course")

        page = await get_collection_members_page(
            mock_request,
            "collection_test",
            admin_user,
            db,
            filter_by="available",
        )

        uuids = [row.resource_uuid for row in page.items]
        assert extra.course_uuid in uuids
        assert course.course_uuid not in uuids
        assert page.total == len(page.items)

    @pytest.mark.asyncio
    async def test_members_page_available_search(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        _make_course(db, org, id=92, name="Searchable Course")

        page = await get_collection_members_page(
            mock_request,
            "collection_test",
            admin_user,
            db,
            filter_by="available",
            search="searchable",
        )

        assert page.total == 1
        assert page.items[0].name == "Searchable Course"

    @pytest.mark.asyncio
    async def test_add_podcast_and_list_it_as_member(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        podcast = _make_podcast(db, org)

        await add_resource_to_collection(
            mock_request, "collection_test", podcast.podcast_uuid, admin_user, db
        )
        rows = await get_collection_courses(
            mock_request, "collection_test", admin_user, db
        )

        podcast_rows = [row for row in rows if row.resource_type == "podcast"]
        assert len(podcast_rows) == 1
        assert podcast_rows[0].resource_uuid == podcast.podcast_uuid
        assert podcast_rows[0].course_uuid is None
        assert podcast_rows[0].lessons == 2
        # The course member is still listed.
        assert any(row.course_uuid == course.course_uuid for row in rows)

    @pytest.mark.asyncio
    async def test_add_private_podcast_is_rejected(
        self, db, org, collection, admin_user, mock_request, bypass_rbac
    ):
        private = _make_podcast(
            db, org, id=72, podcast_uuid="podcast_private", public=False
        )

        with pytest.raises(HTTPException) as exc_info:
            await add_resource_to_collection(
                mock_request, "collection_test", private.podcast_uuid, admin_user, db
            )

        assert exc_info.value.status_code == 422

    @pytest.mark.asyncio
    async def test_add_draft_podcast_to_published_collection_is_rejected(
        self, db, org, collection, admin_user, mock_request, bypass_rbac
    ):
        draft = _make_podcast(
            db, org, id=73, podcast_uuid="podcast_draft", published=False, episodes=0
        )

        with pytest.raises(HTTPException) as exc_info:
            await add_resource_to_collection(
                mock_request, "collection_test", draft.podcast_uuid, admin_user, db
            )

        assert exc_info.value.status_code == 422
        assert "published" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_remove_podcast(
        self, db, org, collection, admin_user, mock_request, bypass_rbac
    ):
        podcast = _make_podcast(db, org, id=74, podcast_uuid="podcast_remove")
        await add_resource_to_collection(
            mock_request, "collection_test", podcast.podcast_uuid, admin_user, db
        )

        await remove_resource_from_collection(
            mock_request, "collection_test", podcast.podcast_uuid, admin_user, db
        )

        rows = await get_collection_courses(
            mock_request, "collection_test", admin_user, db
        )
        assert all(row.resource_uuid != podcast.podcast_uuid for row in rows)


class TestCollectionValidation:
    """Publish/price rules."""

    @pytest.mark.asyncio
    async def test_paid_collection_requires_positive_price(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        with pytest.raises(HTTPException) as exc_info:
            await update_collection(
                mock_request,
                CollectionUpdate(access_type=AccessTypeEnum.PAID),
                "collection_test",
                admin_user,
                db,
            )

        assert exc_info.value.status_code == 422
        assert "price" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_paid_collection_requires_a_member(
        self, db, org, admin_user, mock_request, bypass_rbac, bypass_webhooks
    ):
        with pytest.raises(HTTPException) as exc_info:
            await create_collection(
                mock_request,
                CollectionCreate(
                    name="Empty paid",
                    public=False,
                    access_type=AccessTypeEnum.PAID,
                    price_amount=1500,
                ),
                admin_user,
                db,
                org_id=org.id,
            )

        assert exc_info.value.status_code == 422
        assert "at least one item" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_publish_rejects_draft_members(
        self, db, org, course, collection, admin_user, mock_request, bypass_rbac
    ):
        draft = _make_course(
            db, org, id=55, name="Draft Member", course_uuid="course_draft_member",
            published=False,
        )
        _link_course_to_collection(db, collection, draft, org)

        with pytest.raises(HTTPException) as exc_info:
            await update_collection(
                mock_request,
                CollectionUpdate(published=True),
                "collection_test",
                admin_user,
                db,
            )

        assert exc_info.value.status_code == 422
        assert "Draft Member" in exc_info.value.detail
