"""Add notification_template table, add title/body/source columns to notification

Revision ID: a1b2c3d4e5f8
Revises: a1b2c3d4e5f7
Create Date: 2026-10-24 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f8"
down_revision: Union[str, None] = "a1b2c3d4e5f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Add columns to notification ---
    op.add_column(
        "notification",
        sa.Column("title", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "notification",
        sa.Column("body", sa.Text(), nullable=True),
    )
    op.add_column(
        "notification",
        sa.Column("source", sa.String(length=20), nullable=True),
    )

    # --- Create notification_template table ---
    op.create_table(
        "notification_template",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("org_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="other"),
        sa.Column("title_template", sa.Text(), nullable=True),
        sa.Column("body_template", sa.Text(), nullable=True),
        sa.Column("link_url", sa.String(length=2048), nullable=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.String(length=50), nullable=True),
        sa.Column("updated_at", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(
            ["org_id"], ["organization.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "org_id", "event_type",
            name="uq_notification_template_org_event",
        ),
    )
    op.create_index(
        "ix_notification_template_org_id",
        "notification_template",
        ["org_id"],
    )


def downgrade() -> None:
    # --- Drop notification_template table ---
    op.drop_index(
        "ix_notification_template_org_id",
        table_name="notification_template",
    )
    op.drop_table("notification_template")

    # --- Drop columns from notification ---
    op.drop_column("notification", "source")
    op.drop_column("notification", "body")
    op.drop_column("notification", "title")
