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
        collection = Collection(
            name=name,
            public=True,
            description=description,
            org_id=ctx.org_id,
            collection_uuid=collection_uuid,
            about=(
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
