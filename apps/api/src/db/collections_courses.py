from typing import Optional
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlmodel import Field, SQLModel


class CollectionCourse(SQLModel, table=True):
    """Membership row for a collection.

    Historically this only linked courses (``course_id``). Bundles can now hold
    podcasts too, so membership is described by ``resource_type`` /
    ``resource_uuid``; ``course_id`` is kept for the course rows so existing
    joins keep working.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    collection_id: int = Field(
        sa_column=Column(Integer, ForeignKey("collection.id", ondelete="CASCADE"))
    )
    course_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer, ForeignKey("course.id", ondelete="CASCADE"), nullable=True
        ),
    )
    resource_type: str = Field(
        default="course", sa_column=Column(String, nullable=False, server_default="course")
    )
    resource_uuid: str = Field(
        default="", sa_column=Column(String, nullable=False, server_default="")
    )
    org_id: int = Field(
        sa_column=Column(Integer, ForeignKey("organization.id", ondelete="CASCADE"))
    )
    creation_date: str
    update_date: str
