"""One-shot migration: fill podcast + episode translations with real copy.

Run with:  python -m src.services.seed --seed-podcast-translations

The demo seed used to copy the English `about` and `tags` onto the podcast
translation rows and had no episode translations at all. This backfills the
podcast about/tags for fr/ar and creates a translation row for every seeded
episode (title + description). Matching is by podcast name and episode title
inside the demo organization, so UUIDs never change.
"""

from __future__ import annotations

import sys
from datetime import datetime

from sqlmodel import Session, select

from config.config import get_learnhouse_config
from src.core.events.database import engine
from src.db.organizations import Organization
from src.db.podcast_translations import PodcastEpisodeTranslation, PodcastTranslation
from src.db.podcasts.episodes import PodcastEpisode
from src.db.podcasts.podcasts import Podcast
from src.services.seed import copy as C
from src.services.seed.generators.podcasts import (
    PODCAST_TAGS,
    TRANSLATIONS,
    episode_translation_payload,
    podcast_about_payload,
    podcast_meta_translation_payload,
)

DEMO_ORG_SLUG = "demo"


def seed_podcast_translations() -> int:
    if not get_learnhouse_config().general_config.development_mode:
        print(
            "Refusing to run: development mode is off. "
            "Set LEARNHOUSE_DEVELOPMENT_MODE=true first."
        )
        return 1

    with Session(engine) as session:
        org = session.exec(
            select(Organization).where(Organization.slug == DEMO_ORG_SLUG)
        ).first()
        if org is None:
            print(f"No '{DEMO_ORG_SLUG}' organization found. Nothing to do.")
            return 0

        podcasts = session.exec(
            select(Podcast).where(Podcast.org_id == org.id)
        ).all()
        by_name = {podcast.name: podcast for podcast in podcasts}
        hosts = {name: host for name, _description, host in C.PODCASTS}

        now = str(datetime.now())
        podcast_updated = 0
        podcast_created = 0
        episode_updated = 0
        episode_created = 0
        skipped = 0

        for name, payload in TRANSLATIONS.items():
            podcast = by_name.get(name)
            if podcast is None:
                skipped += 1
                continue

            host = hosts.get(name, "")

            base_about = podcast_about_payload(name, host, "en")
            if podcast.about != base_about:
                podcast.about = base_about
                podcast_updated += 1

            for locale, (translated_name, translated_description) in payload.items():
                row = session.exec(
                    select(PodcastTranslation).where(
                        PodcastTranslation.podcast_id == podcast.id,
                        PodcastTranslation.locale == locale,
                    )
                ).first()

                about = podcast_about_payload(name, host, locale)
                tags = PODCAST_TAGS[locale]
                extra_metadata = podcast_meta_translation_payload(
                    name, host, locale, translated_name
                )

                if row is None:
                    session.add(
                        PodcastTranslation(
                            podcast_id=int(podcast.id or 0),
                            locale=locale,
                            name=translated_name,
                            description=translated_description,
                            about=about,
                            tags=tags,
                            extra_metadata=extra_metadata,
                            seo=None,
                            state="published",
                            source_updated_at=podcast.update_date,
                            translated_by=None,
                            creation_date=podcast.creation_date or now,
                            update_date=now,
                        )
                    )
                    podcast_created += 1
                    continue

                row.name = translated_name
                row.description = translated_description
                row.about = about
                row.tags = tags
                row.extra_metadata = extra_metadata
                row.state = "published"
                podcast_updated += 1

            episodes = session.exec(
                select(PodcastEpisode).where(PodcastEpisode.podcast_id == podcast.id)
            ).all()

            is_flagship = podcast.name == C.PODCASTS[0][0]

            for episode in episodes:
                for locale, translation in episode_translation_payload(
                    episode.title,
                    episode.description,
                    order=episode.order,
                    is_flagship=is_flagship,
                ).items():
                    row = session.exec(
                        select(PodcastEpisodeTranslation).where(
                            PodcastEpisodeTranslation.episode_id == episode.id,
                            PodcastEpisodeTranslation.locale == locale,
                        )
                    ).first()

                    if row is None:
                        session.add(
                            PodcastEpisodeTranslation(
                                episode_id=int(episode.id or 0),
                                locale=locale,
                                title=translation["title"],
                                description=translation["description"],
                                extra_metadata=translation["extra_metadata"],
                                state="published",
                                source_updated_at=episode.update_date,
                                translated_by=None,
                                creation_date=episode.creation_date or now,
                                update_date=now,
                            )
                        )
                        episode_created += 1
                        continue

                    row.title = translation["title"]
                    row.description = translation["description"]
                    row.extra_metadata = translation["extra_metadata"]
                    row.state = "published"
                    episode_updated += 1

        session.commit()

        print(
            "Podcast translations seeded: "
            f"{podcast_updated} podcast rows updated, {podcast_created} created, "
            f"{episode_updated} episode rows updated, {episode_created} created, "
            f"{skipped} podcasts skipped"
        )
        return 0


if __name__ == "__main__":
    sys.exit(seed_podcast_translations())
