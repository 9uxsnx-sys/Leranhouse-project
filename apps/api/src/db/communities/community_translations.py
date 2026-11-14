from typing import Optional

from sqlalchemy import Column, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlmodel import Field, SQLModel


class CommunityTranslation(SQLModel, table=True):
    """One locale of a community.

    The base ``community`` row keeps holding the source-locale content; a row
    here overrides the translatable fields for another locale. Discussions,
    comments and reactions are user-generated and are never translated.
    """

    __tablename__ = "community_translation"  # type: ignore[assignment]
    __table_args__ = (
        UniqueConstraint("community_id", "locale", name="uq_community_translation_locale"),
        Index("ix_community_translation_community_id", "community_id"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    community_id: int = Field(
        sa_column=Column(
            Integer, ForeignKey("community.id", ondelete="CASCADE"), nullable=False
        )
    )
    locale: str = Field(sa_column=Column(String(length=10), nullable=False))
    name: str = Field(sa_column=Column(Text, nullable=False))
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    # draft | machine | reviewed | published — v1 serves every row
    state: str = Field(
        default="draft", sa_column=Column(String(length=20), nullable=False)
    )
    source_updated_at: Optional[str] = Field(
        default=None, sa_column=Column(String(length=50))
    )
    translated_by: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("user.id", ondelete="SET NULL")),
    )
    creation_date: str = Field(default="", sa_column=Column(String(length=50)))
    update_date: str = Field(default="", sa_column=Column(String(length=50)))


class CommunityTranslationUpsert(SQLModel):
    name: str
    description: Optional[str] = None
    state: Optional[str] = None


class CommunityTranslationRead(SQLModel):
    id: int
    community_id: int
    locale: str
    name: str
    description: Optional[str] = None
    state: str
    source_updated_at: Optional[str] = None
    translated_by: Optional[int] = None
    creation_date: str = ""
    update_date: str = ""
