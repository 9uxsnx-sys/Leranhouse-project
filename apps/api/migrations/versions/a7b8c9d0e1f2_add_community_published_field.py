"""Add published field to community

Adds a ``published`` boolean column (default false) to the ``community``
table and a composite index on ``(org_id, public, published, creation_date)``
for query performance.

Revision ID: a7b8c9d0e1f2
Revises: z5a6b7c8d9e0
Create Date: 2026-09-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa  # noqa: F401
import sqlmodel  # noqa: F401

# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'z5a6b7c8d9e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add published column to community table with default value of False
    op.add_column('community', sa.Column('published', sa.Boolean(), nullable=False, server_default='false'))
    # Add composite index for org-scoped queries filtering by public/published
    op.create_index('ix_community_org_public_published_created', 'community', ['org_id', 'public', 'published', 'creation_date'])


def downgrade() -> None:
    op.drop_index('ix_community_org_public_published_created', table_name='community')
    op.drop_column('community', 'published')
