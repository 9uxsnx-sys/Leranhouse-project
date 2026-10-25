"""Shared context and helpers for the demo seeder."""

from __future__ import annotations

import random
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional

from sqlmodel import Session

from src.services.seed.assets import AssetPool

DEMO_SLUG = "demo"
DEMO_NAME = "Koodook Academy"
DEMO_EMAIL = "hello@koodook.academy"
RANDOM_SEED = 20260224

DEMO_PASSWORD = "Demo12345"
OWNER_EMAIL = "owner@koodook.academy"


def iso(value: datetime) -> str:
    """Database timestamps are VARCHAR holding ISO strings with time."""
    return value.strftime("%Y-%m-%d %H:%M:%S.%f")


def new_uuid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4()}"


@dataclass
class SeedContext:
    session: Session
    rng: random.Random
    assets: AssetPool
    now: datetime
    content_root: Path
    password_hash: str = ""

    org: Any = None
    org_id: int = 0
    org_uuid: str = ""

    owner: Any = None
    teachers: list = field(default_factory=list)
    moderators: list = field(default_factory=list)
    students: list = field(default_factory=list)

    courses: list = field(default_factory=list)
    flagship: Any = None
    chapters: list = field(default_factory=list)
    activities: list = field(default_factory=list)

    communities: list = field(default_factory=list)
    podcasts: list = field(default_factory=list)
    collections: list = field(default_factory=list)
    groups: list = field(default_factory=list)

    @property
    def everybody(self) -> list:
        return [self.owner, *self.teachers, *self.moderators, *self.students]

    def date_back(self, max_days: int = 180) -> datetime:
        return self.now - timedelta(
            days=self.rng.randint(0, max_days),
            hours=self.rng.randint(0, 23),
            minutes=self.rng.randint(0, 59),
        )

    def date_between(self, start_days_ago: int, end_days_ago: int) -> datetime:
        low = min(start_days_ago, end_days_ago)
        high = max(start_days_ago, end_days_ago)
        return self.now - timedelta(
            days=self.rng.randint(low, high),
            hours=self.rng.randint(0, 23),
            minutes=self.rng.randint(0, 59),
        )

    def image(self, dest_dir: Path, prefix: str, niche: Optional[str] = None) -> str:
        """Copy a picture from the matching niche, or an empty string.

        Cards are matched to a niche folder when one exists for that subject.
        Anything without a folder falls back to the general pool, which keeps
        copywriting and video courses from sitting on blank cards.
        """
        if not self.assets.ready:
            return ""
        return self.assets.copy(self.assets.pick(niche), dest_dir, prefix)

    def named_image(self, dest_dir: Path, prefix: str, relative: str) -> str:
        """Copy one exact file from the assets folder. Used for hero artwork."""
        return self.assets.copy(self.assets.named(relative), dest_dir, prefix)

    def avatar(self, dest_dir: Path) -> str:
        """Copy a face from the avatars folder. Never used for card artwork."""
        return self.assets.copy(self.assets.pick_avatar(), dest_dir, "avatar")


def org_content_dir(content_root: Path, org_uuid: str) -> Path:
    return content_root / "orgs" / org_uuid


def user_content_dir(content_root: Path, user_uuid: str) -> Path:
    return content_root / "users" / user_uuid


def optional(value: Optional[str]) -> str:
    return value if value else ""
