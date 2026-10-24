from typing import Optional, List
from sqlalchemy import JSON, Column, ForeignKey, Integer, String, Boolean, Index, Text, UniqueConstraint
from sqlmodel import Field, SQLModel


class Notification(SQLModel, table=True):
    """Content row for one notification event. Written once, read by many recipients."""

    __tablename__ = "notification"
    __table_args__ = (
        Index("ix_notification_org_id", "org_id"),
        Index("ix_notification_event_type", "event_type"),
        Index("ix_notification_created_at", "created_at"),
        {"extend_existing": True},
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    org_id: int = Field(
        sa_column=Column(
            Integer, ForeignKey("organization.id", ondelete="CASCADE"), nullable=False
        )
    )
    event_type: str = Field(
        sa_column=Column(String(100), nullable=False)
    )
    category: str = Field(
        sa_column=Column(String(50), nullable=False, server_default="other")
    )
    # Rendered title and body — snapshot at send time so editing a template later
    # never rewrites past notifications.
    title: Optional[str] = Field(default=None, sa_column=Column(String(500), nullable=True))
    body: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    # params stores structured data (not rendered text) so one row serves all locales.
    params: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    # Optional deep-link URL that the recipient can follow.
    link_url: Optional[str] = Field(default=None, max_length=2048)
    # 'system' for auto-generated events, 'announcement' for admin broadcasts
    source: Optional[str] = Field(default=None, max_length=20)
    # Language of the rendered title/body snapshot ('en', 'fr', 'ar')
    language: Optional[str] = Field(default=None, max_length=10)
    created_at: str = ""


class NotificationRecipient(SQLModel, table=True):
    """Per-user state for one notification."""

    __tablename__ = "notification_recipient"
    __table_args__ = (
        Index("ix_notification_recipient_user_id", "user_id"),
        Index("ix_notification_recipient_notification_id", "notification_id"),
        Index(
            "ix_notification_recipient_user_unread",
            "user_id",
            "read_at",
            postgresql_where=Column("read_at").is_(None),
        ),
        {"extend_existing": True},
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    notification_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("notification.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    user_id: int = Field(
        sa_column=Column(
            Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False
        )
    )
    read_at: Optional[str] = Field(default=None, max_length=50)
    muted_at: Optional[str] = Field(default=None, max_length=50)
    created_at: str = ""


class NotificationTemplate(SQLModel, table=True):
    """
    Per-org template overrides for notification event types.

    - ``org_id = NULL`` means the platform default (used when no org override exists).
    - ``is_enabled`` acts as a per-event kill switch (disabled events produce zero
      notifications regardless of audience rules).
    - ``title_template`` / ``body_template`` support ``{{placeholder}}`` syntax.
      The available variables come from the event's ``data_schema``.
    """

    __tablename__ = "notification_template"
    __table_args__ = (
        UniqueConstraint("org_id", "event_type", name="uq_notification_template_org_event"),
        Index("ix_notification_template_org_id", "org_id"),
        {"extend_existing": True},
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    org_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer, ForeignKey("organization.id", ondelete="CASCADE"), nullable=True
        ),
    )
    event_type: str = Field(
        sa_column=Column(String(100), nullable=False)
    )
    category: str = Field(
        sa_column=Column(String(50), nullable=False, server_default="other")
    )
    title_template: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )
    body_template: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )
    link_url: Optional[str] = Field(default=None, max_length=2048)
    is_enabled: bool = Field(
        default=True,
        sa_column=Column(Boolean, nullable=False, server_default="true"),
    )
    created_at: str = ""
    updated_at: str = ""
