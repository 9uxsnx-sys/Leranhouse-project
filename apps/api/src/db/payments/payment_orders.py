from datetime import datetime
from typing import Optional

from sqlalchemy import Column, ForeignKey, Index, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from src.db.payments.enums import (
    PaymentMethodEnum,
    PaymentOrderStatusEnum,
)


class PaymentOrder(SQLModel, table=True):
    """One Chargily checkout and its lifecycle.

    Append-only: rows are never deleted, only moved through the status machine
    `pending → processing → paid`, or `pending → failed | canceled | expired`.
    Refunds are recorded manually after being issued in the Chargily dashboard.
    """
    __table_args__ = (
        Index("ix_paymentorder_status_created", "status", "creation_date"),
        Index("ix_paymentorder_org_created", "org_id", "creation_date"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    order_uuid: str = Field(index=True, unique=True)

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

    # What is being sold. `resource_uuid` carries the prefixed uuid
    # (`course_...` / `podcast_...`).
    resource_uuid: str = Field(index=True)
    resource_type: str = Field(default="course")
    resource_name: Optional[str] = None

    # Money — integer DZD, snapshotted at order creation.
    amount: int
    currency: str = Field(default="DZD")
    price_snapshot: Optional[dict] = Field(default=None, sa_column=Column(JSONB))

    payment_method: Optional[PaymentMethodEnum] = None
    status: PaymentOrderStatusEnum = Field(
        default=PaymentOrderStatusEnum.PENDING, index=True
    )

    # Chargily identifiers.
    chargily_checkout_id: Optional[str] = Field(default=None, index=True, unique=True)
    chargily_payment_id: Optional[str] = None
    checkout_url: Optional[str] = None

    # Prevents double-submit from the checkout page.
    idempotency_key: Optional[str] = Field(default=None, index=True, unique=True)

    # Receipt data (identity always comes from `user_id`).
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None

    # Accounting — read from Chargily, never computed locally.
    fees: int = Field(default=0)
    fees_on_merchant: int = Field(default=0)

    failure_code: Optional[str] = None
    failure_message: Optional[str] = None
    provider_payload: Optional[dict] = Field(default=None, sa_column=Column(JSONB))

    expires_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    creation_date: str = ""
    update_date: str = ""
