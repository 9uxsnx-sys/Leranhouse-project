from typing import Optional, List, Dict, Any
from sqlalchemy import Column, ForeignKey, Index, Integer, String, Text, JSON
from sqlmodel import Field, SQLModel


DEFAULT_MODERATION_SETTINGS: Dict[str, Any] = {
    "block_links": False,
    "min_post_length": 0,
    "max_post_length": 0,
    "max_comment_length": 0,
    "slow_mode_seconds": 0,
    "max_posts_per_day": 0,
    "min_account_age_days": 0,
    "require_email_verified": False,
    "disable_reactions": False,
    "auto_lock_days": 0,
}


class CommunityBase(SQLModel):
    name: str
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    public: bool = True
    published: bool = Field(default=False)
    thumbnail_image: Optional[str] = Field(default="")
    banner_image: Optional[str] = Field(default="")


class Community(CommunityBase, table=True):
    __table_args__ = (
        Index("ix_community_org_id", "org_id"),
        Index("ix_community_resource_uuid", "resource_uuid", unique=True),
        Index("ix_community_org_public_published_created", "org_id", "public", "published", "creation_date"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    org_id: int = Field(
        sa_column=Column(Integer, ForeignKey("organization.id", ondelete="CASCADE"))
    )
    # A community is an add-on, never a standalone product: it is attached to
    # exactly one course or podcast and inherits that resource's access rules.
    resource_uuid: Optional[str] = Field(
        default=None,
        sa_column=Column(String(length=255), nullable=True, index=False),
    )
    resource_type: Optional[str] = Field(
        default=None,
        sa_column=Column(String(length=20), nullable=True),
    )
    community_uuid: str = Field(default="", index=True)
    # The base row holds the source-locale content; other locales live in
    # ``community_translation`` (see the community translations service).
    source_locale: str = Field(default="en")
    moderation_words: List[str] = Field(default=[], sa_column=Column(JSON, default=[]))
    moderation_settings: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON, nullable=True)
    )
    creation_date: str = ""
    update_date: str = ""


class CommunityCreate(CommunityBase):
    org_id: int = Field(default=None, foreign_key="organization.id")
    resource_uuid: Optional[str] = None
    resource_type: Optional[str] = None


class CommunityUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    public: Optional[bool] = None
    published: Optional[bool] = None
    thumbnail_image: Optional[str] = None
    banner_image: Optional[str] = None
    moderation_words: Optional[List[str]] = None
    moderation_settings: Optional[Dict[str, Any]] = None


class CommunityRead(CommunityBase):
    id: int
    org_id: int = Field(default=None, foreign_key="organization.id")
    resource_uuid: Optional[str] = None
    resource_type: Optional[str] = None
    community_uuid: str
    # Localization state, filled by the translations service on read.
    source_locale: str = "en"
    content_locale: str = "en"
    is_fallback: bool = False
    moderation_words: List[str] = []
    moderation_settings: Optional[Dict[str, Any]] = None
    creation_date: str
    update_date: str
