"""Add banner_image column to community table

Adds a ``banner_image`` string column (default empty) to the ``community``
table for the community detail page hero banner.

Revision ID: c9d0e1f2a3b4
Revises: a2b3c4d5e6f7
Create Date: 2026-10-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa  # noqa: F401
import sqlmodel  # noqa: F401

# revision identifiers, used by Alembic.
revision: str = 'c9d0e1f2a3b4'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add banner_image column to community table with default empty string
    op.add_column('community', sa.Column('banner_image', sa.String(), nullable=True, server_default=''))


def downgrade() -> None:
    op.drop_column('community', 'banner_image')
