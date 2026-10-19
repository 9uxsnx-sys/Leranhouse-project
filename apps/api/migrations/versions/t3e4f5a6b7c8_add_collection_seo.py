"""Add per-collection SEO metadata

Revision ID: t3e4f5a6b7c8
Revises: s2d3e4f5a6b7
Create Date: 2026-10-19 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "t3e4f5a6b7c8"
down_revision: Union[str, None] = "s2d3e4f5a6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "collection",
        sa.Column("seo", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("collection", "seo")
