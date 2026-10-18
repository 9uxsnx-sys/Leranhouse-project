from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlmodel import Field, SQLModel

from src.db.payments.enums import PaymentModeEnum, PaymentProviderEnum


class PaymentConfig(SQLModel, table=True):
    """Per-organization payment provider credentials.

    Secrets are stored encrypted; the API never returns them in clear text.
    One row per (org, provider).
    """
    __table_args__ = (
        UniqueConstraint("org_id", "provider", name="uq_paymentconfig_org_provider"),
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
    provider: PaymentProviderEnum = Field(default=PaymentProviderEnum.CHARGILY)
    mode: PaymentModeEnum = Field(default=PaymentModeEnum.TEST)
    public_key: Optional[str] = None
    secret_key_encrypted: Optional[str] = None
    webhook_secret_encrypted: Optional[str] = None
    active: bool = Field(default=False)
    creation_date: str = ""
    update_date: str = ""
