"""Add analytics_events table

Tier-B behavioural events for the org-wide Analytics area.
Contract: docs/08-features/analytics/implementation-plan.md §3.

Revision ID: d4e5f6a7b8c9
Revises: c9d0e1f2a3b4
Create Date: 2026-10-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa  # noqa: F401
import sqlmodel  # noqa: F401
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'analytics_events',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            'org_id',
            sa.Integer(),
            sa.ForeignKey('organization.id', ondelete='CASCADE'),
            nullable=False,
        ),
        sa.Column(
            'user_id',
            sa.Integer(),
            sa.ForeignKey('user.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('visitor_id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('event_name', sa.String(64), nullable=False),
        sa.Column('path', sa.Text(), nullable=True),
        sa.Column('referrer', sa.Text(), nullable=True),
        sa.Column('device', sa.String(32), nullable=True),
        sa.Column('browser', sa.String(64), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('properties', JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
        ),
    )

    op.create_index('ix_analytics_events_org_created', 'analytics_events', ['org_id', 'created_at'])
    op.create_index('ix_analytics_events_name_created', 'analytics_events', ['event_name', 'created_at'])
    op.create_index('ix_analytics_events_user_created', 'analytics_events', ['user_id', 'created_at'])
    op.create_index('ix_analytics_events_org_visitor', 'analytics_events', ['org_id', 'visitor_id'])


def downgrade() -> None:
    op.drop_index('ix_analytics_events_org_visitor', table_name='analytics_events')
    op.drop_index('ix_analytics_events_user_created', table_name='analytics_events')
    op.drop_index('ix_analytics_events_name_created', table_name='analytics_events')
    op.drop_index('ix_analytics_events_org_created', table_name='analytics_events')
    op.drop_table('analytics_events')
