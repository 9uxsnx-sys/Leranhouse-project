"""
Notification service — in-app notification feed.

Single entry point ``notify()`` that every feature calls instead of writing
notification rows directly. Audience rules map event types to recipient user
IDs, so one event can notify many users without each feature knowing about
the notification system.
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Callable, List, Optional

from sqlmodel import Session, select, func, or_
from sqlmodel.sql.expression import SelectOfScalar

from src.db.notifications import Notification, NotificationRecipient
from src.db.users import User
from src.db.trail_runs import TrailRun
from src.db.courses.courses import Course
from src.db.user_organizations import UserOrganization
from src.security.rbac.constants import ADMIN_ROLE_ID

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Audience rule — maps an event type to the list of user IDs who should see it
# ---------------------------------------------------------------------------


@dataclass
class AudienceRule:
    category: str
    resolve: Callable[[dict, Session], List[int]]


def _resolve_enrolled_student(data: dict, db_session: Session) -> List[int]:
    """Return the student user_id from course_enrolled / course_completed data."""
    user_id = data.get("user_id")
    if user_id:
        return [int(user_id)]
    # Fallback: look up by user_uuid
    user_data = data.get("user", {})
    user_uuid = user_data.get("user_uuid", "")
    if user_uuid:
        user = db_session.exec(
            select(User).where(User.user_uuid == user_uuid)
        ).first()
        if user and user.id:
            return [user.id]
    return []


def _resolve_assignment_student(data: dict, db_session: Session) -> List[int]:
    """Return the student user_id from assignment_graded data."""
    user_id = data.get("user_id")
    if user_id:
        return [int(user_id)]
    # Fallback: look up from user sub-object
    user_data = data.get("user", {})
    user_uuid = user_data.get("user_uuid", "")
    if user_uuid:
        user = db_session.exec(
            select(User).where(User.user_uuid == user_uuid)
        ).first()
        if user and user.id:
            return [user.id]
    return []


def _resolve_certificate_student(data: dict, db_session: Session) -> List[int]:
    """Return the student who claimed the certificate."""
    user_id = data.get("user_id")
    if user_id:
        return [int(user_id)]
    # Fallback: look up by user_uuid
    user_data = data.get("user", {})
    user_uuid = user_data.get("user_uuid", "")
    if user_uuid:
        user = db_session.exec(
            select(User).where(User.user_uuid == user_uuid)
        ).first()
        if user and user.id:
            return [user.id]
    return []


def _resolve_course_enrolled_users(data: dict, db_session: Session) -> List[int]:
    """Return all user IDs enrolled in a course (for course_updated events)."""
    course_uuid = data.get("course_uuid", "")
    if not course_uuid:
        return []
    course = db_session.exec(
        select(Course).where(Course.course_uuid == course_uuid)
    ).first()
    if not course or not course.id:
        return []
    rows = db_session.exec(
        select(TrailRun.user_id).where(
            TrailRun.course_id == course.id,
            TrailRun.org_id == course.org_id,
        )
    ).all()
    return [r for r in rows if r is not None]


def _resolve_community_members(data: dict, db_session: Session) -> List[int]:
    """Placeholder: return empty list until community membership queries are wired."""
    return []


# ---------------------------------------------------------------------------
# New audience resolvers for all event types
# ---------------------------------------------------------------------------


def _resolve_user_from_data(data: dict, db_session: Session) -> List[int]:
    """Extract user_id from data, either direct or via user.user_uuid."""
    user_id = data.get("user_id")
    if user_id:
        return [int(user_id)]
    user_data = data.get("user", {})
    user_uuid = user_data.get("user_uuid", "")
    if user_uuid:
        user = db_session.exec(select(User).where(User.user_uuid == user_uuid)).first()
        if user and user.id:
            return [user.id]
    return []


def _resolve_user_id_direct(data: dict, db_session: Session) -> List[int]:
    """Return user_id directly from data."""
    user_id = data.get("user_id")
    if user_id:
        return [int(user_id)]
    return []


def _resolve_org_admins(data: dict, db_session: Session) -> List[int]:
    """Return all admin user IDs for the org referenced in data."""
    org_id = data.get("org_id")
    if not org_id:
        return []
    rows = db_session.exec(
        select(UserOrganization.user_id).where(
            UserOrganization.org_id == int(org_id),
            UserOrganization.role_id == ADMIN_ROLE_ID,
        )
    ).all()
    return [r for r in rows if r is not None]


def _resolve_added_contributors(data: dict, db_session: Session) -> List[int]:
    """Return user IDs from course_contributor_added/removed data."""
    contributors = data.get("contributors", [])
    if not contributors:
        return []
    ids = []
    for c in contributors:
        if isinstance(c, dict):
            uid = c.get("user_id") or c.get("id")
            if uid:
                ids.append(int(uid))
        elif isinstance(c, int):
            ids.append(c)
    return ids


def _resolve_usergroup_members(data: dict, db_session: Session) -> List[int]:
    """Return user IDs from usergroup_users_added data."""
    user_ids = data.get("user_ids", [])
    if not user_ids:
        return []
    return [int(uid) for uid in user_ids if uid]


def _resolve_usergroup_users(data: dict, db_session: Session) -> List[int]:
    """Return all members of a user group."""
    usergroup_uuid = data.get("usergroup_uuid", "")
    usergroup_id = data.get("usergroup_id")
    if not usergroup_uuid and not usergroup_id:
        return []
    from src.db.usergroup_user import UserGroupUser
    if usergroup_id:
        rows = db_session.exec(
            select(UserGroupUser.user_id).where(
                UserGroupUser.usergroup_id == int(usergroup_id)
            )
        ).all()
    else:
        from src.db.usergroups import UserGroup
        ug = db_session.exec(
            select(UserGroup).where(UserGroup.usergroup_uuid == usergroup_uuid)
        ).first()
        if not ug or not ug.id:
            return []
        rows = db_session.exec(
            select(UserGroupUser.user_id).where(
                UserGroupUser.usergroup_id == ug.id
            )
        ).all()
    return [r for r in rows if r is not None]


def _resolve_board_creator(data: dict, db_session: Session) -> List[int]:
    """Return the creator of a board/playground."""
    created_by = data.get("created_by")
    if created_by:
        return [int(created_by)]
    return []


def _resolve_discussion_author(data: dict, db_session: Session) -> List[int]:
    """Return the author of a discussion (for comment_created)."""
    from src.db.communities.discussions import Discussion
    discussion_data = data.get("discussion", {})
    discussion_uuid = discussion_data.get("discussion_uuid", "")
    if not discussion_uuid:
        return []
    discussion = db_session.exec(
        select(Discussion).where(Discussion.discussion_uuid == discussion_uuid)
    ).first()
    if discussion and discussion.user_id:
        return [discussion.user_id]
    return []


def _resolve_course_creator(data: dict, db_session: Session) -> List[int]:
    """Return the creator of a course."""
    course_uuid = data.get("course_uuid", "")
    if not course_uuid:
        return []
    course = db_session.exec(
        select(Course).where(Course.course_uuid == course_uuid)
    ).first()
    if course and course.created_by_user_id:
        return [course.created_by_user_id]
    return []


# ---------------------------------------------------------------------------
# Registry — each event type that produces notifications needs a rule here.
# Events without a rule silently produce zero notifications.
# ---------------------------------------------------------------------------

AUDIENCE_RULES: dict[str, AudienceRule] = {
    # ── System ───────────────────────────────────────────────────────
    "ping": AudienceRule(category="System", resolve=lambda d, s: []),
    # ── Learning progress ────────────────────────────────────────────
    "course_completed": AudienceRule(
        category="Learning Progress",
        resolve=_resolve_enrolled_student,
    ),
    "course_enrolled": AudienceRule(
        category="Learning Progress",
        resolve=_resolve_enrolled_student,
    ),
    "activity_completed": AudienceRule(
        category="Learning Progress",
        resolve=_resolve_user_from_data,
    ),
    "assignment_submitted": AudienceRule(
        category="Learning Progress",
        resolve=_resolve_user_from_data,
    ),
    "assignment_graded": AudienceRule(
        category="Learning Progress",
        resolve=_resolve_assignment_student,
    ),
    "certificate_claimed": AudienceRule(
        category="Learning Progress",
        resolve=_resolve_certificate_student,
    ),
    # ── User & access ────────────────────────────────────────────────
    "user_signed_up": AudienceRule(
        category="User & Access",
        resolve=_resolve_user_from_data,
    ),
    "user_email_verified": AudienceRule(
        category="User & Access",
        resolve=_resolve_user_id_direct,
    ),
    "user_role_changed": AudienceRule(
        category="User & Access",
        resolve=_resolve_user_id_direct,
    ),
    "user_invited_to_org": AudienceRule(
        category="User & Access",
        resolve=_resolve_org_admins,
    ),
    "user_removed_from_org": AudienceRule(
        category="User & Access",
        resolve=_resolve_user_id_direct,
    ),
    # ── Course lifecycle ─────────────────────────────────────────────
    "course_created": AudienceRule(
        category="Course Lifecycle",
        resolve=_resolve_org_admins,
    ),
    "course_published": AudienceRule(
        category="Course Lifecycle",
        resolve=_resolve_course_enrolled_users,
    ),
    "course_deleted": AudienceRule(
        category="Course Lifecycle",
        resolve=_resolve_course_creator,
    ),
    "course_update_published": AudienceRule(
        category="Course Lifecycle",
        resolve=_resolve_course_enrolled_users,
    ),
    # ── Content management ───────────────────────────────────────────
    "activity_version_created": AudienceRule(
        category="Content Management",
        resolve=_resolve_user_id_direct,
    ),
    "activity_version_restored": AudienceRule(
        category="Content Management",
        resolve=_resolve_user_id_direct,
    ),
    "course_contributor_added": AudienceRule(
        category="Content Management",
        resolve=_resolve_added_contributors,
    ),
    "course_contributor_removed": AudienceRule(
        category="Content Management",
        resolve=_resolve_added_contributors,
    ),
    "collection_created": AudienceRule(
        category="Content Management",
        resolve=_resolve_org_admins,
    ),
    "podcast_episode_created": AudienceRule(
        category="Content Management",
        resolve=_resolve_org_admins,
    ),
    # ── Collaboration ────────────────────────────────────────────────
    "board_created": AudienceRule(
        category="Collaboration",
        resolve=_resolve_board_creator,
    ),
    "board_member_added": AudienceRule(
        category="Collaboration",
        resolve=_resolve_user_id_direct,
    ),
    "playground_created": AudienceRule(
        category="Collaboration",
        resolve=_resolve_board_creator,
    ),
    # ── Community ────────────────────────────────────────────────────
    "discussion_posted": AudienceRule(
        category="Community",
        resolve=_resolve_user_from_data,
    ),
    "comment_created": AudienceRule(
        category="Community",
        resolve=_resolve_discussion_author,
    ),
    "discussion_pinned": AudienceRule(
        category="Community",
        resolve=_resolve_community_members,
    ),
    "discussion_locked": AudienceRule(
        category="Community",
        resolve=_resolve_community_members,
    ),
    "discussion_vote_cast": AudienceRule(
        category="Community",
        resolve=_resolve_community_members,
    ),
    # ── Groups ───────────────────────────────────────────────────────
    "usergroup_created": AudienceRule(
        category="Groups",
        resolve=_resolve_org_admins,
    ),
    "usergroup_deleted": AudienceRule(
        category="Groups",
        resolve=_resolve_org_admins,
    ),
    "usergroup_users_added": AudienceRule(
        category="Groups",
        resolve=_resolve_usergroup_members,
    ),
    "usergroup_resources_added": AudienceRule(
        category="Groups",
        resolve=_resolve_usergroup_users,
    ),
    # ── Subscriptions ────────────────────────────────────────────────
    "pack_activated": AudienceRule(
        category="Subscriptions",
        resolve=_resolve_org_admins,
    ),
    "pack_deactivated": AudienceRule(
        category="Subscriptions",
        resolve=_resolve_org_admins,
    ),
    # ── Org administration ───────────────────────────────────────────
    "org_signup_method_changed": AudienceRule(
        category="Organization",
        resolve=_resolve_org_admins,
    ),
    "org_ai_config_changed": AudienceRule(
        category="Organization",
        resolve=_resolve_org_admins,
    ),
    "org_payments_config_changed": AudienceRule(
        category="Organization",
        resolve=_resolve_org_admins,
    ),
}


def _audience_description(rule) -> str:
    """Return a short human string describing the audience of a rule."""
    resolve_name = rule.resolve.__name__ if hasattr(rule.resolve, "__name__") else ""
    descriptions = {
        "_resolve_enrolled_student": "The enrolled student",
        "_resolve_assignment_student": "The graded student",
        "_resolve_certificate_student": "The certificate recipient",
        "_resolve_course_enrolled_users": "All enrolled users",
        "_resolve_community_members": "Community members",
        "_resolve_user_from_data": "The user involved",
        "_resolve_user_id_direct": "The affected user",
        "_resolve_org_admins": "Organization administrators",
        "_resolve_added_contributors": "The added or removed contributors",
        "_resolve_usergroup_members": "The added group members",
        "_resolve_usergroup_users": "All group members",
        "_resolve_board_creator": "The creator",
        "_resolve_discussion_author": "The discussion author",
        "_resolve_course_creator": "The course creator",
    }
    return descriptions.get(resolve_name, "Custom rule")


def get_recipients_for_event(event_name: str, data: dict, db_session: Session) -> List[int]:
    """Return the list of user IDs who should receive a notification for this event."""
    rule = AUDIENCE_RULES.get(event_name)
    if rule is None:
        return []
    return rule.resolve(data, db_session)


# ---------------------------------------------------------------------------
# Write
# ---------------------------------------------------------------------------


def create_notification(
    org_id: int,
    event_type: str,
    category: str,
    params: dict,
    recipient_user_ids: List[int],
    link_url: Optional[str] = None,
    title: Optional[str] = None,
    body: Optional[str] = None,
    source: Optional[str] = None,
    language: Optional[str] = None,
    db_session: Optional[Session] = None,
) -> Optional[Notification]:
    """
    Write one ``Notification`` row and N ``NotificationRecipient`` rows.

    If ``db_session`` is provided the caller is responsible for committing;
    otherwise a new session is opened and committed immediately (the
    fire-and-forget path).
    """
    now = str(datetime.now())

    notification = Notification(
        org_id=org_id,
        event_type=event_type,
        category=category,
        params=params,
        link_url=link_url,
        title=title,
        body=body,
        source=source or ("system" if event_type != "announcement" else "announcement"),
        language=language or "en",
        created_at=now,
    )

    if db_session is not None:
        db_session.add(notification)
        db_session.flush()
        _add_recipients(notification, recipient_user_ids, now, db_session)
        return notification

    # Fire-and-forget: own session
    from src.core.events.database import engine

    own_session = Session(engine)
    try:
        own_session.add(notification)
        own_session.flush()
        _add_recipients(notification, recipient_user_ids, now, own_session)
        own_session.commit()
        return notification
    except Exception:
        logger.exception("Failed to create notification for %s", event_type)
        own_session.rollback()
        return None
    finally:
        own_session.close()


def _add_recipients(
    notification: Notification,
    user_ids: List[int],
    now: str,
    db_session: Session,
) -> None:
    """Bulk-insert recipient rows for a notification."""
    for uid in user_ids:
        db_session.add(
            NotificationRecipient(
                notification_id=notification.id,
                user_id=uid,
                created_at=now,
            )
        )


# ---------------------------------------------------------------------------
# The single entry point
# ---------------------------------------------------------------------------


def notify(
    event_name: str,
    org_id: int,
    data: dict,
    db_session: Optional[Session] = None,
    language: str = "en",
) -> None:
    """
    Single entry point for all in-app notifications.

    Resolves the audience for *event_name*, resolves and renders the
    notification template, writes the notification rows, and returns.
    This is deliberately fire-and-forget — the caller never blocks on
    notification delivery.

    Call this from existing ``dispatch_webhooks()`` call sites instead of
    (or alongside) the webhook fan-out.

    The *language* parameter selects the built-in template dictionary
    for rendering. Defaults to ``"en"``. Supported: ``"en"``, ``"fr"``, ``"ar"``.
    """
    from src.services.notifications.templates import render_notification

    rule = AUDIENCE_RULES.get(event_name)
    if rule is None:
        return

    user_ids = rule.resolve(data, db_session)
    if not user_ids:
        return

    # Build params from the event data — strip sensitive fields
    params = _build_params(event_name, data)

    # Resolve and render the template (title + body snapshot)
    title, body, category, link_url, is_enabled = render_notification(
        org_id, event_name, params, db_session, language=language
    )
    if not is_enabled:
        return

    create_notification(
        org_id=org_id,
        event_type=event_name,
        category=category or rule.category,
        params=params,
        recipient_user_ids=user_ids,
        link_url=link_url,
        title=title,
        body=body,
        source="system",
        language=language,
        db_session=db_session,
    )


def _build_params(event_name: str, data: dict) -> dict:
    """Extract user-facing params from event data. Never stores passwords or tokens."""
    params: dict = {}

    # Common keys used by multiple event types
    for key in ("course", "assignment", "certificate", "discussion", "community", "board"):
        if key in data:
            params[key] = data[key]

    if "grade" in data:
        params["grade"] = data["grade"]
    if "max_grade" in data:
        params["max_grade"] = data["max_grade"]
    if "percentage" in data:
        params["percentage"] = data["percentage"]
    if "letter_grade" in data:
        params["letter_grade"] = data["letter_grade"]
    if "display_grade" in data:
        params["display_grade"] = data["display_grade"]

    if "course_uuid" in data:
        params["course_uuid"] = data["course_uuid"]
    if "course_name" in data:
        params["course_name"] = data["course_name"]
    elif "name" in data:
        params["course_name"] = data["name"]

    # User info
    user_data = data.get("user", {})
    if isinstance(user_data, dict):
        if "first_name" in user_data:
            params["first_name"] = user_data["first_name"]
        if "username" in user_data:
            params["username"] = user_data["username"]

    # Collection name
    if "name" in data and "course_name" not in params:
        params["name"] = data["name"]

    # Podcast episode info
    if "title" in data:
        params["title"] = data["title"]
    if "episode_number" in data:
        params["episode_number"] = data["episode_number"]

    # Pack info
    if "pack_type" in data:
        params["pack_type"] = data["pack_type"]

    # Org info
    if "signup_mechanism" in data:
        params["signup_method"] = data["signup_mechanism"]

    # Activity info
    activity_data = data.get("activity", {})
    if isinstance(activity_data, dict):
        params["activity_type"] = activity_data.get("activity_type", "")

    return params


# ---------------------------------------------------------------------------
# Read / feed
# ---------------------------------------------------------------------------

FEED_PAGE_SIZE = 20


def get_notification_feed(
    user_id: int,
    org_id: int,
    page: int = 1,
    limit: int = FEED_PAGE_SIZE,
    db_session: Optional[Session] = None,
) -> dict:
    """
    Return a paginated feed of notifications for a user.

    Returns ``{"notifications": [...], "total": int, "page": int, "pages": int}``.
    """
    from src.core.events.database import engine

    own_session = db_session or Session(engine)
    try:
        # Count total
        count_q = (
            select(func.count())
            .select_from(NotificationRecipient)
            .join(
                Notification,
                NotificationRecipient.notification_id == Notification.id,
            )
            .where(
                NotificationRecipient.user_id == user_id,
                Notification.org_id == org_id,
                NotificationRecipient.muted_at.is_(None),
            )
        )
        total = own_session.exec(count_q).one()

        # Fetch page
        offset = (page - 1) * limit
        rows = own_session.exec(
            select(NotificationRecipient, Notification)
            .join(
                Notification,
                NotificationRecipient.notification_id == Notification.id,
            )
            .where(
                NotificationRecipient.user_id == user_id,
                Notification.org_id == org_id,
                NotificationRecipient.muted_at.is_(None),
            )
            .order_by(Notification.created_at.desc())  # type: ignore
            .offset(offset)
            .limit(limit)
        ).all()

        notifications = []
        for recipient, note in rows:
            notifications.append(
                {
                    "id": recipient.id,
                    "notification_id": note.id,
                    "event_type": note.event_type,
                    "category": note.category,
                    "title": note.title,
                    "body": note.body,
                    "source": note.source,
                    "params": note.params,
                    "link_url": note.link_url,
                    "read_at": recipient.read_at,
                    "created_at": note.created_at,
                }
            )

        return {
            "notifications": notifications,
            "total": total,
            "page": page,
            "pages": max(1, (total + limit - 1) // limit),
        }
    finally:
        if db_session is None:
            own_session.close()


# ---------------------------------------------------------------------------
# Announcements (admin broadcast)
# ---------------------------------------------------------------------------


def create_announcement(
    org_id: int,
    title: str,
    body: str,
    recipient_user_ids: List[int],
    link_url: Optional[str] = None,
    category: str = "Announcement",
    language: Optional[str] = None,
    db_session: Optional[Session] = None,
) -> Optional[Notification]:
    """
    Create an admin broadcast notification.

    Writes one ``Notification`` row with ``source='announcement'`` and
    ``event_type='announcement'``, plus N ``NotificationRecipient`` rows.
    """
    return create_notification(
        org_id=org_id,
        event_type="announcement",
        category=category,
        params={},
        recipient_user_ids=recipient_user_ids,
        link_url=link_url,
        title=title,
        body=body,
        source="announcement",
        language=language or "en",
        db_session=db_session,
    )


def get_announcements(
    org_id: int,
    page: int = 1,
    limit: int = 20,
    db_session: Optional[Session] = None,
) -> dict:
    """Return paginated announcements sent by admins for this org."""
    from src.core.events.database import engine

    own_session = db_session or Session(engine)
    try:
        count_q = select(func.count()).select_from(Notification).where(
            Notification.org_id == org_id,
            Notification.event_type == "announcement",
        )
        total = own_session.exec(count_q).one()

        offset = (page - 1) * limit
        rows = own_session.exec(
            select(Notification)
            .where(
                Notification.org_id == org_id,
                Notification.event_type == "announcement",
            )
            .order_by(Notification.created_at.desc())  # type: ignore
            .offset(offset)
            .limit(limit)
        ).all()

        announcements = []
        for note in rows:
            announcements.append(
                {
                    "id": note.id,
                    "title": note.title,
                    "body": note.body,
                    "link_url": note.link_url,
                    "category": note.category,
                    "created_at": note.created_at,
                }
            )

        return {
            "announcements": announcements,
            "total": total,
            "page": page,
            "pages": max(1, (total + limit - 1) // limit),
        }
    finally:
        if db_session is None:
            own_session.close()


def get_unread_count(
    user_id: int,
    org_id: int,
    db_session: Optional[Session] = None,
) -> int:
    """Return the number of unread notifications for a user in an org."""
    from src.core.events.database import engine

    own_session = db_session or Session(engine)
    try:
        q = (
            select(func.count())
            .select_from(NotificationRecipient)
            .join(
                Notification,
                NotificationRecipient.notification_id == Notification.id,
            )
            .where(
                NotificationRecipient.user_id == user_id,
                Notification.org_id == org_id,
                NotificationRecipient.read_at.is_(None),
                NotificationRecipient.muted_at.is_(None),
            )
        )
        result = own_session.exec(q).one()
        return result
    finally:
        if db_session is None:
            own_session.close()


# ---------------------------------------------------------------------------
# Mark as read
# ---------------------------------------------------------------------------


def mark_as_read(
    recipient_id: int,
    user_id: int,
    db_session: Optional[Session] = None,
) -> bool:
    """Mark a single notification as read. Returns True if found and updated."""
    from src.core.events.database import engine

    own_session = db_session or Session(engine)
    try:
        recipient = own_session.exec(
            select(NotificationRecipient).where(
                NotificationRecipient.id == recipient_id,
                NotificationRecipient.user_id == user_id,
            )
        ).first()
        if not recipient:
            return False
        recipient.read_at = str(datetime.now())
        own_session.add(recipient)
        if db_session is None:
            own_session.commit()
        return True
    finally:
        if db_session is None:
            own_session.close()


def mark_all_as_read(
    user_id: int,
    org_id: int,
    db_session: Optional[Session] = None,
) -> int:
    """Mark all unread notifications as read. Returns the count updated."""
    from src.core.events.database import engine

    own_session = db_session or Session(engine)
    now = str(datetime.now())
    try:
        # Get all unread recipient rows for this user+org
        rows = own_session.exec(
            select(NotificationRecipient)
            .join(
                Notification,
                NotificationRecipient.notification_id == Notification.id,
            )
            .where(
                NotificationRecipient.user_id == user_id,
                Notification.org_id == org_id,
                NotificationRecipient.read_at.is_(None),
                NotificationRecipient.muted_at.is_(None),
            )
        ).all()
        count = 0
        for r in rows:
            r.read_at = now
            own_session.add(r)
            count += 1
        if db_session is None:
            own_session.commit()
        return count
    finally:
        if db_session is None:
            own_session.close()
