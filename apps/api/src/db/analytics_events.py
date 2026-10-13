from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class AnalyticsEvent(SQLModel, table=True):
    """A single behavioural event (Tier B) for the org-wide Analytics area.

    Written by the ingestion endpoint, read by the analytics query services.
    Contract + event taxonomy: docs/08-features/analytics/implementation-plan.md §3.

    Note: unlike the legacy tables (which store `creation_date` as a VARCHAR),
    this table uses a real `timestamptz` — date bucketing needs no casting here.
    """

    __tablename__ = "analytics_events"
    __table_args__ = (
        Index("ix_analytics_events_org_created", "org_id", "created_at"),
        Index("ix_analytics_events_name_created", "event_name", "created_at"),
        Index("ix_analytics_events_user_created", "user_id", "created_at"),
        Index("ix_analytics_events_org_visitor", "org_id", "visitor_id"),
    )

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger, primary_key=True, autoincrement=True),
    )
    org_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("organization.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    # Nullable: anonymous visitors have no user (and are deleted-with-null on user removal).
    user_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("user.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    visitor_id: str = Field(sa_column=Column(String, nullable=False))
    session_id: str = Field(sa_column=Column(String, nullable=False))
    event_name: str = Field(sa_column=Column(String(64), nullable=False))
    path: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    referrer: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    device: Optional[str] = Field(default=None, sa_column=Column(String(32), nullable=True))
    browser: Optional[str] = Field(default=None, sa_column=Column(String(64), nullable=True))
    duration_ms: Optional[int] = Field(default=None, sa_column=Column(Integer, nullable=True))
    properties: dict = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default=text("'{}'::jsonb")),
    )
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        )
    )


class AnalyticsEventCreate(SQLModel):
    """Validated payload accepted by the ingestion endpoint."""

    org_id: int
    event_name: str
    visitor_id: str
    session_id: str
    user_id: Optional[int] = None
    path: Optional[str] = None
    referrer: Optional[str] = None
    device: Optional[str] = None
    browser: Optional[str] = None
    duration_ms: Optional[int] = None
    properties: Optional[dict] = None
