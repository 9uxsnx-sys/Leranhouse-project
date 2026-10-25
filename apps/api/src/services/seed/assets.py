"""Image and audio handling for the demo seeder.

The operator drops a folder of pictures. Every subfolder is treated as a niche
and is matched, in lowercase, against the niche written on each course,
collection or community. A file placed directly in the root belongs to no niche
and is kept aside for the handful of hand picked slots such as the flagship
banner.

Files inside the `avatars` folder are only used for user avatars. They never
leak into card artwork, which is what would happen with a single flat pool.

Pictures are dealt from a shuffled deck per pool, so the same image never lands
on two neighbouring cards. The deck reshuffles once it runs out, which is
unavoidable when a niche has fewer pictures than slots.
"""

from __future__ import annotations

import random
import shutil
import uuid
from pathlib import Path
from typing import Optional

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
AUDIO_SUFFIXES = {".mp3", ".m4a", ".wav", ".ogg"}
AVATAR_FOLDER = "avatars"


class AssetPool:
    def __init__(self, root: Path, rng: Optional[random.Random] = None) -> None:
        self.root = root
        self.rng = rng or random.Random()
        self.pools: dict[str, list[Path]] = {}
        self.avatars: list[Path] = []
        self.audio: list[Path] = []
        self.copied = 0
        self._decks: dict[str, list[Path]] = {}
        self._named: dict[str, Path] = {}
        self._scan()

    def _scan(self) -> None:
        if not self.root.exists():
            return
        for path in sorted(self.root.rglob("*")):
            if not path.is_file():
                continue
            suffix = path.suffix.lower()
            if suffix in AUDIO_SUFFIXES:
                self.audio.append(path)
                continue
            if suffix not in IMAGE_SUFFIXES:
                continue

            relative = path.relative_to(self.root)
            self._named[relative.as_posix().lower()] = path

            if len(relative.parts) == 1:
                continue

            folder = relative.parts[0].lower()
            if folder == AVATAR_FOLDER:
                self.avatars.append(path)
            else:
                self.pools.setdefault(folder, []).append(path)

    @property
    def ready(self) -> bool:
        return bool(self.pools or self.avatars)

    @property
    def general(self) -> list[Path]:
        return [path for pool in self.pools.values() for path in pool]

    def _deal(self, key: str, pool: list[Path]) -> Path:
        deck = self._decks.get(key)
        if not deck:
            deck = list(pool)
            self.rng.shuffle(deck)
            self._decks[key] = deck
        return deck.pop()

    def pick(self, niche: Optional[str] = None) -> Optional[Path]:
        """Pick a picture for a card, from the niche folder when it exists."""
        if niche:
            pool = self.pools.get(niche.lower())
            if pool:
                return self._deal(f"niche:{niche.lower()}", pool)
        general = self.general
        if not general:
            return None
        return self._deal("general", general)

    def named(self, relative: str) -> Optional[Path]:
        """Return one exact file, ignoring the decks. Used for hero artwork."""
        return self._named.get(relative.replace("\\", "/").lower())

    def pick_avatar(self) -> Optional[Path]:
        if not self.avatars:
            return None
        return self._deal("avatars", self.avatars)

    def copy(self, source: Optional[Path], dest_dir: Path, prefix: str) -> str:
        """Copy a picture into the content tree and return its filename only."""
        if source is None:
            return ""
        dest_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{prefix}_{uuid.uuid4().hex[:10]}{source.suffix.lower()}"
        shutil.copyfile(source, dest_dir / filename)
        self.copied += 1
        return filename

    def pick_audio(self) -> Optional[Path]:
        if not self.audio:
            return None
        return self.audio[uuid.uuid4().int % len(self.audio)]

    def copy_audio(self, dest_dir: Path) -> Optional[str]:
        source = self.pick_audio()
        if source is None:
            return None
        dest_dir.mkdir(parents=True, exist_ok=True)
        filename = f"audio_{uuid.uuid4().hex[:10]}{source.suffix.lower()}"
        shutil.copyfile(source, dest_dir / filename)
        return filename
