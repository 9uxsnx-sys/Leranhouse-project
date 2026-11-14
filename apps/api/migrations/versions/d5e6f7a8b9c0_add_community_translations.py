"""Community content localization

Mirrors ``collection_translation``: the base ``community`` row keeps the
source-locale content (``community.source_locale``) and a
``community_translation`` row overrides the translatable display fields for
one locale.

Communities only author a name and a description; discussions, comments and
reactions stay user-generated and are never translated.

Revision ID: d5e6f7a8b9c0
Revises: b2c3d4e5f6a7
Create Date: 2026-11-14 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "community",
        sa.Column(
            "source_locale",
            sa.String(length=10),
            nullable=False,
            server_default="en",
        ),
    )

    op.create_table(
        "community_translation",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("community_id", sa.Integer(), nullable=False),
        sa.Column("locale", sa.String(length=10), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("state", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("source_updated_at", sa.String(length=50), nullable=True),
        sa.Column("translated_by", sa.Integer(), nullable=True),
        sa.Column("creation_date", sa.String(length=50), nullable=True),
        sa.Column("update_date", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(
            ["community_id"], ["community.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["translated_by"], ["user.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "community_id", "locale", name="uq_community_translation_locale"
        ),
    )
    op.create_index(
        "ix_community_translation_community_id",
        "community_translation",
        ["community_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_community_translation_community_id",
        table_name="community_translation",
    )
    op.drop_table("community_translation")
    op.drop_column("community", "source_locale")
