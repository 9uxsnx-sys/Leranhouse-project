from typing import List, Optional, Union
from uuid import uuid4
from datetime import datetime
from sqlalchemy import text
from sqlmodel import Session, select
from fastapi import HTTPException, Request

from src.db.users import PublicUser, AnonymousUser, APITokenUser
from src.security.auth import resolve_acting_user_id
from src.db.organizations import Organization
from src.db.courses.courses import Course
from src.db.podcasts.podcasts import Podcast
from src.security.superadmin import is_user_superadmin
from src.db.communities.communities import (
    Community,
    CommunityCreate,
    CommunityRead,
    CommunityUpdate,
)
from src.services.communities.community_translations import (
    apply_community_overlay,
    apply_community_overlay_bulk,
)
from src.security.rbac import (
    check_resource_access,
    AccessAction,
    authorization_verify_if_user_is_anon,
    authorization_verify_based_on_org_admin_status,
    authorization_verify_based_on_roles,
)


COMMUNITY_RESOURCE_TYPES = ("course", "podcast")


def _get_parent_resource(
    db_session: Session, resource_uuid: str, resource_type: str
):
    """Resolve the course/podcast a community is attached to, or raise 404."""
    if resource_type == "course":
        parent = db_session.exec(
            select(Course).where(Course.course_uuid == resource_uuid)
        ).first()
    else:
        parent = db_session.exec(
            select(Podcast).where(Podcast.podcast_uuid == resource_uuid)
        ).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Linked resource not found")
    return parent


async def create_community(
    request: Request,
    org_id: int,
    community_object: CommunityCreate,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
) -> CommunityRead:
    """
    Create a new community in an organization.

    Requires admin/maintainer role in the organization.
    """
    # Verify user is not anonymous
    await authorization_verify_if_user_is_anon(current_user.id)

    # Verify org exists
    org_statement = select(Organization).where(Organization.id == org_id)
    org = db_session.exec(org_statement).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Check if user has permission to create communities using role-based permissions
    # This checks the actual database permissions (communities.action_create) instead of hardcoded role IDs
    has_create_permission = await authorization_verify_based_on_roles(
        request, current_user.id, "create", f"community_{org.org_uuid}", db_session
    )

    if not has_create_permission:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to create communities. Check your role permissions.",
        )

    # A community is an add-on: it must belong to exactly one course or podcast
    # and inherits that resource's access rules.
    resource_uuid = (community_object.resource_uuid or "").strip()
    resource_type = (community_object.resource_type or "").strip().lower()
    if not resource_uuid or resource_type not in COMMUNITY_RESOURCE_TYPES:
        raise HTTPException(
            status_code=422,
            detail="A community must be linked to a course or a podcast",
        )

    parent = _get_parent_resource(db_session, resource_uuid, resource_type)
    if int(parent.org_id) != org_id:
        raise HTTPException(
            status_code=400,
            detail="The linked resource must belong to the same organization",
        )

    existing = db_session.exec(
        select(Community).where(Community.resource_uuid == resource_uuid)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This resource already has a community",
        )

    # Create community
    community = Community(
        name=community_object.name,
        description=community_object.description,
        public=True,
        published=True,
        org_id=org_id,
        resource_uuid=resource_uuid,
        resource_type=resource_type,
        community_uuid=f"community_{uuid4()}",
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )

    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    return CommunityRead.model_validate(community.model_dump())


async def get_community(
    request: Request,
    community_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
    locale: Optional[str] = None,
) -> CommunityRead:
    """
    Get a community by UUID.
    """
    # Get community
    statement = select(Community).where(Community.community_uuid == community_uuid)
    community = db_session.exec(statement).first()

    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # RBAC check
    await check_resource_access(request, db_session, current_user, community_uuid, AccessAction.READ)

    read = CommunityRead.model_validate(community.model_dump())
    return apply_community_overlay(read, community, locale, db_session)


async def get_communities_by_org(
    request: Request,
    org_id: int,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
    page: int = 1,
    limit: int = 10,
    locale: Optional[str] = None,
) -> List[CommunityRead]:
    """
    Get paginated list of communities for an organization.

    SECURITY: Maximum limit enforced to prevent data dumping.
    """
    # SECURITY: Enforce maximum limit
    limit = min(limit, 50)
    page = max(page, 1)
    offset = (page - 1) * limit

    # Resolve to the token's creator for API-token callers so ownership /
    # admin / membership checks run against a real user_id.
    acting_user_id = resolve_acting_user_id(current_user)

    # Communities are add-ons: a row is visible only when the course/podcast it
    # belongs to is readable by this caller (plus the claim rule for free
    # content). The access checker is memoized per request, so the per-row check
    # stays cheap; org admins skip it and see everything, including orphans.
    is_admin_viewer = False
    if acting_user_id:
        if is_user_superadmin(acting_user_id, db_session):
            is_admin_viewer = True
        else:
            has_admin_read = await authorization_verify_based_on_roles(
                request, acting_user_id, "update", f"community_{org_id}", db_session
            )
            is_admin_viewer = has_admin_read or await authorization_verify_based_on_org_admin_status(
                request, acting_user_id, "read", f"org_{org_id}", db_session
            )

    all_communities = list(
        db_session.exec(
            select(Community)
            .where(Community.org_id == org_id)
            .order_by(Community.creation_date.desc())  # type: ignore[attr-defined]
        ).all()
    )

    if is_admin_viewer:
        visible = all_communities
    else:
        visible = []
        for community in all_communities:
            decision = await check_resource_access(
                request,
                db_session,
                current_user,
                community.community_uuid,
                AccessAction.READ,
                raise_on_deny=False,
            )
            if decision.allowed:
                visible.append(community)

    communities = visible[offset : offset + limit]
    return apply_community_overlay_bulk(
        [CommunityRead.model_validate(c.model_dump()) for c in communities],
        locale,
        db_session,
    )


async def get_community_by_course(
    request: Request,
    course_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
    locale: Optional[str] = None,
) -> CommunityRead | None:
    """
    Get the community linked to a specific course.
    """
    # Get the course first
    course_statement = select(Course).where(Course.course_uuid == course_uuid)
    course = db_session.exec(course_statement).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Find community linked to this course
    community_statement = select(Community).where(
        Community.resource_uuid == course.course_uuid,
        Community.resource_type == "course",
    )
    community = db_session.exec(community_statement).first()

    if not community:
        return None

    # Check if user can read the community (inherits the course's access)
    await check_resource_access(
        request, db_session, current_user, community.community_uuid, AccessAction.READ
    )

    read = CommunityRead.model_validate(community.model_dump())
    return apply_community_overlay(read, community, locale, db_session)


async def get_community_by_podcast(
    request: Request,
    podcast_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
    locale: Optional[str] = None,
) -> CommunityRead | None:
    """Get the community linked to a podcast (same rules as a course link)."""
    podcast = db_session.exec(
        select(Podcast).where(Podcast.podcast_uuid == podcast_uuid)
    ).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    community = db_session.exec(
        select(Community).where(
            Community.resource_uuid == podcast.podcast_uuid,
            Community.resource_type == "podcast",
        )
    ).first()
    if not community:
        return None

    await check_resource_access(
        request, db_session, current_user, community.community_uuid, AccessAction.READ
    )

    read = CommunityRead.model_validate(community.model_dump())
    return apply_community_overlay(read, community, locale, db_session)


async def update_community(
    request: Request,
    community_uuid: str,
    community_object: CommunityUpdate,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
) -> CommunityRead:
    """
    Update a community.

    Requires admin/maintainer role.
    """
    # Get community
    statement = select(Community).where(Community.community_uuid == community_uuid)
    community = db_session.exec(statement).first()

    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # RBAC check
    await check_resource_access(request, db_session, current_user, community_uuid, AccessAction.UPDATE)

    # Update fields
    if community_object.name is not None:
        community.name = community_object.name
    if community_object.description is not None:
        community.description = community_object.description
    if community_object.public is not None:
        community.public = community_object.public
    if community_object.published is not None:
        community.published = community_object.published
    if community_object.moderation_words is not None:
        community.moderation_words = community_object.moderation_words
    if community_object.moderation_settings is not None:
        community.moderation_settings = community_object.moderation_settings

    community.update_date = str(datetime.now())

    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    return CommunityRead.model_validate(community.model_dump())


async def update_community_banner(
    request: Request,
    community_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
    banner_file,
) -> CommunityRead:
    """
    Update a community's banner image.
    Requires admin/maintainer role.
    """
    from src.services.communities.thumbnails import upload_community_banner

    # Get community
    statement = select(Community).where(Community.community_uuid == community_uuid)
    community = db_session.exec(statement).first()

    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # RBAC check
    await check_resource_access(request, db_session, current_user, community_uuid, AccessAction.UPDATE)

    # Get org UUID for storage path
    org_statement = select(Organization).where(Organization.id == community.org_id)
    org = db_session.exec(org_statement).first()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if banner_file:
        filename = await upload_community_banner(
            banner_file,
            org.org_uuid,
            community_uuid,
        )
        community.banner_image = filename

    community.update_date = str(datetime.now())
    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    return CommunityRead.model_validate(community.model_dump())


async def delete_community_banner(
    request: Request,
    community_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
) -> CommunityRead:
    """
    Delete a community's banner image.
    Requires admin/maintainer role.
    """
    from src.services.communities.thumbnails import delete_community_banner_file

    # Get community
    statement = select(Community).where(Community.community_uuid == community_uuid)
    community = db_session.exec(statement).first()

    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # RBAC check
    await check_resource_access(request, db_session, current_user, community_uuid, AccessAction.UPDATE)

    # Get org UUID for storage path
    org_statement = select(Organization).where(Organization.id == community.org_id)
    org = db_session.exec(org_statement).first()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Delete the banner file from storage
    if community.banner_image:
        await delete_community_banner_file(org.org_uuid, community_uuid, community.banner_image)

    community.banner_image = ""
    community.update_date = str(datetime.now())
    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    return CommunityRead.model_validate(community.model_dump())


async def delete_community(
    request: Request,
    community_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
) -> dict:
    """
    Delete a community.

    Requires admin/maintainer role.
    """
    # Get community
    statement = select(Community).where(Community.community_uuid == community_uuid)
    community = db_session.exec(statement).first()

    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # RBAC check
    await check_resource_access(request, db_session, current_user, community_uuid, AccessAction.DELETE)

    db_session.delete(community)
    db_session.commit()

    return {"detail": "Community deleted"}


async def link_community_to_resource(
    request: Request,
    community_uuid: str,
    resource_uuid: str,
    resource_type: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
) -> CommunityRead:
    """Attach a community to exactly one course or podcast.

    A community never stands alone: linking is what makes it reachable, and the
    resource's own access rules then govern who can read it.
    """
    resource_type = (resource_type or "").strip().lower()
    if resource_type not in COMMUNITY_RESOURCE_TYPES:
        raise HTTPException(
            status_code=422, detail="Resource type must be 'course' or 'podcast'"
        )

    # Get community
    statement = select(Community).where(Community.community_uuid == community_uuid)
    community = db_session.exec(statement).first()

    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # RBAC check — follows the current parent (orphans: org admins only)
    await check_resource_access(request, db_session, current_user, community_uuid, AccessAction.UPDATE)

    parent = _get_parent_resource(db_session, resource_uuid, resource_type)

    # Check if the resource belongs to the same org
    if int(parent.org_id) != int(community.org_id):
        raise HTTPException(
            status_code=400,
            detail="The linked resource must belong to the same organization as the community",
        )

    # One community per resource
    existing = db_session.exec(
        select(Community).where(
            Community.resource_uuid == resource_uuid,
            Community.id != community.id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This resource already has a linked community",
        )

    community.resource_uuid = resource_uuid
    community.resource_type = resource_type
    community.update_date = str(datetime.now())

    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    return CommunityRead.model_validate(community.model_dump())


async def link_community_to_course(
    request: Request,
    community_uuid: str,
    course_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
) -> CommunityRead:
    """Back-compat wrapper around `link_community_to_resource`."""
    return await link_community_to_resource(
        request, community_uuid, course_uuid, "course", current_user, db_session
    )


async def link_community_to_podcast(
    request: Request,
    community_uuid: str,
    podcast_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
) -> CommunityRead:
    return await link_community_to_resource(
        request, community_uuid, podcast_uuid, "podcast", current_user, db_session
    )


async def unlink_community_from_resource(
    request: Request,
    community_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
) -> CommunityRead:
    """Detach a community from its resource.

    The row stays in the database (with its discussions) but becomes invisible
    to learners until it is attached again; admins can still manage it.
    """
    statement = select(Community).where(Community.community_uuid == community_uuid)
    community = db_session.exec(statement).first()

    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    await check_resource_access(request, db_session, current_user, community_uuid, AccessAction.UPDATE)

    community.resource_uuid = None
    community.resource_type = None
    community.update_date = str(datetime.now())

    db_session.add(community)
    db_session.commit()
    db_session.refresh(community)

    return CommunityRead.model_validate(community.model_dump())


async def unlink_community_from_course(
    request: Request,
    community_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
) -> CommunityRead:
    """Back-compat alias for `unlink_community_from_resource`."""
    return await unlink_community_from_resource(
        request, community_uuid, current_user, db_session
    )


async def get_community_user_rights(
    request: Request,
    community_uuid: str,
    current_user: Union[PublicUser, AnonymousUser, APITokenUser],
    db_session: Session,
) -> dict:
    """
    Get detailed user rights for a specific community.

    Returns comprehensive rights information for UI feature toggling.
    """
    # Check if community exists
    statement = select(Community).where(Community.community_uuid == community_uuid)
    community = db_session.exec(statement).first()

    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # API tokens report rights under their creator's identity.
    acting_user_id = resolve_acting_user_id(current_user)

    # Initialize rights object
    rights = {
        "community_uuid": community_uuid,
        "user_id": acting_user_id,
        "is_anonymous": acting_user_id == 0,
        "permissions": {
            "read": False,
            "create": False,
            "update": False,
            "delete": False,
            "create_discussion": False,
        },
        "ownership": {
            "is_admin": False,
            "is_maintainer_role": False,
        },
        "access": {
            "via_public": False,
            "via_usergroups": [],
            "has_usergroup_restriction": False,
        },
    }

    # Rights are inherited from the linked resource: reading follows its access
    # rules (plus the claim rule for free content), managing follows its authors
    # and org admins.
    read_decision = await check_resource_access(
        request,
        db_session,
        current_user,
        community_uuid,
        AccessAction.READ,
        raise_on_deny=False,
    )
    update_decision = await check_resource_access(
        request,
        db_session,
        current_user,
        community_uuid,
        AccessAction.UPDATE,
        raise_on_deny=False,
    )

    rights["access"]["via_public"] = read_decision.via_public
    rights["access"]["via_resource"] = (
        read_decision.via_entitlement
        or read_decision.via_usergroup
        or update_decision.via_authorship
        or update_decision.via_admin
    )
    rights["access"]["resource_uuid"] = community.resource_uuid
    rights["access"]["resource_type"] = community.resource_type
    rights["access"]["is_linked"] = bool(community.resource_uuid)

    if read_decision.allowed:
        rights["permissions"]["read"] = True
        rights["permissions"]["create_discussion"] = True

    if update_decision.allowed:
        rights["ownership"]["is_admin"] = True
        rights["ownership"]["is_maintainer_role"] = True
        rights["permissions"]["create"] = True
        rights["permissions"]["update"] = True
        rights["permissions"]["delete"] = True

    return rights


async def get_community_member_count(
    community_uuid: str,
    db_session: Session,
) -> int:
    """
    Count unique users who have participated in a community
    (discussion authors, comment authors, voters, reactors).
    """
    # Get community first
    statement = select(Community).where(Community.community_uuid == community_uuid)
    community = db_session.exec(statement).first()

    if not community:
        return 0

    community_id = community.id

    # Count distinct users across all participation tables via raw SQL
    sql = text("""
        SELECT count(*) FROM (
            SELECT author_id FROM discussion WHERE community_id = :cid
            UNION
            SELECT dc.author_id FROM discussioncomment dc
                JOIN discussion d ON dc.discussion_id = d.id
                WHERE d.community_id = :cid
            UNION
            SELECT dv.user_id FROM discussionvote dv
                JOIN discussion d ON dv.discussion_id = d.id
                WHERE d.community_id = :cid
            UNION
            SELECT dr.user_id FROM discussionreaction dr
                JOIN discussion d ON dr.discussion_id = d.id
                WHERE d.community_id = :cid
        ) AS members
    """)
    result = db_session.exec(sql, params={"cid": community_id}).one()
    return result[0] or 0


async def get_user_communities(
    request: Request,
    current_user: PublicUser | AnonymousUser,
    user_id: int,
    db_session: Session,
    page: int = 1,
    limit: int = 10,
    locale: Optional[str] = None,
) -> List[CommunityRead]:
    # Verify user is not anonymous
    await authorization_verify_if_user_is_anon(current_user.id)

    # Communities the user can actually reach: each one follows the access of
    # its linked course/podcast, so the list is filtered with the same check as
    # the org listing instead of community-level usergroup links.
    from src.db.user_organizations import UserOrganization

    org_ids = select(UserOrganization.org_id).where(
        UserOrganization.user_id == user_id
    )
    candidates = db_session.exec(
        select(Community)
        .where(Community.org_id.in_(org_ids))  # type: ignore[attr-defined]
        .order_by(Community.creation_date.desc())  # type: ignore[attr-defined]
    ).all()

    visible = []
    for community in candidates:
        decision = await check_resource_access(
            request,
            db_session,
            current_user,
            community.community_uuid,
            AccessAction.READ,
            raise_on_deny=False,
        )
        if decision.allowed:
            visible.append(community)

    communities = visible[(page - 1) * limit : (page - 1) * limit + limit]

    if not communities:
        return []

    return apply_community_overlay_bulk(
        [CommunityRead.model_validate(c.model_dump()) for c in communities],
        locale,
        db_session,
    )
