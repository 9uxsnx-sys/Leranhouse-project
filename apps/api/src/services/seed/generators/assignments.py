"""Assignments, tasks and submissions for the flagship course."""

from __future__ import annotations

from src.db.courses.assignments import (
    Assignment,
    AssignmentTask,
    AssignmentTaskSubmission,
    AssignmentTaskTypeEnum,
    AssignmentUserSubmission,
    AssignmentUserSubmissionStatus,
    GradingTypeEnum,
)
from src.services.seed import copy as C
from src.services.seed.core import SeedContext, iso, new_uuid

SUBMISSION_LINES = [
    "I redesigned the booking form for a dental clinic. Two screens and one error state. The hardest part was the date field.",
    "Here is my component inventory. I stopped at twenty buttons, which felt like enough to prove the point.",
    "First page of the case study. I left the final screens out on purpose, still iterating.",
    "Ran the keyboard test on a local shop. The checkout fails at the second field and the focus ring is invisible.",
    "Attached my file. The spacing is not right yet but I wanted to submit before the deadline.",
    "Took me three tries to get the error message useful instead of polite.",
    "I used the clinic example from the lesson but changed the flow a little. Feedback welcome.",
    "The form now tells you what went wrong instead of just turning red.",
]


def create_assignments(ctx: SeedContext) -> None:
    assignment_activities = [
        activity for activity in ctx.activities
        if activity.activity_type.value == "TYPE_ASSIGNMENT"
    ]
    if not assignment_activities or ctx.flagship is None:
        return

    tasks: list[AssignmentTask] = []
    assignments: list[Assignment] = []

    for index, activity in enumerate(assignment_activities[: len(C.ASSIGNMENTS)]):
        title, description, grading = C.ASSIGNMENTS[index]
        created = ctx.date_between(100, 40)
        assignment = Assignment(
            title=title,
            description=description,
            due_date=iso(created.replace(hour=23, minute=59)),
            published=True,
            grading_type=GradingTypeEnum(grading),
            auto_grading=False,
            anti_copy_paste=False,
            show_correct_answers=False,
            allow_retries=True,
            max_retries=2,
            org_id=ctx.org_id,
            course_id=int(ctx.flagship.id or 0),
            chapter_id=_chapter_for(ctx, activity),
            activity_id=int(activity.id or 0),
            creation_date=iso(created),
            update_date=iso(created),
            assignment_uuid=new_uuid("assignment"),
        )
        ctx.session.add(assignment)
        ctx.session.commit()
        ctx.session.refresh(assignment)
        assignments.append(assignment)

        for task_index in range(3):
            task = AssignmentTask(
                title=f"Task {task_index + 1}",
                description=(
                    "Submit the screen you redesigned with a short note explaining the change."
                    if task_index == 0
                    else "Write three sentences about what you tried first and why it did not work."
                    if task_index == 1
                    else "List the two things you would test with a real user."
                ),
                hint="Short answers are fine. I care about the reasoning more than the polish.",
                reference_file=None,
                assignment_type=(
                    AssignmentTaskTypeEnum.SHORT_ANSWER
                    if task_index != 2
                    else AssignmentTaskTypeEnum.FILE_SUBMISSION
                ),
                contents={},
                max_grade_value=100,
                assignment_task_uuid=new_uuid("assignmenttask"),
                creation_date=iso(created),
                update_date=iso(created),
                assignment_id=int(assignment.id or 0),
                org_id=ctx.org_id,
                course_id=int(ctx.flagship.id or 0),
                chapter_id=assignment.chapter_id,
                activity_id=int(activity.id or 0),
            )
            ctx.session.add(task)
            tasks.append(task)
        ctx.session.commit()

    for task in tasks:
        for student in ctx.rng.sample(ctx.students, 5):
            created = ctx.date_between(35, 2)
            ctx.session.add(
                AssignmentTaskSubmission(
                    assignment_task_submission_uuid=new_uuid("tasksubmission"),
                    task_submission={"text": ctx.rng.choice(SUBMISSION_LINES)},
                    grade=ctx.rng.choice([70, 75, 80, 85, 90, 95, 100]),
                    task_submission_grade_feedback=ctx.rng.choice(
                        [
                            "Good reasoning, tighten the writing next time.",
                            "Clear enough. Show the before screen too.",
                            "Nice work. One detail missing in the error state.",
                            "Solid. I would push the spacing a little further.",
                            "",
                        ]
                    ),
                    manually_graded=True,
                    assignment_type=task.assignment_type,
                    user_id=int(student.id or 0),
                    activity_id=task.activity_id,
                    course_id=task.course_id,
                    chapter_id=task.chapter_id,
                    assignment_task_id=int(task.id or 0),
                    creation_date=iso(created),
                    update_date=iso(created),
                )
            )
    ctx.session.commit()

    for assignment in assignments:
        for student in ctx.rng.sample(ctx.students, 12):
            created = ctx.date_between(30, 1)
            status = ctx.rng.choices(
                [
                    AssignmentUserSubmissionStatus.GRADED,
                    AssignmentUserSubmissionStatus.SUBMITTED,
                    AssignmentUserSubmissionStatus.PENDING,
                    AssignmentUserSubmissionStatus.LATE,
                ],
                weights=[55, 25, 12, 8],
            )[0]
            ctx.session.add(
                AssignmentUserSubmission(
                    submission_status=status,
                    grade=ctx.rng.choice([0, 70, 75, 80, 85, 90, 95]) if status == AssignmentUserSubmissionStatus.GRADED else 0,
                    overall_feedback=(
                        "See the notes on each task. Overall this is on the right track."
                        if status == AssignmentUserSubmissionStatus.GRADED
                        else None
                    ),
                    attempt_number=1,
                    user_id=int(student.id or 0),
                    assignment_id=int(assignment.id or 0),
                    creation_date=iso(created),
                    update_date=iso(created),
                    assignmentusersubmission_uuid=new_uuid("usersubmission"),
                )
            )
    ctx.session.commit()


def _chapter_for(ctx: SeedContext, activity) -> int:
    from sqlmodel import select

    from src.db.courses.chapter_activities import ChapterActivity

    link = ctx.session.exec(
        select(ChapterActivity).where(ChapterActivity.activity_id == activity.id)
    ).first()
    return int(link.chapter_id or 0) if link else 0
