"""Add course translations

Stores one row per (course, locale). The base ``course`` row keeps holding the
source content; a translation row overrides the translatable fields for its
locale. ``course.source_locale`` names the locale the base row was authored in.

Revision ID: w6b7c8d9e0f1
Revises: v5a6b7c8d9e0
Create Date: 2026-10-21 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "w6b7c8d9e0f1"
down_revision: Union[str, None] = "v5a6b7c8d9e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "course",
        sa.Column(
            "source_locale",
            sa.String(length=10),
            nullable=False,
            server_default="en",
        ),
    )

    op.create_table(
        "course_translation",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "course_id",
            sa.Integer(),
            sa.ForeignKey("course.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("locale", sa.String(length=10), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("about", sa.Text(), nullable=True),
        sa.Column("learnings", sa.Text(), nullable=True),
        sa.Column("tags", sa.Text(), nullable=True),
        sa.Column("seo", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        # workflow — v1 serves every row regardless of state
        sa.Column("state", sa.String(length=20), nullable=False, server_default="draft"),
        # snapshot of course.update_date when this row was last translated
        sa.Column("source_updated_at", sa.String(length=50), nullable=True),
        sa.Column(
            "translated_by",
            sa.Integer(),
            sa.ForeignKey("user.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("creation_date", sa.String(length=50), nullable=False, server_default=""),
        sa.Column("update_date", sa.String(length=50), nullable=False, server_default=""),
        sa.UniqueConstraint(
            "course_id", "locale", name="uq_course_translation_course_locale"
        ),
    )
    op.create_index(
        "ix_course_translation_course_id", "course_translation", ["course_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_course_translation_course_id", table_name="course_translation")
    op.drop_table("course_translation")
    op.drop_column("course", "source_locale")
