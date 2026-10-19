from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlmodel import Session

from src.core.events.database import get_db_session
from src.db.users import PublicUser
from src.security.auth import get_current_user
from src.services.payments.checkout import create_resource_checkout
from src.services.payments.config import get_payment_config, update_payment_config
from src.services.payments.entitlements import (
    bulk_grant_entitlements,
    bulk_revoke_entitlements,
    list_entitlement_candidates,
    list_resource_entitlements,
)
from src.services.payments.orders import list_org_orders
from src.services.payments.overview import get_payments_overview

router = APIRouter()


class PaymentConfigUpdate(BaseModel):
    provider: str = "chargily"
    mode: str = "test"
    public_key: Optional[str] = None
    secret_key: Optional[str] = None
    webhook_secret: Optional[str] = None
    active: Optional[bool] = None


class CheckoutCreate(BaseModel):
    resource_uuid: str
    resource_type: Optional[str] = None
    payment_method: Optional[str] = None
    locale: Optional[str] = None


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
    "/{org_id}/overview",
    summary="Payments overview",
    description="Revenue total and time series for the selected range.",
)
async def api_payments_overview(
    request: Request,
    org_id: int,
    range: str = "30d",
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await get_payments_overview(
        request,
        current_user,
        org_id,
        db_session,
        range_token=range,
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


@router.get(
    "/{org_id}/config",
    summary="Get the organization's payment configuration",
    description=(
        "Returns the Chargily settings for the organization. Secret keys are "
        "never returned — only boolean flags saying whether they are stored."
    ),
)
async def api_get_payment_config(
    request: Request,
    org_id: int,
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await get_payment_config(request, current_user, org_id, db_session)


@router.put(
    "/{org_id}/config",
    summary="Update the organization's payment configuration",
    description=(
        "Upserts the Chargily settings for the organization. Secret keys are "
        "write-only and stored encrypted at rest."
    ),
)
async def api_update_payment_config(
    request: Request,
    org_id: int,
    payload: PaymentConfigUpdate,
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await update_payment_config(
        request,
        current_user,
        org_id,
        payload.model_dump(),
        db_session,
    )


@router.post(
    "/{org_id}/checkout",
    summary="Create a Chargily checkout for a paid resource",
    description=(
        "Validates the resource is paid and priced, creates a pending order, "
        "and returns the Chargily-hosted checkout URL."
    ),
)
async def api_create_checkout(
    request: Request,
    org_id: int,
    payload: CheckoutCreate,
    current_user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await create_resource_checkout(
        request,
        current_user,
        org_id,
        payload.resource_uuid,
        db_session,
        payment_method=payload.payment_method,
        locale=payload.locale,
    )
