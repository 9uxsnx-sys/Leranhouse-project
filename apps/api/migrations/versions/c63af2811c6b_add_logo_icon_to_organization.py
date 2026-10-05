"""add logo_icon to organization

Revision ID: c63af2811c6b
Revises: bc96a0222a3b
Create Date: 2026-10-05 12:08:36.531570

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'c63af2811c6b'
down_revision: Union[str, None] = 'bc96a0222a3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('organization', sa.Column('logo_icon', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_column('organization', 'logo_icon')
