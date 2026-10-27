"""Collections (bundles) with their members and owners."""

from __future__ import annotations

import json

from src.db.collection_translations import CollectionTranslation
from src.db.collections import Collection
from src.db.collections_courses import CollectionCourse
from src.db.collection_users import CollectionUser
from src.db.courses.courses import ThumbnailType
from src.db.payments.enums import AccessTypeEnum
from src.services.seed import copy as C
from src.services.seed.core import SeedContext, iso, new_uuid, org_content_dir

COLLECTION_LEARNINGS = [
    ("Follow a path instead of picking random courses", "\U0001F5FA"),
    ("Save money compared to buying each course alone", "\U0001F4B0"),
    ("Finish with one portfolio ready project", "\U0001F4C4"),
]

TRANSLATIONS = {
    "Backend Starter Pack": {
        "fr": ("Pack backend debutant", "Commencez par le cours backend, puis SQL et les API. Quatre cours dans l ordre ou nous les enseignons."),
        "ar": ("حزمة الواجهة الخلفية للمبتدئين", "ابدا بدورة الواجهة الخلفية ثم SQL وواجهات البرمجة. اربع دورات بالترتيب الذي ندرسه."),
    },
    "Front End Track": {
        "fr": ("Parcours front end", "React, mobile et l API derriere. Les trois cours ensemble."),
        "ar": ("مسار الواجهات", "رياكت والموبايل وواجهة البرمجة خلفهما. الدورات الثلاث معا."),
    },
    "Data Track": {
        "fr": ("Parcours data", "Pandas et SQL sur les memes donnees, pour que les deux cours se repondent."),
        "ar": ("مسار البيانات", "بانداز و SQL على نفس البيانات حتى تتكامل الدورتان."),
    },
    "Everything Bundle": {
        "fr": ("Tout inclus", "Tous les cours et podcasts actuels. L option simple."),
        "ar": ("الحزمة الكاملة", "كل الدورات والبودكاست الحالية. الخيار الابسط."),
    },
}


def create_collections(ctx: SeedContext) -> None:
    published_courses = [course for course in ctx.courses if course.published]
    if not published_courses:
        return

    base = org_content_dir(ctx.content_root, ctx.org_uuid) / "collections"
    created_collections = []

    for index, (name, description, access, price) in enumerate(C.COLLECTIONS):
        collection_uuid = new_uuid("collection")
        collection_dir = base / collection_uuid
        created = ctx.date_between(145, 20)
        learnings = json.dumps(
            [
                {"id": f"learning-{position}", "text": text, "emoji": emoji}
                for position, (text, emoji) in enumerate(COLLECTION_LEARNINGS)
            ]
        )
        is_flagship = index == 0
        extra_metadata = (
            {
                "requirements": json.dumps([
                    {"text": "Python basics: functions, lists, dictionaries — enough to write and run a small script"},
                    {"text": "A computer with a stable internet connection"},
                    {"text": "Willingness to read error messages out loud"},
                    {"text": "No backend or Docker experience required — we start from zero"},
                ]),
                "difficulty": "Intermediate",
                "duration": "42h",
                "lessons_count": 0,
                "video_hours": 28,
                "resources_count": 12,
                "has_certificate": True,
                "target_audience": {
                    "for": [
                        "Python beginners who have written a few scripts and want to build real backend projects",
                        "Self-taught developers looking for a structured path through backend engineering",
                        "Career switchers moving into web development with some coding experience",
                    ],
                    "not_for": [
                        "Experienced backend engineers who already ship APIs in production",
                        "Complete programming beginners — take an intro to Python first",
                    ],
                },
            }
            if is_flagship
            else {
                "requirements": json.dumps([
                    {"text": "Basic computer skills and a stable internet connection"},
                    {"text": "A desire to learn something new"},
                ]),
                "target_audience": {
                    "for": [
                        "Learners who want a curated path instead of picking random courses",
                        "Students looking to save money compared to buying courses individually",
                    ],
                    "not_for": [
                        "Learners who only need a single course from the bundle",
                    ],
                },
            }
        )
        collection = Collection(
            name=name,
            public=True,
            description=description,
            org_id=ctx.org_id,
            collection_uuid=collection_uuid,
            extra_metadata=extra_metadata,
            about=(
                "This bundle exists because people kept asking which course to start with and in what order. "
                "We designed it as a single path through the four courses that matter most for backend work, "
                "with the same project running through all of them so you never have to start from scratch twice.\n\n"
                "The flagship course, Backend Engineering with Python, is the first and longest. It takes you from "
                "an empty folder to a running API with a real database, authentication, tests and deployment. "
                "The three courses that follow pick up where it leaves off. SQL That Answers Real Questions teaches "
                "you to query that database without guessing, and Backend APIs with FastAPI adds endpoints, "
                "middleware and the kind of error handling that survives a production deploy. The fourth course, "
                "Python for Everyday Automation, is lighter and works as a breather between the heavy weeks.\n\n"
                "We arranged the four courses in the order we teach them internally, which means each one assumes "
                "you finished the previous one. The SQL course queries the database you built in the flagship. "
                "The API course extends the same codebase. If you skip ahead, the exercises still work, but the "
                "context of the project file will not be as clear as it should be. Stick to the order for the "
                "first pass, then come back to any course individually later.\n\n"
                "Buy once and keep access to every update. We add new lessons to these courses as we record them, "
                "and the bundle price never changes after you purchase. If you already own one of the courses, "
                "the bundle price adjusts automatically so you never pay twice for the same content. The community "
                "channel stays open as long as you need it, and most people who finish the bundle stay to review "
                "each other's work long after.\n\n"
                "You need Python basics before you start: functions, lists, dictionaries, and the willingness to "
                "read an error message out loud. You do not need backend experience, Docker or a cloud account. "
                "If you have written a small script and were not entirely sure why it worked, you are exactly "
                "who this bundle is for. The tools are FastAPI, Postgres, SQLModel and pytest, all of which you "
                "will meet in most backend jobs around here."
            ) if is_flagship else (
                "A bundle we put together because people kept asking which courses to take first. "
                "Start at the top and work down, or jump to the part you need."
            ),
            learnings=learnings,
            tags="bundle, path, courses",
            thumbnail_type=ThumbnailType.IMAGE,
            thumbnail_image=(
                ctx.named_image(
                    collection_dir / "thumbnails",
                    "thumb",
                    "design/collection flasgship.jpg",
                )
                if index == 0
                else ctx.image(
                    collection_dir / "thumbnails",
                    "thumb",
                    C.COLLECTION_NICHES.get(name),
                )
            ),
            thumbnail_video="",
            banner_image=(
                ctx.named_image(
                    collection_dir / "banners", "banner", "collection banner.png"
                )
                if index == 0
                else ""
            ),
            published=index < 16,
            access_type=AccessTypeEnum(access.lower()),
            price_amount=price,
            price_currency="DZD",
            seo=None,
            source_locale="en",
            creation_date=iso(created),
            update_date=iso(created),
        )
        ctx.session.add(collection)
        ctx.session.commit()
        ctx.session.refresh(collection)
        created_collections.append(collection)

    ctx.collections = created_collections

    for index, collection in enumerate(created_collections[:16]):
        if index == 0 and ctx.flagship is not None:
            # The collection opened on camera always leads with the flagship
            # course, followed by the three courses the description mentions.
            wanted = [
                "Python for Everyday Automation",
                "SQL That Answers Real Questions",
                "Backend APIs with FastAPI",
            ]
            members = [ctx.flagship] + [
                course for name in wanted for course in published_courses if course.name == name
            ]
        else:
            members = ctx.rng.sample(
                published_courses, ctx.rng.randint(3, min(6, len(published_courses)))
            )
        for course in members:
            ctx.session.add(
                CollectionCourse(
                    collection_id=int(collection.id or 0),
                    course_id=int(course.id or 0),
                    org_id=ctx.org_id,
                    creation_date=iso(ctx.date_back(60)),
                    update_date=iso(ctx.now),
                    resource_type="course",
                    resource_uuid=course.course_uuid,
                )
            )
        for student in ctx.rng.sample(ctx.students, ctx.rng.randint(3, 7)):
            ctx.session.add(
                CollectionUser(
                    collection_id=int(collection.id or 0),
                    user_id=int(student.id or 0),
                    org_id=ctx.org_id,
                    creation_date=iso(ctx.date_back(50)),
                    update_date=iso(ctx.now),
                )
            )
    ctx.session.commit()

    for collection in created_collections:
        payload = TRANSLATIONS.get(collection.name)
        if not payload:
            continue
        for locale, (name, description) in payload.items():
            ctx.session.add(
                CollectionTranslation(
                    collection_id=int(collection.id or 0),
                    locale=locale,
                    name=name,
                    description=description,
                    about=collection.about,
                    learnings=collection.learnings,
                    tags=collection.tags,
                    seo=None,
                    state="published",
                    source_updated_at=collection.update_date,
                    translated_by=None,
                    creation_date=iso(ctx.date_back(30)),
                    update_date=iso(ctx.now),
                )
            )
    ctx.session.commit()
