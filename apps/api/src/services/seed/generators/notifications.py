"""Notification templates, notifications and their recipients."""

from __future__ import annotations

from src.db.notifications import Notification, NotificationRecipient, NotificationTemplate
from src.services.seed import copy as C
from src.services.seed.core import SeedContext, iso, new_uuid

TEMPLATE_OVERRIDES = [
    ("course_completed", "Learning Progress", "Course finished", "{{user_name}} completed {{course_name}}. Certificate is ready."),
    ("course_enrolled", "Learning Progress", "You are in", "Enrollment confirmed for {{course_name}}. The first lesson is short."),
    ("activity_completed", "Learning Progress", "Lesson done", "{{user_name}} finished {{activity_name}}."),
    ("assignment_graded", "Learning Progress", "Assignment graded", "Feedback is in for {{assignment_name}}."),
    ("certificate_claimed", "Learning Progress", "Certificate ready", "The certificate for {{course_name}} is ready to download."),
    ("course_published", "Course Lifecycle", "New course", "{{course_name}} just went live in the catalogue."),
    ("course_update_published", "Course Lifecycle", "Course updated", "{{course_name}} has a new update: {{title}}."),
    ("podcast_episode_created", "Content Management", "New episode", "{{podcast_name}} published a new episode."),
    ("discussion_posted", "Community", "New discussion", "{{user_name}} posted in {{community_name}}."),
    ("comment_created", "Community", "New reply", "Someone replied to {{title}}."),
    ("discussion_pinned", "Community", "Discussion pinned", "{{title}} is now pinned at the top."),
    ("usergroup_users_added", "Groups", "Group updated", "{{user_name}} joined {{group_name}}."),
]

TOPIC_BY_EVENT = {
    "activity_unlocked": "course_update_published",
    "course_completed": "course_completed",
    "discussion_reply": "comment_created",
    "live_session": "course_update_published",
    "course_updated": "course_update_published",
    "progress_milestone": "activity_completed",
    "podcast_episode": "podcast_episode_created",
    "assignment_graded": "assignment_graded",
    "discussion_reaction": "discussion_vote_cast",
    "course_enrolled": "course_enrolled",
    "profile_incomplete": "user_signed_up",
    "community_member": "usergroup_users_added",
    "payment_confirmed": "course_enrolled",
    "weekly_digest": "course_update_published",
    "discussion_pinned": "discussion_pinned",
    "assignment_deadline": "assignment_graded",
    "streak": "activity_completed",
    "course_published": "course_published",
    "moderation": "discussion_locked",
    "certificate_verified": "certificate_claimed",
    "welcome": "user_signed_up",
    "cart_reminder": "course_enrolled",
    "live_session_recording": "course_update_published",
    "discussion_trending": "discussion_posted",
}


def create_notifications(ctx: SeedContext) -> None:
    for event_type, category, title, body in TEMPLATE_OVERRIDES:
        ctx.session.add(
            NotificationTemplate(
                org_id=ctx.org_id,
                event_type=event_type,
                category=category,
                title_template=title,
                body_template=body,
                link_url=None,
                is_enabled=True,
                created_at=iso(ctx.date_between(180, 150)),
                updated_at=iso(ctx.now),
            )
        )
    ctx.session.commit()

    for index, (title, body, category, kind) in enumerate(C.NOTIFICATIONS):
        created = ctx.date_between(60, 0)
        notification = Notification(
            org_id=ctx.org_id,
            event_type=TOPIC_BY_EVENT.get(kind, "course_update_published"),
            category=category,
            params={"source": "seed", "kind": kind},
            link_url=None,
            created_at=iso(created),
            title=title,
            body=body,
            source="seed",
            language="en",
        )
        ctx.session.add(notification)
        ctx.session.commit()
        ctx.session.refresh(notification)

        audience = (
            ctx.rng.sample(ctx.students, ctx.rng.randint(40, 110))
            if index % 3
            else ctx.rng.sample(ctx.students, ctx.rng.randint(80, 150))
        )

        for student in audience:
            read = ctx.rng.random() < 0.65
            read_at = (
                created + (ctx.now - created) / 2
                if read
                else None
            )
            ctx.session.add(
                NotificationRecipient(
                    notification_id=int(notification.id or 0),
                    user_id=int(student.id or 0),
                    read_at=iso(read_at) if read_at else None,
                    muted_at=None,
                    created_at=iso(created),
                )
            )

        # Always deliver the recent ones to the owner so the bell is never empty
        if index >= len(C.NOTIFICATIONS) - 6:
            ctx.session.add(
                NotificationRecipient(
                    notification_id=int(notification.id or 0),
                    user_id=int(ctx.owner.id or 0),
                    read_at=None,
                    muted_at=None,
                    created_at=iso(created),
                )
            )

    ctx.session.commit()
