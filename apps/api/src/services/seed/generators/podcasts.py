"""Podcast shows, episodes and translations."""

from __future__ import annotations

from src.db.payments.enums import AccessTypeEnum
from src.db.podcasts.episodes import PodcastEpisode
from src.db.podcast_translations import PodcastTranslation
from src.db.podcasts.podcasts import Podcast
from src.services.seed import copy as C
from src.services.seed.core import SeedContext, iso, new_uuid, org_content_dir

TRANSLATIONS = {
    "The Pixel Hour": {
        "fr": (
            "L heure du pixel",
            "Un invite, un projet, une heure. On parle des decisions derriere les ecrans.",
        ),
        "ar": (
            "ساعة البكسل",
            "ضيف واحد ومشروع واحد وساعة واحدة. نتحدث عن القرارات التي تقف خلف الشاشات.",
        ),
    },
    "Designers Who Ship": {
        "fr": (
            "Des designers qui livrent",
            "Des episodes courts sur les projets termines et ce qu ils ont appris.",
        ),
        "ar": (
            "مصممون ينجزون",
            "حلقات قصيرة عن مشاريع انتهت فعلا وما تعلمه اصحابها.",
        ),
    },
    "The Freelance Files": {
        "fr": (
            "Dossiers freelance",
            "Des histoires de clients, certaines bonnes, certaines douloureuses.",
        ),
        "ar": (
            "ملفات العمل الحر",
            "قصص عملاء، بعضها جيد وبعضها مؤلم، وكلها مفيدة.",
        ),
    },
}


def create_podcasts(ctx: SeedContext) -> None:
    base = org_content_dir(ctx.content_root, ctx.org_uuid) / "podcasts"
    shows: list[Podcast] = []

    for index, (name, description, host) in enumerate(C.PODCASTS):
        created = ctx.date_between(170, 25)
        podcast_uuid = new_uuid("podcast")
        podcast_dir = base / podcast_uuid
        podcast = Podcast(
            name=name,
            description=description,
            about=f"Hosted by {host}. Recorded in a small room with too many cables and not enough coffee.",
            tags="design, learning, interviews",
            # No audio artwork folder exists yet, so podcast covers come from
            # the general pool. Banners are the last step and stay empty.
            thumbnail_image=ctx.image(podcast_dir / "thumbnails", "thumb"),
            banner_image="",
            public=True,
            published=index < 16,
            org_id=ctx.org_id,
            podcast_uuid=podcast_uuid,
            seo={
                "title": name,
                "description": description[:150],
                "keywords": "design, podcast, learning",
                "robots_noindex": False,
                "robots_nofollow": False,
                "enable_jsonld": True,
            },
            extra_metadata=None,
            access_type=AccessTypeEnum.PUBLIC,
            price_amount=None,
            price_currency="DZD",
            source_locale="en",
            creation_date=iso(created),
            update_date=iso(created),
        )
        ctx.session.add(podcast)
        ctx.session.commit()
        ctx.session.refresh(podcast)
        shows.append(podcast)

    ctx.podcasts = shows

    main = shows[0]
    for order, (title, description) in enumerate(C.FLAGSHIP_EPISODES):
        _create_episode(ctx, main, title, description, order)

    for podcast in shows[1:16]:
        for order in range(2):
            title = (
                f"Episode {order + 1}: {ctx.rng.choice(['Notes from the studio', 'A short one about practice', 'What we got wrong this month', 'Questions from listeners'])}"
            )
            description = (
                "A short conversation recorded between meetings. Rough audio, honest answers."
                if order == 0
                else "Second episode of the season. We answer one question properly instead of five badly."
            )
            _create_episode(ctx, podcast, title, description, order)

    _create_translations(ctx, shows)


def _create_episode(
    ctx: SeedContext, podcast: Podcast, title: str, description: str, order: int
) -> None:
    episode_uuid = new_uuid("episode")
    created = ctx.date_between(140, 2)
    podcast_dir = (
        org_content_dir(ctx.content_root, ctx.org_uuid)
        / "podcasts"
        / podcast.podcast_uuid
        / "episodes"
        / episode_uuid
    )
    audio = ctx.assets.copy_audio(podcast_dir / "audio")
    # Episode covers are left empty for now, the same as the logo.
    thumbnail = ""

    ctx.session.add(
        PodcastEpisode(
            title=title,
            description=description,
            audio_file=audio,
            duration_seconds=ctx.rng.randint(900, 3600),
            episode_number=order + 1,
            thumbnail_image=thumbnail,
            published=True,
            order=order,
            podcast_id=int(podcast.id or 0),
            org_id=ctx.org_id,
            episode_uuid=episode_uuid,
            creation_date=iso(created),
            update_date=iso(created),
        )
    )
    ctx.session.commit()


def _create_translations(ctx: SeedContext, shows: list[Podcast]) -> None:
    for podcast in shows:
        payload = TRANSLATIONS.get(podcast.name)
        if not payload:
            continue
        for locale, (name, description) in payload.items():
            ctx.session.add(
                PodcastTranslation(
                    podcast_id=int(podcast.id or 0),
                    locale=locale,
                    name=name,
                    description=description,
                    about=podcast.about,
                    tags=podcast.tags,
                    seo=None,
                    state="published",
                    source_updated_at=podcast.update_date,
                    translated_by=None,
                    creation_date=iso(ctx.date_back(40)),
                    update_date=iso(ctx.now),
                )
            )
    ctx.session.commit()
