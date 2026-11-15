> Status: as-built · Last verified: 2026-11-15

# Analytics Overview

The analytics area is a seven-tab dashboard that reads behavioural events and learning records from PostgreSQL and renders charts and tables with in-house components.

## Tabs

| Tab | Scope | Question it answers |
|---|---|---|
| Overview | Org-wide | Is the platform healthy right now? |
| Learning | Org-wide | Are learners using the content? |
| Audience | Org-wide | Where does traffic come from? |
| Learners | Org-wide | What is one specific user doing? |
| Courses | One course | How is this course doing? |
| Podcasts | One podcast | Is anyone listening? |
| Community | One community | Is the community alive? |

Overview, Learning and Audience carry no entity filter. Courses, Podcasts and Community each put their own selector in the shared action row; Learners has a search field. The range selector offers `7d`, `30d`, `90d` and `12m`; `12m` buckets by calendar month and the others by day.

## Data sources

| Source | Used for |
|---|---|
| `analytics_events` | Page views, course views, activity views, time on activity, searches, signups, completions, discussion posts |
| `trail_runs`, `trail_steps` | Enrollments, completions, active learners, progress distribution |
| `course`, `chapter`, `activity` | Course and lesson names, lesson counts, content type |
| `user`, `user_organizations` | Learner identity, role, join date, status |
| `podcast`, `podcastepisode` | Episode lists, durations, completion |
| Community tables | Discussions, comments, labels and contributors |

The org-wide tabs query PostgreSQL directly. Tinybird still receives a copy of frontend events for the legacy per-course suite, but it is no longer the read source for this area.

## Event ingestion

`POST /api/v1/analytics/events` accepts a whitelisted frontend event: `page_view`, `course_view`, `activity_view`, `search_query` and `time_on_activity`. The caller must be a member of the target organization. The endpoint:

1. Rejects unknown event names with `400`.
2. Clamps `seconds_spent` to a positive value of at most four hours.
3. Adds `country_code` from `cf-ipcountry` or `x-country-code` when present.
4. Writes one row through `record_event`, which parses device and browser from the user agent.
5. Mirrors the event to Tinybird when a Tinybird configuration exists.

API-side events (enrolment, completion, certificate, discussion) are written server-side by their services.

## UI building blocks

| Component | Role |
|---|---|
| `TrendChart` / `BarsChart` / `RankedBars` | Time series, vertical bars and horizontal rankings |
| `BreakdownList` / `FunnelSteps` | Distributions and funnels |
| `DataTable` | Column-driven table, server-paginated where needed |
| `TabCard` | Maps a card payload `kind` onto the right component |
| `SectionCard` / `ChartCard` | White card shells with uppercase titles |
| `AnalyticsToolbar` / `FilterSelect` / `SearchInput` | Shared action row, entity selectors and search |
| `useChartTheme()` | Chart colours from the live theme |

Each tab body is pure layout over `useAnalyticsTab(tab, range, entity, extra)`. Entity options come from `useOrgCourses`, `useOrgPodcasts` and `useOrgCommunities`; there is no mock dataset.

## Access

`GET /analytics/tabs/{tab}` requires organization membership and an organization admin role. In SaaS mode it also requires a Standard plan or higher and answers `403` otherwise; OSS and EE deployments bypass the plan check. The frontend `PlanRestrictedFeature` wrapper is transparent, so the backend check is the real gate. Revenue is not part of this area; it lives in [Payments → Overview](../payments/overview.md).

## Not built

- Session replay, click maps and scroll heatmaps.
- AI anomaly detection or generated insights.
- A cross-organization platform analytics view for superadmins.
- Revenue per teacher or refund analysis inside Analytics.

## Related

- [Analytics API reference](../../06-api-reference/analytics.md)
- [Analytics admin guide](../../04-admin-guide/analytics.md)
- [Payments overview](../payments/overview.md)
