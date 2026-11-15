"""Tests for src/services/communities/*.py."""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from src.db.communities.communities import Community, CommunityCreate, CommunityUpdate
from src.db.communities.discussions import Discussion, DiscussionUpdate
from src.db.communities.discussion_votes import DiscussionVote
from src.db.courses.courses import Course
from src.db.usergroup_resources import UserGroupResource
from src.db.usergroup_user import UserGroupUser
from src.db.usergroups import UserGroup
from src.services.communities.communities import (
    create_community,
    delete_community,
    get_communities_by_org,
    get_community,
    get_community_by_course,
    get_community_user_rights,
    link_community_to_course,
    unlink_community_from_course,
    update_community,
)
from src.services.communities.discussions import (
    DiscussionSortBy,
    calculate_hot_score,
    create_discussion,
    delete_discussion,
    get_discussion,
    get_discussions_by_community,
    lock_discussion,
    pin_discussion,
    update_discussion,
    validate_label,
)


def _make_course(db, org, **overrides):
    course = Course(
        id=overrides.pop("id", None),
        name=overrides.pop("name", "Course"),
        description=overrides.pop("description", "Desc"),
        public=overrides.pop("public", True),
        published=overrides.pop("published", True),
        open_to_contributors=overrides.pop("open_to_contributors", False),
        org_id=org.id,
        course_uuid=overrides.pop("course_uuid", "course_test"),
        creation_date=overrides.pop("creation_date", "2024-01-01"),
        update_date=overrides.pop("update_date", "2024-01-01"),
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def _make_community(db, org, **overrides):
    community = Community(
        id=overrides.pop("id", None),
        org_id=org.id,
        name=overrides.pop("name", "Community"),
        description=overrides.pop("description", "Desc"),
        public=overrides.pop("public", True),
        thumbnail_image=overrides.pop("thumbnail_image", ""),
        resource_uuid=overrides.pop("resource_uuid", None),
        resource_type=overrides.pop("resource_type", None),
        community_uuid=overrides.pop("community_uuid", "community_test"),
        moderation_words=overrides.pop("moderation_words", []),
        creation_date=overrides.pop("creation_date", "2024-01-01"),
        update_date=overrides.pop("update_date", "2024-01-01"),
    )
    db.add(community)
    db.commit()
    db.refresh(community)
    return community


def _make_discussion(db, community, org, author_id, **overrides):
    discussion = Discussion(
        id=overrides.pop("id", None),
        title=overrides.pop("title", "Title"),
        content=overrides.pop("content", "Content"),
        label=overrides.pop("label", "general"),
        emoji=overrides.pop("emoji", None),
        community_id=community.id,
        org_id=org.id,
        author_id=author_id,
        discussion_uuid=overrides.pop("discussion_uuid", "discussion_test"),
        upvote_count=overrides.pop("upvote_count", 0),
        edit_count=overrides.pop("edit_count", 0),
        is_pinned=overrides.pop("is_pinned", False),
        is_locked=overrides.pop("is_locked", False),
        creation_date=overrides.pop("creation_date", "2024-01-01T00:00:00+00:00"),
        update_date=overrides.pop("update_date", "2024-01-01T00:00:00+00:00"),
    )
    db.add(discussion)
    db.commit()
    db.refresh(discussion)
    return discussion


def _make_usergroup(db, org, **overrides):
    usergroup = UserGroup(
        id=overrides.pop("id", None),
        org_id=org.id,
        name=overrides.pop("name", "UG"),
        description=overrides.pop("description", "Desc"),
        usergroup_uuid=overrides.pop("usergroup_uuid", "ug_test"),
        creation_date=overrides.pop("creation_date", str(datetime.now())),
        update_date=overrides.pop("update_date", str(datetime.now())),
    )
    db.add(usergroup)
    db.commit()
    db.refresh(usergroup)
    return usergroup


class TestCommunitiesService:
    @pytest.mark.asyncio
    async def test_community_crud_link_and_lookup(
        self, db, org, admin_user, mock_request
    ):
        course = _make_course(db, org, course_uuid="course_link_a")
        other_course = _make_course(db, org, id=31, course_uuid="course_link_b")
        with patch(
            "src.services.communities.communities.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.communities.authorization_verify_based_on_roles",
            new_callable=AsyncMock,
            return_value=True,
        ), patch(
            "src.services.communities.communities.check_resource_access",
            new_callable=AsyncMock,
        ):
            created = await create_community(
                mock_request,
                org.id,
                CommunityCreate(
                    name="Community",
                    description="Desc",
                    resource_uuid=course.course_uuid,
                    resource_type="course",
                ),
                admin_user,
                db,
            )
            fetched = await get_community(
                mock_request, created.community_uuid, admin_user, db
            )
            linked = await link_community_to_course(
                mock_request,
                created.community_uuid,
                other_course.course_uuid,
                admin_user,
                db,
            )
            by_course = await get_community_by_course(
                mock_request, other_course.course_uuid, admin_user, db
            )
            updated = await update_community(
                mock_request,
                created.community_uuid,
                CommunityUpdate(
                    name="Updated",
                    description="Updated Desc",
                    public=False,
                    moderation_words=["x"],
                    moderation_settings={"max_post_length": 500},
                ),
                admin_user,
                db,
            )
            unlinked = await unlink_community_from_course(
                mock_request, created.community_uuid, admin_user, db
            )
            deleted = await delete_community(
                mock_request, created.community_uuid, admin_user, db
            )

        assert fetched.community_uuid == created.community_uuid
        assert created.resource_uuid == course.course_uuid
        assert created.resource_type == "course"
        assert linked.resource_uuid == other_course.course_uuid
        assert by_course.community_uuid == created.community_uuid
        assert updated.name == "Updated"
        assert updated.description == "Updated Desc"
        assert updated.public is False
        assert updated.moderation_words == ["x"]
        assert unlinked.resource_uuid is None
        assert unlinked.resource_type is None
        assert deleted == {"detail": "Community deleted"}

    @pytest.mark.asyncio
    async def test_get_communities_by_org_filters_by_linked_resource(
        self, db, org, admin_user, regular_user, anonymous_user, mock_request
    ):
        course = _make_course(db, org, course_uuid="course_filter_a")
        visible = _make_community(
            db,
            org,
            id=1,
            community_uuid="community_visible",
            resource_uuid=course.course_uuid,
            resource_type="course",
        )
        hidden = _make_community(
            db,
            org,
            id=2,
            community_uuid="community_hidden",
            resource_uuid="course_filter_b",
            resource_type="course",
        )
        orphan = _make_community(
            db, org, id=3, community_uuid="community_orphan"
        )

        async def fake_check(request, session, user, uuid, action, **kwargs):
            return SimpleNamespace(
                allowed=uuid == visible.community_uuid,
                via_public=False,
                via_usergroup=False,
                via_entitlement=False,
                via_authorship=False,
                via_admin=False,
                via_role=False,
                reason="filtered",
            )

        with patch(
            "src.services.communities.communities.is_user_superadmin",
            return_value=False,
        ), patch(
            "src.services.communities.communities.authorization_verify_based_on_roles",
            new_callable=AsyncMock,
            return_value=False,
        ), patch(
            "src.services.communities.communities.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=False,
        ), patch(
            "src.services.communities.communities.check_resource_access",
            side_effect=fake_check,
        ):
            regular_result = await get_communities_by_org(
                mock_request, org.id, regular_user, db
            )
            rights = await get_community_user_rights(
                mock_request, visible.community_uuid, regular_user, db
            )

        with patch(
            "src.services.communities.communities.is_user_superadmin",
            return_value=True,
        ):
            admin_result = await get_communities_by_org(
                mock_request, org.id, admin_user, db
            )

        # Orphans and communities whose linked resource is denied stay hidden.
        assert [community.community_uuid for community in regular_result] == [
            visible.community_uuid
        ]
        assert rights["permissions"]["read"] is True
        assert rights["access"]["is_linked"] is True
        assert rights["access"]["resource_uuid"] == course.course_uuid
        assert len(admin_result) == 3

    @pytest.mark.asyncio
    async def test_community_admin_and_error_branches(
        self, db, org, other_org, admin_user, anonymous_user, mock_request
    ):
        course = _make_course(db, org, id=20, course_uuid="course_admin")
        community = _make_community(
            db,
            org,
            id=21,
            community_uuid="community_admin",
            public=False,
        )
        _linked_community = _make_community(
            db,
            org,
            id=22,
            community_uuid="community_linked",
            public=False,
            resource_uuid=course.course_uuid,
            resource_type="course",
        )
        other_org_community = _make_community(
            db,
            org,
            id=23,
            community_uuid="community_other_org",
            public=False,
        )

        allowed_decision = SimpleNamespace(
            allowed=True,
            via_public=False,
            via_usergroup=False,
            via_entitlement=False,
            via_authorship=False,
            via_admin=False,
            via_role=False,
            reason="allowed",
        )
        denied_decision = SimpleNamespace(
            allowed=False,
            via_public=False,
            via_usergroup=False,
            via_entitlement=False,
            via_authorship=False,
            via_admin=False,
            via_role=False,
            reason="denied",
        )

        with patch(
            "src.services.communities.communities.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.communities.authorization_verify_based_on_roles",
            new_callable=AsyncMock,
            return_value=True,
        ), patch(
            "src.services.communities.communities.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=False,
        ), patch(
            "src.services.communities.communities.check_resource_access",
            new_callable=AsyncMock,
            return_value=allowed_decision,
        ):
            admin_rights_result = await get_community_user_rights(
                mock_request, community.community_uuid, admin_user, db
            )
            admin_list_result = await get_communities_by_org(
                mock_request, org.id, admin_user, db
            )
            orphan_course = _make_course(
                db,
                org,
                id=24,
                course_uuid="course_orphan",
            )
            no_link_result = await get_community_by_course(
                mock_request, orphan_course.course_uuid, admin_user, db
            )
            with pytest.raises(HTTPException) as create_missing_org_exc:
                await create_community(
                    mock_request,
                    9999,
                    CommunityCreate(
                        name="Missing Org",
                        description="Desc",
                        resource_uuid=course.course_uuid,
                        resource_type="course",
                    ),
                    admin_user,
                    db,
                )
            with pytest.raises(HTTPException) as get_missing_exc:
                await get_community(mock_request, "missing-community", admin_user, db)
            with pytest.raises(HTTPException) as course_missing_exc:
                await get_community_by_course(
                    mock_request, "missing-course", admin_user, db
                )
            with pytest.raises(HTTPException) as update_missing_exc:
                await update_community(
                    mock_request,
                    "missing-community",
                    CommunityUpdate(name="Missing"),
                    admin_user,
                    db,
                )
            with pytest.raises(HTTPException) as delete_missing_exc:
                await delete_community(
                    mock_request, "missing-community", admin_user, db
                )
            with pytest.raises(HTTPException) as link_missing_community_exc:
                await link_community_to_course(
                    mock_request, "missing-community", course.course_uuid, admin_user, db
                )
            with pytest.raises(HTTPException) as link_missing_course_exc:
                await link_community_to_course(
                    mock_request, community.community_uuid, "missing-course", admin_user, db
                )
            with pytest.raises(HTTPException) as unlink_missing_exc:
                await unlink_community_from_course(
                    mock_request, "missing-community", admin_user, db
                )

        with patch(
            "src.services.communities.communities.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.communities.authorization_verify_based_on_roles",
            new_callable=AsyncMock,
            return_value=False,
        ), patch(
            "src.services.communities.communities.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=False,
        ), patch(
            "src.services.communities.communities.check_resource_access",
            new_callable=AsyncMock,
            return_value=allowed_decision,
        ):
            with pytest.raises(HTTPException) as create_denied_exc:
                await create_community(
                    mock_request,
                    org.id,
                    CommunityCreate(
                        name="Denied",
                        description="Desc",
                        resource_uuid=course.course_uuid,
                        resource_type="course",
                    ),
                    admin_user,
                    db,
                )
            existing_linked_community = _make_community(
                db,
                org,
                id=26,
                community_uuid="community_existing_link",
            )
            with pytest.raises(HTTPException) as link_same_org_exc:
                await link_community_to_course(
                    mock_request,
                    community.community_uuid,
                    course.course_uuid,
                    admin_user,
                    db,
                )
            assert existing_linked_community.resource_uuid is None

        with patch(
            "src.services.communities.communities.check_resource_access",
            new_callable=AsyncMock,
            return_value=denied_decision,
        ):
            anon_rights_result = await get_community_user_rights(
                mock_request, community.community_uuid, anonymous_user, db
            )

        other_course = _make_course(
            db,
            other_org,
            id=25,
            course_uuid="course_other_org",
        )
        with patch(
            "src.services.communities.communities.check_resource_access",
            new_callable=AsyncMock,
        ):
            with pytest.raises(HTTPException) as link_org_exc:
                await link_community_to_course(
                    mock_request,
                    other_org_community.community_uuid,
                    other_course.course_uuid,
                    admin_user,
                    db,
                )

        assert admin_rights_result["permissions"]["create"] is True
        assert admin_rights_result["permissions"]["update"] is True
        assert admin_rights_result["permissions"]["delete"] is True
        assert admin_rights_result["ownership"]["is_admin"] is True
        assert admin_rights_result["ownership"]["is_maintainer_role"] is True
        assert admin_rights_result["permissions"]["read"] is True
        assert anon_rights_result["permissions"]["read"] is False
        assert len(admin_list_result) == 3
        assert no_link_result is None
        assert create_missing_org_exc.value.status_code == 404
        assert get_missing_exc.value.status_code == 404
        assert course_missing_exc.value.status_code == 404
        assert update_missing_exc.value.status_code == 404
        assert delete_missing_exc.value.status_code == 404
        assert link_missing_community_exc.value.status_code == 404
        assert link_missing_course_exc.value.status_code == 404
        assert unlink_missing_exc.value.status_code == 404
        assert create_denied_exc.value.status_code == 403
        assert link_same_org_exc.value.status_code == 400
        assert link_org_exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_community_user_rights_anonymous_and_no_access(
        self, db, org, anonymous_user, regular_user, mock_request
    ):
        linked = _make_community(
            db,
            org,
            id=30,
            community_uuid="community_linked_rights",
            resource_uuid="course_rights",
            resource_type="course",
        )
        orphan = _make_community(
            db, org, id=31, community_uuid="community_orphan_rights"
        )

        denied_decision = SimpleNamespace(
            allowed=False,
            via_public=False,
            via_usergroup=False,
            via_entitlement=False,
            via_authorship=False,
            via_admin=False,
            via_role=False,
            reason="denied",
        )

        with patch(
            "src.services.communities.communities.check_resource_access",
            new_callable=AsyncMock,
            return_value=denied_decision,
        ):
            anonymous_rights = await get_community_user_rights(
                mock_request, linked.community_uuid, anonymous_user, db
            )
            orphan_rights = await get_community_user_rights(
                mock_request, orphan.community_uuid, regular_user, db
            )

        assert anonymous_rights["permissions"]["read"] is False
        assert anonymous_rights["permissions"]["create_discussion"] is False
        assert anonymous_rights["access"]["is_linked"] is True
        assert anonymous_rights["access"]["resource_uuid"] == "course_rights"
        assert orphan_rights["permissions"]["read"] is False
        assert orphan_rights["access"]["is_linked"] is False

    @pytest.mark.asyncio
    async def test_community_error_paths(self, db, org, admin_user, mock_request):
        course = _make_course(db, org, id=2, course_uuid="course_two")
        community = _make_community(
            db,
            org,
            id=10,
            resource_uuid=course.course_uuid,
            resource_type="course",
        )
        _make_community(
            db,
            org,
            id=11,
            community_uuid="community_two",
        )

        # A community can only link to a resource that has no community yet, so
        # an orphan cannot steal the course already owned by `community`.
        orphan = _make_community(
            db,
            org,
            id=12,
            community_uuid="community_orphan_two",
        )

        with patch(
            "src.services.communities.communities.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.communities.authorization_verify_based_on_roles",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with pytest.raises(HTTPException) as create_exc:
                await create_community(
                    mock_request,
                    org.id,
                    CommunityCreate(
                        name="Denied",
                        description="Desc",
                        resource_uuid=course.course_uuid,
                        resource_type="course",
                    ),
                    admin_user,
                    db,
                )
        assert create_exc.value.status_code == 403

        with patch(
            "src.services.communities.communities.check_resource_access",
            new_callable=AsyncMock,
        ):
            with pytest.raises(HTTPException) as link_exc:
                await link_community_to_course(
                    mock_request, orphan.community_uuid, course.course_uuid, admin_user, db
                )
        assert link_exc.value.status_code == 400

        with pytest.raises(HTTPException) as rights_exc:
            await get_community_user_rights(mock_request, "missing", admin_user, db)
        assert rights_exc.value.status_code == 404


class TestDiscussionsService:
    def test_hot_score_and_label_validation(self):
        now = datetime.now(timezone.utc).isoformat()
        naive = datetime.now().replace(tzinfo=None).isoformat()
        old = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        assert calculate_hot_score(10, now) > calculate_hot_score(10, old)
        assert isinstance(calculate_hot_score(5, naive), float)
        assert isinstance(calculate_hot_score(5, "not-a-timestamp"), float)
        assert validate_label("question") == "question"
        assert validate_label("nope") == "general"

    @pytest.mark.asyncio
    async def test_discussion_crud_and_sorting(
        self, db, org, admin_user, anonymous_user, mock_request
    ):
        community = _make_community(db, org)
        with patch(
            "src.services.communities.discussions.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.check_resource_access",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.validate_discussion_content",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.track",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.dispatch_webhooks",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.notify",
        ), patch(
            "src.services.communities.discussions.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=True,
        ):
            created = await create_discussion(
                mock_request,
                community.community_uuid,
                "First",
                "Body",
                "question",
                admin_user,
                db,
                emoji="🔥",
            )
            fetched = await get_discussion(
                mock_request, created.discussion_uuid, admin_user, db
            )
            updated = await update_discussion(
                mock_request,
                created.discussion_uuid,
                DiscussionUpdate(
                    title="Updated", content="Updated body", label="idea", emoji=""
                ),
                admin_user,
                db,
            )
            pinned = await pin_discussion(
                mock_request, created.discussion_uuid, True, admin_user, db
            )
            locked = await lock_discussion(
                mock_request, created.discussion_uuid, True, admin_user, db
            )
            upvotes = await get_discussions_by_community(
                mock_request,
                community.community_uuid,
                admin_user,
                db,
                sort_by=DiscussionSortBy.UPVOTES,
                label="idea",
            )

        older = _make_discussion(
            db,
            community,
            org,
            admin_user.id,
            id=20,
            discussion_uuid="discussion_old",
            upvote_count=5,
            creation_date=(datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        )
        db.add(
            DiscussionVote(
                discussion_id=older.id,
                user_id=admin_user.id,
                vote_uuid="vote_x",
                creation_date=str(datetime.now()),
            )
        )
        db.commit()

        with patch(
            "src.services.communities.discussions.check_resource_access",
            new_callable=AsyncMock,
        ):
            recent = await get_discussions_by_community(
                mock_request,
                community.community_uuid,
                admin_user,
                db,
                sort_by=DiscussionSortBy.RECENT,
            )
            hot = await get_discussions_by_community(
                mock_request,
                community.community_uuid,
                admin_user,
                db,
                sort_by=DiscussionSortBy.HOT,
            )
            empty_community = _make_community(
                db, org, id=21, community_uuid="community_empty"
            )
            empty = await get_discussions_by_community(
                mock_request,
                empty_community.community_uuid,
                admin_user,
                db,
                limit=0,
            )

        with patch(
            "src.services.communities.discussions.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=True,
        ):
            deleted = await delete_discussion(
                mock_request, created.discussion_uuid, admin_user, db
            )

        assert fetched.has_voted is True
        assert updated.label == "idea"
        assert updated.emoji is None
        assert updated.content == "Updated body"
        assert pinned.is_pinned is True
        assert locked.is_locked is True
        assert upvotes[0].discussion_uuid == created.discussion_uuid
        assert recent[0].is_pinned is True
        assert hot[0].is_pinned is True
        assert empty == []
        assert deleted == {"detail": "Discussion deleted"}

    @pytest.mark.asyncio
    async def test_discussion_error_paths(self, db, org, admin_user, regular_user, mock_request):
        community = _make_community(db, org)
        discussion = _make_discussion(
            db,
            community,
            org,
            admin_user.id,
            edit_count=2,
            discussion_uuid="discussion_limit",
        )

        with patch(
            "src.services.communities.discussions.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with pytest.raises(HTTPException) as update_exc:
                await update_discussion(
                    mock_request,
                    discussion.discussion_uuid,
                    DiscussionUpdate(content="Nope"),
                    regular_user,
                    db,
                )
        assert update_exc.value.status_code == 403

        with patch(
            "src.services.communities.discussions.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with pytest.raises(HTTPException) as limit_exc:
                await update_discussion(
                    mock_request,
                    discussion.discussion_uuid,
                    DiscussionUpdate(content="Still nope"),
                    admin_user,
                    db,
                )
        assert limit_exc.value.status_code == 403

        with patch(
            "src.services.communities.discussions.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with pytest.raises(HTTPException) as pin_exc:
                await pin_discussion(
                    mock_request, discussion.discussion_uuid, True, regular_user, db
                )
        assert pin_exc.value.status_code == 403

        with patch(
            "src.services.communities.discussions.check_resource_access",
            new_callable=AsyncMock,
        ):
            with pytest.raises(HTTPException) as list_missing_exc:
                await get_discussions_by_community(
                    mock_request,
                    "community_missing_discussions",
                    admin_user,
                    db,
                )
        assert list_missing_exc.value.status_code == 404

        with patch(
            "src.services.communities.discussions.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with pytest.raises(HTTPException) as update_missing_discussion_exc:
                await update_discussion(
                    mock_request,
                    "discussion_missing",
                    DiscussionUpdate(content="No such discussion"),
                    admin_user,
                    db,
                )
        assert update_missing_discussion_exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_discussion_missing_and_permission_paths(
        self, db, org, admin_user, regular_user, mock_request
    ):
        community = _make_community(db, org, id=30, community_uuid="community_discussion_paths")
        discussion = _make_discussion(
            db,
            community,
            org,
            admin_user.id,
            discussion_uuid="discussion_discussion_paths",
        )
        orphan_discussion = Discussion(
            title="Orphan",
            content="Body",
            label="general",
            emoji=None,
            community_id=987654,
            org_id=org.id,
            author_id=admin_user.id,
            discussion_uuid="discussion_orphan",
            upvote_count=0,
            edit_count=0,
            is_pinned=False,
            is_locked=False,
            creation_date="2024-01-01T00:00:00+00:00",
            update_date="2024-01-01T00:00:00+00:00",
        )
        db.add(orphan_discussion)
        db.commit()
        db.refresh(orphan_discussion)

        with patch(
            "src.services.communities.discussions.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.check_resource_access",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.validate_discussion_content",
            new_callable=AsyncMock,
        ):
            with pytest.raises(HTTPException) as create_exc:
                await create_discussion(
                    mock_request,
                    "community_missing",
                    "Title",
                    "Body",
                    "question",
                    admin_user,
                    db,
                )
        assert create_exc.value.status_code == 404

        with pytest.raises(HTTPException) as missing_discussion_exc:
            await get_discussion(mock_request, "discussion_missing", admin_user, db)
        assert missing_discussion_exc.value.status_code == 404

        with patch(
            "src.services.communities.discussions.check_resource_access",
            new_callable=AsyncMock,
        ):
            with pytest.raises(HTTPException) as orphan_get_exc:
                await get_discussion(
                    mock_request, orphan_discussion.discussion_uuid, admin_user, db
                )
        assert orphan_get_exc.value.status_code == 404

        with patch(
            "src.services.communities.discussions.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with pytest.raises(HTTPException) as update_forbidden_exc:
                await update_discussion(
                    mock_request,
                    discussion.discussion_uuid,
                    DiscussionUpdate(content="No permission"),
                    regular_user,
                    db,
                )
            with pytest.raises(HTTPException) as pin_forbidden_exc:
                await pin_discussion(
                    mock_request, discussion.discussion_uuid, True, regular_user, db
                )
            with pytest.raises(HTTPException) as lock_forbidden_exc:
                await lock_discussion(
                    mock_request, discussion.discussion_uuid, True, regular_user, db
                )
            with pytest.raises(HTTPException) as delete_forbidden_exc:
                await delete_discussion(
                    mock_request, discussion.discussion_uuid, regular_user, db
                )
        assert update_forbidden_exc.value.status_code == 403
        assert pin_forbidden_exc.value.status_code == 403
        assert lock_forbidden_exc.value.status_code == 403
        assert delete_forbidden_exc.value.status_code == 403

        with patch(
            "src.services.communities.discussions.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ):
            with pytest.raises(HTTPException) as pin_missing_exc:
                await pin_discussion(
                    mock_request, "discussion_missing", True, admin_user, db
                )
            with pytest.raises(HTTPException) as lock_missing_exc:
                await lock_discussion(
                    mock_request, "discussion_missing", True, admin_user, db
                )
            with pytest.raises(HTTPException) as delete_missing_exc:
                await delete_discussion(
                    mock_request, "discussion_missing", admin_user, db
                )
        assert pin_missing_exc.value.status_code == 404
        assert lock_missing_exc.value.status_code == 404
        assert delete_missing_exc.value.status_code == 404

        with patch(
            "src.services.communities.discussions.authorization_verify_if_user_is_anon",
            new_callable=AsyncMock,
        ), patch(
            "src.services.communities.discussions.authorization_verify_based_on_org_admin_status",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with pytest.raises(HTTPException) as update_orphan_exc:
                await update_discussion(
                    mock_request,
                    orphan_discussion.discussion_uuid,
                    DiscussionUpdate(content="Still no community"),
                    admin_user,
                    db,
                )
            with pytest.raises(HTTPException) as pin_orphan_exc:
                await pin_discussion(
                    mock_request, orphan_discussion.discussion_uuid, True, admin_user, db
                )
            with pytest.raises(HTTPException) as lock_orphan_exc:
                await lock_discussion(
                    mock_request, orphan_discussion.discussion_uuid, True, admin_user, db
                )
            with pytest.raises(HTTPException) as delete_orphan_exc:
                await delete_discussion(
                    mock_request, orphan_discussion.discussion_uuid, admin_user, db
                )
        assert update_orphan_exc.value.status_code == 404
        assert pin_orphan_exc.value.status_code == 404
        assert lock_orphan_exc.value.status_code == 404
        assert delete_orphan_exc.value.status_code == 404
