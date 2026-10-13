"""Row factories for the analytics query tests.

Each helper adds ORM rows to the session and returns the object. Nothing is
committed — the ``pg`` fixture rolls the transaction back — so a test can assert
exact numbers against a throwaway org without touching real data.

Identifiers that must be globally unique (org slug, username, email, resource
uuids) get a random suffix so a leftover row in the dev database can never
collide with the fixture.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from src.db.analytics_events import AnalyticsEvent
from src.db.communities.communities import Community
from src.db.communities.discussion_comments import DiscussionComment
from src.db.communities.discussion_reactions import DiscussionReaction
from src.db.communities.discussions import Discussion
from src.db.courses.activities import (
    Activity,
    ActivitySubTypeEnum,
    ActivityTypeEnum,
)
from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.chapters import Chapter
from src.db.courses.course_chapters import CourseChapter
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.podcasts.episodes import PodcastEpisode
from src.db.podcasts.podcasts import Podcast
from src.db.roles import Role
from src.db.trail_runs import StatusEnum, TrailRun, TrailRunEnum
from src.db.trail_steps import TrailStep
from src.db.trails import Trail
from src.db.user_organizations import UserOrganization
from src.db.users import User


def _token() -> str:
    return uuid.uuid4().hex[:10]


def now() -> datetime:
    return datetime.now(timezone.utc)


def days_ago(days: float = 0) -> datetime:
    return now() - timedelta(days=days)


def iso(moment: datetime) -> str:
    """ISO-8601 for the legacy VARCHAR date columns (they carry a time part)."""
    return moment.isoformat()


# ---------------------------------------------------------------------------
# Org / identity
# ---------------------------------------------------------------------------
def make_org(session: Session, name: str = "Analytics Test Org") -> Organization:
    token = _token()
    stamp = iso(days_ago(30))
    org = Organization(
        name=name,
        slug=f"analytics-{token}",
        email=f"org-{token}@test.dev",
        org_uuid=f"org_{token}",
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(org)
    session.flush()
    return org


def make_role(session: Session, org: Organization, name: str = "Admin") -> Role:
    role = Role(name=name, org_id=org.id, role_uuid=f"role_{_token()}")
    session.add(role)
    session.flush()
    return role


def make_user(
    session: Session,
    org: Organization,
    role: Role,
    *,
    first: str = "Alice",
    last: str = "Adams",
    verified: bool = True,
    joined: datetime | None = None,
) -> User:
    token = _token()
    user = User(
        username=f"u_{token}",
        first_name=first,
        last_name=last,
        email=f"{token}@test.dev",
        user_uuid=f"user_{token}",
        email_verified=verified,
        creation_date=iso(days_ago(30)),
        update_date=iso(days_ago(30)),
    )
    session.add(user)
    session.flush()
    joined_at = iso(joined or days_ago(10))
    session.add(
        UserOrganization(
            user_id=user.id,
            org_id=org.id,
            role_id=role.id,
            creation_date=joined_at,
            update_date=joined_at,
        )
    )
    session.flush()
    return user


# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------
def make_course(
    session: Session, org: Organization, *, name: str = "Course One"
) -> Course:
    stamp = iso(days_ago(20))
    course = Course(
        name=name,
        description="A test course",
        public=True,
        published=True,
        open_to_contributors=False,
        org_id=org.id,
        course_uuid=f"course_{_token()}",
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(course)
    session.flush()
    return course


def make_chapter(
    session: Session, org: Organization, course: Course, *, order: int = 1, name: str = "Chapter 1"
) -> Chapter:
    stamp = iso(days_ago(20))
    chapter = Chapter(
        name=name,
        org_id=org.id,
        course_id=course.id,
        chapter_uuid=f"chap_{_token()}",
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(chapter)
    session.flush()
    session.add(
        CourseChapter(
            order=order,
            course_id=course.id,
            chapter_id=chapter.id,
            org_id=org.id,
            creation_date=stamp,
            update_date=stamp,
        )
    )
    session.flush()
    return chapter


def make_activity(
    session: Session,
    org: Organization,
    course: Course,
    chapter: Chapter,
    *,
    order: int = 1,
    name: str = "Lesson",
    activity_type: ActivityTypeEnum = ActivityTypeEnum.TYPE_VIDEO,
    subtype: ActivitySubTypeEnum = ActivitySubTypeEnum.SUBTYPE_VIDEO_HOSTED,
) -> Activity:
    stamp = iso(days_ago(20))
    activity = Activity(
        name=name,
        activity_type=activity_type,
        activity_sub_type=subtype,
        content={},
        published=True,
        org_id=org.id,
        course_id=course.id,
        activity_uuid=f"act_{_token()}",
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(activity)
    session.flush()
    session.add(
        ChapterActivity(
            order=order,
            chapter_id=chapter.id,
            activity_id=activity.id,
            course_id=course.id,
            org_id=org.id,
            creation_date=stamp,
            update_date=stamp,
        )
    )
    session.flush()
    return activity


# ---------------------------------------------------------------------------
# Trails / runs / steps
# ---------------------------------------------------------------------------
def make_run(
    session: Session,
    org: Organization,
    user: User,
    *,
    course: Course | None = None,
    podcast: Podcast | None = None,
    status: StatusEnum = StatusEnum.STATUS_IN_PROGRESS,
    created: datetime | None = None,
) -> TrailRun:
    stamp = iso(days_ago(20))
    trail = Trail(
        org_id=org.id,
        user_id=user.id,
        trail_uuid=f"trail_{_token()}",
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(trail)
    session.flush()

    created_at = iso(created or days_ago(3))
    run = TrailRun(
        status=status,
        run_type=TrailRunEnum.RUN_TYPE_PODCAST if podcast else TrailRunEnum.RUN_TYPE_COURSE,
        trail_id=trail.id,
        course_id=course.id if course else None,
        podcast_id=podcast.id if podcast else None,
        org_id=org.id,
        user_id=user.id,
        creation_date=created_at,
        update_date=created_at,
    )
    session.add(run)
    session.flush()
    return run


def make_step(
    session: Session,
    org: Organization,
    run: TrailRun,
    *,
    activity: Activity | None = None,
    episode: PodcastEpisode | None = None,
    complete: bool = True,
    created: datetime | None = None,
) -> TrailStep:
    stamp = iso(created or days_ago(2))
    step = TrailStep(
        complete=complete,
        teacher_verified=False,
        grade="",
        trailrun_id=run.id,
        trail_id=run.trail_id,
        activity_id=activity.id if activity else None,
        course_id=activity.course_id if activity else None,
        episode_id=episode.id if episode else None,
        podcast_id=episode.podcast_id if episode else None,
        org_id=org.id,
        user_id=run.user_id,
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(step)
    session.flush()
    return step


# ---------------------------------------------------------------------------
# Behavioural events
# ---------------------------------------------------------------------------
def make_event(
    session: Session,
    org: Organization,
    *,
    name: str = "page_view",
    created: datetime | None = None,
    visitor: str = "visitor",
    session_key: str = "session",
    path: str | None = None,
    referrer: str | None = None,
    device: str | None = None,
    browser: str | None = None,
    duration_ms: int | None = None,
    properties: dict | None = None,
    user: User | None = None,
) -> AnalyticsEvent:
    event = AnalyticsEvent(
        org_id=org.id,
        user_id=user.id if user else None,
        visitor_id=visitor,
        session_id=session_key,
        event_name=name,
        path=path,
        referrer=referrer,
        device=device,
        browser=browser,
        duration_ms=duration_ms,
        properties=properties or {},
        created_at=created or days_ago(1),
    )
    session.add(event)
    session.flush()
    return event


# ---------------------------------------------------------------------------
# Podcasts
# ---------------------------------------------------------------------------
def make_podcast(session: Session, org: Organization, *, name: str = "Podcast") -> Podcast:
    stamp = iso(days_ago(20))
    podcast = Podcast(
        name=name,
        public=True,
        published=True,
        org_id=org.id,
        podcast_uuid=f"pod_{_token()}",
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(podcast)
    session.flush()
    return podcast


def make_episode(
    session: Session,
    org: Organization,
    podcast: Podcast,
    *,
    number: int = 1,
    title: str = "Episode",
    duration: int = 600,
    published: bool = True,
) -> PodcastEpisode:
    stamp = iso(days_ago(20))
    episode = PodcastEpisode(
        title=title,
        duration_seconds=duration,
        episode_number=number,
        published=published,
        order=number,
        podcast_id=podcast.id,
        org_id=org.id,
        episode_uuid=f"ep_{_token()}",
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(episode)
    session.flush()
    return episode


# ---------------------------------------------------------------------------
# Community
# ---------------------------------------------------------------------------
def make_community(
    session: Session, org: Organization, *, name: str = "Community"
) -> Community:
    stamp = iso(days_ago(20))
    community = Community(
        name=name,
        public=True,
        published=True,
        org_id=org.id,
        community_uuid=f"comm_{_token()}",
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(community)
    session.flush()
    return community


def make_discussion(
    session: Session,
    org: Organization,
    community: Community,
    author: User,
    *,
    title: str = "Discussion",
    label: str = "general",
    upvotes: int = 0,
    created: datetime | None = None,
) -> Discussion:
    stamp = iso(created or days_ago(2))
    discussion = Discussion(
        title=title,
        content="content",
        label=label,
        community_id=community.id,
        org_id=org.id,
        author_id=author.id,
        discussion_uuid=f"disc_{_token()}",
        upvote_count=upvotes,
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(discussion)
    session.flush()
    return discussion


def make_comment(
    session: Session,
    discussion: Discussion,
    author: User,
    *,
    content: str = "nice",
    created: datetime | None = None,
) -> DiscussionComment:
    stamp = iso(created or days_ago(1))
    comment = DiscussionComment(
        content=content,
        discussion_id=discussion.id,
        author_id=author.id,
        comment_uuid=f"cmt_{_token()}",
        creation_date=stamp,
        update_date=stamp,
    )
    session.add(comment)
    session.flush()
    return comment


def make_reaction(
    session: Session,
    discussion: Discussion,
    user: User,
    *,
    emoji: str = "+1",
    created: datetime | None = None,
) -> DiscussionReaction:
    reaction = DiscussionReaction(
        discussion_id=discussion.id,
        user_id=user.id,
        emoji=emoji,
        reaction_uuid=f"rx_{_token()}",
        creation_date=iso(created or days_ago(1)),
    )
    session.add(reaction)
    session.flush()
    return reaction
