"""Add translatable extra_metadata to collection translations

Collection display values such as difficulty, duration, requirements and the
target audience live in ``collection.extra_metadata`` rather than in columns.
They are shown to learners, so a translation row needs its own copy for those
keys. Counts and booleans stay on the base row.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f1
Create Date: 2026-11-14 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "collection_translation",
        sa.Column(
            "extra_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("collection_translation", "extra_metadata")
