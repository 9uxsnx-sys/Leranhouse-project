"""Catalog (product page) read access for paid resources.

A published paid course, podcast or collection is a product page: learners must
be able to read what they are buying before they pay. This helper allows that
metadata read while the actual content endpoints (lessons, episode audio) keep
the strict RBAC check.

Only ``paid`` gets the exception. ``users_only`` and draft resources stay fully
denied, because there is no product to preview for a private cohort.
"""

from fastapi import HTTPException, Request, status
from sqlmodel import Session

from src.db.payments.enums import AccessTypeEnum
from src.db.users import AnonymousUser, APITokenUser, PublicUser
from src.security.rbac.resource_access import check_resource_access
from src.security.rbac.types import AccessAction, AccessContext, AccessDecision


async def check_catalog_read_access(
    request: Request,
    db_session: Session,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    resource_uuid: str,
    *,
    published: bool,
    access_type: AccessTypeEnum | str | None,
    context: AccessContext = AccessContext.PUBLIC_VIEW,
) -> AccessDecision:
    """Allow the metadata read of a published paid resource.

    Returns the raw access decision so callers can tell an entitled viewer
    (``allowed=True``) apart from a previewing one and strip the paid content
    accordingly. Raises 403 for every other denial.
    """
    decision = await check_resource_access(
        request,
        db_session,
        current_user,
        resource_uuid,
        AccessAction.READ,
        context=context,
        raise_on_deny=False,
    )
    if decision.allowed:
        return decision

    if published and access_type == AccessTypeEnum.PAID:
        return decision

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail=decision.reason
    )
