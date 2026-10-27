from typing import Optional

from sqlalchemy import BigInteger, Column, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from src.db.courses.courses import ThumbnailType
from src.db.payments.enums import AccessTypeEnum


class CollectionBase(SQLModel):
    """Presentation and access fields, mirroring ``CourseBase``.

    Bundles are shown with the same surface as a course (cover, banner,
    description, learning outcomes, price), but their body lists courses
    instead of chapters and activities.
    """

    name: str
    description: Optional[str] = None
    about: Optional[str] = None
    learnings: Optional[str] = None
    tags: Optional[str] = None
    thumbnail_type: Optional[ThumbnailType] = Field(default=ThumbnailType.IMAGE)
    thumbnail_image: Optional[str] = Field(default="")
    thumbnail_video: Optional[str] = Field(default="")
    banner_image: Optional[str] = Field(default="")
    # `public` is the legacy visibility flag, kept in sync with `access_type`
    # so that existing listing queries keep working.
    public: bool
    published: bool = Field(default=False)
    access_type: AccessTypeEnum = Field(default=AccessTypeEnum.PUBLIC)
    price_amount: Optional[int] = None
    price_currency: str = Field(default="DZD")
    seo: Optional[dict] = Field(default=None, sa_column=Column(JSONB, nullable=True))
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column(JSONB, nullable=True))


class Collection(CollectionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    org_id: int = Field(
        sa_column=Column(BigInteger, ForeignKey("organization.id", ondelete="CASCADE"))
    )
    collection_uuid: str = ""
    # The base row holds the source-locale content; other locales live in
    # ``collection_translation`` (see translations service).
    source_locale: str = Field(default="en")
    creation_date: str = ""
    update_date: str = ""


class CollectionCreate(CollectionBase):
    # Membership is optional at creation: a collection may start empty and be
    # filled from the dashboard Content tab. The organization comes from the
    # route, never from the body.
    courses: Optional[list[int]] = None


class CollectionUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    about: Optional[str] = None
    learnings: Optional[str] = None
    tags: Optional[str] = None
    thumbnail_type: Optional[ThumbnailType] = None
    thumbnail_image: Optional[str] = None
    thumbnail_video: Optional[str] = None
    banner_image: Optional[str] = None
    public: Optional[bool] = None
    published: Optional[bool] = None
    access_type: Optional[AccessTypeEnum] = None
    price_amount: Optional[int] = None
    price_currency: Optional[str] = None
    seo: Optional[dict] = None
    extra_metadata: Optional[dict] = None
    courses: Optional[list[int]] = None


class CollectionRead(CollectionBase):
    id: int
    courses: list
    member_count: int = 0
    collection_uuid: str
    # Localization state, filled by the translations service on read.
    source_locale: str = "en"
    content_locale: str = "en"
    is_fallback: bool = False
    creation_date: str
    update_date: str


class CollectionCourseRead(SQLModel):
    """Lean member row for the dashboard Content table and learner page."""

    id: int
    resource_type: str = "course"
    resource_uuid: str = ""
    course_uuid: Optional[str] = None
    name: str
    description: Optional[str] = None
    thumbnail_image: Optional[str] = None
    access_type: AccessTypeEnum
    published: bool
    price_amount: Optional[int] = None
    price_currency: str = "DZD"
    lessons: int = 0
    # Card metadata copied from the course so a member card can render the
    # same "26 lessons · 6h 20m · Intermediate" row as the course listing.
    duration: Optional[str] = None
    difficulty: Optional[str] = None
    creation_date: str = ""


class CollectionMembersPage(SQLModel):
    """Paginated page used by the dashboard Content table.

    ``filter=linked`` lists the members of the collection, while
    ``filter=available`` lists the organization resources that can still be
    added (search + add flow, mirroring the course Access tab).
    """

    items: list[CollectionCourseRead]
    total: int
