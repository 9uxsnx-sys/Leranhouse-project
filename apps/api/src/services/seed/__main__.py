"""python -m src.services.seed --demo --reset"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from src.services.seed.runner import SeedError, run_demo_seed


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
    args = parser.parse_args()

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
