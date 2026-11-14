"""One-shot migration: fill community translation rows with the fr/ar copy.

Run with:  python -m src.services.seed --seed-community-translations

Communities only carry two admin-authored fields (name and description), so
this backfills both on the rows that already exist and creates a row when a
locale is missing. Matching is by community name inside the demo organization,
so community UUIDs never change. Discussions are user-generated and are left
untouched.
"""

from __future__ import annotations

import sys

from sqlmodel import Session, select

from config.config import get_learnhouse_config
from src.core.events.database import engine
from src.db.communities.communities import Community
from src.db.communities.community_translations import CommunityTranslation
from src.db.organizations import Organization
from src.services.seed.generators.community import COMMUNITY_TRANSLATIONS

DEMO_ORG_SLUG = "demo"


def seed_community_translations() -> int:
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

        communities = session.exec(
            select(Community).where(Community.org_id == org.id)
        ).all()
        by_name = {community.name: community for community in communities}

        updated = 0
        created = 0
        skipped = 0

        for name, payload in COMMUNITY_TRANSLATIONS.items():
            community = by_name.get(name)
            if community is None:
                skipped += 1
                continue

            for locale, (translated_name, translated_description) in payload.items():
                row = session.exec(
                    select(CommunityTranslation).where(
                        CommunityTranslation.community_id == community.id,
                        CommunityTranslation.locale == locale,
                    )
                ).first()

                if row is None:
                    session.add(
                        CommunityTranslation(
                            community_id=int(community.id or 0),
                            locale=locale,
                            name=translated_name,
                            description=translated_description,
                            state="published",
                            source_updated_at=community.update_date,
                            translated_by=None,
                            creation_date=community.creation_date or "",
                            update_date=community.update_date or "",
                        )
                    )
                    created += 1
                    continue

                row.name = translated_name
                row.description = translated_description
                row.state = "published"
                updated += 1

        session.commit()

        print(
            "Community translations seeded: "
            f"{updated} updated, {created} created, {skipped} skipped"
        )
        return 0


if __name__ == "__main__":
    sys.exit(seed_community_translations())
