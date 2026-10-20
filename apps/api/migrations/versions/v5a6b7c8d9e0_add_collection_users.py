"""Add collection learner inventory rows

A public bundle can be claimed by a learner. ``collectionuser`` stores that
claim so the dashboard Access tab can list, add and remove learners exactly
like the course access roster (TrailRun). No progress is tracked here.

Revision ID: v5a6b7c8d9e0
Revises: u4f5a6b7c8d9
Create Date: 2026-10-20 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "v5a6b7c8d9e0"
down_revision: Union[str, None] = "u4f5a6b7c8d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "collectionuser",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "collection_id",
            sa.Integer(),
            sa.ForeignKey("collection.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "org_id",
            sa.Integer(),
            sa.ForeignKey("organization.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("creation_date", sa.String(), nullable=False),
        sa.Column("update_date", sa.String(), nullable=False),
        sa.UniqueConstraint(
            "collection_id",
            "user_id",
            name="uq_collectionuser_collection_user",
        ),
    )
    op.create_index(
        "ix_collectionuser_collection_id", "collectionuser", ["collection_id"]
    )
    op.create_index("ix_collectionuser_user_id", "collectionuser", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_collectionuser_user_id", table_name="collectionuser")
    op.drop_index("ix_collectionuser_collection_id", table_name="collectionuser")
    op.drop_table("collectionuser")
