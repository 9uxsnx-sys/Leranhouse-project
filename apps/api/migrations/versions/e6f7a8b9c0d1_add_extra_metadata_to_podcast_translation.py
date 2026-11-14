"""Add extra_metadata JSONB column to podcast_translation table

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-11-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa  # noqa: F401
import sqlmodel  # noqa: F401
from sqlalchemy.dialects import postgresql


revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE = 'podcast_translation'


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if TABLE not in existing_tables:
        return

    existing_columns = {col['name'] for col in inspector.get_columns(TABLE)}
    if 'extra_metadata' in existing_columns:
        return

    op.add_column(
        TABLE,
        sa.Column(
            'extra_metadata',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if TABLE not in existing_tables:
        return

    existing_columns = {col['name'] for col in inspector.get_columns(TABLE)}
    if 'extra_metadata' in existing_columns:
        op.drop_column(TABLE, 'extra_metadata')
