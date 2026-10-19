"""Monthly operating costs for the payouts report

Stores the costs an admin enters per organization and month. Gateway fees are
not stored here — they are summed from the paid orders when the report is built.

Revision ID: s2d3e4f5a6b7
Revises: q1b2c3d4e5f6
Create Date: 2026-10-19 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "s2d3e4f5a6b7"
down_revision: Union[str, None] = "q1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payoutcost",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("org_id", sa.Integer(), nullable=False),
        sa.Column("month", sa.String(), nullable=False),
        sa.Column("hosting", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("marketing", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("other", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("creation_date", sa.String(), nullable=False, server_default=""),
        sa.Column("update_date", sa.String(), nullable=False, server_default=""),
        sa.ForeignKeyConstraint(
            ["org_id"], ["organization.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("org_id", "month", name="uq_payoutcost_org_month"),
    )
    op.create_index("ix_payoutcost_org_id", "payoutcost", ["org_id"])
    op.create_index("ix_payoutcost_month", "payoutcost", ["month"])


def downgrade() -> None:
    op.drop_index("ix_payoutcost_month", table_name="payoutcost")
    op.drop_index("ix_payoutcost_org_id", table_name="payoutcost")
    op.drop_table("payoutcost")
