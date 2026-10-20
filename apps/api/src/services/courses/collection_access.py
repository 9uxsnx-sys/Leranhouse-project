from datetime import datetime

from fastapi import HTTPException, Request, status
from sqlmodel import Session, and_, func, or_, select

from src.db.collection_users import CollectionUser
from src.db.collections import Collection
from src.db.roles import Role, RoleRead
from src.db.user_organizations import UserOrganization
from src.db.users import AnonymousUser, APITokenUser, PublicUser, User, UserRead
from src.security.auth import resolve_acting_user_id
from src.security.rbac import AccessAction, check_resource_access
from src.services.search.normalization import LIKE_ESCAPE_CHAR, build_like_pattern


async def _get_collection_and_authorize(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: Session,
) -> Collection:
    collection = db_session.exec(
        select(Collection).where(Collection.collection_uuid == collection_uuid)
    ).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found"
        )

    await check_resource_access(
        request, db_session, current_user, collection.collection_uuid, AccessAction.UPDATE
    )
    return collection


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


async def list_collection_access_users(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: Session,
    list_filter: str = "enrolled",
    search: str = "",
    page: int = 1,
    limit: int = 10,
):
    """List learners who claimed a collection, or org members not listed yet.

    Mirrors the course Access tab: ``enrolled`` is the bundle inventory, while
    ``available`` feeds the search picker. Paid rosters keep using payment
    entitlements and private rosters keep using user groups.
    """
    collection = await _get_collection_and_authorize(
        request, collection_uuid, current_user, db_session
    )

    limit = min(max(limit, 1), 100)
    page = max(page, 1)

    claimed_user_ids = select(CollectionUser.user_id).where(
        CollectionUser.collection_id == collection.id,
        CollectionUser.org_id == collection.org_id,
    )

    if list_filter == "available":
        statement = (
            select(User, UserOrganization)
            .join(UserOrganization, UserOrganization.user_id == User.id)
            .where(
                UserOrganization.org_id == collection.org_id,
                User.id.not_in(claimed_user_ids),
            )
        )
    else:
        statement = (
            select(User, UserOrganization, CollectionUser)
            .join(UserOrganization, UserOrganization.user_id == User.id)
            .join(
                CollectionUser,
                and_(
                    CollectionUser.user_id == User.id,
                    CollectionUser.collection_id == collection.id,
                    CollectionUser.org_id == collection.org_id,
                ),
            )
            .where(UserOrganization.org_id == collection.org_id)
        )

    statement = _search_filter(statement, search)

    total = db_session.exec(
        select(func.count()).select_from(statement.subquery())
    ).one()

    offset = (page - 1) * limit
    if list_filter == "available":
        statement = statement.order_by(UserOrganization.id.desc())
    else:
        statement = statement.order_by(CollectionUser.creation_date.desc())

    rows = db_session.exec(statement.offset(offset).limit(limit)).all()

    role_ids = {row[1].role_id for row in rows if row[1].role_id is not None}
    roles = (
        {role.id: role for role in db_session.exec(select(Role).where(Role.id.in_(role_ids))).all()}
        if role_ids
        else {}
    )

    items = []
    for row in rows:
        user, user_org = row[0], row[1]
        claim = row[2] if len(row) > 2 else None
        role = roles.get(user_org.role_id)
        items.append(
            {
                "user": UserRead.model_validate(user).model_dump(),
                "role": RoleRead.model_validate(role).model_dump() if role else None,
                "joined_at": user_org.creation_date,
                "enrolled_at": claim.creation_date if claim else None,
                "status": None,
            }
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
    }


async def bulk_enroll_collection_users(
    request: Request,
    collection_uuid: str,
    user_ids: list[int],
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: Session,
):
    """Add org members to a collection's inventory."""
    collection = await _get_collection_and_authorize(
        request, collection_uuid, current_user, db_session
    )

    enrolled: list[int] = []
    already_enrolled: list[int] = []
    skipped: list[int] = []
    now = datetime.now()

    for user_id in dict.fromkeys(user_ids):
        membership = db_session.exec(
            select(UserOrganization).where(
                UserOrganization.user_id == user_id,
                UserOrganization.org_id == collection.org_id,
            )
        ).first()
        if not membership:
            skipped.append(user_id)
            continue

        existing = db_session.exec(
            select(CollectionUser).where(
                CollectionUser.collection_id == collection.id,
                CollectionUser.user_id == user_id,
                CollectionUser.org_id == collection.org_id,
            )
        ).first()
        if existing:
            already_enrolled.append(user_id)
            continue

        db_session.add(
            CollectionUser(
                collection_id=int(collection.id),  # type: ignore[arg-type]
                user_id=user_id,
                org_id=int(collection.org_id),
                creation_date=str(now),
                update_date=str(now),
            )
        )
        enrolled.append(user_id)

    db_session.commit()

    return {
        "enrolled": enrolled,
        "already_enrolled": already_enrolled,
        "skipped": skipped,
    }


async def bulk_unenroll_collection_users(
    request: Request,
    collection_uuid: str,
    user_ids: list[int],
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: Session,
):
    """Remove users from a collection's inventory."""
    collection = await _get_collection_and_authorize(
        request, collection_uuid, current_user, db_session
    )

    removed: list[int] = []
    not_enrolled: list[int] = []

    for user_id in dict.fromkeys(user_ids):
        claim = db_session.exec(
            select(CollectionUser).where(
                CollectionUser.collection_id == collection.id,
                CollectionUser.user_id == user_id,
                CollectionUser.org_id == collection.org_id,
            )
        ).first()
        if not claim:
            not_enrolled.append(user_id)
            continue

        db_session.delete(claim)
        removed.append(user_id)

    db_session.commit()

    return {"removed": removed, "not_enrolled": not_enrolled}


async def claim_collection(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser,
    db_session: Session,
):
    """Add the current learner to the collection inventory (idempotent)."""
    collection = db_session.exec(
        select(Collection).where(Collection.collection_uuid == collection_uuid)
    ).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found"
        )

    await check_resource_access(
        request, db_session, current_user, collection.collection_uuid, AccessAction.READ
    )

    user_id = resolve_acting_user_id(current_user)
    if user_id == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )

    membership = db_session.exec(
        select(UserOrganization).where(
            UserOrganization.user_id == user_id,
            UserOrganization.org_id == collection.org_id,
        )
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Join the organization to claim this collection",
        )

    existing = db_session.exec(
        select(CollectionUser).where(
            CollectionUser.collection_id == collection.id,
            CollectionUser.user_id == user_id,
            CollectionUser.org_id == collection.org_id,
        )
    ).first()
    if existing:
        return {"claimed": False, "already_claimed": True}

    now = datetime.now()
    db_session.add(
        CollectionUser(
            collection_id=int(collection.id),  # type: ignore[arg-type]
            user_id=user_id,
            org_id=int(collection.org_id),
            creation_date=str(now),
            update_date=str(now),
        )
    )
    db_session.commit()

    return {"claimed": True, "already_claimed": False}
