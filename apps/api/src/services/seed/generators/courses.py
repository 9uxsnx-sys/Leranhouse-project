"""Creates the catalogue: courses, the flagship curriculum, authors, updates."""

from __future__ import annotations

import json

from src.db.courses.activities import (
    Activity,
    ActivityLockType,
    ActivitySubTypeEnum,
    ActivityTypeEnum,
)
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.chapters import Chapter
from src.db.courses.course_chapters import CourseChapter
from src.db.courses.course_translations import CourseTranslation
from src.db.courses.course_updates import CourseUpdate
from src.db.courses.courses import Course, ThumbnailType
from src.db.payments.enums import AccessTypeEnum
from src.db.resource_authors import (
    ResourceAuthor,
    ResourceAuthorshipEnum,
    ResourceAuthorshipStatusEnum,
)
from src.services.seed import copy as C
from src.services.seed.core import SeedContext, iso, new_uuid, org_content_dir

YOUTUBE_URIS = [
    "https://www.youtube.com/watch?v=aircAruvnKk",
    "https://www.youtube.com/watch?v=fNk_zzaMoSs",
    "https://www.youtube.com/watch?v=kYB8IZa5AuE",
    "https://www.youtube.com/watch?v=WUvTyaaNkzM",
]

INTRO_LESSONS = [
    "How this course works",
    "What you need before we start",
]


def create_courses(ctx: SeedContext) -> None:
    base = org_content_dir(ctx.content_root, ctx.org_uuid) / "courses"

    for index, entry in enumerate(C.COURSES):
        course_uuid = new_uuid("course")
        course_dir = base / course_uuid

        if index == 0:
            # The flagship is the only course we open on camera, so it is the
            # only one that gets a hand picked cover and a banner. The artwork
            # is dropped into the assets folder under coding/ and at the root.
            thumbnail = ctx.named_image(
                course_dir / "thumbnails", "thumb", "coding/flagship course.jpg"
            )
            banner = ctx.named_image(course_dir / "banners", "banner", "banner.png")
        else:
            thumbnail = ctx.image(
                course_dir / "thumbnails", "thumb", C.COURSE_NICHES.get(entry["name"])
            )
            # Other course pages are never opened, so they keep no banner and
            # fall back to the cover on the detail page.
            banner = ""

        learnings = json.dumps(
            [
                {"id": f"learning-{position}", "text": text, "emoji": emoji}
                for position, (text, emoji) in enumerate(entry["learnings"])
            ]
        )

        # Card metadata. The listing and detail pages read difficulty, duration
        # and lessons_count from here, so leaving it null makes the cards look
        # empty even though the courses are fully populated.
        meta = C.COURSE_META.get(entry["name"], {})
        instructor = ctx.owner if index == 0 else ctx.teachers[index % len(ctx.teachers)]
        extra_metadata = {
            "difficulty": meta.get("difficulty", ""),
            "duration": meta.get("duration", ""),
            "video_hours": meta.get("video_hours", 0),
            "resources_count": meta.get("resources_count", 0),
            "has_certificate": meta.get("has_certificate", False),
            "requirements": json.dumps(
                [{"text": text} for text in meta.get("requirements", [])]
            ),
            "instructor": {
                "name": f"{instructor.first_name} {instructor.last_name}",
                "title": meta.get("instructor_title", "Instructor"),
                "bio": meta.get("instructor_bio", ""),
            },
            "target_audience": {
                "for": meta.get("audience_for", []),
                "not_for": meta.get("audience_not_for", []),
            },
            "lessons_count": meta.get("lessons_count", 0),
        }

        created = ctx.date_between(175, 20)
        course = Course(
            name=entry["name"],
            description=entry["description"],
            about=entry["about"],
            learnings=learnings,
            tags=entry["tags"],
            thumbnail_type=ThumbnailType.IMAGE,
            thumbnail_image=thumbnail,
            thumbnail_video="",
            banner_image=banner,
            public=True,
            published=not entry.get("draft", False),
            open_to_contributors=False,
            org_id=ctx.org_id,
            course_uuid=course_uuid,
            creation_date=iso(created),
            update_date=iso(created),
            access_type=AccessTypeEnum(entry["access"].lower()),
            price_amount=entry["price"],
            price_currency="DZD",
            source_locale="en",
            seo={
                "title": entry["name"],
                "description": entry["description"][:160],
                "keywords": entry["tags"],
                "robots_noindex": False,
                "robots_nofollow": False,
                "enable_jsonld": True,
            },
            extra_metadata=extra_metadata,
        )
        ctx.session.add(course)
        ctx.session.commit()
        ctx.session.refresh(course)
        ctx.courses.append(course)

        if index == 0:
            ctx.flagship = course

        _add_authors(ctx, course, index)
        _add_translation(ctx, course, entry)

    ctx.session.commit()
    _create_curriculum(ctx)
    _create_updates(ctx)


def _add_authors(ctx: SeedContext, course: Course, index: int) -> None:
    # The founder teaches the flagship, which keeps the instructor shown on the
    # course page in line with the backend subject.
    if index == 0 and ctx.owner is not None:
        author = ctx.owner
    else:
        author = ctx.teachers[index % len(ctx.teachers)]
    if index % 5 == 0 and ctx.teachers:
        second = ctx.teachers[(index + 1) % len(ctx.teachers)]
    else:
        second = None

    rows = [
        ResourceAuthor(
            resource_uuid=course.course_uuid,
            user_id=int(author.id or 0),
            authorship=ResourceAuthorshipEnum.CREATOR,
            authorship_status=ResourceAuthorshipStatusEnum.ACTIVE,
            creation_date=course.creation_date,
            update_date=course.creation_date,
        )
    ]
    if second is not None:
        rows.append(
            ResourceAuthor(
                resource_uuid=course.course_uuid,
                user_id=int(second.id or 0),
                authorship=ResourceAuthorshipEnum.CONTRIBUTOR,
                authorship_status=ResourceAuthorshipStatusEnum.ACTIVE,
                creation_date=course.creation_date,
                update_date=course.creation_date,
            )
        )
    ctx.session.add_all(rows)
    ctx.session.commit()


def _add_translation(ctx: SeedContext, course: Course, entry: dict) -> None:
    translations = C.COURSE_TRANSLATIONS.get(entry["name"])
    if not translations:
        return
    for locale, payload in translations.items():
        ctx.session.add(
            CourseTranslation(
                course_id=int(course.id or 0),
                locale=locale,
                name=payload["name"],
                description=payload["description"],
                about=payload["about"],
                learnings=course.learnings,
                tags=entry["tags"],
                seo=None,
                state="published",
                source_updated_at=course.update_date,
                translated_by=None,
                creation_date=iso(ctx.date_back(60)),
                update_date=iso(ctx.now),
            )
        )
    ctx.session.commit()


def _create_curriculum(ctx: SeedContext) -> None:
    course = ctx.flagship
    if course is None:
        return

    chapter_created = ctx.date_between(120, 90)
    intro_chapter = Chapter(
        name="Introduction",
        description="Two short videos before the weekly modules begin.",
        thumbnail_image=None,
        lock_type=ActivityLockType.PUBLIC,
        org_id=ctx.org_id,
        course_id=int(course.id or 0),
        chapter_uuid=new_uuid("chapter"),
        creation_date=iso(chapter_created),
        update_date=iso(chapter_created),
    )
    ctx.session.add(intro_chapter)
    ctx.session.commit()
    ctx.session.refresh(intro_chapter)

    _link_chapter(ctx, course, intro_chapter, 0)
    for order, title in enumerate(INTRO_LESSONS):
        _create_video_activity(ctx, course, intro_chapter, title, order)

    assignments = iter(C.ASSIGNMENTS)
    for module_order, (module_name, lessons) in enumerate(C.MODULES):
        chapter = Chapter(
            name=module_name,
            description=f"What we cover in {module_name.split(':')[0].lower()}.",
            thumbnail_image=None,
            lock_type=ActivityLockType.PUBLIC,
            org_id=ctx.org_id,
            course_id=int(course.id or 0),
            chapter_uuid=new_uuid("chapter"),
            creation_date=iso(chapter_created),
            update_date=iso(chapter_created),
        )
        ctx.session.add(chapter)
        ctx.session.commit()
        ctx.session.refresh(chapter)
        ctx.chapters.append(chapter)

        _link_chapter(ctx, course, chapter, module_order + 1)

        for order, lesson_title in enumerate(lessons):
            is_assignment_slot = order == 3 and module_order % 2 == 0
            if is_assignment_slot:
                assignment = next(assignments, None)
                if assignment is not None:
                    # Name the lesson after the assignment itself, otherwise the
                    # curriculum shows a video title on an assignment card.
                    _create_assignment_activity(ctx, course, chapter, assignment[0], order)
                    continue
            _create_video_activity(ctx, course, chapter, lesson_title, order)


def _link_chapter(ctx: SeedContext, course: Course, chapter: Chapter, order: int) -> None:
    ctx.session.add(
        CourseChapter(
            order=order,
            course_id=int(course.id or 0),
            chapter_id=int(chapter.id or 0),
            org_id=ctx.org_id,
            creation_date=chapter.creation_date,
            update_date=chapter.creation_date,
        )
    )
    ctx.session.commit()


def _create_video_activity(
    ctx: SeedContext, course: Course, chapter: Chapter, name: str, order: int
) -> None:
    activity_uuid = new_uuid("activity")
    created = ctx.date_between(110, 10)
    activity = Activity(
        name=name,
        activity_type=ActivityTypeEnum.TYPE_VIDEO,
        activity_sub_type=ActivitySubTypeEnum.SUBTYPE_VIDEO_YOUTUBE,
        content={
            "uri": YOUTUBE_URIS[len(ctx.activities) % len(YOUTUBE_URIS)],
            "type": "youtube",
            "activity_uuid": activity_uuid,
        },
        details={"startTime": 0, "endTime": None, "autoplay": False, "muted": False},
        extra_metadata=_lesson_sections(name),
        published=True,
        lock_type=ActivityLockType.PUBLIC,
        org_id=ctx.org_id,
        course_id=int(course.id or 0),
        activity_uuid=activity_uuid,
        creation_date=iso(created),
        update_date=iso(created),
        current_version=1,
        last_modified_by_id=None,
    )
    ctx.session.add(activity)
    ctx.session.commit()
    ctx.session.refresh(activity)
    ctx.activities.append(activity)

    ctx.session.add(
        ChapterActivity(
            order=order,
            chapter_id=int(chapter.id or 0),
            activity_id=int(activity.id or 0),
            course_id=int(course.id or 0),
            org_id=ctx.org_id,
            creation_date=iso(created),
            update_date=iso(created),
        )
    )
    ctx.session.commit()


def _vary_takeaways(blocks: list[dict], name: str) -> list[dict]:
    """Move one bullet between cards so the three blocks are not all the same size.

    The source blocks are authored with three bullets each. Rotating one bullet
    gives 2 / 4 / 3 on one lesson and 4 / 3 / 2 on the next, so a learner never
    sees the same template repeated down the page.
    """
    varied = [
        {**block, "items": list(block.get("items", []))} for block in blocks
    ]
    if len(varied) < 3 or any(len(block["items"]) < 3 for block in varied):
        return varied

    shift = sum(ord(character) for character in name) % 3
    source, target = [(0, 1), (1, 2), (2, 0)][shift]
    varied[target]["items"].append(varied[source]["items"].pop())
    return varied


def _lesson_sections(name: str) -> dict:
    """Page sections for one lesson, shaped the way the lesson page reads them."""
    sections = C.LESSON_SECTIONS.get(name, {})
    return {
        "learning_objectives": list(sections.get("objectives", [])),
        "takeaways": _vary_takeaways(sections.get("takeaways", []), name),
        "resources": list(sections.get("resources", [])),
        "knowledge_checks": list(sections.get("checks", [])),
    }


def _create_assignment_activity(
    ctx: SeedContext, course: Course, chapter: Chapter, name: str, order: int
) -> None:
    activity_uuid = new_uuid("activity")
    created = ctx.date_between(100, 10)
    activity = Activity(
        name=name,
        activity_type=ActivityTypeEnum.TYPE_ASSIGNMENT,
        activity_sub_type=ActivitySubTypeEnum.SUBTYPE_ASSIGNMENT_ANY,
        content={"activity_uuid": activity_uuid},
        details={},
        extra_metadata=_lesson_sections(name),
        published=True,
        lock_type=ActivityLockType.PUBLIC,
        org_id=ctx.org_id,
        course_id=int(course.id or 0),
        activity_uuid=activity_uuid,
        creation_date=iso(created),
        update_date=iso(created),
        current_version=1,
        last_modified_by_id=None,
    )
    ctx.session.add(activity)
    ctx.session.commit()
    ctx.session.refresh(activity)
    ctx.activities.append(activity)

    ctx.session.add(
        ChapterActivity(
            order=order,
            chapter_id=int(chapter.id or 0),
            activity_id=int(activity.id or 0),
            course_id=int(course.id or 0),
            org_id=ctx.org_id,
            creation_date=iso(created),
            update_date=iso(created),
        )
    )
    ctx.session.commit()


def _create_updates(ctx: SeedContext) -> None:
    published = [c for c in ctx.courses if c.published]
    if not published or ctx.flagship is None:
        return

    for index, (title, content) in enumerate(C.COURSE_UPDATES):
        # Most updates belong to the flagship so its page feels alive
        course = ctx.flagship if index < 18 else published[index % len(published)]
        created = ctx.date_between(150, 1)
        ctx.session.add(
            CourseUpdate(
                courseupdate_uuid=new_uuid("courseupdate"),
                title=title,
                content=content,
                course_id=int(course.id or 0),
                linked_activity_uuids=None,
                org_id=ctx.org_id,
                creation_date=iso(created),
                update_date=iso(created),
            )
        )
    ctx.session.commit()
