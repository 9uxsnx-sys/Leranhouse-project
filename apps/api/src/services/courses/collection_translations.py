"""Collection content localization.

Same contract as courses: the base ``collection`` row holds the source-locale
content (``collection.source_locale``) and a ``collection_translation`` row
overrides the translatable display fields for one locale. Resolution is always:
requested locale -> base row.
"""

from datetime import datetime
from typing import Optional, Tuple

from fastapi import HTTPException, Request
from sqlmodel import Session, select

from src.db.collection_translations import (
    CollectionTranslation,
    CollectionTranslationRead,
    CollectionTranslationUpsert,
)
from src.db.collections import Collection
from src.db.users import AnonymousUser, PublicUser
from src.security.rbac import AccessAction, AccessContext, check_resource_access
from src.services.courses.translations import DEFAULT_LOCALE, normalize_locale


def _get_collection_or_404(db_session: Session, collection_uuid: str) -> Collection:
    collection = db_session.exec(
        select(Collection).where(Collection.collection_uuid == collection_uuid)
    ).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection does not exist")
    return collection


def get_collection_translation_row(
    db_session: Session, collection_id: int, locale: str
) -> Optional[CollectionTranslation]:
    return db_session.exec(
        select(CollectionTranslation).where(
            CollectionTranslation.collection_id == collection_id,
            CollectionTranslation.locale == locale,
        )
    ).first()


def _overlay_from_translation(translation: CollectionTranslation) -> dict:
    overlay = {
        "name": translation.name,
        "description": translation.description,
        "about": translation.about,
        "learnings": translation.learnings,
        "tags": translation.tags,
    }
    if translation.seo:
        overlay["seo"] = translation.seo
    return overlay


def build_collection_overlay(
    collection: Collection, locale: Optional[str], db_session: Session
) -> Tuple[dict, str, bool]:
    """Return `(field_overrides, content_locale, is_fallback)` for a read.

    `is_fallback` is True when a locale was requested but no translation exists.
    """
    source_locale = normalize_locale(
        getattr(collection, "source_locale", None)
    ) or DEFAULT_LOCALE
    requested = normalize_locale(locale)

    if not requested or requested == source_locale or collection.id is None:
        return {}, source_locale, False

    translation = get_collection_translation_row(db_session, int(collection.id), requested)
    if not translation:
        return {}, source_locale, True

    return _overlay_from_translation(translation), requested, False


def apply_collection_overlay(
    model, collection: Collection, locale: Optional[str], db_session: Session
):
    """Return a copy of a collection read model localized for `locale`."""
    overlay, content_locale, is_fallback = build_collection_overlay(
        collection, locale, db_session
    )
    return model.model_copy(
        update={
            **overlay,
            "content_locale": content_locale,
            "is_fallback": is_fallback,
        }
    )


def apply_collection_overlay_bulk(collection_reads, locale: Optional[str], db_session: Session):
    """Localize a page of collection reads with a single translation query."""
    requested = normalize_locale(locale)
    if not requested or not collection_reads:
        return collection_reads

    pending_ids = [
        read.id
        for read in collection_reads
        if read.id
        and normalize_locale(getattr(read, "source_locale", None)) != requested
    ]

    rows: dict[int, CollectionTranslation] = {}
    if pending_ids:
        translations = db_session.exec(
            select(CollectionTranslation).where(
                CollectionTranslation.collection_id.in_(pending_ids),
                CollectionTranslation.locale == requested,
            )
        ).all()
        rows = {row.collection_id: row for row in translations}

    localized = []
    for read in collection_reads:
        source_locale = (
            normalize_locale(getattr(read, "source_locale", None)) or DEFAULT_LOCALE
        )
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
                    **_overlay_from_translation(translation),
                    "content_locale": requested,
                    "is_fallback": False,
                }
            )
        )

    return localized


async def list_collection_translations(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
):
    collection = _get_collection_or_404(db_session, collection_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        collection.collection_uuid,
        AccessAction.UPDATE,
    )

    rows = db_session.exec(
        select(CollectionTranslation)
        .where(CollectionTranslation.collection_id == collection.id)
        .order_by(CollectionTranslation.locale.asc())
    ).all()

    return [CollectionTranslationRead.model_validate(row) for row in rows]


async def upsert_collection_translation(
    request: Request,
    collection_uuid: str,
    locale: str,
    payload: CollectionTranslationUpsert,
    current_user: PublicUser,
    db_session: Session,
):
    collection = _get_collection_or_404(db_session, collection_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        collection.collection_uuid,
        AccessAction.UPDATE,
        context=AccessContext.DASHBOARD,
    )

    code = normalize_locale(locale)
    if not code:
        raise HTTPException(status_code=422, detail="Invalid locale")

    source_locale = normalize_locale(
        getattr(collection, "source_locale", None)
    ) or DEFAULT_LOCALE
    if code == source_locale:
        raise HTTPException(
            status_code=422,
            detail="This locale is the collection source locale; update the collection instead",
        )

    now = str(datetime.now())
    row = get_collection_translation_row(db_session, int(collection.id), code)

    if row is None:
        row = CollectionTranslation(
            collection_id=int(collection.id),
            locale=code,
            name=payload.name,
            description=payload.description,
            about=payload.about,
            learnings=payload.learnings,
            tags=payload.tags,
            seo=payload.seo,
            state=payload.state or "draft",
            source_updated_at=collection.update_date,
            translated_by=getattr(current_user, "id", None),
            creation_date=now,
            update_date=now,
        )
        db_session.add(row)
    else:
        row.name = payload.name
        row.description = payload.description
        row.about = payload.about
        row.learnings = payload.learnings
        row.tags = payload.tags
        if payload.seo is not None:
            row.seo = payload.seo
        if payload.state:
            row.state = payload.state
        row.source_updated_at = collection.update_date
        row.translated_by = getattr(current_user, "id", None)
        row.update_date = now
        db_session.add(row)

    db_session.commit()
    db_session.refresh(row)

    return CollectionTranslationRead.model_validate(row)


async def delete_collection_translation(
    request: Request,
    collection_uuid: str,
    locale: str,
    current_user: PublicUser,
    db_session: Session,
):
    collection = _get_collection_or_404(db_session, collection_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        collection.collection_uuid,
        AccessAction.UPDATE,
    )

    code = normalize_locale(locale)
    if not code:
        raise HTTPException(status_code=422, detail="Invalid locale")

    row = get_collection_translation_row(db_session, int(collection.id), code)
    if row is None:
        raise HTTPException(status_code=404, detail="Translation not found")

    db_session.delete(row)
    db_session.commit()

    return {"detail": "Translation deleted"}
