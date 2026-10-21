"""Add translatable extra_metadata to course translations

Some course-page values live in ``course.extra_metadata`` rather than in a
column (difficulty label, duration label, requirements). They are shown to
learners, so a translation row needs its own copy for those keys.

Revision ID: x9e0f1a2b3c4
Revises: w6b7c8d9e0f1
Create Date: 2026-10-21 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "x9e0f1a2b3c4"
down_revision: Union[str, None] = "w6b7c8d9e0f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "course_translation",
        sa.Column(
            "extra_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("course_translation", "extra_metadata")
