"""Add banner_image column to podcast table

Adds a ``banner_image`` string column (default empty) to the ``podcast``
table for the podcast detail page hero banner.

Revision ID: a2b3c4d5e6f7
Revises: e1f2a3b4c5d6
Create Date: 2026-10-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa  # noqa: F401
import sqlmodel  # noqa: F401

# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add banner_image column to podcast table with default empty string
    op.add_column('podcast', sa.Column('banner_image', sa.String(), nullable=True, server_default=''))


def downgrade() -> None:
    op.drop_column('podcast', 'banner_image')
