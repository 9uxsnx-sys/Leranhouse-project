"""One-shot migration: inject translations into existing video activities.

Run with:  python -m src.services.seed --seed-activity-translations

This finds the flagship course (Backend Engineering with Python) and updates
every TYPE_VIDEO activity whose English name matches an entry in
ACTIVITY_TRANSLATIONS, writing all locale blocks (ar, fr, etc.) into
extra_metadata.translations.
"""

from __future__ import annotations

import sys
from pathlib import Path

from sqlmodel import Session, select

from config.config import get_learnhouse_config
from src.core.events.database import engine
from src.db.courses.activities import Activity, ActivityTypeEnum
from src.db.courses.courses import Course

# The seed data module — its ACTIVITY_TRANSLATIONS dict is the source of truth.
from src.services.seed import copy as C


def seed_activity_translations() -> int:
    if not get_learnhouse_config().general_config.development_mode:
        print(
            "Refusing to run: development mode is off. "
            "Set LEARNHOUSE_DEVELOPMENT_MODE=true first."
        )
        return 1

    flagships = ("Backend Engineering with Python",)

    with Session(engine) as session:
        courses = session.exec(
            select(Course).where(Course.name.in_(flagships))
        ).all()

        if not courses:
            print("No flagship course found. Nothing to do.")
            return 0

        updated = 0
        skipped = 0

        for course in courses:
            activities = session.exec(
                select(Activity).where(
                    Activity.course_id == course.id,
                    Activity.activity_type == ActivityTypeEnum.TYPE_VIDEO,
                )
            ).all()

            for activity in activities:
                locales = C.ACTIVITY_TRANSLATIONS.get(activity.name)
                if locales is None:
                    skipped += 1
                    continue

                meta = dict(activity.extra_metadata or {})
                translations = dict(meta.get("translations", {}))
                for locale_key, locale_data in locales.items():
                    translations[locale_key] = locale_data
                meta["translations"] = translations
                activity.extra_metadata = meta
                updated += 1

            session.commit()

        print(f"Activity translations seeded: {updated} updated, {skipped} skipped")
        return 0


if __name__ == "__main__":
    sys.exit(seed_activity_translations())
