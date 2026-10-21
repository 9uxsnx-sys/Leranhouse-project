"""Translation rows for podcasts and their episodes.

Same contract as courses and collections: the base row holds the source-locale
content and a translation row overrides the display fields for one locale.
Episodes inherit the source locale from their podcast, so they do not carry a
``source_locale`` column of their own.
"""

from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class PodcastTranslation(SQLModel, table=True):
    """One locale of a podcast."""

    __tablename__ = "podcast_translation"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    podcast_id: int = Field(
        sa_column=Column(
            Integer, ForeignKey("podcast.id", ondelete="CASCADE"), nullable=False
        )
    )
    locale: str = Field(sa_column=Column(String(length=10), nullable=False))
    name: str = Field(sa_column=Column(Text, nullable=False))
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    about: Optional[str] = Field(default=None, sa_column=Column(Text))
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


class PodcastTranslationUpsert(SQLModel):
    name: str
    description: Optional[str] = None
    about: Optional[str] = None
    tags: Optional[str] = None
    seo: Optional[dict] = None
    state: Optional[str] = None


class PodcastTranslationRead(SQLModel):
    id: int
    podcast_id: int
    locale: str
    name: str
    description: Optional[str] = None
    about: Optional[str] = None
    tags: Optional[str] = None
    seo: Optional[dict] = None
    state: str
    source_updated_at: Optional[str] = None
    translated_by: Optional[int] = None
    creation_date: str = ""
    update_date: str = ""


class PodcastEpisodeTranslation(SQLModel, table=True):
    """One locale of a podcast episode (title + description)."""

    __tablename__ = "podcast_episode_translation"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    episode_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("podcastepisode.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    locale: str = Field(sa_column=Column(String(length=10), nullable=False))
    title: str = Field(sa_column=Column(Text, nullable=False))
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
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


class PodcastEpisodeTranslationUpsert(SQLModel):
    title: str
    description: Optional[str] = None
    state: Optional[str] = None


class PodcastEpisodeTranslationRead(SQLModel):
    id: int
    episode_id: int
    locale: str
    title: str
    description: Optional[str] = None
    state: str
    source_updated_at: Optional[str] = None
    translated_by: Optional[int] = None
    creation_date: str = ""
    update_date: str = ""
