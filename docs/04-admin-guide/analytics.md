> Status: as-built · Last verified: 2026-11-15

# Analytics

The Analytics area reports on learning activity, audience and community engagement. Revenue reporting lives in [Payments](./payments.md), not here.

## Opening Analytics

Open **Analytics** in the dashboard menu. The area requires the **Standard** plan; on lower plans the whole page is replaced by the plan-restricted view.

The action row always contains a date range: `7d`, `30d`, `90d` or `12m`. Every tab reloads with the selected range.

## Tabs

| Tab | Answers |
|---|---|
| **Overview** | Activity trend, enrollments trend, enrollment stages, top courses, completion by course |
| **Learning** | Learning trend, completion by course, lesson drop-off, time on activity, content-type effectiveness |
| **Audience** | Traffic trend, sources, devices, top pages |
| **Learners** | Searchable learner table with a detail dialog |
| **Courses** | Course-scoped enrollment, funnel, progress and lesson metrics |
| **Podcasts** | Podcast-scoped listening metrics |
| **Community** | Community activity and a switchable detail table |

## Overview, Learning and Audience

These tabs are chart-only; they do not show KPI cards. Overview starts with a full-width activity trend, then splits into two rows of paired charts. Learning follows the same layout around learning activity. Audience adds a full-width top-pages table under its sources and devices charts.

## Learners

The action row adds a search field. The table lists learners; the row action opens a detail dialog with:

- Name, username and email.
- Role, verification status, joined date and last active date.
- Per-course completion for that learner.

## Courses

The action row adds a course selector. The tab shows:

| Card | Content |
|---|---|
| Enrollment trend | Enrollments over the selected range |
| Completion funnel | Enrollment-to-completion stages |
| Learner progress | Progress distribution |
| Lesson drop-off | Where learners stop |
| Time per lesson | Time spent per lesson |
| Students | Table of learners in the selected course |

The dashboard home reuses the enrollment-trend, completion-funnel and learner-progress cards.

## Podcasts

The action row adds a podcast selector. Cards cover the listening trend, episode plays, episode completion, episode length versus listened time, series progress, and an episodes table.

## Community

The action row adds a community selector and a button that cycles the detail table:

- Contributors
- Top discussions
- Unanswered questions

Two charts stay visible above the table: community activity trend and community-by-label breakdown.

## Related

- [Payments](./payments.md) — revenue, orders and payouts.
- [Assignments](./assignments.md) — per-assignment analytics.
- [Analytics API](../06-api-reference/analytics.md) and [Developer guide](../05-developer-guide/README.md).
