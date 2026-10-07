"""Add podcast tracking columns to trailrun and trailstep tables

Revision ID: e1f2a3b4c5d6
Revises: d9e0f1a2b3c4
Create Date: 2026-10-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa  # noqa: F401
import sqlmodel  # noqa: F401

# revision identifiers, used by Alembic.
revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, None] = 'd9e0f1a2b3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    # ── trailrun table modifications ──
    if 'trailrun' in existing_tables:
        existing_columns = {col['name'] for col in inspector.get_columns('trailrun')}

        # Add run_type column
        if 'run_type' not in existing_columns:
            op.add_column(
                'trailrun',
                sa.Column('run_type', sa.VARCHAR(), nullable=False, server_default='RUN_TYPE_COURSE'),
            )

        # Add podcast_id column
        if 'podcast_id' not in existing_columns:
            op.add_column(
                'trailrun',
                sa.Column('podcast_id', sa.Integer(), nullable=True),
            )
            op.create_foreign_key(
                'fk_trailrun_podcast_id', 'trailrun', 'podcast',
                ['podcast_id'], ['id'], ondelete='CASCADE',
            )
            op.create_index('ix_trailrun_podcast_id', 'trailrun', ['podcast_id'])

        # Make course_id nullable (it may have been NOT NULL previously)
        col_info = [c for c in inspector.get_columns('trailrun') if c['name'] == 'course_id']
        if col_info and col_info[0].get('nullable', True) is False:
            op.alter_column('trailrun', 'course_id', existing_type=sa.Integer(), nullable=True)

    # ── trailstep table modifications ──
    if 'trailstep' in existing_tables:
        existing_columns = {col['name'] for col in inspector.get_columns('trailstep')}

        # Add episode_id column
        if 'episode_id' not in existing_columns:
            op.add_column(
                'trailstep',
                sa.Column('episode_id', sa.Integer(), nullable=True),
            )
            op.create_foreign_key(
                'fk_trailstep_episode_id', 'trailstep', 'podcastepisode',
                ['episode_id'], ['id'], ondelete='CASCADE',
            )
            op.create_index('ix_trailstep_episode_id', 'trailstep', ['episode_id'])

        # Add podcast_id column
        if 'podcast_id' not in existing_columns:
            op.add_column(
                'trailstep',
                sa.Column('podcast_id', sa.Integer(), nullable=True),
            )
            op.create_foreign_key(
                'fk_trailstep_podcast_id', 'trailstep', 'podcast',
                ['podcast_id'], ['id'], ondelete='CASCADE',
            )
            op.create_index('ix_trailstep_podcast_id', 'trailstep', ['podcast_id'])

        # Make activity_id nullable
        col_info = [c for c in inspector.get_columns('trailstep') if c['name'] == 'activity_id']
        if col_info and col_info[0].get('nullable', True) is False:
            op.alter_column('trailstep', 'activity_id', existing_type=sa.Integer(), nullable=True)

        # Make course_id nullable
        col_info = [c for c in inspector.get_columns('trailstep') if c['name'] == 'course_id']
        if col_info and col_info[0].get('nullable', True) is False:
            op.alter_column('trailstep', 'course_id', existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    # ── trailrun table downgrade ──
    if 'trailrun' in existing_tables:
        existing_columns = {col['name'] for col in inspector.get_columns('trailrun')}

        # Drop podcast_id index and FK
        if 'podcast_id' in existing_columns:
            op.drop_index('ix_trailrun_podcast_id', 'trailrun')
            op.drop_constraint('fk_trailrun_podcast_id', 'trailrun', type_='foreignkey')
            op.drop_column('trailrun', 'podcast_id')

        # Make course_id NOT NULL again (set existing nulls to 0 first if needed)
        col_info = [c for c in inspector.get_columns('trailrun') if c['name'] == 'course_id']
        if col_info and col_info[0].get('nullable', True) is True:
            # Set any existing null course_ids to 0 (dummy value)
            op.execute("UPDATE trailrun SET course_id = 0 WHERE course_id IS NULL")
            op.alter_column('trailrun', 'course_id', existing_type=sa.Integer(), nullable=False)

        # Drop run_type column
        if 'run_type' in existing_columns:
            op.drop_column('trailrun', 'run_type')

    # ── trailstep table downgrade ──
    if 'trailstep' in existing_tables:
        existing_columns = {col['name'] for col in inspector.get_columns('trailstep')}

        # Drop episode_id index and FK
        if 'episode_id' in existing_columns:
            op.drop_index('ix_trailstep_episode_id', 'trailstep')
            op.drop_constraint('fk_trailstep_episode_id', 'trailstep', type_='foreignkey')
            op.drop_column('trailstep', 'episode_id')

        # Drop podcast_id index and FK
        if 'podcast_id' in existing_columns:
            op.drop_index('ix_trailstep_podcast_id', 'trailstep')
            op.drop_constraint('fk_trailstep_podcast_id', 'trailstep', type_='foreignkey')
            op.drop_column('trailstep', 'podcast_id')

        # Make activity_id NOT NULL again
        col_info = [c for c in inspector.get_columns('trailstep') if c['name'] == 'activity_id']
        if col_info and col_info[0].get('nullable', True) is True:
            op.execute("UPDATE trailstep SET activity_id = 0 WHERE activity_id IS NULL")
            op.alter_column('trailstep', 'activity_id', existing_type=sa.Integer(), nullable=False)

        # Make course_id NOT NULL again
        col_info = [c for c in inspector.get_columns('trailstep') if c['name'] == 'course_id']
        if col_info and col_info[0].get('nullable', True) is True:
            op.execute("UPDATE trailstep SET course_id = 0 WHERE course_id IS NULL")
            op.alter_column('trailstep', 'course_id', existing_type=sa.Integer(), nullable=False)
