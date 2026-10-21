from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class CollectionTranslation(SQLModel, table=True):
    """One locale of a collection.

    The base ``collection`` row keeps holding the source-locale content; a row
    here overrides the translatable fields for another locale.
    """

    __tablename__ = "collection_translation"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    collection_id: int = Field(
        sa_column=Column(
            Integer, ForeignKey("collection.id", ondelete="CASCADE"), nullable=False
        )
    )
    locale: str = Field(sa_column=Column(String(length=10), nullable=False))
    name: str = Field(sa_column=Column(Text, nullable=False))
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    about: Optional[str] = Field(default=None, sa_column=Column(Text))
    learnings: Optional[str] = Field(default=None, sa_column=Column(Text))
    tags: Optional[str] = Field(default=None, sa_column=Column(Text))
    seo: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
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


class CollectionTranslationUpsert(SQLModel):
    name: str
    description: Optional[str] = None
    about: Optional[str] = None
    learnings: Optional[str] = None
    tags: Optional[str] = None
    seo: Optional[dict] = None
    state: Optional[str] = None


class CollectionTranslationRead(SQLModel):
    id: int
    collection_id: int
    locale: str
    name: str
    description: Optional[str] = None
    about: Optional[str] = None
    learnings: Optional[str] = None
    tags: Optional[str] = None
    seo: Optional[dict] = None
    state: str
    source_updated_at: Optional[str] = None
    translated_by: Optional[int] = None
    creation_date: str = ""
    update_date: str = ""
