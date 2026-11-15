"""Access guard for raw media files (local filesystem and S3).

The legacy `public` column is not enough to protect a file: a paid or
UserGroup-locked resource must honour the entitlement / group rules here too,
otherwise knowing the file path would bypass the paywall entirely.
"""

from fastapi import HTTPException, Request, status
from sqlmodel import Session

from src.db.users import AnonymousUser, APITokenUser, PublicUser
from src.security.rbac.resource_access import check_resource_access
from src.security.rbac.types import AccessAction


async def require_resource_read(
    request: Request,
    db_session: Session,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    resource_uuid: str,
    *,
    org_id: int,
) -> None:
    """Raise unless ``current_user`` may read the resource behind a file.

    API tokens are scoped per organization, so a token from the owning org keeps
    its historical access (imports and integrations rely on it). Anonymous
    callers get 401, signed-in callers without access get 403.
    """
    if isinstance(current_user, APITokenUser):
        if current_user.org_id == org_id:
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    decision = await check_resource_access(
        request,
        db_session,
        current_user,
        resource_uuid,
        AccessAction.READ,
        raise_on_deny=False,
    )
    if decision.allowed:
        return
    if isinstance(current_user, AnonymousUser):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
