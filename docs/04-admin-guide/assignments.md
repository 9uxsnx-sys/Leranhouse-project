> Status: as-built · Last verified: 2026-11-15

# Assignments

Assignments are graded course activities. They are created inside a course activity and managed from a dedicated dashboard page.

## Assignments overview

Open **Assignments** from the dashboard search or the direct dashboard route. The page groups assignments by course; courses with no matching assignment are hidden.

| Element | Behaviour |
|---|---|
| Stats bar | Total, published, drafts and auto-graded counts |
| Search | Matches assignment title or description |
| Status pills | All, Published, Drafts |
| **Auto-graded** pill | Shows only auto-graded assignments |
| Result line | Shows how many assignments match out of the total |

Each course header shows a thumbnail, the course name and an **Open course editor** link. Each assignment card shows its publish state, due date, title, description, grading-type badge, an auto-grading badge, an anti-copy-paste badge, and two actions: **Editor** and **Submissions**.

## Assignment detail

Selecting an assignment opens a header with its title, badges and publish controls, followed by three tabs. The detail view is desktop-only; mobile shows a notice.

| Control | Effect |
|---|---|
| **Edit** | Opens the assignment settings modal (title, grading, dates, behaviour) |
| **Preview** | Opens the assignment activity in a new tab |
| **Publish / Unpublish** | Toggles both the assignment and its activity |

## Editor tab

The left column is the task list; the right column edits the selected task.

- Add tasks and choose a task type. Supported types are quiz, short answer, number answer, code, file and form.
- The general task editor holds the task instructions and grading options.
- Each assignment has one grading type, shown as a badge throughout the dashboard:

| Grading type | Badge |
|---|---|
| Letter grades | ALPHABET |
| Numeric score | NUMERIC |
| Percentage | PERCENTAGE |
| Pass / fail | PASS_FAIL |
| GPA scale | GPA_SCALE |

## Submissions tab

The tab shows four counters — total, late, submitted and graded — a search field, status pills with counts, and a sort menu. Sort options include date, name, status, grade, needs-grading, late-first and recently-graded.

Rows show the learner and their submission status. The row action opens the evaluation modal, where you can:

- Review the learner's task answers.
- Set the final grade and overall feedback.
- Save the grade, or finalize the grade and mark the activity as done for that learner.

The submission list refreshes every 10 seconds, when the tab regains focus, and on reconnect.

## Analytics tab

The analytics tab is computed from the same submissions:

| Block | Content |
|---|---|
| KPI row | Average grade, median, pass rate, on-time rate |
| Mini stats | Highest, lowest, spread and feedback count |
| Distribution | Grade buckets A–F |
| Timeline | Submitted and graded over time, with a due-date marker |
| Tasks | Average grade and attempts per task |
| Top | Highest-performing learners |
| Needs attention | Learners who need follow-up |

## Related

- [Activities](../03-user-guide/activities.md) — how learners see assignments.
- [Assignments API](../06-api-reference/assignments.md) and [Courses API](../06-api-reference/courses.md).
- [Developer guide](../05-developer-guide/README.md).
