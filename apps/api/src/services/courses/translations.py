"""Course content localization.

The base ``course`` row holds the source-locale content (``course.source_locale``).
A ``course_translation`` row overrides the translatable fields for one locale.
Resolution is always: requested locale -> base row.
"""

from datetime import datetime
from typing import Optional, Tuple

from fastapi import HTTPException, Request
from sqlmodel import Session, select

from src.db.courses.course_translations import (
    CourseTranslation,
    CourseTranslationRead,
    CourseTranslationUpsert,
)
from src.db.courses.courses import Course
from src.db.users import AnonymousUser, PublicUser
from src.security.rbac import AccessAction, AccessContext, check_resource_access

SUPPORTED_LOCALES = ("en", "fr", "ar")
DEFAULT_LOCALE = "en"


def normalize_locale(locale: Optional[str]) -> Optional[str]:
    """`fr-FR` -> `fr`; unknown/blank -> None (caller falls back to the base row)."""
    if not locale:
        return None
    code = locale.strip().lower().split("-")[0].split("_")[0]
    return code or None


def _get_course_or_404(db_session: Session, course_uuid: str) -> Course:
    course = db_session.exec(
        select(Course).where(Course.course_uuid == course_uuid)
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def get_translation_row(
    db_session: Session, course_id: int, locale: str
) -> Optional[CourseTranslation]:
    return db_session.exec(
        select(CourseTranslation).where(
            CourseTranslation.course_id == course_id,
            CourseTranslation.locale == locale,
        )
    ).first()


def _overlay_from_translation(translation: CourseTranslation) -> dict:
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


def build_translation_overlay(
    course: Course, locale: Optional[str], db_session: Session
) -> Tuple[dict, str, bool]:
    """Return `(field_overrides, content_locale, is_fallback)` for a course read.

    `is_fallback` is True when a locale was requested but no translation exists.
    """
    source_locale = normalize_locale(getattr(course, "source_locale", None)) or (
        DEFAULT_LOCALE
    )
    requested = normalize_locale(locale)

    # No locale asked for, or the source locale itself: serve the base row.
    if not requested or requested == source_locale or course.id is None:
        return {}, source_locale, False

    translation = get_translation_row(db_session, course.id, requested)
    if not translation:
        return {}, source_locale, True

    return _overlay_from_translation(translation), requested, False


def apply_overlay(model, course: Course, locale: Optional[str], db_session: Session):
    """Return a copy of a course read model localized for `locale`."""
    overlay, content_locale, is_fallback = build_translation_overlay(
        course, locale, db_session
    )
    return model.model_copy(
        update={
            **overlay,
            "content_locale": content_locale,
            "is_fallback": is_fallback,
        }
    )


def apply_overlay_bulk(course_reads, locale: Optional[str], db_session: Session):
    """Localize a page of course reads with a single translation query.

    List endpoints cannot afford one SELECT per course, so every translation row
    for the page is fetched at once.
    """
    requested = normalize_locale(locale)
    if not requested or not course_reads:
        return course_reads

    pending_ids = [
        read.id
        for read in course_reads
        if read.id
        and normalize_locale(getattr(read, "source_locale", None)) != requested
    ]

    rows: dict[int, CourseTranslation] = {}
    if pending_ids:
        translations = db_session.exec(
            select(CourseTranslation).where(
                CourseTranslation.course_id.in_(pending_ids),
                CourseTranslation.locale == requested,
            )
        ).all()
        rows = {row.course_id: row for row in translations}

    localized = []
    for read in course_reads:
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


async def list_course_translations(
    request: Request,
    course_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
):
    course = _get_course_or_404(db_session, course_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        course.course_uuid,
        AccessAction.UPDATE,
    )

    rows = db_session.exec(
        select(CourseTranslation)
        .where(CourseTranslation.course_id == course.id)
        .order_by(CourseTranslation.locale.asc())
    ).all()

    return [CourseTranslationRead.model_validate(row) for row in rows]


async def upsert_course_translation(
    request: Request,
    course_uuid: str,
    locale: str,
    payload: CourseTranslationUpsert,
    current_user: PublicUser,
    db_session: Session,
):
    course = _get_course_or_404(db_session, course_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        course.course_uuid,
        AccessAction.UPDATE,
        context=AccessContext.DASHBOARD,
    )

    code = normalize_locale(locale)
    if not code:
        raise HTTPException(status_code=422, detail="Invalid locale")

    source_locale = normalize_locale(getattr(course, "source_locale", None)) or (
        DEFAULT_LOCALE
    )
    if code == source_locale:
        raise HTTPException(
            status_code=422,
            detail="This locale is the course source locale; update the course instead",
        )

    now = str(datetime.now())
    row = get_translation_row(db_session, course.id, code)

    if row is None:
        row = CourseTranslation(
            course_id=course.id,
            locale=code,
            name=payload.name,
            description=payload.description,
            about=payload.about,
            learnings=payload.learnings,
            tags=payload.tags,
            seo=payload.seo,
            state=payload.state or "draft",
            source_updated_at=course.update_date,
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
        row.source_updated_at = course.update_date
        row.translated_by = getattr(current_user, "id", None)
        row.update_date = now
        db_session.add(row)

    db_session.commit()
    db_session.refresh(row)

    return CourseTranslationRead.model_validate(row)


async def delete_course_translation(
    request: Request,
    course_uuid: str,
    locale: str,
    current_user: PublicUser,
    db_session: Session,
):
    course = _get_course_or_404(db_session, course_uuid)
    await check_resource_access(
        request,
        db_session,
        current_user,
        course.course_uuid,
        AccessAction.UPDATE,
    )

    code = normalize_locale(locale)
    if not code:
        raise HTTPException(status_code=422, detail="Invalid locale")

    row = get_translation_row(db_session, course.id, code)
    if row is None:
        raise HTTPException(status_code=404, detail="Translation not found")

    db_session.delete(row)
    db_session.commit()

    return {"detail": "Translation deleted"}
