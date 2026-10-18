from datetime import datetime
from typing import Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from src.db.payments.enums import WebhookEventStatusEnum


class PaymentWebhookEvent(SQLModel, table=True):
    """Idempotency log for Chargily webhooks.

    `event_id` is unique: a duplicate delivery is acknowledged with 200 and
    skipped. The raw payload is kept for replay/debugging.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: str = Field(index=True, unique=True)
    event_type: str = ""
    status: WebhookEventStatusEnum = Field(default=WebhookEventStatusEnum.RECEIVED)
    attempts: int = Field(default=0)
    raw_payload: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
    error_message: Optional[str] = None
    received_at: datetime = Field(default_factory=datetime.now)
    processed_at: Optional[datetime] = None
