from datetime import datetime
from typing import List
from uuid import uuid4

from fastapi import HTTPException, Request, status
from sqlalchemy import func
from sqlmodel import Session, select

from src.db.collections import (
    Collection,
    CollectionCourseRead,
    CollectionCreate,
    CollectionMembersPage,
    CollectionRead,
    CollectionUpdate,
)
from src.db.collections_courses import CollectionCourse
from src.db.courses.activities import Activity
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.chapters import Chapter
from src.db.courses.course_translations import CourseTranslation
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.payments.enums import AccessTypeEnum
from src.db.podcasts.episodes import PodcastEpisode
from src.db.podcasts.podcasts import Podcast
from src.db.roles import Role
from src.db.usergroup_resources import UserGroupResource
from src.db.usergroup_user import UserGroupUser
from src.db.users import AnonymousUser, APITokenUser, PublicUser
from src.db.user_organizations import UserOrganization
from src.security.auth import resolve_acting_user_id
from src.security.rbac import check_resource_access, AccessAction
from src.security.rbac.constants import ADMIN_OR_MAINTAINER_ROLE_IDS
from src.security.superadmin import is_user_superadmin
from src.services.courses.collection_translations import (
    apply_collection_overlay,
    apply_collection_overlay_bulk,
)
from src.services.courses.translations import DEFAULT_LOCALE, normalize_locale
from src.services.webhooks.dispatch import dispatch_webhooks
from src.services.notifications import notify


####################################################
# Helpers
####################################################


def _get_collection_or_404(db_session: Session, collection_uuid: str) -> Collection:
    collection = db_session.exec(
        select(Collection).where(Collection.collection_uuid == collection_uuid)
    ).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Collection does not exist"
        )
    return collection


def _is_org_admin(db_session: Session, org_id: int, acting_user_id: int) -> bool:
    if acting_user_id == 0:
        return False
    if is_user_superadmin(acting_user_id, db_session):
        return True
    roles = db_session.exec(
        select(Role)
        .join(UserOrganization, UserOrganization.role_id == Role.id)
        .where(
            UserOrganization.org_id == org_id,
            UserOrganization.user_id == acting_user_id,
        )
    ).all()
    return any(role.id in ADMIN_OR_MAINTAINER_ROLE_IDS for role in roles)


def _member_courses(
    db_session: Session,
    collection_id: int,
    org_id: int,
    include_unpublished: bool = False,
) -> list[Course]:
    statement = (
        select(Course)
        .join(CollectionCourse, CollectionCourse.course_id == Course.id)
        .where(
            CollectionCourse.collection_id == collection_id,
            CollectionCourse.org_id == org_id,
        )
    )
    if not include_unpublished:
        statement = statement.where(
            Course.published == True,  # noqa: E712
            Course.access_type.in_(
                [AccessTypeEnum.PUBLIC, AccessTypeEnum.PAID]
            ),
        )
    statement = statement.order_by(Course.creation_date.desc())  # type: ignore[attr-defined]
    return list(db_session.exec(statement).all())


def _build_read(
    db_session: Session,
    collection: Collection,
    include_unpublished: bool = False,
    locale: str | None = None,
) -> CollectionRead:
    courses = _member_courses(
        db_session, int(collection.id), int(collection.org_id), include_unpublished
    )
    read = CollectionRead(
        **collection.model_dump(),
        courses=courses,
        member_count=_member_count(db_session, collection),
    )
    return apply_collection_overlay(read, collection, locale, db_session)


def _member_count(db_session: Session, collection: Collection) -> int:
    return int(
        db_session.exec(
            select(func.count())
            .select_from(CollectionCourse)
            .where(CollectionCourse.collection_id == collection.id)
        ).one()
        or 0
    )


def _validate_publishable(db_session: Session, collection: Collection) -> None:
    """Enforce the rules that make a collection understandable to learners."""
    member_count = _member_count(db_session, collection)

    if collection.access_type == AccessTypeEnum.PAID:
        if (collection.price_amount or 0) <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A paid collection requires a positive price",
            )
        if member_count == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A paid collection requires at least one item",
            )

    if collection.published:
        members = db_session.exec(
            select(CollectionCourse).where(
                CollectionCourse.collection_id == collection.id
            )
        ).all()
        course_ids = [
            member.course_id
            for member in members
            if member.resource_type == "course" and member.course_id is not None
        ]
        podcast_uuids = [
            member.resource_uuid
            for member in members
            if member.resource_type == "podcast" and member.resource_uuid
        ]

        draft_names: list[str] = []
        if course_ids:
            draft_names += db_session.exec(
                select(Course.name).where(
                    Course.id.in_(course_ids),  # type: ignore[attr-defined]
                    Course.published == False,  # noqa: E712
                )
            ).all()
        if podcast_uuids:
            draft_names += db_session.exec(
                select(Podcast.name).where(
                    Podcast.podcast_uuid.in_(podcast_uuids),  # type: ignore[attr-defined]
                    Podcast.published == False,  # noqa: E712
                )
            ).all()

        if draft_names:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "All items in a published collection must be published: "
                    + ", ".join(sorted(draft_names))
                ),
            )


def _sync_access_flags(collection: Collection, fields_set: set[str]) -> None:
    """Keep the legacy `public` flag and `access_type` consistent."""
    if "access_type" in fields_set and collection.access_type is not None:
        collection.public = collection.access_type == AccessTypeEnum.PUBLIC
    elif "public" in fields_set and collection.public is not None:
        collection.access_type = (
            AccessTypeEnum.PUBLIC if collection.public else AccessTypeEnum.USERS_ONLY
        )


async def _check_catalog_read_access(
    request: Request,
    db_session: Session,
    current_user: PublicUser | AnonymousUser,
    collection: Collection,
) -> None:
    """Guard the collection catalog (metadata and member list).

    A published paid bundle is a product page: learners must be able to browse
    what they are buying before they pay. The lessons stay protected by each
    course's own RBAC check. Private (``users_only``) and draft collections keep
    the strict RBAC denial.
    """
    decision = await check_resource_access(
        request,
        db_session,
        current_user,
        collection.collection_uuid,
        AccessAction.READ,
        raise_on_deny=False,
    )
    if decision.allowed:
        return
    if collection.published and collection.access_type == AccessTypeEnum.PAID:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail=decision.reason
    )


####################################################
# CRUD
####################################################


async def get_collection(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
    locale: str | None = None,
) -> CollectionRead:
    collection = _get_collection_or_404(db_session, collection_uuid)

    await _check_catalog_read_access(request, db_session, current_user, collection)

    acting_user_id = resolve_acting_user_id(current_user)
    include_unpublished = _is_org_admin(
        db_session, int(collection.org_id), acting_user_id
    )

    return _build_read(db_session, collection, include_unpublished, locale)


async def create_collection(
    request: Request,
    collection_object: CollectionCreate,
    current_user: PublicUser,
    db_session: Session,
    org_id: int,
) -> CollectionRead:
    # SECURITY: The organization always comes from the route, never from the body.
    await check_resource_access(
        request, db_session, current_user, "collection_x", AccessAction.CREATE
    )

    collection = Collection(
        **collection_object.model_dump(exclude={"courses"}),
        org_id=org_id,
    )

    _sync_access_flags(collection, set(collection_object.model_fields_set))

    # Older clients do not send a publish toggle. Collections created without
    # an explicit `published` value stay visible, preserving previous behaviour.
    if "published" not in collection_object.model_fields_set:
        collection.published = True

    # Validate every member before writing anything so a bad id cannot leave a
    # half-created collection behind.
    courses: list[Course] = []
    for course_id in collection_object.courses or []:
        course = db_session.exec(select(Course).where(Course.id == course_id)).first()

        if not course or int(course.org_id) != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course {course_id} not found in this organization",
            )

        await check_resource_access(
            request, db_session, current_user, course.course_uuid, AccessAction.READ
        )

        if course.access_type == AccessTypeEnum.USERS_ONLY:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Course {course.name} is private and cannot be added to a collection",
            )

        courses.append(course)

    collection.collection_uuid = f"collection_{uuid4()}"
    collection.creation_date = str(datetime.now())
    collection.update_date = str(datetime.now())

    db_session.add(collection)
    db_session.flush()

    for course in courses:
        db_session.add(
            CollectionCourse(
                collection_id=int(collection.id),  # type: ignore[arg-type]
                course_id=int(course.id),  # type: ignore[arg-type]
                resource_type="course",
                resource_uuid=course.course_uuid,
                org_id=org_id,
                creation_date=str(datetime.now()),
                update_date=str(datetime.now()),
            )
        )

    db_session.flush()
    _validate_publishable(db_session, collection)
    db_session.commit()
    db_session.refresh(collection)

    result = _build_read(db_session, collection, include_unpublished=True)

    await dispatch_webhooks(
        event_name="collection_created",
        org_id=org_id,
        data={
            "collection_uuid": collection.collection_uuid,
            "name": collection.name,
        },
    )
    notify(
        event_name="collection_created",
        org_id=org_id,
        data={
            "collection_uuid": collection.collection_uuid,
            "name": collection.name,
        },
    )

    return result


async def update_collection(
    request: Request,
    collection_object: CollectionUpdate,
    collection_uuid: str,
    current_user: PublicUser,
    db_session: Session,
) -> CollectionRead:
    collection = _get_collection_or_404(db_session, collection_uuid)

    # RBAC check
    await check_resource_access(
        request, db_session, current_user, collection.collection_uuid, AccessAction.UPDATE
    )

    fields_set = set(collection_object.model_fields_set)

    # Apply only the fields that were explicitly provided.
    for var, value in collection_object.model_dump(exclude_unset=True, exclude={"courses"}).items():
        setattr(collection, var, value)

    # An explicit null clears the price; null otherwise means "not provided".
    if "price_amount" in fields_set and collection_object.price_amount is None:
        collection.price_amount = None

    _sync_access_flags(collection, fields_set)
    collection.update_date = str(datetime.now())

    db_session.add(collection)

    # Membership is only rebuilt when the caller actually sent `courses`.
    if "courses" in fields_set:
        members: list[Course] = []
        for course_id in collection_object.courses or []:
            course = db_session.exec(
                select(Course).where(Course.id == course_id)
            ).first()
            if not course or int(course.org_id) != int(collection.org_id):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Course {course_id} not found in this organization",
                )
            await check_resource_access(
                request, db_session, current_user, course.course_uuid, AccessAction.READ
            )
            if course.access_type == AccessTypeEnum.USERS_ONLY:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Course {course.name} is private and cannot be added to a collection",
                )
            members.append(course)

        for existing in db_session.exec(
            select(CollectionCourse).where(
                CollectionCourse.collection_id == collection.id
            )
        ).all():
            db_session.delete(existing)

        for course in members:
            db_session.add(
                CollectionCourse(
                    collection_id=int(collection.id),  # type: ignore[arg-type]
                    course_id=int(course.id),  # type: ignore[arg-type]
                    resource_type="course",
                    resource_uuid=course.course_uuid,
                    org_id=int(collection.org_id),
                    creation_date=str(datetime.now()),
                    update_date=str(datetime.now()),
                )
            )

    db_session.flush()

    if fields_set & {"courses", "published", "access_type", "price_amount", "public"}:
        _validate_publishable(db_session, collection)

    db_session.commit()
    db_session.refresh(collection)

    return _build_read(db_session, collection, include_unpublished=True)


async def delete_collection(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser,
    db_session: Session,
):
    collection = _get_collection_or_404(db_session, collection_uuid)

    # RBAC check
    await check_resource_access(
        request, db_session, current_user, collection.collection_uuid, AccessAction.DELETE
    )

    # Clean up collection media so deleting a bundle does not leave files behind.
    org = db_session.exec(
        select(Organization).where(Organization.id == collection.org_id)
    ).first()
    if org:
        from src.services.courses.transfer.storage_utils import delete_storage_directory

        delete_storage_directory(
            f"content/orgs/{org.org_uuid}/collections/{collection.collection_uuid}"
        )

    db_session.delete(collection)
    db_session.commit()

    return {"detail": "Collection deleted"}


####################################################
# Membership
####################################################


def _course_translations_for(
    db_session: Session, courses: list[Course], requested: str | None
) -> dict[int, CourseTranslation]:
    """Translations of the given courses in `requested`, with one query."""
    if not requested or not courses:
        return {}
    ids = [
        int(course.id)
        for course in courses
        if course.id is not None
        and normalize_locale(getattr(course, "source_locale", None)) != requested
    ]
    if not ids:
        return {}
    rows = db_session.exec(
        select(CourseTranslation).where(
            CourseTranslation.course_id.in_(ids),  # type: ignore[attr-defined]
            CourseTranslation.locale == requested,
        )
    ).all()
    return {row.course_id: row for row in rows}


def _list_member_rows(
    db_session: Session,
    collection: Collection,
    include_unpublished: bool,
    query: str = "",
    locale: str | None = None,
) -> list[CollectionCourseRead]:
    """Build every member row (courses + podcasts) with lesson/episode counts."""
    members = db_session.exec(
        select(CollectionCourse).where(
            CollectionCourse.collection_id == collection.id,
            CollectionCourse.org_id == collection.org_id,
        )
    ).all()
    if not members:
        return []

    course_ids = [
        member.course_id
        for member in members
        if member.resource_type == "course" and member.course_id is not None
    ]
    podcast_uuids = [
        member.resource_uuid
        for member in members
        if member.resource_type == "podcast" and member.resource_uuid
    ]

    courses_by_id: dict[int, Course] = {}
    if course_ids:
        for course in db_session.exec(
            select(Course).where(Course.id.in_(course_ids))  # type: ignore[attr-defined]
        ).all():
            courses_by_id[int(course.id)] = course  # type: ignore[arg-type]

    podcasts_by_uuid: dict[str, Podcast] = {}
    if podcast_uuids:
        for podcast in db_session.exec(
            select(Podcast).where(
                Podcast.podcast_uuid.in_(podcast_uuids)  # type: ignore[attr-defined]
            )
        ).all():
            podcasts_by_uuid[podcast.podcast_uuid] = podcast

    # Member course cards show the course name/description, so they follow the
    # requested language too (one extra query for the whole page).
    requested = normalize_locale(locale)
    course_translations = _course_translations_for(
        db_session, list(courses_by_id.values()), requested
    )

    lesson_counts = dict(
        db_session.exec(
            select(Chapter.course_id, func.count(Activity.id))
            .join(ChapterActivity, ChapterActivity.chapter_id == Chapter.id)
            .join(Activity, Activity.id == ChapterActivity.activity_id)
            .where(Chapter.course_id.in_(course_ids))  # type: ignore[attr-defined]
            .group_by(Chapter.course_id)
        ).all()
    ) if course_ids else {}

    podcast_ids = [int(podcast.id) for podcast in podcasts_by_uuid.values()]  # type: ignore[arg-type]
    episode_counts = dict(
        db_session.exec(
            select(PodcastEpisode.podcast_id, func.count(PodcastEpisode.id))
            .where(PodcastEpisode.podcast_id.in_(podcast_ids))  # type: ignore[attr-defined]
            .group_by(PodcastEpisode.podcast_id)
        ).all()
    ) if podcast_ids else {}

    result: list[CollectionCourseRead] = []

    for member in members:
        if member.resource_type == "podcast":
            podcast = podcasts_by_uuid.get(member.resource_uuid)
            if not podcast:
                continue
            if not include_unpublished and (
                not podcast.published
                or podcast.access_type
                not in (AccessTypeEnum.PUBLIC, AccessTypeEnum.PAID)
            ):
                continue
            if query and query not in (podcast.name or "").lower():
                continue
            result.append(
                CollectionCourseRead(
                    id=int(podcast.id),  # type: ignore[arg-type]
                    resource_type="podcast",
                    resource_uuid=podcast.podcast_uuid,
                    course_uuid=None,
                    name=podcast.name,
                    description=podcast.description,
                    thumbnail_image=podcast.thumbnail_image,
                    access_type=podcast.access_type,
                    published=podcast.published,
                    price_amount=podcast.price_amount,
                    price_currency=podcast.price_currency,
                    lessons=int(episode_counts.get(podcast.id, 0)),
                    creation_date=podcast.creation_date,
                )
            )
            continue

        course = courses_by_id.get(int(member.course_id)) if member.course_id else None
        if not course:
            continue
        if not include_unpublished and (
            not course.published
            or course.access_type not in (AccessTypeEnum.PUBLIC, AccessTypeEnum.PAID)
        ):
            continue
        translation = course_translations.get(int(course.id)) if course.id else None
        display_name = (translation.name or course.name) if translation else course.name
        display_description = (
            translation.description
            if translation and translation.description is not None
            else course.description
        )
        if query and query not in (display_name or "").lower():
            continue
        result.append(
            CollectionCourseRead(
                id=int(course.id),  # type: ignore[arg-type]
                resource_type="course",
                resource_uuid=course.course_uuid,
                course_uuid=course.course_uuid,
                name=display_name,
                description=display_description,
                thumbnail_image=course.thumbnail_image,
                access_type=course.access_type,
                published=course.published,
                price_amount=course.price_amount,
                price_currency=course.price_currency,
                lessons=int(lesson_counts.get(course.id, 0)),
                creation_date=course.creation_date,
            )
        )

    result.sort(key=lambda item: item.creation_date or "", reverse=True)
    return result


def _list_available_rows(
    db_session: Session,
    collection: Collection,
    include_unpublished: bool,
    query: str = "",
    locale: str | None = None,
) -> list[CollectionCourseRead]:
    """Organization resources that can still join this collection.

    Mirrors the dashboard picker rules: private items are never selectable and
    a published bundle only accepts published items.
    """
    member_uuids = set(
        db_session.exec(
            select(CollectionCourse.resource_uuid).where(
                CollectionCourse.collection_id == collection.id
            )
        ).all()
    )

    courses = list(
        db_session.exec(
            select(Course).where(Course.org_id == collection.org_id)
        ).all()
    )
    podcasts = list(
        db_session.exec(
            select(Podcast).where(Podcast.org_id == collection.org_id)
        ).all()
    )

    candidates: list[tuple[str, Course | Podcast]] = []
    for course in courses:
        if course.course_uuid in member_uuids:
            continue
        if course.access_type == AccessTypeEnum.USERS_ONLY:
            continue
        if collection.published and not course.published:
            continue
        if not include_unpublished and (
            not course.published
            or course.access_type not in (AccessTypeEnum.PUBLIC, AccessTypeEnum.PAID)
        ):
            continue
        candidates.append(("course", course))
    for podcast in podcasts:
        if podcast.podcast_uuid in member_uuids:
            continue
        if podcast.access_type == AccessTypeEnum.USERS_ONLY:
            continue
        if collection.published and not podcast.published:
            continue
        if not include_unpublished and (
            not podcast.published
            or podcast.access_type not in (AccessTypeEnum.PUBLIC, AccessTypeEnum.PAID)
        ):
            continue
        candidates.append(("podcast", podcast))

    if query:
        candidates = [
            (kind, resource)
            for kind, resource in candidates
            if query in (resource.name or "").lower()
            or query in (resource.description or "").lower()
        ]

    requested = normalize_locale(locale)
    course_translations = _course_translations_for(
        db_session,
        [resource for kind, resource in candidates if kind == "course"],  # type: ignore[misc]
        requested,
    )

    def _localized(kind: str, resource) -> tuple[str, str | None]:
        if kind != "course":
            return resource.name, resource.description
        translation = course_translations.get(int(resource.id)) if resource.id else None
        if not translation:
            return resource.name, resource.description
        return (
            translation.name or resource.name,
            translation.description
            if translation.description is not None
            else resource.description,
        )

    course_ids = [
        int(resource.id)  # type: ignore[arg-type]
        for kind, resource in candidates
        if kind == "course"
    ]
    podcast_ids = [
        int(resource.id)  # type: ignore[arg-type]
        for kind, resource in candidates
        if kind == "podcast"
    ]

    lesson_counts = dict(
        db_session.exec(
            select(Chapter.course_id, func.count(Activity.id))
            .join(ChapterActivity, ChapterActivity.chapter_id == Chapter.id)
            .join(Activity, Activity.id == ChapterActivity.activity_id)
            .where(Chapter.course_id.in_(course_ids))  # type: ignore[attr-defined]
            .group_by(Chapter.course_id)
        ).all()
    ) if course_ids else {}
    episode_counts = dict(
        db_session.exec(
            select(PodcastEpisode.podcast_id, func.count(PodcastEpisode.id))
            .where(PodcastEpisode.podcast_id.in_(podcast_ids))  # type: ignore[attr-defined]
            .group_by(PodcastEpisode.podcast_id)
        ).all()
    ) if podcast_ids else {}

    rows: list[CollectionCourseRead] = []
    for kind, resource in candidates:
        display_name, display_description = _localized(kind, resource)
        if kind == "podcast":
            podcast = resource  # type: ignore[assignment]
            rows.append(
                CollectionCourseRead(
                    id=int(podcast.id),  # type: ignore[arg-type]
                    resource_type="podcast",
                    resource_uuid=podcast.podcast_uuid,
                    course_uuid=None,
                    name=display_name,
                    description=display_description,
                    thumbnail_image=podcast.thumbnail_image,
                    access_type=podcast.access_type,
                    published=podcast.published,
                    price_amount=podcast.price_amount,
                    price_currency=podcast.price_currency,
                    lessons=int(episode_counts.get(podcast.id, 0)),
                    creation_date=podcast.creation_date,
                )
            )
            continue
        course = resource  # type: ignore[assignment]
        rows.append(
            CollectionCourseRead(
                id=int(course.id),  # type: ignore[arg-type]
                resource_type="course",
                resource_uuid=course.course_uuid,
                course_uuid=course.course_uuid,
                name=display_name,
                description=display_description,
                thumbnail_image=course.thumbnail_image,
                access_type=course.access_type,
                published=course.published,
                price_amount=course.price_amount,
                price_currency=course.price_currency,
                lessons=int(lesson_counts.get(course.id, 0)),
                creation_date=course.creation_date,
            )
        )

    rows.sort(key=lambda item: item.creation_date or "", reverse=True)
    return rows


async def get_collection_members_page(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
    filter_by: str = "linked",
    search: str = "",
    kind: str = "",
    status: str = "",
    page: int = 1,
    limit: int = 10,
    locale: str | None = None,
) -> CollectionMembersPage:
    collection = _get_collection_or_404(db_session, collection_uuid)

    await _check_catalog_read_access(request, db_session, current_user, collection)

    acting_user_id = resolve_acting_user_id(current_user)
    include_unpublished = _is_org_admin(
        db_session, int(collection.org_id), acting_user_id
    )

    query = search.strip().lower()
    if filter_by == "available":
        rows = _list_available_rows(
            db_session, collection, include_unpublished, query, locale
        )
    else:
        rows = _list_member_rows(
            db_session, collection, include_unpublished, query, locale
        )

    if kind in ("course", "podcast"):
        rows = [row for row in rows if row.resource_type == kind]
    if status == "published":
        rows = [row for row in rows if row.published]
    elif status == "draft":
        rows = [row for row in rows if not row.published]

    start = (page - 1) * limit
    return CollectionMembersPage(items=rows[start : start + limit], total=len(rows))


async def get_collection_courses(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
    search: str = "",
    page: int = 1,
    limit: int = 20,
    locale: str | None = None,
) -> List[CollectionCourseRead]:
    collection = _get_collection_or_404(db_session, collection_uuid)

    await _check_catalog_read_access(request, db_session, current_user, collection)

    acting_user_id = resolve_acting_user_id(current_user)
    include_unpublished = _is_org_admin(
        db_session, int(collection.org_id), acting_user_id
    )

    rows = _list_member_rows(
        db_session, collection, include_unpublished, search.strip().lower(), locale
    )
    start = (page - 1) * limit
    return rows[start : start + limit]


def _resource_type_from_uuid(resource_uuid: str) -> str:
    return "podcast" if resource_uuid.startswith("podcast_") else "course"


async def _resolve_member_resource(
    request: Request,
    db_session: Session,
    current_user: PublicUser,
    collection: Collection,
    resource_uuid: str,
) -> tuple[str, int]:
    """Validate that a course/podcast can join the collection.

    Returns ``(resource_type, database_id)``.
    """
    resource_type = _resource_type_from_uuid(resource_uuid)

    if resource_type == "podcast":
        podcast = db_session.exec(
            select(Podcast).where(Podcast.podcast_uuid == resource_uuid)
        ).first()
        if not podcast or int(podcast.org_id) != int(collection.org_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Podcast not found in this organization",
            )

        await check_resource_access(
            request, db_session, current_user, podcast.podcast_uuid, AccessAction.READ
        )

        if podcast.access_type == AccessTypeEnum.USERS_ONLY:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Private podcasts cannot be added to a collection",
            )

        return "podcast", int(podcast.id)  # type: ignore[arg-type]

    course = db_session.exec(
        select(Course).where(Course.course_uuid == resource_uuid)
    ).first()
    if not course or int(course.org_id) != int(collection.org_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found in this organization",
        )

    await check_resource_access(
        request, db_session, current_user, course.course_uuid, AccessAction.READ
    )

    if course.access_type == AccessTypeEnum.USERS_ONLY:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Private courses cannot be added to a collection",
        )

    return "course", int(course.id)  # type: ignore[arg-type]


async def add_resource_to_collection(
    request: Request,
    collection_uuid: str,
    resource_uuid: str,
    current_user: PublicUser,
    db_session: Session,
) -> CollectionRead:
    collection = _get_collection_or_404(db_session, collection_uuid)

    await check_resource_access(
        request, db_session, current_user, collection.collection_uuid, AccessAction.UPDATE
    )

    resource_type, resource_id = await _resolve_member_resource(
        request, db_session, current_user, collection, resource_uuid
    )

    already_member = db_session.exec(
        select(CollectionCourse).where(
            CollectionCourse.collection_id == collection.id,
            CollectionCourse.resource_uuid == resource_uuid,
        )
    ).first()
    if already_member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This item is already part of the collection",
        )

    db_session.add(
        CollectionCourse(
            collection_id=int(collection.id),  # type: ignore[arg-type]
            course_id=resource_id if resource_type == "course" else None,
            resource_type=resource_type,
            resource_uuid=resource_uuid,
            org_id=int(collection.org_id),
            creation_date=str(datetime.now()),
            update_date=str(datetime.now()),
        )
    )
    try:
        db_session.flush()
        # Publish rules apply immediately: a published bundle must not accept a
        # draft item just because it was added after publishing.
        _validate_publishable(db_session, collection)
    except HTTPException:
        db_session.rollback()
        raise

    collection.update_date = str(datetime.now())
    db_session.add(collection)
    db_session.commit()
    db_session.refresh(collection)

    return _build_read(db_session, collection, include_unpublished=True)


async def remove_resource_from_collection(
    request: Request,
    collection_uuid: str,
    resource_uuid: str,
    current_user: PublicUser,
    db_session: Session,
) -> CollectionRead:
    collection = _get_collection_or_404(db_session, collection_uuid)

    await check_resource_access(
        request, db_session, current_user, collection.collection_uuid, AccessAction.UPDATE
    )

    link = db_session.exec(
        select(CollectionCourse).where(
            CollectionCourse.collection_id == collection.id,
            CollectionCourse.resource_uuid == resource_uuid,
        )
    ).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This item is not part of this collection",
        )

    if (
        collection.access_type == AccessTypeEnum.PAID
        and _member_count(db_session, collection) == 1
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A paid collection must keep at least one item",
        )

    db_session.delete(link)
    collection.update_date = str(datetime.now())
    db_session.add(collection)
    db_session.commit()
    db_session.refresh(collection)

    return _build_read(db_session, collection, include_unpublished=True)


async def add_course_to_collection(
    request: Request,
    collection_uuid: str,
    course_uuid: str,
    current_user: PublicUser,
    db_session: Session,
) -> CollectionRead:
    return await add_resource_to_collection(
        request, collection_uuid, course_uuid, current_user, db_session
    )


async def remove_course_from_collection(
    request: Request,
    collection_uuid: str,
    course_uuid: str,
    current_user: PublicUser,
    db_session: Session,
) -> CollectionRead:
    return await remove_resource_from_collection(
        request, collection_uuid, course_uuid, current_user, db_session
    )


####################################################
# Misc
####################################################


async def get_collections(
    request: Request,
    org_id: str,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: Session,
    page: int = 1,
    limit: int = 10,
    locale: str | None = None,
) -> List[CollectionRead]:
    org_id_int = int(org_id)
    acting_user_id = resolve_acting_user_id(current_user)

    statement = select(Collection).where(Collection.org_id == org_id_int)

    if not _is_org_admin(db_session, org_id_int, acting_user_id):
        # Learners only see published collections. Restricted collections are
        # visible when the learner is a member of a linked UserGroup.
        usergroup_uuids = select(UserGroupResource.resource_uuid).join(
            UserGroupUser,
            UserGroupUser.usergroup_id == UserGroupResource.usergroup_id,
        ).where(UserGroupUser.user_id == acting_user_id)
        statement = statement.where(
            Collection.published == True,  # noqa: E712
            (
                Collection.access_type.in_(
                    [AccessTypeEnum.PUBLIC, AccessTypeEnum.PAID]
                )
                | Collection.collection_uuid.in_(usergroup_uuids)
            ),
        )

    statement = (
        statement.order_by(Collection.creation_date.desc())  # type: ignore[attr-defined]
        .offset((page - 1) * limit)
        .limit(limit)
    )
    collections = list(db_session.exec(statement).all())

    if not collections:
        return []

    collection_ids = [collection.id for collection in collections]
    include_unpublished = _is_org_admin(db_session, org_id_int, acting_user_id)

    # Batch fetch all courses for all collections in a single query
    batch_statement = (
        select(CollectionCourse, Course)
        .join(Course, CollectionCourse.course_id == Course.id)  # type: ignore[arg-type]
        .where(
            CollectionCourse.collection_id.in_(collection_ids),  # type: ignore[attr-defined]
            CollectionCourse.org_id == org_id_int,
        )
    )
    if not include_unpublished:
        batch_statement = batch_statement.where(
            Course.published == True,  # noqa: E712
            Course.access_type.in_(
                [AccessTypeEnum.PUBLIC, AccessTypeEnum.PAID]
            ),
        )

    batch_results = db_session.exec(batch_statement).all()

    # Member counts include podcasts, so listing cards report every item.
    member_counts = dict(
        db_session.exec(
            select(CollectionCourse.collection_id, func.count())
            .where(CollectionCourse.collection_id.in_(collection_ids))  # type: ignore[attr-defined]
            .group_by(CollectionCourse.collection_id)
        ).all()
    )

    # Group courses by collection_id, deduplicating
    collection_courses_map: dict[int, list[Course]] = {}
    seen: set[tuple[int, int]] = set()
    for cc, course in batch_results:
        key = (cc.collection_id, course.id)
        if key not in seen:
            seen.add(key)
            collection_courses_map.setdefault(cc.collection_id, []).append(course)

    collections_with_courses = []
    for collection in collections:
        courses = collection_courses_map.get(collection.id, [])
        collection_read = CollectionRead(
            **collection.model_dump(),
            courses=courses,
            member_count=int(member_counts.get(collection.id, 0)),
        )
        collections_with_courses.append(collection_read)

    return apply_collection_overlay_bulk(collections_with_courses, locale, db_session)
