> Status: as-built · Last verified: 2026-11-15

# Activities

An activity is one item inside a course chapter: a video, a document, a rich page, an assignment or another supported block.

## Activity page

Opening an activity from the curriculum shows:

| Area | Content |
|---|---|
| Header | Course and chapter context, activity title and type |
| Content | The activity body, rendered by its type |
| Secondary bar | Chapter dropdown, share action and reading controls |
| Footer | **What's next**, previous activity and next activity |
| Actions | Completion or assignment controls |

Supported content renderers include video, PDF/document, dynamic page, Markdown, embed and — on enterprise deployments — SCORM. Quizzes and interactive blocks can appear inside a dynamic page.

## Navigation

| Control | Behaviour |
|---|---|
| Chapter dropdown | Jumps to another chapter in the same course |
| Previous | Opens the previous activity in course order |
| Next | Opens the next activity; after the last activity it leads to the course-end screen |
| Share | Copies a link to the activity |
| **What's next** | Lists the following activity with a shortcut |

Chapters in the course curriculum can be collapsed and expanded; the current activity is highlighted, and completed activities carry a check.

## Marking completion

Completion controls appear only for signed-in learners, on published activities whose content is not marked as paid-without-access.

| State | Action |
|---|---|
| Not complete | **Mark as complete** records the activity in your trail |
| Complete | A completed indicator is shown, with an action to unmark it |

Marking the final activity completes the course and opens the course-end screen. The screen shows the course result and, when the course is certified, your certificate with a PDF download.

## Assignments inside a course

An assignment activity shows the task instructions and your submission state: not submitted, submitted, late or graded. You can:

- Submit your answers for the tasks.
- Retry when the assignment allows it.
- Read the final grade and overall feedback once the teacher releases them.

The teacher evaluates submissions in the dashboard; see [Assignments](../04-admin-guide/assignments.md).

## Locked content

If an activity is part of a paid resource without an entitlement, the page explains that access is required instead of rendering the body. The same applies to activities from group-restricted resources when you are not in a linked group.

## Related

- [Courses](./courses.md) — curriculum and progress.
- [Certificates](./certificates.md) — what happens after the last activity.
- [Activities API](../06-api-reference/activities.md) and [Assignments API](../06-api-reference/assignments.md).
