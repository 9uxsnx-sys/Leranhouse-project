"""Orchestrates the demo seed."""

from __future__ import annotations

import random
import sys
import time
from pathlib import Path

from sqlmodel import Session, func, select

from config.config import get_learnhouse_config
from src.core.events.database import engine
from src.db.analytics_events import AnalyticsEvent
from src.db.communities.discussions import Discussion
from src.db.courses.courses import Course
from src.db.notifications import Notification, NotificationRecipient
from src.db.payments.payment_orders import PaymentOrder
from src.db.podcasts.podcasts import Podcast
from src.db.trail_runs import TrailRun
from src.db.trail_steps import TrailStep
from src.db.users import User
from src.security.security import security_hash_password
from src.services.seed.assets import AssetPool
from src.services.seed.core import DEMO_PASSWORD, DEMO_SLUG, RANDOM_SEED, SeedContext
from src.services.seed.generators.analytics import create_analytics
from src.services.seed.generators.assignments import create_assignments
from src.services.seed.generators.collections import create_collections
from src.services.seed.generators.community import create_communities
from src.services.seed.generators.courses import create_courses
from src.services.seed.generators.notifications import create_notifications
from src.services.seed.generators.org import create_org
from src.services.seed.generators.payments import create_payments
from src.services.seed.generators.podcasts import create_podcasts
from src.services.seed.generators.progress import create_progress
from src.services.seed.generators.users import attach_group_resources, create_people
from src.services.seed.generators.webhooks import create_webhooks
from src.services.seed.reset import demo_org, reset_demo_org


class SeedError(RuntimeError):
    pass


def run_demo_seed(
    *,
    reset: bool = False,
    assets_dir: Path | None = None,
    content_root: Path | None = None,
) -> dict:
    started = time.time()

    if not get_learnhouse_config().general_config.development_mode:
        raise SeedError(
            "Refusing to seed: development mode is off. Set LEARNHOUSE_DEVELOPMENT_MODE=true first."
        )

    api_root = Path.cwd()
    assets_root = assets_dir or (api_root / "seed-assets")
    content_root = content_root or (api_root / "content")

    assets = AssetPool(assets_root, rng=random.Random(RANDOM_SEED + 1))
    if not assets.ready:
        print(
            f"No artwork in {assets_root}. Seeding without images, they can be filled later."
        )

    with Session(engine) as session:
        existing = demo_org(session)

        if existing and not reset:
            raise SeedError(
                f"The '{DEMO_SLUG}' org already exists. Run with --reset to wipe it and seed again."
            )

        if existing and reset:
            print("Removing the previous demo org and its rows")
            reset_demo_org(session, content_root)

        if demo_org(session) is not None:
            raise SeedError(
                "Reset did not clear the demo org. Stop here and inspect the database before trying again."
            )

        ctx = SeedContext(
            session=session,
            rng=random.Random(RANDOM_SEED),
            assets=assets,
            now=_now(),
            content_root=content_root,
            password_hash=security_hash_password(DEMO_PASSWORD),
        )

        steps = [
            ("Organization", lambda: create_org(ctx)),
            ("People and groups", lambda: create_people(ctx)),
            ("Courses", lambda: create_courses(ctx)),
            ("Collections", lambda: create_collections(ctx)),
            ("Communities", lambda: create_communities(ctx)),
            ("Podcasts", lambda: create_podcasts(ctx)),
            ("Group resources", lambda: attach_group_resources(ctx, _resource_pairs(ctx))),
            ("Enrollments and certificates", lambda: create_progress(ctx)),
            ("Assignments", lambda: create_assignments(ctx)),
            ("Payments", lambda: create_payments(ctx)),
            ("Notifications", lambda: create_notifications(ctx)),
            ("Webhooks", lambda: create_webhooks(ctx)),
            ("Analytics", lambda: create_analytics(ctx)),
        ]

        for label, action in steps:
            print(f"  {label}")
            action()

        summary = _summary(session, ctx)
        summary["images"] = assets.copied
        summary["seconds"] = round(time.time() - started, 1)

    _invalidate(api_root)
    return summary


def _now():
    from datetime import datetime

    return datetime.now()


def _resource_pairs(ctx: SeedContext) -> list[tuple[str, str]]:
    pairs = [(course.course_uuid, "course") for course in ctx.courses[:12]]
    pairs += [(podcast.podcast_uuid, "podcast") for podcast in ctx.podcasts[:8]]
    return pairs


def _summary(session: Session, ctx: SeedContext) -> dict:
    def count(model, *, org_scoped: bool = True) -> int:
        statement = select(func.count()).select_from(model)
        if org_scoped and hasattr(model, "org_id"):
            statement = statement.where(model.org_id == ctx.org_id)
        return int(session.exec(statement).one() or 0)

    return {
        "org": f"{ctx.org.name} ({ctx.org.slug})",
        "org_uuid": ctx.org_uuid,
        "owner_email": ctx.owner.email,
        "password": DEMO_PASSWORD,
        "users": count(User, org_scoped=False),
        "courses": count(Course),
        "discussions": count(Discussion),
        "podcasts": count(Podcast),
        "enrollments": count(TrailRun),
        "progress_steps": count(TrailStep),
        "orders": count(PaymentOrder),
        "notifications": count(Notification),
        "notification_deliveries": int(
            session.exec(
                select(func.count())
                .select_from(NotificationRecipient)
                .join(Notification, Notification.id == NotificationRecipient.notification_id)
                .where(Notification.org_id == ctx.org_id)
            ).one()
            or 0
        ),
        "analytics_events": count(AnalyticsEvent),
    }


def _invalidate(api_root: Path) -> None:
    try:
        sys.path.insert(0, str(api_root))
        from src.services.courses.cache import invalidate_courses_cache
        from src.services.orgs.cache import invalidate_org_cache

        invalidate_org_cache(DEMO_SLUG)
        invalidate_courses_cache(DEMO_SLUG)
    except Exception as error:  # pragma: no cover - cache is best effort
        print(f"Cache invalidation skipped: {error}")
