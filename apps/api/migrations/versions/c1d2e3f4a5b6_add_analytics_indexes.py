"""Add org-wide analytics indexes

Every org-wide analytics aggregate filters on `org_id` (plus a `creation_date`
range on the string-typed tables). `trailrun`, `trailstep` and `discussion` had
no `org_id` index at all, so those queries would sequentially scan the largest
tables in the schema.

The composite `(org_id, creation_date)` also serves the range predicate: the
queries filter on the *raw* string (lexicographic comparison is correct for the
ISO-8601 values these columns hold) and only cast in the SELECT/GROUP BY.

Contract: docs/08-features/analytics/implementation-plan.md (Phase 1, §7).

Revision ID: c1d2e3f4a5b6
Revises: d4e5f6a7b8c9
Create Date: 2026-10-12 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa  # noqa: F401
import sqlmodel  # noqa: F401

# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('ix_trailrun_org_created', 'trailrun', ['org_id', 'creation_date'])
    op.create_index('ix_trailstep_org_created', 'trailstep', ['org_id', 'creation_date'])
    op.create_index('ix_discussion_org_created', 'discussion', ['org_id', 'creation_date'])


def downgrade() -> None:
    op.drop_index('ix_discussion_org_created', table_name='discussion')
    op.drop_index('ix_trailstep_org_created', table_name='trailstep')
    op.drop_index('ix_trailrun_org_created', table_name='trailrun')
