"""Allow collections to hold podcasts as members

Membership rows gain ``resource_type`` / ``resource_uuid`` so a bundle can mix
courses and podcasts. Existing rows are backfilled from their course.

Revision ID: u4f5a6b7c8d9
Revises: t3e4f5a6b7c8
Create Date: 2026-10-19 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "u4f5a6b7c8d9"
down_revision: Union[str, None] = "t3e4f5a6b7c8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "collectioncourse", sa.Column("resource_type", sa.String(), nullable=True)
    )
    op.add_column(
        "collectioncourse", sa.Column("resource_uuid", sa.String(), nullable=True)
    )

    op.execute(
        """
        UPDATE collectioncourse AS cc
        SET resource_type = 'course', resource_uuid = c.course_uuid
        FROM course AS c
        WHERE cc.course_id = c.id
        """
    )
    op.execute(
        "UPDATE collectioncourse SET resource_type = 'course' WHERE resource_type IS NULL"
    )
    op.execute(
        "UPDATE collectioncourse SET resource_uuid = '' WHERE resource_uuid IS NULL"
    )

    op.alter_column(
        "collectioncourse",
        "resource_type",
        nullable=False,
        server_default="course",
    )
    op.alter_column(
        "collectioncourse",
        "resource_uuid",
        nullable=False,
        server_default="",
    )
    op.alter_column("collectioncourse", "course_id", nullable=True)
    op.create_index(
        "ix_collectioncourse_resource_uuid",
        "collectioncourse",
        ["resource_uuid"],
    )


def downgrade() -> None:
    op.execute("DELETE FROM collectioncourse WHERE resource_type <> 'course'")
    op.drop_index(
        "ix_collectioncourse_resource_uuid", table_name="collectioncourse"
    )
    op.alter_column("collectioncourse", "course_id", nullable=False)
    op.drop_column("collectioncourse", "resource_uuid")
    op.drop_column("collectioncourse", "resource_type")
