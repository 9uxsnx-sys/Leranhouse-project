"""One-shot migration: fill collection translation rows with the full content.

Run with:  python -m src.services.seed --seed-collection-translations

The demo seed used to write only `name` + `description` on the fr/ar collection
rows, leaving `about`, `learnings`, `tags` and the translatable `extra_metadata`
keys in English. This backfills them on the rows that already exist and creates
a row when a locale is missing. Matching is by collection name inside the demo
organization, so collection UUIDs never change.
"""

from __future__ import annotations

import json
import sys

from sqlmodel import Session, select

from config.config import get_learnhouse_config
from src.core.events.database import engine
from src.db.collection_translations import CollectionTranslation
from src.db.collections import Collection
from src.db.organizations import Organization
from src.services.seed import copy as C
from src.services.seed.generators.collections import COLLECTION_SHARED, TRANSLATIONS

DEMO_ORG_SLUG = "demo"


def _learnings_payload(shared: dict) -> str:
    return json.dumps(
        [
            {"id": f"learning-{position}", "text": text, "emoji": emoji}
            for position, (text, emoji) in enumerate(shared["learnings"])
        ]
    )


def _extra_metadata(shared: dict, variant: str) -> dict:
    """Only display text is translated; counts and flags stay on the base row."""
    return {
        "requirements": json.dumps(
            [{"text": text} for text in shared[f"requirements_{variant}"]]
        ),
        "target_audience": shared[f"audience_{variant}"],
    }


def seed_collection_translations() -> int:
    if not get_learnhouse_config().general_config.development_mode:
        print(
            "Refusing to run: development mode is off. "
            "Set LEARNHOUSE_DEVELOPMENT_MODE=true first."
        )
        return 1

    with Session(engine) as session:
        org = session.exec(
            select(Organization).where(Organization.slug == DEMO_ORG_SLUG)
        ).first()
        if org is None:
            print(f"No '{DEMO_ORG_SLUG}' organization found. Nothing to do.")
            return 0

        collections = session.exec(
            select(Collection).where(Collection.org_id == org.id)
        ).all()
        by_name = {collection.name: collection for collection in collections}

        flagship_name = C.COLLECTIONS[0][0]
        updated = 0
        created = 0
        skipped = 0

        for name, payload in TRANSLATIONS.items():
            collection = by_name.get(name)
            if collection is None:
                skipped += 1
                continue

            variant = "flagship" if name == flagship_name else "default"

            for locale, (translated_name, description) in payload.items():
                shared = COLLECTION_SHARED[locale]
                row = session.exec(
                    select(CollectionTranslation).where(
                        CollectionTranslation.collection_id == collection.id,
                        CollectionTranslation.locale == locale,
                    )
                ).first()

                if row is None:
                    session.add(
                        CollectionTranslation(
                            collection_id=int(collection.id or 0),
                            locale=locale,
                            name=translated_name,
                            description=description,
                            about=shared[f"about_{variant}"],
                            learnings=_learnings_payload(shared),
                            tags=shared["tags"],
                            seo=None,
                            extra_metadata=_extra_metadata(shared, variant),
                            state="published",
                            source_updated_at=collection.update_date,
                            translated_by=None,
                            creation_date=collection.creation_date or "",
                            update_date=collection.update_date or "",
                        )
                    )
                    created += 1
                    continue

                row.name = translated_name
                row.description = description
                row.about = shared[f"about_{variant}"]
                row.learnings = _learnings_payload(shared)
                row.tags = shared["tags"]
                row.extra_metadata = _extra_metadata(shared, variant)
                updated += 1

        session.commit()

        print(
            "Collection translations seeded: "
            f"{updated} updated, {created} created, {skipped} skipped"
        )
        return 0


if __name__ == "__main__":
    sys.exit(seed_collection_translations())
