"""merge banner_image and assignment_retries heads

Revision ID: bc96a0222a3b
Revises: b1c2d3e4f5a6, c8d9e0f3a4b5
Create Date: 2026-10-05 12:07:04.154330

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa # noqa: F401
import sqlmodel # noqa: F401


# revision identifiers, used by Alembic.
revision: str = 'bc96a0222a3b'
down_revision: Union[str, None] = ('b1c2d3e4f5a6', 'c8d9e0f3a4b5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
