"""Podcast content localization

Mirrors ``collection_translation``: the base ``podcast`` row keeps the
source-locale content (``podcast.source_locale``) and a
``podcast_translation`` row overrides the translatable display fields for one
locale. Episodes are content, so they get their own table keyed by episode;
their source locale is the parent podcast's.

Revision ID: z1a2b3c4d5e6
Revises: y0f1a2b3c4d5
Create Date: 2026-10-21 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "z1a2b3c4d5e6"
down_revision: Union[str, None] = "y0f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "podcast",
        sa.Column(
            "source_locale",
            sa.String(length=10),
            nullable=False,
            server_default="en",
        ),
    )

    op.create_table(
        "podcast_translation",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("podcast_id", sa.Integer(), nullable=False),
        sa.Column("locale", sa.String(length=10), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("about", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["podcast_id"], ["podcast.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["translated_by"], ["user.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "podcast_id", "locale", name="uq_podcast_translation_podcast_locale"
        ),
    )
    op.create_index(
        "ix_podcast_translation_podcast_id",
        "podcast_translation",
        ["podcast_id"],
    )

    op.create_table(
        "podcast_episode_translation",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("episode_id", sa.Integer(), nullable=False),
        sa.Column("locale", sa.String(length=10), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("state", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("source_updated_at", sa.String(length=50), nullable=True),
        sa.Column("translated_by", sa.Integer(), nullable=True),
        sa.Column("creation_date", sa.String(length=50), nullable=True),
        sa.Column("update_date", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(
            ["episode_id"], ["podcastepisode.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["translated_by"], ["user.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "episode_id", "locale", name="uq_podcast_episode_translation_episode_locale"
        ),
    )
    op.create_index(
        "ix_podcast_episode_translation_episode_id",
        "podcast_episode_translation",
        ["episode_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_podcast_episode_translation_episode_id",
        table_name="podcast_episode_translation",
    )
    op.drop_table("podcast_episode_translation")
    op.drop_index(
        "ix_podcast_translation_podcast_id",
        table_name="podcast_translation",
    )
    op.drop_table("podcast_translation")
    op.drop_column("podcast", "source_locale")
