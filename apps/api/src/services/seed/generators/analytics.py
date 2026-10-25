"""Back dated analytics events so every chart has a real shape."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlmodel import select

from src.db.analytics_events import AnalyticsEvent
from src.db.podcasts.episodes import PodcastEpisode
from src.services.analytics import events as E
from src.services.seed.core import SeedContext

REFERRERS = [
    "",
    "",
    "",
    "https://www.google.com/",
    "https://www.facebook.com/",
    "https://www.instagram.com/",
    "https://www.linkedin.com/",
    "https://news.ycombinator.com/",
    "https://www.reddit.com/",
]

DEVICES = ["desktop", "desktop", "mobile", "mobile", "mobile", "tablet"]
BROWSERS = ["Chrome", "Chrome", "Safari", "Firefox", "Edge", "Samsung Internet"]

PATHS = [
    "/courses",
    "/collections",
    "/podcasts",
    "/communities",
    "/store",
    "/progress",
]

SEARCHES = [
    "figma auto layout",
    "design system",
    "react hooks",
    "sql joins",
    "portfolio review",
    "pandas groupby",
    "arabic typography",
    "accessibility checklist",
]


def create_analytics(ctx: SeedContext) -> None:
    activities = [a for a in ctx.activities if a.published]
    courses = [c for c in ctx.courses if c.published]
    episode_uuids = [
        row for row in ctx.session.exec(select(PodcastEpisode.episode_uuid)).all()
    ]

    batch: list[AnalyticsEvent] = []
    total_days = 180

    for day_offset in range(total_days, -1, -1):
        day_start = (ctx.now - timedelta(days=day_offset)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        growth = 1 + (total_days - day_offset) / total_days * 0.9
        weekday = day_start.weekday()
        weekend_factor = 0.55 if weekday >= 5 else 1.0
        volume = int(ctx.rng.gauss(52, 9) * growth * weekend_factor)
        volume = max(6, volume)

        for _ in range(volume):
            created = day_start + timedelta(
                seconds=ctx.rng.randint(0, 86399)
            )
            name = ctx.rng.choices(
                [
                    E.PAGE_VIEW,
                    E.COURSE_VIEW,
                    E.ACTIVITY_VIEW,
                    E.TIME_ON_ACTIVITY,
                    E.ACTIVITY_COMPLETED,
                    E.COURSE_ENROLLED,
                    E.COURSE_COMPLETED,
                    E.SEARCH_QUERY,
                    E.DISCUSSION_POSTED,
                    E.USER_SIGNED_UP,
                    E.CERTIFICATE_CLAIMED,
                ],
                weights=[58, 11, 12, 8, 4, 2, 1, 2, 1, 1, 1],
            )[0]

            student = ctx.rng.choice(ctx.students) if ctx.rng.random() < 0.82 else None
            properties: dict = {}

            if name == E.PAGE_VIEW:
                path = ctx.rng.choice(PATHS)
            elif name == E.SEARCH_QUERY:
                path = "/search"
                properties["query"] = ctx.rng.choice(SEARCHES)
            elif name == E.COURSE_VIEW and courses:
                course = ctx.rng.choice(courses)
                path = f"/course/{course.course_uuid.replace('course_', '')}"
                properties["course_uuid"] = course.course_uuid
            elif activities and name in (
                E.ACTIVITY_VIEW,
                E.TIME_ON_ACTIVITY,
                E.ACTIVITY_COMPLETED,
            ):
                activity = ctx.rng.choice(activities)
                path = f"/course/{ctx.org.slug}/activity/{activity.activity_uuid}"
                properties["activity_uuid"] = activity.activity_uuid
                properties["activity_type"] = activity.activity_type.value
                if ctx.rng.random() < 0.12 and episode_uuids:
                    properties["episode_uuid"] = ctx.rng.choice(episode_uuids)
                if name == E.TIME_ON_ACTIVITY:
                    properties["duration_ms"] = ctx.rng.randint(15_000, 900_000)
            else:
                path = ctx.rng.choice(PATHS)

            batch.append(
                AnalyticsEvent(
                    org_id=ctx.org_id,
                    user_id=int(student.id or 0) if student else None,
                    visitor_id=f"visitor_{uuid.uuid4().hex[:12]}",
                    session_id=f"session_{uuid.uuid4().hex[:10]}",
                    event_name=name,
                    path=path,
                    referrer=ctx.rng.choice(REFERRERS) if name == E.PAGE_VIEW else None,
                    device=ctx.rng.choice(DEVICES),
                    browser=ctx.rng.choice(BROWSERS),
                    duration_ms=properties.get("duration_ms"),
                    properties=properties,
                    created_at=created.replace(tzinfo=timezone.utc),
                )
            )

        if len(batch) >= 500:
            ctx.session.add_all(batch)
            ctx.session.commit()
            batch = []

    if batch:
        ctx.session.add_all(batch)
        ctx.session.commit()
