from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlmodel import Field, SQLModel


class CollectionUser(SQLModel, table=True):
    """Learner inventory row for a collection.

    Mirrors ``TrailRun`` for courses without progress tracking: a row exists
    once a learner claims a public bundle, and removing it drops the bundle
    from their inventory. Paid access keeps using payment entitlements and
    private access keeps using user groups.
    """

    __table_args__ = (
        UniqueConstraint(
            "collection_id", "user_id", name="uq_collectionuser_collection_user"
        ),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    collection_id: int = Field(
        sa_column=Column(Integer, ForeignKey("collection.id", ondelete="CASCADE"))
    )
    user_id: int = Field(
        sa_column=Column(Integer, ForeignKey("user.id", ondelete="CASCADE"))
    )
    org_id: int = Field(
        sa_column=Column(Integer, ForeignKey("organization.id", ondelete="CASCADE"))
    )
    creation_date: str
    update_date: str
