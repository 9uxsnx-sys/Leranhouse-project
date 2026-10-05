"""Add banner_image column to course table

Adds a ``banner_image`` string column (default empty) to the ``course``
table for the course detail page hero banner.

Revision ID: b1c2d3e4f5a6
Revises: a7b8c9d0e1f2
Create Date: 2026-10-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa  # noqa: F401
import sqlmodel  # noqa: F401

# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add banner_image column to course table with default empty string
    op.add_column('course', sa.Column('banner_image', sa.String(), nullable=True, server_default=''))


def downgrade() -> None:
    op.drop_column('course', 'banner_image')
