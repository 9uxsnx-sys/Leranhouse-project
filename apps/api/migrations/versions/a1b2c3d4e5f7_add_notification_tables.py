"""Add notification and notification_recipient tables

Revision ID: a1b2c3d4e5f7
Revises: z1a2b3c4d5e6
Create Date: 2026-10-24 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f7"
down_revision: Union[str, None] = "z1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("org_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="other"),
        sa.Column("params", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("link_url", sa.String(length=2048), nullable=True),
        sa.Column("created_at", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(["org_id"], ["organization.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notification_org_id", "notification", ["org_id"])
    op.create_index("ix_notification_event_type", "notification", ["event_type"])
    op.create_index("ix_notification_created_at", "notification", ["created_at"])

    op.create_table(
        "notification_recipient",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("notification_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("read_at", sa.String(length=50), nullable=True),
        sa.Column("muted_at", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(
            ["notification_id"], ["notification.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_notification_recipient_user_id",
        "notification_recipient",
        ["user_id"],
    )
    op.create_index(
        "ix_notification_recipient_notification_id",
        "notification_recipient",
        ["notification_id"],
    )
    op.create_index(
        "ix_notification_recipient_user_unread",
        "notification_recipient",
        ["user_id", "read_at"],
        postgresql_where=sa.text("read_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "ix_notification_recipient_user_unread",
        table_name="notification_recipient",
    )
    op.drop_index(
        "ix_notification_recipient_notification_id",
        table_name="notification_recipient",
    )
    op.drop_index(
        "ix_notification_recipient_user_id",
        table_name="notification_recipient",
    )
    op.drop_table("notification_recipient")
    op.drop_index("ix_notification_created_at", table_name="notification")
    op.drop_index("ix_notification_event_type", table_name="notification")
    op.drop_index("ix_notification_org_id", table_name="notification")
    op.drop_table("notification")
