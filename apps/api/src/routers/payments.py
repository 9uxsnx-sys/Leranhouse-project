from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session

from src.core.events.database import get_db_session
from src.db.users import PublicUser
from src.security.auth import get_current_user
from src.services.payments.entitlements import (
    bulk_grant_entitlements,
    bulk_revoke_entitlements,
    list_entitlement_candidates,
    list_resource_entitlements,
)
from src.services.payments.orders import list_org_orders

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
    "/{org_id}/entitlements",
    summary="List users with access to a paid resource",
    description=(
        "List active entitlements for a course or podcast. This is the "
        "'who has access' roster shown in the Paid access mode."
    ),
)
async def api_list_resource_entitlements(
    request: Request,
    org_id: int,
    resource_uuid: str = Query(description="course_... or podcast_..."),
    search: str = "",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await list_resource_entitlements(
        request,
        current_user,
        org_id,
        resource_uuid,
        db_session,
        search=search,
        page=page,
        limit=limit,
    )


@router.get(
    "/{org_id}/entitlements/candidates",
    summary="List org members without access to a paid resource",
    description=(
        "Organization members that do not have an active entitlement for the "
        "resource. Used by the search picker when granting access."
    ),
)
async def api_list_entitlement_candidates(
    request: Request,
    org_id: int,
    resource_uuid: str = Query(description="course_... or podcast_..."),
    search: str = "",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await list_entitlement_candidates(
        request,
        current_user,
        org_id,
        resource_uuid,
        db_session,
        search=search,
        page=page,
        limit=limit,
    )


@router.post(
    "/{org_id}/entitlements",
    summary="Grant access to a paid resource",
    description="Manually grant course/podcast access to organization members.",
)
async def api_bulk_grant_entitlements(
    request: Request,
    org_id: int,
    resource_uuid: str = Query(description="course_... or podcast_..."),
    user_ids: str = Query(description="Comma-separated user ids"),
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await bulk_grant_entitlements(
        request,
        current_user,
        org_id,
        resource_uuid,
        _parse_user_ids(user_ids),
        db_session,
    )


@router.delete(
    "/{org_id}/entitlements",
    summary="Revoke access to a paid resource",
    description=(
        "Revoke active entitlements for the given users. Rows are kept with "
        "status=revoked for the audit trail."
    ),
)
async def api_bulk_revoke_entitlements(
    request: Request,
    org_id: int,
    resource_uuid: str = Query(description="course_... or podcast_..."),
    user_ids: str = Query(description="Comma-separated user ids"),
    reason: Optional[str] = None,
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await bulk_revoke_entitlements(
        request,
        current_user,
        org_id,
        resource_uuid,
        _parse_user_ids(user_ids),
        db_session,
        reason=reason or "manual",
    )


@router.get(
    "/{org_id}/orders",
    summary="List payment orders",
    description="Paginated order list for the organization, newest first.",
)
async def api_list_org_orders(
    request: Request,
    org_id: int,
    search: str = "",
    status: str = "",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await list_org_orders(
        request,
        current_user,
        org_id,
        db_session,
        search=search,
        status=status,
        page=page,
        limit=limit,
    )
