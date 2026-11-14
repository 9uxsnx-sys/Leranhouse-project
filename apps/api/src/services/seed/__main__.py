"""python -m src.services.seed --demo --reset
   python -m src.services.seed --seed-activity-translations
   python -m src.services.seed --seed-collection-translations
   python -m src.services.seed --seed-community-translations
   python -m src.services.seed --seed-podcast-translations
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from src.services.seed.runner import SeedError, run_demo_seed
from src.services.seed.seed_activity_translations import seed_activity_translations
from src.services.seed.seed_collection_translations import (
    seed_collection_translations,
)
from src.services.seed.seed_community_translations import (
    seed_community_translations,
)
from src.services.seed.seed_podcast_translations import (
    seed_podcast_translations,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="python -m src.services.seed",
        description="Fill the demo organization with realistic data.",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Required. Confirms you want to seed the demo organization.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete the existing demo org and everything in it before seeding.",
    )
    parser.add_argument(
        "--assets-dir",
        type=Path,
        default=None,
        help="Folder holding your images and optional mp3. Defaults to apps/api/seed-assets.",
    )
    parser.add_argument(
        "--seed-activity-translations",
        action="store_true",
        help="Inject Arabic translations into existing flagship video activities.",
    )
    parser.add_argument(
        "--seed-collection-translations",
        action="store_true",
        help=(
            "Backfill about/learnings/tags/metadata on the existing collection "
            "translation rows."
        ),
    )
    parser.add_argument(
        "--seed-community-translations",
        action="store_true",
        help="Backfill fr/ar name and description on the community rows.",
    )
    parser.add_argument(
        "--seed-podcast-translations",
        action="store_true",
        help="Backfill fr/ar about/tags on podcasts and translate all episodes.",
    )
    args = parser.parse_args()

    # ── Activity translation migration ──
    if args.seed_activity_translations:
        return seed_activity_translations()

    # ── Collection translation backfill ──
    if args.seed_collection_translations:
        return seed_collection_translations()

    # ── Community translation backfill ──
    if args.seed_community_translations:
        return seed_community_translations()

    # ── Podcast translation backfill ──
    if args.seed_podcast_translations:
        return seed_podcast_translations()

    # ── Full demo seed ──
    if not args.demo:
        parser.error("pass --demo to confirm the target")

    try:
        summary = run_demo_seed(reset=args.reset, assets_dir=args.assets_dir)
    except SeedError as error:
        print(f"\nSeed aborted: {error}")
        return 1

    print("\nDemo data ready")
    print("----------------")
    for key, value in summary.items():
        print(f"{key.replace('_', ' ').capitalize()}: {value}")

    print(
        "\nOpen /orgs/demo on the site and sign in as "
        f"{summary['owner_email']} with password {summary['password']}."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
