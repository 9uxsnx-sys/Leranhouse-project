from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException, Request
from sqlmodel import Session, and_, func, or_, select

from src.db.courses.courses import Course
from src.db.roles import Role, RoleRead
from src.db.trail_runs import TrailRun
from src.db.trail_steps import TrailStep
from src.db.trails import Trail
from src.db.user_organizations import UserOrganization
from src.db.users import AnonymousUser, APITokenUser, PublicUser, User, UserRead
from src.security.rbac import AccessAction, check_resource_access
from src.services.search.normalization import LIKE_ESCAPE_CHAR, build_like_pattern


async def _get_course_and_authorize(
    request: Request,
    course_uuid: str,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: Session,
) -> Course:
    course = db_session.exec(
        select(Course).where(Course.course_uuid == course_uuid)
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    await check_resource_access(
        request, db_session, current_user, course.course_uuid, AccessAction.UPDATE
    )
    return course


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


async def list_course_access_users(
    request: Request,
    course_uuid: str,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: Session,
    list_filter: str = "enrolled",
    search: str = "",
    page: int = 1,
    limit: int = 10,
):
    """List users linked to a course, or org members that can still be linked.

    `list_filter="enrolled"` returns users with a TrailRun for the course
    (their learner inventory). `list_filter="available"` returns org members
    that are not linked yet, which is what the search picker shows.
    """
    course = await _get_course_and_authorize(
        request, course_uuid, current_user, db_session
    )

    limit = min(max(limit, 1), 100)
    page = max(page, 1)

    enrolled_user_ids = select(TrailRun.user_id).where(
        TrailRun.course_id == course.id,
        TrailRun.org_id == course.org_id,
    )

    if list_filter == "available":
        statement = (
            select(User, UserOrganization)
            .join(UserOrganization, UserOrganization.user_id == User.id)
            .where(
                UserOrganization.org_id == course.org_id,
                User.id.not_in(enrolled_user_ids),
            )
        )
    else:
        statement = (
            select(User, UserOrganization, TrailRun)
            .join(UserOrganization, UserOrganization.user_id == User.id)
            .join(
                TrailRun,
                and_(
                    TrailRun.user_id == User.id,
                    TrailRun.course_id == course.id,
                    TrailRun.org_id == course.org_id,
                ),
            )
            .where(UserOrganization.org_id == course.org_id)
        )

    statement = _search_filter(statement, search)

    total = db_session.exec(
        select(func.count()).select_from(statement.subquery())
    ).one()

    offset = (page - 1) * limit
    if list_filter == "available":
        statement = statement.order_by(UserOrganization.id.desc())
    else:
        statement = statement.order_by(TrailRun.creation_date.desc())

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
        trail_run = row[2] if len(row) > 2 else None
        role = roles.get(user_org.role_id)
        items.append(
            {
                "user": UserRead.model_validate(user).model_dump(),
                "role": RoleRead.model_validate(role).model_dump() if role else None,
                "joined_at": user_org.creation_date,
                "enrolled_at": trail_run.creation_date if trail_run else None,
                "status": (
                    trail_run.status.value
                    if trail_run and hasattr(trail_run.status, "value")
                    else None
                ),
            }
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
    }


async def bulk_enroll_course_users(
    request: Request,
    course_uuid: str,
    user_ids: list[int],
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: Session,
):
    """Link org members to a course by creating their TrailRun (inventory)."""
    course = await _get_course_and_authorize(
        request, course_uuid, current_user, db_session
    )

    enrolled: list[int] = []
    already_enrolled: list[int] = []
    skipped: list[int] = []

    now = datetime.now()

    for user_id in dict.fromkeys(user_ids):
        membership = db_session.exec(
            select(UserOrganization).where(
                UserOrganization.user_id == user_id,
                UserOrganization.org_id == course.org_id,
            )
        ).first()
        if not membership:
            skipped.append(user_id)
            continue

        existing = db_session.exec(
            select(TrailRun).where(
                TrailRun.course_id == course.id,
                TrailRun.user_id == user_id,
                TrailRun.org_id == course.org_id,
            )
        ).first()
        if existing:
            already_enrolled.append(user_id)
            continue

        trail = db_session.exec(
            select(Trail).where(
                Trail.org_id == course.org_id,
                Trail.user_id == user_id,
            )
        ).first()
        if not trail:
            trail = Trail(
                org_id=course.org_id,
                user_id=user_id,
                trail_uuid=f"trail_{uuid4()}",
                creation_date=str(now),
                update_date=str(now),
            )
            db_session.add(trail)
            db_session.commit()
            db_session.refresh(trail)

        db_session.add(
            TrailRun(
                trail_id=trail.id if trail.id is not None else 0,
                course_id=course.id if course.id is not None else 0,
                org_id=course.org_id,
                user_id=user_id,
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


async def bulk_unenroll_course_users(
    request: Request,
    course_uuid: str,
    user_ids: list[int],
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: Session,
):
    """Remove users from a course, including their progress for it."""
    course = await _get_course_and_authorize(
        request, course_uuid, current_user, db_session
    )

    removed: list[int] = []
    not_enrolled: list[int] = []

    for user_id in dict.fromkeys(user_ids):
        trail_run = db_session.exec(
            select(TrailRun).where(
                TrailRun.course_id == course.id,
                TrailRun.user_id == user_id,
                TrailRun.org_id == course.org_id,
            )
        ).first()
        if not trail_run:
            not_enrolled.append(user_id)
            continue

        steps = db_session.exec(
            select(TrailStep).where(
                TrailStep.course_id == course.id,
                TrailStep.user_id == user_id,
                TrailStep.org_id == course.org_id,
            )
        ).all()
        for step in steps:
            db_session.delete(step)

        db_session.delete(trail_run)
        removed.append(user_id)

    db_session.commit()

    return {"removed": removed, "not_enrolled": not_enrolled}
