"""Removes every row the demo seeder created, in dependency order."""

from __future__ import annotations

import shutil
from pathlib import Path

from sqlmodel import Session, text

from src.services.seed.core import DEMO_SLUG

# Tables keyed directly by org_id
DIRECT_TABLES = [
    "notification",
    "notification_template",
    "webhook_endpoint",
    "paymentconfig",
    "payoutcost",
    "paymentorder",
    "resourceentitlement",
    "analytics_events",
    "trailstep",
    "trailrun",
    "trail",
    "usergroupuser",
    "usergroupresource",
    "usergroup",
    "apitoken",
    "collectionuser",
    "collectioncourse",
    "collection",
    "discussion",
    "community",
    "podcastepisode",
    "podcast",
    "playground",
    "board",
]


class DemoOrgNotFound(RuntimeError):
    pass


def demo_org(session: Session) -> tuple[int, str] | None:
    row = session.exec(
        text("SELECT id, org_uuid FROM organization WHERE slug = :slug"),
        params={"slug": DEMO_SLUG},
    ).first()
    if row is None:
        return None
    return int(row[0]), str(row[1])


def reset_demo_org(session: Session, content_root: Path) -> None:
    found = demo_org(session)
    if found is None:
        return
    org_id, org_uuid = found

    params = {"org_id": org_id}

    # Rows that hang off other rows need to go first
    statements = [
        "DELETE FROM notification_recipient WHERE notification_id IN (SELECT id FROM notification WHERE org_id = :org_id)",
        "DELETE FROM webhook_delivery_log WHERE webhook_id IN (SELECT id FROM webhook_endpoint WHERE org_id = :org_id)",
        "DELETE FROM paymentwebhookevent WHERE raw_payload->>'order' IN (SELECT order_uuid FROM paymentorder WHERE org_id = :org_id)",
        "DELETE FROM discussioncommentvote WHERE comment_id IN (SELECT dc.id FROM discussioncomment dc JOIN discussion d ON d.id = dc.discussion_id WHERE d.org_id = :org_id)",
        "DELETE FROM discussioncomment WHERE discussion_id IN (SELECT id FROM discussion WHERE org_id = :org_id)",
        "DELETE FROM discussionreaction WHERE discussion_id IN (SELECT id FROM discussion WHERE org_id = :org_id)",
        "DELETE FROM discussionvote WHERE discussion_id IN (SELECT id FROM discussion WHERE org_id = :org_id)",
        "DELETE FROM certificateuser WHERE certification_id IN (SELECT id FROM certifications WHERE course_id IN (SELECT id FROM course WHERE org_id = :org_id))",
        "DELETE FROM certifications WHERE course_id IN (SELECT id FROM course WHERE org_id = :org_id)",
        "DELETE FROM assignmenttasksubmission WHERE course_id IN (SELECT id FROM course WHERE org_id = :org_id)",
        "DELETE FROM assignmentusersubmission WHERE assignment_id IN (SELECT id FROM assignment WHERE org_id = :org_id)",
        "DELETE FROM assignmenttask WHERE org_id = :org_id",
        "DELETE FROM assignment WHERE org_id = :org_id",
        "DELETE FROM code_submission WHERE activity_uuid IN (SELECT activity_uuid FROM activity WHERE org_id = :org_id)",
        "DELETE FROM playgroundreaction WHERE playground_id IN (SELECT id FROM playground WHERE org_id = :org_id)",
        "DELETE FROM boardmember WHERE board_id IN (SELECT id FROM board WHERE org_id = :org_id)",
        "DELETE FROM podcast_episode_translation WHERE episode_id IN (SELECT id FROM podcastepisode WHERE org_id = :org_id)",
        "DELETE FROM podcast_translation WHERE podcast_id IN (SELECT id FROM podcast WHERE org_id = :org_id)",
        "DELETE FROM collection_translation WHERE collection_id IN (SELECT id FROM collection WHERE org_id = :org_id)",
        "DELETE FROM chapteractivity WHERE org_id = :org_id",
        "DELETE FROM activityversion WHERE org_id = :org_id",
        "DELETE FROM activity WHERE org_id = :org_id",
        "DELETE FROM coursechapter WHERE org_id = :org_id",
        "DELETE FROM chapter WHERE org_id = :org_id",
        "DELETE FROM courseupdate WHERE org_id = :org_id",
        "DELETE FROM course_translation WHERE course_id IN (SELECT id FROM course WHERE org_id = :org_id)",
        "DELETE FROM resourceauthor WHERE resource_uuid IN (SELECT course_uuid FROM course WHERE org_id = :org_id)",
        "DELETE FROM course WHERE org_id = :org_id",
        "DELETE FROM userorganization WHERE org_id = :org_id",
        "DELETE FROM organizationconfig WHERE org_id = :org_id",
        "DELETE FROM organization WHERE id = :org_id",
    ]

    for statement in statements + [
        f"DELETE FROM {table} WHERE org_id = :org_id" for table in DIRECT_TABLES
    ]:
        session.exec(text(statement), params=params)

    # Seed users are the ones still unattached after removing memberships
    user_rows = session.exec(
        text(
            """
            SELECT user_uuid FROM "user"
            WHERE (email LIKE '%@example.com' OR email = 'owner@koodook.academy')
              AND NOT EXISTS (SELECT 1 FROM userorganization uo WHERE uo.user_id = "user".id)
            """
        )
    ).all()

    session.exec(
        text(
            """
            DELETE FROM "user"
            WHERE (email LIKE '%@example.com' OR email = 'owner@koodook.academy')
              AND NOT EXISTS (SELECT 1 FROM userorganization uo WHERE uo.user_id = "user".id)
            """
        )
    )
    session.commit()

    org_dir = content_root / "orgs" / org_uuid
    if org_dir.exists():
        shutil.rmtree(org_dir, ignore_errors=True)

    for row in user_rows:
        avatar_dir = content_root / "users" / str(row[0])
        if avatar_dir.exists():
            shutil.rmtree(avatar_dir, ignore_errors=True)
