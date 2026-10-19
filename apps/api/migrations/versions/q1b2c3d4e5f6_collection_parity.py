"""Collection parity: media, publish flag and three-mode access

Brings ``collection`` up to the same presentation and access surface as
``course`` so bundles can be browsed, priced and purchased like a course.

Revision ID: q1b2c3d4e5f6
Revises: p0a1y2m3e4n5
Create Date: 2026-10-19 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'q1b2c3d4e5f6'
down_revision: Union[str, None] = 'p0a1y2m3e4n5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    access_type = postgresql.ENUM(
        'PUBLIC', 'USERS_ONLY', 'PAID', name='accesstypeenum', create_type=False
    )
    thumbnail_type = postgresql.ENUM(
        'IMAGE', 'VIDEO', 'BOTH', name='thumbnail_type', create_type=False
    )

    op.add_column('collection', sa.Column('about', sa.String(), nullable=True))
    op.add_column('collection', sa.Column('learnings', sa.String(), nullable=True))
    op.add_column('collection', sa.Column('tags', sa.String(), nullable=True))
    op.add_column('collection', sa.Column('thumbnail_type', thumbnail_type, nullable=True))
    op.add_column('collection', sa.Column('thumbnail_image', sa.String(), nullable=True, server_default=''))
    op.add_column('collection', sa.Column('thumbnail_video', sa.String(), nullable=True, server_default=''))
    op.add_column('collection', sa.Column('banner_image', sa.String(), nullable=True, server_default=''))
    op.add_column('collection', sa.Column('published', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('collection', sa.Column('access_type', access_type, nullable=False, server_default='PUBLIC'))
    op.add_column('collection', sa.Column('price_amount', sa.Integer(), nullable=True))
    op.add_column('collection', sa.Column('price_currency', sa.String(), nullable=False, server_default='DZD'))

    # Existing collections were already visible to learners, so they stay
    # published. Their access mode mirrors the old `public` flag, which keeps
    # the previous visibility model intact.
    op.execute("UPDATE collection SET published = true")
    op.execute("UPDATE collection SET access_type = 'USERS_ONLY' WHERE public = false")
    op.execute("UPDATE collection SET access_type = 'PUBLIC' WHERE public = true")


def downgrade() -> None:
    op.drop_column('collection', 'price_currency')
    op.drop_column('collection', 'price_amount')
    op.drop_column('collection', 'access_type')
    op.drop_column('collection', 'published')
    op.drop_column('collection', 'banner_image')
    op.drop_column('collection', 'thumbnail_video')
    op.drop_column('collection', 'thumbnail_image')
    op.drop_column('collection', 'thumbnail_type')
    op.drop_column('collection', 'tags')
    op.drop_column('collection', 'learnings')
    op.drop_column('collection', 'about')
