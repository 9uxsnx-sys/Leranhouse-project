from datetime import datetime

from fastapi import HTTPException, Request
from sqlmodel import Session, func, or_, select

from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.payments.enums import (
    EntitlementSourceEnum,
    EntitlementStatusEnum,
)
from src.db.payments.resource_entitlements import ResourceEntitlement
from src.db.podcasts.podcasts import Podcast
from src.db.roles import Role, RoleRead
from src.db.user_organizations import UserOrganization
from src.db.users import AnonymousUser, APITokenUser, PublicUser, User, UserRead
from src.security.auth import resolve_acting_user_id
from src.services.search.normalization import LIKE_ESCAPE_CHAR, build_like_pattern


def _resolve_resource(org_id: int, resource_uuid: str, db_session: Session) -> tuple[str, str]:
    """Return (resource_type, name) for a course or podcast owned by the org."""
    if resource_uuid.startswith("podcast_"):
        podcast = db_session.exec(
            select(Podcast).where(
                Podcast.podcast_uuid == resource_uuid,
                Podcast.org_id == org_id,
            )
        ).first()
        if not podcast:
            raise HTTPException(status_code=404, detail="Podcast not found")
        return "podcast", podcast.name

    course = db_session.exec(
        select(Course).where(
            Course.course_uuid == resource_uuid,
            Course.org_id == org_id,
        )
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return "course", course.name


async def authorize_org_admin(
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    db_session: Session,
) -> tuple[Organization, int]:
    org = db_session.exec(select(Organization).where(Organization.id == org_id)).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    acting_user_id = resolve_acting_user_id(current_user)

    from src.security.superadmin import is_user_superadmin

    if not is_user_superadmin(acting_user_id, db_session):
        from src.security.org_auth import is_org_admin

        if not is_org_admin(acting_user_id, org.id, db_session):
            raise HTTPException(
                status_code=403,
                detail="Only organization administrators can manage payments",
            )

    return org, acting_user_id


def _search_filter(statement, search: str):
    if not search:
        return statement
    pattern = build_like_pattern(search)
    return statement.where(
        or_(
            User.first_name.ilike(pattern, escape=LIKE_ESCAPE_CHAR),
            User.last_name.ilike(pattern, escape=LIKE_ESCAPE_CHAR),
            User.username.ilike(pattern, escape=LIKE_ESCAPE_CHAR),
            User.email.ilike(pattern, escape=LIKE_ESCAPE_CHAR),
        )
    )


def _active_entitlement_user_ids(org_id: int, resource_uuid: str):
    return select(ResourceEntitlement.user_id).where(
        ResourceEntitlement.org_id == org_id,
        ResourceEntitlement.resource_uuid == resource_uuid,
        ResourceEntitlement.status == EntitlementStatusEnum.ACTIVE,
    )


def _role_map(db_session: Session, rows) -> dict[int, Role]:
    role_ids = {row[1].role_id for row in rows if row[1].role_id is not None}
    if not role_ids:
        return {}
    return {
        role.id: role
        for role in db_session.exec(select(Role).where(Role.id.in_(role_ids))).all()
    }


async def list_resource_entitlements(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    resource_uuid: str,
    db_session: Session,
    search: str = "",
    page: int = 1,
    limit: int = 10,
):
    await authorize_org_admin(current_user, org_id, db_session)
    _resolve_resource(org_id, resource_uuid, db_session)

    limit = min(max(limit, 1), 100)
    page = max(page, 1)

    statement = (
        select(User, UserOrganization, ResourceEntitlement)
        .join(UserOrganization, UserOrganization.user_id == User.id)
        .join(ResourceEntitlement, ResourceEntitlement.user_id == User.id)
        .where(
            UserOrganization.org_id == org_id,
            ResourceEntitlement.org_id == org_id,
            ResourceEntitlement.resource_uuid == resource_uuid,
            ResourceEntitlement.status == EntitlementStatusEnum.ACTIVE,
        )
    )
    statement = _search_filter(statement, search)

    total = db_session.exec(
        select(func.count()).select_from(statement.subquery())
    ).one()

    offset = (page - 1) * limit
    rows = db_session.exec(
        statement.order_by(ResourceEntitlement.granted_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    roles = _role_map(db_session, rows)

    items = []
    for user, user_org, entitlement in rows:
        role = roles.get(user_org.role_id)
        items.append(
            {
                "user": UserRead.model_validate(user).model_dump(),
                "role": RoleRead.model_validate(role).model_dump() if role else None,
                "joined_at": user_org.creation_date,
                "enrolled_at": (
                    entitlement.granted_at.isoformat()
                    if entitlement.granted_at
                    else None
                ),
                "status": "active",
                "source": entitlement.source.value,
                "valid_until": (
                    entitlement.valid_until.isoformat()
                    if entitlement.valid_until
                    else None
                ),
            }
        )

    return {"items": items, "total": total, "page": page, "limit": limit}


async def list_entitlement_candidates(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    resource_uuid: str,
    db_session: Session,
    search: str = "",
    page: int = 1,
    limit: int = 10,
):
    """Org members that do not have an active entitlement for the resource."""
    await authorize_org_admin(current_user, org_id, db_session)
    _resolve_resource(org_id, resource_uuid, db_session)

    limit = min(max(limit, 1), 100)
    page = max(page, 1)

    statement = (
        select(User, UserOrganization)
        .join(UserOrganization, UserOrganization.user_id == User.id)
        .where(
            UserOrganization.org_id == org_id,
            User.id.not_in(_active_entitlement_user_ids(org_id, resource_uuid)),
        )
    )
    statement = _search_filter(statement, search)

    total = db_session.exec(
        select(func.count()).select_from(statement.subquery())
    ).one()

    offset = (page - 1) * limit
    rows = db_session.exec(
        statement.order_by(UserOrganization.id.desc()).offset(offset).limit(limit)
    ).all()

    roles = _role_map(db_session, rows)

    items = []
    for user, user_org in rows:
        role = roles.get(user_org.role_id)
        items.append(
            {
                "user": UserRead.model_validate(user).model_dump(),
                "role": RoleRead.model_validate(role).model_dump() if role else None,
                "joined_at": user_org.creation_date,
                "enrolled_at": None,
                "status": None,
                "source": None,
                "valid_until": None,
            }
        )

    return {"items": items, "total": total, "page": page, "limit": limit}


async def bulk_grant_entitlements(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    resource_uuid: str,
    user_ids: list[int],
    db_session: Session,
    valid_until: datetime | None = None,
):
    org, acting_user_id = await authorize_org_admin(current_user, org_id, db_session)
    resource_type, _ = _resolve_resource(org.id, resource_uuid, db_session)

    granted: list[int] = []
    already: list[int] = []
    skipped: list[int] = []

    for user_id in dict.fromkeys(user_ids):
        membership = db_session.exec(
            select(UserOrganization).where(
                UserOrganization.user_id == user_id,
                UserOrganization.org_id == org.id,
            )
        ).first()
        if not membership:
            skipped.append(user_id)
            continue

        existing = db_session.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.org_id == org.id,
                ResourceEntitlement.user_id == user_id,
                ResourceEntitlement.resource_uuid == resource_uuid,
                ResourceEntitlement.status == EntitlementStatusEnum.ACTIVE,
            )
        ).first()
        if existing:
            already.append(user_id)
            continue

        db_session.add(
            ResourceEntitlement(
                org_id=org.id,
                user_id=user_id,
                resource_uuid=resource_uuid,
                resource_type=resource_type,
                source=EntitlementSourceEnum.MANUAL,
                status=EntitlementStatusEnum.ACTIVE,
                valid_from=datetime.now(),
                valid_until=valid_until,
                granted_by=acting_user_id,
                granted_at=datetime.now(),
            )
        )
        granted.append(user_id)

    db_session.commit()

    return {"granted": granted, "already": already, "skipped": skipped}


async def bulk_revoke_entitlements(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    resource_uuid: str,
    user_ids: list[int],
    db_session: Session,
    reason: str = "manual",
):
    org, _ = await authorize_org_admin(current_user, org_id, db_session)
    _resolve_resource(org.id, resource_uuid, db_session)

    revoked: list[int] = []
    not_found: list[int] = []
    now = datetime.now()

    for user_id in dict.fromkeys(user_ids):
        entitlement = db_session.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.org_id == org.id,
                ResourceEntitlement.user_id == user_id,
                ResourceEntitlement.resource_uuid == resource_uuid,
                ResourceEntitlement.status == EntitlementStatusEnum.ACTIVE,
            )
        ).first()
        if not entitlement:
            not_found.append(user_id)
            continue

        entitlement.status = EntitlementStatusEnum.REVOKED
        entitlement.revoked_at = now
        entitlement.revoke_reason = reason
        db_session.add(entitlement)
        revoked.append(user_id)

    db_session.commit()

    return {"revoked": revoked, "not_found": not_found}
