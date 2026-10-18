from typing import Literal

from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session

from src.core.events.database import get_db_session
from src.db.users import PublicUser
from src.security.auth import get_current_user
from src.services.courses.access import (
    bulk_enroll_course_users,
    bulk_unenroll_course_users,
    list_course_access_users,
)

router = APIRouter()


def _parse_user_ids(user_ids: str) -> list[int]:
    ids: list[int] = []
    for raw in user_ids.split(","):
        raw = raw.strip()
        if not raw:
            continue
        try:
            ids.append(int(raw))
        except ValueError:
            continue
    return ids


@router.get(
    "/{course_uuid}/access/users",
    summary="List course access users",
    description=(
        "List users linked to a course (`filter=enrolled`, their learner "
        "inventory), or organization members that are not linked yet "
        "(`filter=available`). Supports search and pagination."
    ),
)
async def api_list_course_access_users(
    request: Request,
    course_uuid: str,
    filter: Literal["enrolled", "available"] = Query(default="enrolled"),
    search: str = "",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await list_course_access_users(
        request,
        course_uuid,
        current_user,
        db_session,
        list_filter=filter,
        search=search,
        page=page,
        limit=limit,
    )


@router.post(
    "/{course_uuid}/access/users",
    summary="Link users to a course",
    description="Create course access (learner inventory) for a list of organization members.",
)
async def api_bulk_enroll_course_users(
    request: Request,
    course_uuid: str,
    user_ids: str = Query(description="Comma-separated user ids"),
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await bulk_enroll_course_users(
        request,
        course_uuid,
        _parse_user_ids(user_ids),
        current_user,
        db_session,
    )


@router.delete(
    "/{course_uuid}/access/users",
    summary="Unlink users from a course",
    description="Remove course access and progress for a list of users.",
)
async def api_bulk_unenroll_course_users(
    request: Request,
    course_uuid: str,
    user_ids: str = Query(description="Comma-separated user ids"),
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await bulk_unenroll_course_users(
        request,
        course_uuid,
        _parse_user_ids(user_ids),
        current_user,
        db_session,
    )
