# Analytics API

> Status: as-built · Last verified: 2026-11-15

This router owns analytics ingest (frontend event proxy) and analytics reads: the org-wide Analytics tabs, the learner-details dialog, and the legacy dashboard query families. Mounted at `/api/v1/analytics`.

Mounted with `require_authenticated_user`: anonymous callers get `401`, API tokens get `403`. Handlers repeat the anonymous check. Every org-scoped route first requires **org membership** (`403 "Not a member of this organization"`); the tabs, learner, dashboard and export routes also require **org admin** — the caller's role in that org must carry `rights.organizations.action_update` (superadmins bypass; there is no admin-role-id fallback) — otherwise `403 "Admin access required for this organization"`.

Two backends exist: `analytics_events` in PostgreSQL (source for the org-wide **tabs** and learner detail) and Tinybird (legacy dashboard queries). Redis caches results.

---

## Endpoints

| Method | Path | Who | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/analytics/status` | any authenticated user | Is Tinybird configured? |
| `POST` | `/api/v1/analytics/events` | org member | Ingest a whitelisted frontend event |
| `GET` | `/api/v1/analytics/tabs/{tab}` | org admin | Org-wide Analytics tab payload |
| `GET` | `/api/v1/analytics/learners/{user_id}` | org admin | Learner-details dialog |
| `GET` | `/api/v1/analytics/dashboard/detail/{query_name}` | org admin | Detail drill-down rows |
| `GET` | `/api/v1/analytics/dashboard/{query_name}` | org admin | Aggregate query |
| `GET` | `/api/v1/analytics/dashboard/db/{query_name}` | org admin | PostgreSQL query |
| `GET` | `/api/v1/analytics/dashboard/course/detail/{query_name}` | org admin | Course-level detail rows |
| `GET` | `/api/v1/analytics/dashboard/course/{query_name}` | org admin | Course-level aggregate |
| `GET` | `/api/v1/analytics/export` | org admin | Export one or more queries |
| `GET` | `/api/v1/analytics/plan-info` | org member | Analytics tier for the org |

Plan gates: tabs and learner detail need **Standard+**; `/dashboard/db` and both course routes need **Pro+**; advanced names on `/dashboard/{query_name}` need **Enterprise**; `/export`, `/status`, `/events` and `/plan-info` have no plan gate.

---

## GET /api/v1/analytics/status

No parameters. `{ "configured": true }` when a Tinybird config is present, otherwise `{ "configured": false }`.

---

## POST /api/v1/analytics/events

Body (`FrontendEvent`):

```json
{ "event_name": "page_view", "org_id": 1, "session_id": "s_…", "visitor_id": "v_…", "properties": { "path": "/courses", "device_type": "desktop" } }
```

- Caller must be a member of `org_id` (`403` otherwise).
- `event_name` must be one of `page_view`, `course_view`, `activity_view`, `search_query`, `time_on_activity` (`400 "Invalid event name"`).
- `properties.seconds_spent` is sanitized: dropped if `<= 0` or non-numeric, capped at `14400` (4 h).
- If Cloudflare's `cf-ipcountry` or a proxy's `x-country-code` header is present (and not `XX`/`T1`), it is added as `properties.country_code` when not already set.
- Writes a row to PostgreSQL (`record_event`) and forwards to Tinybird (`track`, `source="frontend"`).

Response: `{ "ok": true }`.

---

## GET /api/v1/analytics/tabs/{tab}

Runs one org-wide tab and returns every card as a self-describing payload.

| Param | In | Type | Default | Notes |
|---|---|---|---|---|
| `tab` | path | enum | — | `overview`, `learning`, `audience`, `learners`, `courses`, `podcasts`, `community` |
| `org_id` | query | integer | — | Required |
| `range` | query | enum | `30d` | `7d`, `30d`, `90d`, `12m` (`12m` = 365 days, monthly buckets) |
| `entity` | query | string | `all` | `all` or an entity UUID: course UUID (courses tab), podcast UUID (podcasts), community UUID (community). Ignored by overview/learning/audience/learners |
| `q` | query | string | `""` | Learners tab only — name/username/email search |
| `page` | query | integer | `1` | Learners tab only (page size 50) |
| `view` | query | string | `""` | Community tab only: `contributors`, `discussions`, `questions`; any other value falls back to `contributors` |

Errors: `404 "Unknown tab"`, `400 "Invalid range"`, `403` (membership, admin, or the Standard plan gate `"Analytics requires a Standard plan or higher."`).

Envelope:

```json
{
  "tab": "overview",
  "meta": {
    "org_id": 1,
    "range": "30d",
    "entity": "all",
    "generated_at": "2026-11-15T09:00:00.123456+00:00",
    "cached": false
  },
  "cards": {
    "activity_trend": {
      "title": "Activity over time",
      "kind": "trend",
      "format": "number",
      "data": [{ "label": "01 Nov", "learners": 12, "signups": 3 }],
      "xKey": "label",
      "series": [
        { "key": "learners", "name": "Active learners" },
        { "key": "signups", "name": "New signups" }
      ]
    }
  }
}
```

`kind` is one of `trend`, `bars`, `ranked`, `table`; `format` is `number`, `percent` or `minutes`. Table cards carry `columns` + `rows`; the learners table also adds `page`, `pageSize`, `total`. A cache hit returns `meta.cached: true`.

### Cards per tab

| Tab | Card keys (`cards.*`) |
|---|---|
| `overview` | `activity_trend`, `enrollments_trend`, `enrollment_stage`, `top_courses`, `completion_by_course` |
| `learning` | `learning_trend`, `completion_by_course`, `lesson_dropoff`, `time_on_activity`, `content_type_effectiveness` |
| `audience` | `traffic_trend`, `sources`, `devices`, `top_pages` |
| `learners` | `learners_table` |
| `courses` | `course_enrollment_trend`, `course_completion_funnel`, `course_learner_progress`, `course_lesson_dropoff`, `course_time_per_lesson`, `course_students` |
| `podcasts` | `podcast_listening_trend`, `podcast_episode_plays`, `podcast_episode_completion`, `podcast_length_vs_listened`, `podcast_series_progress`, `podcast_episodes` |
| `community` | `community_activity_trend`, `community_by_label`, `community_detail_table` |

The `audience` cards read `page_view` events and stay empty until traffic is collected; `learning`'s `time_on_activity` and `podcasts`' `podcast_length_vs_listened` similarly need those events.

Caching: keyed by tab + org + range days + entity (with `q`/`page`/`view` folded into the variant), so a search or page can never be served another variant's payload.

---

## GET /api/v1/analytics/learners/{user_id}

Learner profile + per-course progress for the Analytics → Learners details dialog. Requires `org_id`; Standard+ plan.

- `404 "Learner is not a member of this organization"` when the user has no `userorganization` row in the org.
- `403` for non-admin callers or an insufficient plan.

```json
{
  "user": {
    "id": 7,
    "name": "John Doe",
    "username": "jdoe",
    "email": "jdoe@example.com",
    "role": "Instructor",
    "verified": true,
    "joined": "2026-09-20",
    "last_active": "2026-11-14T18:22:03+00:00"
  },
  "courses": [
    { "name": "Algebra", "progress": 42 }
  ]
}
```

`name` falls back to `username` when first/last name are empty; `role` is `-` when missing; `progress` is an integer percent (0 when the course has no activities).

---

## Legacy dashboard queries

All take `org_id`; the Tinybird query routes also take `days` (integer, per-query default 7–180). Unknown names `404`; invalid `org_id`/`days` `400 "Invalid parameter"`.

### GET /api/v1/analytics/dashboard/detail/{query_name}

Returns `{ "data": [...], "users": { "<user_id>": { "user_uuid", "first_name", "last_name", "username", "email", "avatar_image" } } }`. Rows are enriched with course/activity metadata from PostgreSQL. Names:

```
detail_live_users, detail_signups, detail_enrollments, detail_completions, learner_engagement_score
```

No plan gate. `404 "Unknown detail query"`; upstream failures `502`, unconfigured backend `503`.

### GET /api/v1/analytics/dashboard/{query_name}

Returns `{ "data": [...], "rows": N, "meta": [...] }` (Tinybird JSON, NaN/Inf → `null`), enriched with course/activity fields. `404 "Unknown query"`.

Allowed names = core + advanced + detail:

```
core:     live_users, daily_active_users, top_courses, enrollment_funnel, event_counts,
          activity_engagement, visitors_by_country, visitors_by_device,
          visitors_by_referrer, daily_visitor_breakdown
advanced: course_dropoff, cohort_retention, time_to_completion, peak_usage_hours,
          content_type_effectiveness, new_vs_returning, completion_velocity,
          community_correlation, user_progress_snapshot, search_effectiveness,
          certification_rate, org_growth_trend, course_rating_by_completion
detail:   detail_live_users, detail_signups, detail_enrollments, detail_completions,
          learner_engagement_score
```

An **advanced** name additionally requires Enterprise in SaaS (`403 "Advanced analytics requires an Enterprise plan or higher."`) and is blocked in OSS.

### GET /api/v1/analytics/dashboard/db/{query_name}

PostgreSQL-backed queries, **Pro+** (`403 "Advanced analytics requires a Pro plan or higher."`). The only registered name is `grade_distribution`, returning:

```json
{ "data": [{ "grade": "A", "count": 12 }, { "grade": "B", "count": 8 }] }
```

`404 "Unknown query"` for anything else.

### GET /api/v1/analytics/dashboard/course/{query_name}

Requires `course_uuid` (validated: `^[a-zA-Z0-9_-]+$`, max 100 chars — else `400 "Invalid course_uuid"`) and **Pro+** (`403 "Course analytics requires a Pro plan or higher."`). Returns `{ "data", "rows", "meta" }`.

```
course_overview_stats, course_enrollment_trend, course_activity_funnel,
course_learner_progress, course_time_per_activity, course_completion_velocity,
course_active_learners, course_time_to_completion, course_certification_rate,
course_view_to_enrollment, course_activity_type_breakdown, course_peak_hours,
course_learner_retention, course_activity_dropoff, course_engagement_by_type,
course_daily_completions, course_avg_session_duration, course_unique_viewers
```

`404 "Unknown course query"`.

### GET /api/v1/analytics/dashboard/course/detail/{query_name}

Requires `course_uuid` and **Pro+**. Returns `{ "data": [...], "users": { "<user_id>": {…} } }` with course/activity/user enrichment. Names:

```
course_recent_enrollments, course_top_learners
```

Special case: if `course_recent_enrollments` returns no Tinybird rows, the handler falls back to the latest 50 PostgreSQL `trailrun` rows for that course/org (`user_id`, `timestamp`). `404 "Unknown course detail query"`.

---

## GET /api/v1/analytics/export

| Param | In | Type | Default | Notes |
|---|---|---|---|---|
| `org_id` | query | integer | — | Required |
| `format` | query | `json` \| `csv` | `json` | Anything else → `400 "format must be 'json' or 'csv'"` |
| `queries` | query | string | — | Comma-separated names; required (`400 "queries parameter required"`) |
| `course_uuid` | query | string | — | Optional; switches the allowed set to course + course-detail queries |
| `days` | query | integer | `30` | `0` falls back to the query's default; omitting it means `30`, not the query default |

No plan gate and no advanced/enterprise gating. Unknown query names are **silently skipped**.

- `format=json` → object keyed by query name: `{ "<query_name>": { "data": [...], "rows": N, "meta": [...] } }`.
- `format=csv` → `text/csv` stream; sections start with `# <query_name>`, then a header row per section; filename `analytics_export_{org_id}_{days}d.csv`.

---

## GET /api/v1/analytics/plan-info

Member-only (no admin check, no plan gate). `org_id` query required.

```json
{ "tier": "advanced", "plan": "pro" }
```

`tier` is `advanced` when the org plan is **Pro or higher**, otherwise `core`; `plan` is the raw plan name from the org config.

---

## Notes that are easy to miss

- Admin scoping is explicit: `_verify_org_admin` looks at the caller's role **in the requested org** and requires `organizations.action_update`, not merely membership.
- `/dashboard/detail/...` has no plan gate, while `/dashboard/{query_name}` gates only the advanced names.
- `/export` skips unrecognized query names instead of erroring — a typo yields fewer sections, not a `400`.
- Redis TTLs: core 60 s, advanced 300 s, course 60 s, course-detail/detail 30 s; `live_users`/`detail_live_users` are never cached.
