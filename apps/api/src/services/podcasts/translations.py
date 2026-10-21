"""Podcast and episode content localization.

Same contract as courses and collections: the base ``podcast`` row holds the
source-locale content (``podcast.source_locale``) and a translation row
overrides the translatable display fields for one locale. Episodes inherit the
source locale from their podcast.

Resolution is always: requested locale -> base row, and the overlay is applied
*after* access checks so a translation can never reveal locked content.
"""

from datetime import datetime
from typing import Optional, Tuple

from fastapi import HTTPException, Request
from sqlmodel import Session, select

from src.db.podcast_translations import (
    PodcastEpisodeTranslation,
    PodcastEpisodeTranslationRead,
    PodcastEpisodeTranslationUpsert,
    PodcastTranslation,
    PodcastTranslationRead,
    PodcastTranslationUpsert,
)
from src.db.podcasts.episodes import PodcastEpisode
from src.db.podcasts.podcasts import Podcast
from src.db.users import PublicUser
from src.security.rbac import AccessAction, AccessContext, check_resource_access
from src.services.courses.translations import DEFAULT_LOCALE, normalize_locale


def _get_podcast_or_404(db_session: Session, podcast_uuid: str) -> Podcast:
    podcast = db_session.exec(
        select(Podcast).where(Podcast.podcast_uuid == podcast_uuid)
    ).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")
    return podcast


def _get_episode_or_404(
    db_session: Session, episode_uuid: str
) -> Tuple[PodcastEpisode, Podcast]:
    episode = db_session.exec(
        select(PodcastEpisode).where(PodcastEpisode.episode_uuid == episode_uuid)
    ).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    podcast = db_session.exec(
        select(Podcast).where(Podcast.id == episode.podcast_id)
    ).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    return episode, podcast


def get_podcast_translation_row(
    db_session: Session, podcast_id: int, locale: str
) -> Optional[PodcastTranslation]:
    return db_session.exec(
        select(PodcastTranslation).where(
            PodcastTranslation.podcast_id == podcast_id,
            PodcastTranslation.locale == locale,
        )
    ).first()


def get_episode_translation_row(
    db_session: Session, episode_id: int, locale: str
) -> Optional[PodcastEpisodeTranslation]:
    return db_session.exec(
        select(PodcastEpisodeTranslation).where(
            PodcastEpisodeTranslation.episode_id == episode_id,
            PodcastEpisodeTranslation.locale == locale,
        )
    ).first()


def podcast_source_locale(podcast: Podcast) -> str:
    return normalize_locale(getattr(podcast, "source_locale", None)) or DEFAULT_LOCALE


def _overlay_from_podcast_translation(translation: PodcastTranslation) -> dict:
    overlay = {
        "name": translation.name,
        "description": translation.description,
        "about": translation.about,
        "tags": translation.tags,
    }
    if translation.seo:
        overlay["seo"] = translation.seo
    return overlay


def build_podcast_overlay(
    podcast: Podcast, locale: Optional[str], db_session: Session
) -> Tuple[dict, str, bool]:
    """Return `(field_overrides, content_locale, is_fallback)` for a read."""
    source_locale = podcast_source_locale(podcast)
    requested = normalize_locale(locale)

    if not requested or requested == source_locale or podcast.id is None:
        return {}, source_locale, False

    translation = get_podcast_translation_row(
        db_session, int(podcast.id), requested
    )
    if not translation:
        return {}, source_locale, True

    return _overlay_from_podcast_translation(translation), requested, False


def apply_podcast_overlay(
    model, podcast: Podcast, locale: Optional[str], db_session: Session
):
    """Return a copy of a podcast read model localized for `locale`."""
    overlay, content_locale, is_fallback = build_podcast_overlay(
        podcast, locale, db_session
    )
    return model.model_copy(
        update={
            **overlay,
            "content_locale": content_locale,
            "is_fallback": is_fallback,
        }
    )


def apply_podcast_overlay_bulk(podcast_reads, locale: Optional[str], db_session: Session):
    """Localize a page of podcast reads with a single translation query."""
    requested = normalize_locale(locale)
    if not requested or not podcast_reads:
        return podcast_reads

    pending_ids = [
        read.id
        for read in podcast_reads
        if read.id and normalize_locale(getattr(read, "source_locale", None)) != requested
    ]

    rows: dict[int, PodcastTranslation] = {}
    if pending_ids:
        translations = db_session.exec(
            select(PodcastTranslation).where(
                PodcastTranslation.podcast_id.in_(pending_ids),
                PodcastTranslation.locale == requested,
            )
        ).all()
        rows = {row.podcast_id: row for row in translations}

    localized = []
    for read in podcast_reads:
        source_locale = normalize_locale(getattr(read, "source_locale", None)) or DEFAULT_LOCALE
        if requested == source_locale or not read.id:
            localized.append(
                read.model_copy(
                    update={"content_locale": source_locale, "is_fallback": False}
                )
            )
            continue

        translation = rows.get(read.id)
        if not translation:
            localized.append(
                read.model_copy(
                    update={"content_locale": source_locale, "is_fallback": True}
                )
            )
            continue

        localized.append(
            read.model_copy(
                update={
                    **_overlay_from_podcast_translation(translation),
                    "content_locale": requested,
                    "is_fallback": False,
                }
            )
        )

    return localized


def apply_episode_overlay(
    model,
    episode: PodcastEpisode,
    source_locale: str,
    locale: Optional[str],
    db_session: Session,
):
    """Localize one episode read model. Falls back to the base row silently."""
    requested = normalize_locale(locale)
    if not requested or requested == source_locale or episode.id is None:
        return model

    translation = get_episode_translation_row(
        db_session, int(episode.id), requested
    )
    if not translation:
        return model

    return model.model_copy(
        update={
            "title": translation.title,
            "description": translation.description,
        }
    )


def apply_episode_overlay_bulk(
    episode_reads,
    episodes: list[PodcastEpisode],
    source_locale: str,
    locale: Optional[str],
    db_session: Session,
):
    """Localize a list of episodes with one translation query."""
    requested = normalize_locale(locale)
    if not requested or requested == source_locale or not episode_reads:
        return episode_reads

    episode_ids = [episode.id for episode in episodes if episode.id]
    if not episode_ids:
        return episode_reads

    translations = db_session.exec(
        select(PodcastEpisodeTranslation).where(
            PodcastEpisodeTranslation.episode_id.in_(episode_ids),
            PodcastEpisodeTranslation.locale == requested,
        )
    ).all()
    rows = {row.episode_id: row for row in translations}

    localized = []
    for read in episode_reads:
        translation = rows.get(read.id)
        if not translation:
            localized.append(read)
            continue
        localized.append(
            read.model_copy(
                update={
                    "title": translation.title,
                    "description": translation.description,
                }
            )
        )

    return localized


async def list_podcast_translations(
    request: Request,
    podcast_uuid: str,
    current_user: PublicUser,
    db_session: Session,
):
    podcast = _get_podcast_or_404(db_session, podcast_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        podcast.podcast_uuid,
        AccessAction.UPDATE,
    )

    rows = db_session.exec(
        select(PodcastTranslation)
        .where(PodcastTranslation.podcast_id == podcast.id)
        .order_by(PodcastTranslation.locale.asc())
    ).all()

    return [PodcastTranslationRead.model_validate(row) for row in rows]


async def upsert_podcast_translation(
    request: Request,
    podcast_uuid: str,
    locale: str,
    payload: PodcastTranslationUpsert,
    current_user: PublicUser,
    db_session: Session,
):
    podcast = _get_podcast_or_404(db_session, podcast_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        podcast.podcast_uuid,
        AccessAction.UPDATE,
        context=AccessContext.DASHBOARD,
    )

    code = normalize_locale(locale)
    if not code:
        raise HTTPException(status_code=422, detail="Invalid locale")

    source_locale = podcast_source_locale(podcast)
    if code == source_locale:
        raise HTTPException(
            status_code=422,
            detail="This locale is the podcast source locale; update the podcast instead",
        )

    now = str(datetime.now())
    row = get_podcast_translation_row(db_session, int(podcast.id), code)

    if row is None:
        row = PodcastTranslation(
            podcast_id=int(podcast.id),
            locale=code,
            name=payload.name,
            description=payload.description,
            about=payload.about,
            tags=payload.tags,
            seo=payload.seo,
            state=payload.state or "draft",
            source_updated_at=podcast.update_date,
            translated_by=getattr(current_user, "id", None),
            creation_date=now,
            update_date=now,
        )
        db_session.add(row)
    else:
        row.name = payload.name
        row.description = payload.description
        row.about = payload.about
        row.tags = payload.tags
        if payload.seo is not None:
            row.seo = payload.seo
        if payload.state:
            row.state = payload.state
        row.source_updated_at = podcast.update_date
        row.translated_by = getattr(current_user, "id", None)
        row.update_date = now
        db_session.add(row)

    db_session.commit()
    db_session.refresh(row)

    return PodcastTranslationRead.model_validate(row)


async def delete_podcast_translation(
    request: Request,
    podcast_uuid: str,
    locale: str,
    current_user: PublicUser,
    db_session: Session,
):
    podcast = _get_podcast_or_404(db_session, podcast_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        podcast.podcast_uuid,
        AccessAction.UPDATE,
    )

    code = normalize_locale(locale)
    if not code:
        raise HTTPException(status_code=422, detail="Invalid locale")

    row = get_podcast_translation_row(db_session, int(podcast.id), code)
    if row is None:
        raise HTTPException(status_code=404, detail="Translation not found")

    db_session.delete(row)
    db_session.commit()

    return {"detail": "Translation deleted"}


async def list_episode_translations(
    request: Request,
    episode_uuid: str,
    current_user: PublicUser,
    db_session: Session,
):
    episode, podcast = _get_episode_or_404(db_session, episode_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        podcast.podcast_uuid,
        AccessAction.UPDATE,
    )

    rows = db_session.exec(
        select(PodcastEpisodeTranslation)
        .where(PodcastEpisodeTranslation.episode_id == episode.id)
        .order_by(PodcastEpisodeTranslation.locale.asc())
    ).all()

    return [PodcastEpisodeTranslationRead.model_validate(row) for row in rows]


async def upsert_episode_translation(
    request: Request,
    episode_uuid: str,
    locale: str,
    payload: PodcastEpisodeTranslationUpsert,
    current_user: PublicUser,
    db_session: Session,
):
    episode, podcast = _get_episode_or_404(db_session, episode_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        podcast.podcast_uuid,
        AccessAction.UPDATE,
        context=AccessContext.DASHBOARD,
    )

    code = normalize_locale(locale)
    if not code:
        raise HTTPException(status_code=422, detail="Invalid locale")

    source_locale = podcast_source_locale(podcast)
    if code == source_locale:
        raise HTTPException(
            status_code=422,
            detail="This locale is the podcast source locale; update the episode instead",
        )

    now = str(datetime.now())
    row = get_episode_translation_row(db_session, int(episode.id), code)

    if row is None:
        row = PodcastEpisodeTranslation(
            episode_id=int(episode.id),
            locale=code,
            title=payload.title,
            description=payload.description,
            state=payload.state or "draft",
            source_updated_at=episode.update_date,
            translated_by=getattr(current_user, "id", None),
            creation_date=now,
            update_date=now,
        )
        db_session.add(row)
    else:
        row.title = payload.title
        row.description = payload.description
        if payload.state:
            row.state = payload.state
        row.source_updated_at = episode.update_date
        row.translated_by = getattr(current_user, "id", None)
        row.update_date = now
        db_session.add(row)

    db_session.commit()
    db_session.refresh(row)

    return PodcastEpisodeTranslationRead.model_validate(row)


async def delete_episode_translation(
    request: Request,
    episode_uuid: str,
    locale: str,
    current_user: PublicUser,
    db_session: Session,
):
    episode, podcast = _get_episode_or_404(db_session, episode_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        podcast.podcast_uuid,
        AccessAction.UPDATE,
    )

    code = normalize_locale(locale)
    if not code:
        raise HTTPException(status_code=422, detail="Invalid locale")

    row = get_episode_translation_row(db_session, int(episode.id), code)
    if row is None:
        raise HTTPException(status_code=404, detail="Translation not found")

    db_session.delete(row)
    db_session.commit()

    return {"detail": "Translation deleted"}
