"""Community content localization.

Same contract as courses and collections: the base ``community`` row holds the
source-locale content (``community.source_locale``) and a
``community_translation`` row overrides the translatable display fields for one
locale. Resolution is always: requested locale -> base row.

Only the admin-authored content is translated (name, description). Discussions,
comments, replies and reactions are user-generated and stay untouched.
"""

from datetime import datetime
from typing import Optional, Tuple

from fastapi import HTTPException, Request
from sqlmodel import Session, select

from src.db.communities.communities import Community
from src.db.communities.community_translations import (
    CommunityTranslation,
    CommunityTranslationRead,
    CommunityTranslationUpsert,
)
from src.db.users import AnonymousUser, PublicUser
from src.security.rbac import AccessAction, AccessContext, check_resource_access
from src.services.courses.translations import DEFAULT_LOCALE, normalize_locale


def _get_community_or_404(db_session: Session, community_uuid: str) -> Community:
    community = db_session.exec(
        select(Community).where(Community.community_uuid == community_uuid)
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    return community


def get_community_translation_row(
    db_session: Session, community_id: int, locale: str
) -> Optional[CommunityTranslation]:
    return db_session.exec(
        select(CommunityTranslation).where(
            CommunityTranslation.community_id == community_id,
            CommunityTranslation.locale == locale,
        )
    ).first()


def _overlay_from_translation(translation: CommunityTranslation) -> dict:
    return {
        "name": translation.name,
        "description": translation.description,
    }


def build_community_overlay(
    community: Community, locale: Optional[str], db_session: Session
) -> Tuple[dict, str, bool]:
    """Return `(field_overrides, content_locale, is_fallback)` for a read.

    `is_fallback` is True when a locale was requested but no translation exists.
    """
    source_locale = normalize_locale(
        getattr(community, "source_locale", None)
    ) or DEFAULT_LOCALE
    requested = normalize_locale(locale)

    if not requested or requested == source_locale or community.id is None:
        return {}, source_locale, False

    translation = get_community_translation_row(db_session, int(community.id), requested)
    if not translation:
        return {}, source_locale, True

    return _overlay_from_translation(translation), requested, False


def apply_community_overlay(
    model, community: Community, locale: Optional[str], db_session: Session
):
    """Return a copy of a community read model localized for `locale`."""
    overlay, content_locale, is_fallback = build_community_overlay(
        community, locale, db_session
    )
    return model.model_copy(
        update={
            **overlay,
            "content_locale": content_locale,
            "is_fallback": is_fallback,
        }
    )


def apply_community_overlay_bulk(community_reads, locale: Optional[str], db_session: Session):
    """Localize a page of community reads with a single translation query."""
    requested = normalize_locale(locale)
    if not requested or not community_reads:
        return community_reads

    pending_ids = [
        read.id
        for read in community_reads
        if read.id
        and normalize_locale(getattr(read, "source_locale", None)) != requested
    ]

    rows: dict[int, CommunityTranslation] = {}
    if pending_ids:
        translations = db_session.exec(
            select(CommunityTranslation).where(
                CommunityTranslation.community_id.in_(pending_ids),
                CommunityTranslation.locale == requested,
            )
        ).all()
        rows = {row.community_id: row for row in translations}

    localized = []
    for read in community_reads:
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


async def list_community_translations(
    request: Request,
    community_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
):
    community = _get_community_or_404(db_session, community_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        community.community_uuid,
        AccessAction.UPDATE,
    )

    rows = db_session.exec(
        select(CommunityTranslation)
        .where(CommunityTranslation.community_id == community.id)
        .order_by(CommunityTranslation.locale.asc())
    ).all()

    return [CommunityTranslationRead.model_validate(row) for row in rows]


async def upsert_community_translation(
    request: Request,
    community_uuid: str,
    locale: str,
    payload: CommunityTranslationUpsert,
    current_user: PublicUser,
    db_session: Session,
):
    community = _get_community_or_404(db_session, community_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        community.community_uuid,
        AccessAction.UPDATE,
        context=AccessContext.DASHBOARD,
    )

    code = normalize_locale(locale)
    if not code:
        raise HTTPException(status_code=422, detail="Invalid locale")

    source_locale = normalize_locale(
        getattr(community, "source_locale", None)
    ) or DEFAULT_LOCALE
    if code == source_locale:
        raise HTTPException(
            status_code=422,
            detail="This locale is the community source locale; update the community instead",
        )

    now = str(datetime.now())
    row = get_community_translation_row(db_session, int(community.id), code)

    if row is None:
        row = CommunityTranslation(
            community_id=int(community.id),
            locale=code,
            name=payload.name,
            description=payload.description,
            state=payload.state or "draft",
            source_updated_at=community.update_date,
            translated_by=getattr(current_user, "id", None),
            creation_date=now,
            update_date=now,
        )
        db_session.add(row)
    else:
        row.name = payload.name
        row.description = payload.description
        if payload.state:
            row.state = payload.state
        row.source_updated_at = community.update_date
        row.translated_by = getattr(current_user, "id", None)
        row.update_date = now
        db_session.add(row)

    db_session.commit()
    db_session.refresh(row)

    return CommunityTranslationRead.model_validate(row)


async def delete_community_translation(
    request: Request,
    community_uuid: str,
    locale: str,
    current_user: PublicUser,
    db_session: Session,
):
    community = _get_community_or_404(db_session, community_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        community.community_uuid,
        AccessAction.UPDATE,
    )

    code = normalize_locale(locale)
    if not code:
        raise HTTPException(status_code=422, detail="Invalid locale")

    row = get_community_translation_row(db_session, int(community.id), code)
    if row is None:
        raise HTTPException(status_code=404, detail="Translation not found")

    db_session.delete(row)
    db_session.commit()

    return {"detail": "Translation deleted"}
