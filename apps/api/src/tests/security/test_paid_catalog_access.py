"""Catalog (product-page) access for published paid courses and podcasts.

A published paid resource keeps its marketing page readable — that is how a
learner decides whether the product is worth buying. The lesson bodies and the
episode audio stay behind the paywall.
"""

from datetime import datetime

import pytest
from fastapi import HTTPException

from src.db.payments.enums import AccessTypeEnum, EntitlementStatusEnum
from src.db.payments.resource_entitlements import ResourceEntitlement
from src.db.podcasts.episodes import PodcastEpisode
from src.db.podcasts.podcasts import Podcast
from src.security.rbac.catalog import check_catalog_read_access
from src.services.courses.activities.activities import get_activity
from src.services.courses.courses import get_course_meta
from src.services.podcasts.episodes import get_episodes_by_podcast


def _set_course(db, course, **fields):
    for key, value in fields.items():
        setattr(course, key, value)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def _grant(db, org, user, resource_uuid, resource_type):
    db.add(
        ResourceEntitlement(
            org_id=org.id,
            user_id=user.id,
            resource_uuid=resource_uuid,
            resource_type=resource_type,
            status=EntitlementStatusEnum.ACTIVE,
        )
    )
    db.commit()


def _make_podcast(db, org, **overrides):
    podcast = Podcast(
        org_id=org.id,
        name=overrides.pop("name", "Podcast"),
        description=overrides.pop("description", "Desc"),
        about=overrides.pop("about", "About"),
        public=overrides.pop("public", True),
        published=overrides.pop("published", True),
        access_type=overrides.pop("access_type", AccessTypeEnum.PUBLIC),
        price_amount=overrides.pop("price_amount", None),
        podcast_uuid=overrides.pop("podcast_uuid", "podcast_test"),
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(podcast)
    db.commit()
    db.refresh(podcast)
    return podcast


def _make_episode(db, org, podcast, **overrides):
    episode = PodcastEpisode(
        podcast_id=podcast.id,
        org_id=org.id,
        title=overrides.pop("title", "Episode"),
        description=overrides.pop("description", "Desc"),
        audio_file=overrides.pop("audio_file", "episodes/e1.mp3"),
        duration_seconds=overrides.pop("duration_seconds", 600),
        episode_number=overrides.pop("episode_number", 1),
        published=overrides.pop("published", True),
        order=overrides.pop("order", 0),
        episode_uuid=overrides.pop("episode_uuid", "episode_test"),
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )
    db.add(episode)
    db.commit()
    db.refresh(episode)
    return episode


class TestCourseCatalogAccess:
    async def test_paid_course_meta_visible_but_lessons_locked(
        self, db, org, course, chapter, activity, regular_user, mock_request
    ):
        _set_course(
            db,
            course,
            public=False,
            published=True,
            access_type=AccessTypeEnum.PAID,
            price_amount=5000,
        )

        result = await get_course_meta(
            mock_request, "course_test", False, regular_user, db
        )

        assert result.name == "Test Course"
        assert len(result.chapters) == 1
        lesson = result.chapters[0].activities[0]
        # The curriculum is the product description: titles stay visible.
        assert lesson.name == "Test Activity"
        # The bodies do not.
        assert result.chapters[0].is_locked is True
        assert lesson.is_locked is True
        assert lesson.content == {}

    async def test_paid_course_meta_unlocked_for_entitled_user(
        self, db, org, course, chapter, activity, regular_user, mock_request
    ):
        _set_course(
            db,
            course,
            public=False,
            published=True,
            access_type=AccessTypeEnum.PAID,
            price_amount=5000,
        )
        _grant(db, org, regular_user, "course_test", "course")

        result = await get_course_meta(
            mock_request, "course_test", False, regular_user, db
        )

        lesson = result.chapters[0].activities[0]
        assert result.chapters[0].is_locked is False
        assert lesson.is_locked is False
        assert lesson.content

    async def test_activity_content_endpoint_stays_forbidden_on_paid_course(
        self, db, org, course, chapter, activity, regular_user, mock_request
    ):
        _set_course(
            db,
            course,
            public=False,
            published=True,
            access_type=AccessTypeEnum.PAID,
            price_amount=5000,
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_activity(mock_request, "activity_test", regular_user, db)

        assert exc_info.value.status_code == 403

    async def test_users_only_course_meta_is_still_denied(
        self, db, org, course, chapter, activity, regular_user, mock_request
    ):
        _set_course(
            db,
            course,
            public=False,
            published=True,
            access_type=AccessTypeEnum.USERS_ONLY,
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_course_meta(mock_request, "course_test", False, regular_user, db)

        assert exc_info.value.status_code == 403

    async def test_draft_paid_course_meta_is_still_denied(
        self, db, org, course, chapter, activity, regular_user, mock_request
    ):
        _set_course(
            db,
            course,
            public=False,
            published=False,
            access_type=AccessTypeEnum.PAID,
            price_amount=5000,
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_course_meta(mock_request, "course_test", False, regular_user, db)

        assert exc_info.value.status_code == 403


class TestPodcastCatalogAccess:
    async def test_paid_podcast_episode_list_hides_audio(
        self, db, org, regular_user, mock_request
    ):
        podcast = _make_podcast(
            db,
            org,
            public=False,
            access_type=AccessTypeEnum.PAID,
            price_amount=3000,
        )
        _make_episode(db, org, podcast)

        episodes = await get_episodes_by_podcast(
            mock_request, podcast.id, db, regular_user
        )

        assert len(episodes) == 1
        assert episodes[0].title == "Episode"
        assert episodes[0].audio_file == ""

    async def test_paid_podcast_episode_list_keeps_audio_for_entitled_user(
        self, db, org, regular_user, mock_request
    ):
        podcast = _make_podcast(
            db,
            org,
            public=False,
            access_type=AccessTypeEnum.PAID,
            price_amount=3000,
        )
        _make_episode(db, org, podcast)
        _grant(db, org, regular_user, "podcast_test", "podcast")

        episodes = await get_episodes_by_podcast(
            mock_request, podcast.id, db, regular_user
        )

        assert episodes[0].audio_file == "episodes/e1.mp3"

    async def test_users_only_podcast_episode_list_is_denied(
        self, db, org, regular_user, mock_request
    ):
        podcast = _make_podcast(
            db, org, public=False, access_type=AccessTypeEnum.USERS_ONLY
        )
        _make_episode(db, org, podcast)

        with pytest.raises(HTTPException) as exc_info:
            await get_episodes_by_podcast(mock_request, podcast.id, db, regular_user)

        assert exc_info.value.status_code == 403


class TestCatalogRule:
    async def test_published_paid_resource_is_readable(
        self, db, org, course, regular_user, mock_request
    ):
        _set_course(
            db,
            course,
            public=False,
            published=True,
            access_type=AccessTypeEnum.PAID,
            price_amount=5000,
        )

        decision = await check_catalog_read_access(
            mock_request,
            db,
            regular_user,
            "course_test",
            published=course.published,
            access_type=course.access_type,
        )

        assert decision.allowed is False

    async def test_published_users_only_resource_is_not_readable(
        self, db, org, course, regular_user, mock_request
    ):
        _set_course(
            db,
            course,
            public=False,
            published=True,
            access_type=AccessTypeEnum.USERS_ONLY,
        )

        with pytest.raises(HTTPException) as exc_info:
            await check_catalog_read_access(
                mock_request,
                db,
                regular_user,
                "course_test",
                published=course.published,
                access_type=course.access_type,
            )

        assert exc_info.value.status_code == 403
