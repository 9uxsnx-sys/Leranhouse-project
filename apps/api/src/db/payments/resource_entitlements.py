from datetime import datetime
from typing import Optional

from sqlalchemy import Column, ForeignKey, Index, Integer
from sqlmodel import Field, SQLModel

from src.db.payments.enums import (
    EntitlementSourceEnum,
    EntitlementStatusEnum,
)


class ResourceEntitlement(SQLModel, table=True):
    """Grants a user access to a paid resource.

    Created by the webhook on `checkout.paid`, by an admin manual grant, or by a
    usergroup sync. Full refunds / manual revokes flip `status` to `revoked`
    rather than deleting the row (audit trail).

    An active entitlement for the same (user, resource) must be unique — the
    partial unique index is created in the migration.
    """
    __table_args__ = (
        Index(
            "ix_resourceentitlement_user_resource_status",
            "user_id",
            "resource_uuid",
            "status",
        ),
        Index(
            "ix_resourceentitlement_resource_status",
            "resource_uuid",
            "status",
        ),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    org_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("organization.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    user_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )

    resource_uuid: str = Field(index=True)
    resource_type: str = Field(default="course")

    source: EntitlementSourceEnum = Field(default=EntitlementSourceEnum.PURCHASE)
    order_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("paymentorder.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    status: EntitlementStatusEnum = Field(
        default=EntitlementStatusEnum.ACTIVE, index=True
    )

    # Null = lifetime. Kept for future subscriptions/renewals.
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None

    granted_by: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("user.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    granted_at: datetime = Field(default_factory=datetime.now)
    revoked_at: Optional[datetime] = None
    revoke_reason: Optional[str] = None
