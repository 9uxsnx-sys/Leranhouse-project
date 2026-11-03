from typing import Optional
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class PodcastEpisodeBase(SQLModel):
    title: str
    description: Optional[str] = None
    audio_file: Optional[str] = Field(default="")
    duration_seconds: Optional[int] = Field(default=0)
    episode_number: Optional[int] = Field(default=1)
    thumbnail_image: Optional[str] = Field(default="")
    published: bool = Field(default=False)
    order: int = Field(default=0)
    extra_metadata: Optional[dict] = None


class PodcastEpisode(PodcastEpisodeBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    podcast_id: int = Field(
        sa_column=Column(Integer, ForeignKey("podcast.id", ondelete="CASCADE"))
    )
    org_id: int = Field(
        sa_column=Column(Integer, ForeignKey("organization.id", ondelete="CASCADE"))
    )
    episode_uuid: str = ""
    creation_date: str = ""
    update_date: str = ""
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column(JSONB))


class PodcastEpisodeCreate(PodcastEpisodeBase):
    podcast_id: int = Field(default=None, foreign_key="podcast.id")
    org_id: int = Field(default=None, foreign_key="organization.id")
    thumbnail_image: Optional[str] = Field(default="")


class PodcastEpisodeUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    audio_file: Optional[str] = None  # None means don't update, use upload endpoint to change
    duration_seconds: Optional[int] = None
    episode_number: Optional[int] = None
    thumbnail_image: Optional[str] = None  # None means don't update, use upload endpoint to change
    published: Optional[bool] = None
    order: Optional[int] = None
    extra_metadata: Optional[dict] = None


class PodcastEpisodeRead(PodcastEpisodeBase):
    id: int
    podcast_id: int = Field(default=None, foreign_key="podcast.id")
    org_id: int = Field(default=None, foreign_key="organization.id")
    episode_uuid: str
    creation_date: str
    update_date: str
    thumbnail_image: Optional[str] = Field(default="")
    extra_metadata: Optional[dict] = None
