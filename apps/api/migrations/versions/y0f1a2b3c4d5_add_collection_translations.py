"""Collection content localization

Mirrors ``course_translation``: the base ``collection`` row keeps the
source-locale content (``collection.source_locale``) and a
``collection_translation`` row overrides the translatable display fields for
one locale.

Collections have no ``extra_metadata`` column, so the translation table only
carries the text fields they actually render (name, description, about,
learnings, tags) plus SEO.

Revision ID: y0f1a2b3c4d5
Revises: x9e0f1a2b3c4
Create Date: 2026-10-21 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "y0f1a2b3c4d5"
down_revision: Union[str, None] = "x9e0f1a2b3c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "collection",
        sa.Column(
            "source_locale",
            sa.String(length=10),
            nullable=False,
            server_default="en",
        ),
    )

    op.create_table(
        "collection_translation",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("collection_id", sa.Integer(), nullable=False),
        sa.Column("locale", sa.String(length=10), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("about", sa.Text(), nullable=True),
        sa.Column("learnings", sa.Text(), nullable=True),
        sa.Column("tags", sa.Text(), nullable=True),
        sa.Column(
            "seo",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column("state", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("source_updated_at", sa.String(length=50), nullable=True),
        sa.Column("translated_by", sa.Integer(), nullable=True),
        sa.Column("creation_date", sa.String(length=50), nullable=True),
        sa.Column("update_date", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(
            ["collection_id"], ["collection.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["translated_by"], ["user.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "collection_id", "locale", name="uq_collection_translation_collection_locale"
        ),
    )
    op.create_index(
        "ix_collection_translation_collection_id",
        "collection_translation",
        ["collection_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_collection_translation_collection_id",
        table_name="collection_translation",
    )
    op.drop_table("collection_translation")
    op.drop_column("collection", "source_locale")
