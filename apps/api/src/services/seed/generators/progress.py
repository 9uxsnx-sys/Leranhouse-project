"""Enrollments, progress and certificates."""

from __future__ import annotations

import os

from sqlmodel import select

from src.db.courses.chapter_activities import ChapterActivity
from src.db.courses.certifications import CertificateUser, Certifications
from src.db.trail_runs import StatusEnum, TrailRun, TrailRunEnum
from src.db.trail_steps import TrailStep
from src.db.trails import Trail
from src.db.users import User
from src.services.seed.core import SeedContext, iso, new_uuid

COURSE_ENROLLMENTS = 450
PODCAST_LISTENS = 150


def create_progress(ctx: SeedContext) -> None:
    published = [course for course in ctx.courses if course.published]
    if not published:
        return

    podcasts = [podcast for podcast in ctx.podcasts if podcast.published]
    trails: dict[int, Trail] = {}

    def trail_for(student) -> Trail:
        student_id = int(student.id or 0)
        trail = trails.get(student_id)
        if trail is None:
            created = ctx.date_between(190, 150)
            trail = Trail(
                org_id=ctx.org_id,
                user_id=student_id,
                trail_uuid=new_uuid("trail"),
                creation_date=iso(created),
                update_date=iso(created),
            )
            ctx.session.add(trail)
            ctx.session.commit()
            ctx.session.refresh(trail)
            trails[student_id] = trail
        return trail

    flagship_activities = _flagship_activity_ids(ctx)
    flagship_total = len(flagship_activities)

    planned: list[tuple[object, object, int]] = []
    # Flagship gets the bulk of enrollments
    flagship_students = ctx.rng.sample(ctx.students, 130)
    completers_target = 60
    for index, student in enumerate(flagship_students):
        if index < completers_target:
            steps_done = flagship_total
        else:
            steps_done = ctx.rng.randint(0, max(0, flagship_total - 1))
        planned.append((student, ctx.flagship, steps_done))

    remaining = COURSE_ENROLLMENTS - len(planned)
    other_courses = [course for course in published if course is not ctx.flagship]
    while remaining > 0 and other_courses:
        course = ctx.rng.choices(other_courses, weights=[6, 5, 5, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 2])[0]
        student = ctx.rng.choice(ctx.students)
        if any(item[0] is student and item[1] is course for item in planned):
            continue
        planned.append((student, course, 0))
        remaining -= 1

    completers = []
    for student, course, steps_done in planned:
        trail = trail_for(student)
        enrolled_at = ctx.date_between(150, 5)
        completed = (
            course is ctx.flagship
            and steps_done == flagship_total
            and flagship_total > 0
        )
        if completed and len(completers) < 60:
            completers.append(student)
        status = StatusEnum.STATUS_COMPLETED if completed else StatusEnum.STATUS_IN_PROGRESS
        run = TrailRun(
            data={},
            status=status,
            run_type=TrailRunEnum.RUN_TYPE_COURSE,
            trail_id=int(trail.id or 0),
            course_id=int(course.id or 0),
            org_id=ctx.org_id,
            user_id=int(student.id or 0),
            creation_date=iso(enrolled_at),
            update_date=iso(ctx.date_between(60, 1)),
        )
        ctx.session.add(run)
        ctx.session.commit()
        ctx.session.refresh(run)

        if course is ctx.flagship and steps_done > 0:
            for activity_id in flagship_activities[:steps_done]:
                step_at = ctx.date_between(120, 1)
                ctx.session.add(
                    TrailStep(
                        complete=True,
                        teacher_verified=False,
                        grade="",
                        data={},
                        trailrun_id=int(run.id or 0),
                        trail_id=int(trail.id or 0),
                        activity_id=activity_id,
                        course_id=int(course.id or 0),
                        org_id=ctx.org_id,
                        user_id=int(student.id or 0),
                        creation_date=iso(step_at),
                        update_date=iso(step_at),
                    )
                )
    ctx.session.commit()

    _enroll_demo_viewers(ctx, trail_for)

    for student in ctx.rng.sample(ctx.students, PODCAST_LISTENS):
        if not podcasts:
            break
        podcast = ctx.rng.choice(podcasts)
        trail = trail_for(student)
        listened_at = ctx.date_between(140, 1)
        ctx.session.add(
            TrailRun(
                data={},
                status=StatusEnum.STATUS_IN_PROGRESS,
                run_type=TrailRunEnum.RUN_TYPE_PODCAST,
                trail_id=int(trail.id or 0),
                course_id=None,
                podcast_id=int(podcast.id or 0),
                org_id=ctx.org_id,
                user_id=int(student.id or 0),
                creation_date=iso(listened_at),
                update_date=iso(listened_at),
            )
        )
    ctx.session.commit()

    _create_certificates(ctx, completers)


def _enroll_demo_viewers(ctx: SeedContext, trail_for) -> None:
    """Enroll the people who walk the demo in the flagship course.

    The owner and the CLI admin sign in on camera, and the sidebar only shows
    "Continue learning" when a trail run exists. No completed steps, so the
    button opens the first lesson of the first module.
    """
    if ctx.flagship is None:
        return

    email = os.environ.get("LEARNHOUSE_INITIAL_ADMIN_EMAIL", "admin@school.dev")
    admin = ctx.session.exec(select(User).where(User.email == email)).first()

    viewers = [user for user in (ctx.owner, admin) if user is not None]
    flagship_id = int(ctx.flagship.id or 0)

    for viewer in viewers:
        user_id = int(viewer.id or 0)
        existing = ctx.session.exec(
            select(TrailRun).where(
                TrailRun.user_id == user_id,
                TrailRun.course_id == flagship_id,
            )
        ).first()
        if existing:
            continue
        trail = trail_for(viewer)
        ctx.session.add(
            TrailRun(
                data={},
                status=StatusEnum.STATUS_IN_PROGRESS,
                run_type=TrailRunEnum.RUN_TYPE_COURSE,
                trail_id=int(trail.id or 0),
                course_id=flagship_id,
                org_id=ctx.org_id,
                user_id=user_id,
                creation_date=iso(ctx.date_back(20)),
                update_date=iso(ctx.now),
            )
        )
    ctx.session.commit()


def _flagship_activity_ids(ctx: SeedContext) -> list[int]:
    if ctx.flagship is None:
        return []
    rows = ctx.session.exec(
        select(ChapterActivity)
        .where(ChapterActivity.course_id == ctx.flagship.id)
        .order_by(ChapterActivity.order)
    ).all()
    return [int(row.activity_id or 0) for row in rows]


def _create_certificates(ctx: SeedContext, completers: list) -> None:
    published = [course for course in ctx.courses if course.published]
    if ctx.flagship is None or not published:
        return

    targets = [ctx.flagship]
    for index in (5, 9):
        if index < len(published) and published[index] is not ctx.flagship:
            targets.append(published[index])

    flagship_certification = None
    for course in targets:
        author = ctx.teachers[0]
        certification = Certifications(
            certification_uuid=new_uuid("certification"),
            course_id=int(course.id or 0),
            config={
                "certification_name": course.name,
                "certification_description": f"Completed every lesson in {course.name}.",
                "certification_type": "completion",
                "certificate_pattern": "professional",
                "certificate_instructor": f"{author.first_name} {author.last_name}",
            },
            creation_date=iso(ctx.date_between(150, 100)),
            update_date=iso(ctx.now),
        )
        ctx.session.add(certification)
        ctx.session.commit()
        ctx.session.refresh(certification)
        if course is ctx.flagship:
            flagship_certification = certification

    if flagship_certification is None:
        return

    for student in completers:
        issued = ctx.date_between(60, 1)
        ctx.session.add(
            CertificateUser(
                user_id=int(student.id or 0),
                certification_id=int(flagship_certification.id or 0),
                user_certification_uuid=new_uuid("certificate"),
                created_at=iso(issued),
                updated_at=iso(issued),
            )
        )
    ctx.session.commit()
