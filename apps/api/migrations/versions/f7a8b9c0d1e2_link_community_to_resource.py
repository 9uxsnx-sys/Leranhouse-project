"""Attach communities to a course or podcast instead of an optional course

Communities are add-ons: they inherit the access rules of the resource they
belong to. The old nullable ``course_id`` FK is replaced by a generic
``resource_uuid`` + ``resource_type`` pair (``course`` | ``podcast``), with one
community per resource (unique index).

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-11-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa  # noqa: F401


revision: str = 'f7a8b9c0d1e2'
down_revision: Union[str, None] = 'e6f7a8b9c0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE = 'community'
INDEX = 'ix_community_resource_uuid'


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if TABLE not in inspector.get_table_names():
        return

    columns = {col['name'] for col in inspector.get_columns(TABLE)}

    if 'resource_uuid' not in columns:
        op.add_column(
            TABLE, sa.Column('resource_uuid', sa.String(length=255), nullable=True)
        )
    if 'resource_type' not in columns:
        op.add_column(
            TABLE, sa.Column('resource_type', sa.String(length=20), nullable=True)
        )

    # Backfill from the legacy course link before dropping it.
    if 'course_id' in columns:
        op.execute(
            """
            UPDATE community AS c
            SET resource_uuid = co.course_uuid,
                resource_type = 'course'
            FROM course AS co
            WHERE c.course_id = co.id
              AND (c.resource_uuid IS NULL OR c.resource_uuid = '')
            """
        )
        op.execute('DROP INDEX IF EXISTS ix_community_course_id')
        op.drop_column(TABLE, 'course_id')

    op.execute(f'CREATE UNIQUE INDEX IF NOT EXISTS {INDEX} ON community (resource_uuid)')


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if TABLE not in inspector.get_table_names():
        return

    columns = {col['name'] for col in inspector.get_columns(TABLE)}

    if 'course_id' not in columns:
        op.add_column(
            TABLE,
            sa.Column(
                'course_id',
                sa.Integer(),
                sa.ForeignKey('course.id', ondelete='SET NULL'),
                nullable=True,
            ),
        )
        op.execute(
            """
            UPDATE community AS c
            SET course_id = co.id
            FROM course AS co
            WHERE c.resource_type = 'course'
              AND c.resource_uuid = co.course_uuid
            """
        )
        op.execute('CREATE INDEX IF NOT EXISTS ix_community_course_id ON community (course_id)')

    op.execute(f'DROP INDEX IF EXISTS {INDEX}')

    if 'resource_uuid' in columns:
        op.drop_column(TABLE, 'resource_uuid')
    if 'resource_type' in columns:
        op.drop_column(TABLE, 'resource_type')
