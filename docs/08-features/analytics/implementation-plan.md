# Analytics — Implementation Plan (the contract)

> **Status:** Phase 0 — frozen contract
> **Scope:** the org-wide Analytics area at `/orgs/{orgslug}/dash/analytics` (7 tabs).
> **Companion docs:** the metric catalog + UI rules live in [overview.md](./overview.md); money lives in [Revenue Analytics](../payments/revenue-analytics.md).
> **Why this file exists:** every downstream phase (queries → endpoints → UI wiring) is built against the *contract* below, so the UI can never drift from the API.

---

## 0. Decisions (frozen)

| # | Decision | Value |
|---|----------|-------|
| D1 | **Read path** | **PostgreSQL** for the new tabs. Tinybird stays where it is (the legacy per-course suite) and becomes an optional mirror/backfill source — never a dependency of the new tabs. |
| D2 | **Behavioural events** | One new Postgres table, `analytics_events` (Tier B). No external event engine. |
| D3 | **Money** | The payment models live in the EE package (`ee/db/payments/*`), which is **not** in this checkout → **money metrics are out of scope for this plan**. The Revenue section is a separate deliverable. |
| D4 | **Granularity** | `range` ∈ `7d · 30d · 90d · 12m`. `7d/30d/90d` → **daily** buckets, `12m` → **monthly** buckets. |
| D5 | **Entity scope** | Overview / Learning / Audience / Learners are org-wide (`entity=all`). Courses / Podcasts / Community accept an entity uuid. |
| D6 | **Caching** | Redis, key `tab_{tab}:{org_id}:{days}:{entity}` via the existing `cache.py` helper → TTL **60 s** (the repo's core TTL). Bump to 300 s later only if a tab proves expensive. |

---

## 1. Conventions (hard rules — every query follows these)

1. **Dates are strings.** `creation_date` / `update_date` are `VARCHAR` on every target table, and the SQLModel default is `""` (empty). Never cast raw — always `NULLIF(creation_date, '')::timestamp`. A bare `creation_date::timestamp` will blow up on the empty-string rows.
2. **All SQL is parameterized** (`:org_id`, `:start`, `:end`, …). No string interpolation into `text()` — the repo already avoids it (`src/services/explore/explore.py`).
3. **Everything is `org_id`-scoped**, first predicate in every query.
4. **Empty is valid.** A metric with no rows returns `data: []` — never a 500.
5. **Auth:** org admin, reusing `_verify_org_admin` from [analytics.py](../../../apps/api/src/routers/analytics.py). Plan gating: the Analytics area is `standard+` (existing); per-tab overrides are listed in §5.
6. **One shared helper** for bucketing: `bucket_expr(granularity)` → daily `date_trunc('day', …)` / monthly `date_trunc('month', …)`, applied to the `NULLIF` cast. Defined once in the analytics service package.
7. **Enums:** `trailrun.status` (`STATUS_IN_PROGRESS | STATUS_COMPLETED | STATUS_PAUSED | STATUS_CANCELLED`), `trailrun.run_type` (`RUN_TYPE_COURSE | RUN_TYPE_PODCAST`). `run_type` was added as `VARCHAR` on existing DBs → compare against the plain string, don't cast to the model enum.

---

## 2. API surface

```
GET /api/v1/analytics/tabs/{tab}
      ?org_id=<int>
      &range=7d|30d|90d|12m        (default 30d)
      &entity=all|<uuid>           (default all)
      &q=<string>                  (learners only)
      &page=<int>                  (learners only)
      &view=<id>                   (community only: contributors | discussions | questions)
```

`tab` ∈ `overview | learning | audience | learners | courses | podcasts | community`

### Response envelope

```jsonc
{
  "tab": "overview",
  "meta": { "org_id": 1, "range": "30d", "entity": "all", "generated_at": "2026-10-12T09:00:00Z", "cached": false },
  "cards": {
    "activity_trend": {
      "title": "Activity over time",
      "heading": "2,431 learners · 847 new signups",   // optional; feeds the card header slot
      "kind": "trend",                                  // trend | bars | ranked | table
      "data": [ { "label": "Jan", "learners": 120, "signups": 48 } ],
      "xKey": "label",
      "series": [ { "key": "learners", "name": "Active learners" }, { "key": "signups", "name": "New signups" } ]
    }
  }
}
```

**Every card is self-describing**: `kind` tells the frontend which locked component to render, and the rest of the object **is** that component's props:

| `kind` | Component | Required fields |
|--------|-----------|-----------------|
| `trend` | `TrendChart` | `data`, `xKey`, `series[{key,name,color?}]`, `formatter?` |
| `bars` | `BarsChart` | `data`, `xKey`, `series[{key,name}]`, `formatter?`, `xTickFormatter?` |
| `ranked` | `RankedBars` | `data`, `categoryKey`, `valueKey`, `formatter?` |
| `table` | `DataTable` | `columns[{key,header,align?,width?,sortable?,variant?}]`, `rows[]`, optional `page`/`pageSize`/`total` (Learners) |

`variant` is a small rendering hint the frontend maps to a cell renderer — `mono` (path), `delta` (signed %), `percent` (plain %), `person` (avatar + name), `username` (`@handle`), `status` (verified dot), `date` (localized). Tab bodies stay dumb; the only per-tab escape hatch is `TabCard`'s optional `actionsColumn` (the Learners row action).

This is what makes Phase 6 mechanical: the tab body becomes `<card.kind → component>` with `{...card}` spread, and the mock file disappears.

---

## 3. `analytics_events` (Tier B)

```sql
analytics_events
├── id            bigserial   PK
├── org_id        bigint      NOT NULL  → organization.id (CASCADE)
├── user_id       bigint      NULL      → user.id (SET NULL)   -- null = anonymous
├── visitor_id    text        NOT NULL  -- anonymous id (new vs returning)
├── session_id    text        NOT NULL  -- groups a visit
├── event_name    text        NOT NULL  -- whitelist, see below
├── path          text        NULL      -- page path (page_view)
├── referrer      text        NULL
├── device        text        NULL      -- parsed at ingest: mobile | desktop | tablet
├── browser       text        NULL      -- parsed at ingest
├── duration_ms   int         NULL      -- time_on_activity
├── properties    jsonb       NOT NULL DEFAULT '{}'
└── created_at    timestamptz NOT NULL DEFAULT now()   -- a REAL timestamp (unlike the legacy tables)
```

Indexes: `(org_id, created_at)`, `(event_name, created_at)`, `(user_id, created_at)`, `(org_id, visitor_id)`.
Retention: raw 90 days; longer-term via daily rollups (only if we ever need them).

**Event taxonomy** (whitelist — ingest rejects anything else). Superset of the existing frontend list in `src/services/analytics/events.py`:

| Event | Emitted when | Feeds |
|---|---|---|
| `page_view` | any public page renders | Audience (traffic, sources, devices, top pages) |
| `course_view` | a course landing page renders | Overview stage "views", Courses |
| `activity_view` | a lesson opens | Courses (lesson views) |
| `time_on_activity` | lesson/episode loses focus | Time on activity, time per lesson, avg listened |
| `search_query` | a search runs | Content quality (later) |
| `checkout_started` | checkout begins | Revenue (out of scope here) |

Server-side events already emitted by the API (`course_enrolled`, `course_completed`, `activity_completed`, …) stay as they are — they keep Tinybird fed.

---

## 4. Metric map — every card → query → shape

Tier column: **A** = existing tables only, **B** = needs `analytics_events`.

### Overview — org-wide
| Card key | Title / kind | Tier | Source → query |
|---|---|---|---|
| `activity_trend` | Activity over time · trend | A | `learners` = `COUNT(DISTINCT user_id)` from `trailstep` per bucket; `signups` = `COUNT(*)` from `userorganization` per bucket |
| `enrollments_trend` | Enrollments over time · bars | A | `COUNT(*)` from `trailrun` (`run_type='RUN_TYPE_COURSE'`) per bucket |
| `enrollment_stage` | Enrollment by stage · bars | A | ordered stages: **Enrolled** (`trailrun`), **Started** (runs with ≥1 `trailstep`), **Completed** (`trailrun.status='STATUS_COMPLETED'`) |
| `top_courses` | Top courses · ranked | A | `trailrun` ⋈ `course` → count per course, `ORDER BY count DESC LIMIT 5` |
| `completion_by_course` | Completion by course · ranked | A | per course: completed runs ÷ total runs → `%` |

> "Views" as a funnel stage arrives with `course_view` events (after Phase 2); until then the stage card ships the 3-stage Tier A version.

### Learning — org-wide
| Card key | Title / kind | Tier | Source → query |
|---|---|---|---|
| `learning_trend` | Course starts & completions · trend | A | `starts` = runs whose first `trailstep` falls in the bucket; `completions` = `trailrun.status='STATUS_COMPLETED'` per bucket |
| `completion_by_course` | Completion by course · bars | A | same as Overview's, vertical orientation with truncated ticks |
| `lesson_dropoff` | Lesson drop-off · bars | A | completion rate by **lesson position** (normalised 10% buckets). Position comes from `coursechapter.order` (chapter) + `chapteractivity.order` (activity) — both exist, so this is queryable |
| `time_on_activity` | Time on activity · bars | **B** | avg `duration_ms` from `time_on_activity` events, grouped by activity type |
| `content_type_effectiveness` | Content type effectiveness · bars | A | `trailstep.complete` rate grouped by `activity.activity_type` (`TYPE_VIDEO · TYPE_DOCUMENT · TYPE_DYNAMIC · TYPE_ASSIGNMENT · TYPE_CUSTOM · TYPE_SCORM`) |

### Audience — org-wide (all Tier B)
| Card key | Title / kind | Tier | Source → query |
|---|---|---|---|
| `traffic_trend` | Traffic over time · trend | B | `visits` = `COUNT(*)` of `page_view`; `visitors` = `COUNT(DISTINCT visitor_id)`, per bucket |
| `sources` | Sources · bars | B | `page_view` grouped by `referrer` (normalised to a source name), top 5 |
| `devices` | Devices · bars | B | `page_view` grouped by the `device` column (parsed at ingest) |
| `top_pages` | Top pages · table | B | `page_view` grouped by `path`: views, visitors, avg `duration_ms`, change vs the previous bucket |

### Learners — org-wide
| Card key | Title / kind | Tier | Source → query |
|---|---|---|---|
| `learners_table` | (no title) · table | A | `user` ⋈ `userorganization` ⋈ `role` → name, username, email, role, status (`user.email_verified`), joined (`userorganization.creation_date`). Supports `q` + `page`. |
| `learner_detail` | learner-details card (dialog) | A | `user` + per-course `trailrun`/`trailstep` progress + `last_active` = `MAX(NULLIF(creation_date,'')::timestamp)` across their trail rows |

### Courses — course-scoped
| Card key | Title / kind | Tier | Source → query |
|---|---|---|---|
| `course_enrollment_trend` | Enrollments over time · trend | A | `enrollments` = `trailrun` for the course per bucket; `active` = `COUNT(DISTINCT trailstep.user_id)` per bucket |
| `course_completion_funnel` | Completion funnel · bars | A | Enrolled → Started → Halfway (≥50% of activities done) → Completed. **Certified** needs the certificate table → drops to 4 stages until confirmed |
| `course_learner_progress` | Learner progress · bars | A | per-run completion ratio → buckets 0–25 / 25–50 / 50–75 / 75–100 |
| `course_lesson_dropoff` | Lesson drop-off · ranked | A | `trailstep` per activity (ordered) → distinct learners per lesson |
| `course_time_per_lesson` | Time per lesson · ranked | **B** | avg `duration_ms` from `time_on_activity` per activity |
| `course_students` | (no title) · table | A | `trailrun` ⋈ `user` for the course → learner, email, enrolled, progress %, status |

### Podcasts — podcast-scoped
| Card key | Title / kind | Tier | Source → query |
|---|---|---|---|
| `podcast_listening_trend` | Listening over time · trend | A | `starts` = `trailrun` (`run_type='RUN_TYPE_PODCAST'`) per bucket; `completions` = completed episode steps |
| `podcast_episode_plays` | Episode plays · ranked | A | `trailstep` grouped by `episode_id` |
| `podcast_episode_completion` | Episode completion · ranked | A | per episode: completed ÷ started → `%` |
| `podcast_length_vs_listened` | Episode length vs listened · bars | **B** | `podcastepisode.duration_seconds` vs avg listened from `time_on_activity` |
| `podcast_series_progress` | Series progress · bars | A | episodes completed per listener → 0–25 / 25–50 / 50–75 / 75–100 buckets |
| `podcast_episodes` | (no title) · table | A | `podcastepisode` + play/completion counts → episode, status, duration, plays, completion |

### Community — community-scoped
| Card key | Title / kind | Tier | Source → query |
|---|---|---|---|
| `community_activity_trend` | Activity over time · trend | A | `discussion` + `discussioncomment` counts per bucket |
| `community_by_label` | Discussions by label · bars | A | `discussion` grouped by `label` (`general · question · idea · announcement · showcase`) |
| `community_detail_table` | (no title) · table | A | three views the action-row cycle button swaps: **contributors** (counts by `author_id`), **top discussions** (`discussion` ordered by `upvote_count`/comment count), **unanswered** (`label='question'` with 0 comments) |

---

## 5. Tier matrix — what can ship before Phase 2

| Ships on existing tables (Tier A) | Blocked on `analytics_events` (Tier B) |
|---|---|
| Overview (all 5 cards) · Learning (4/5) · Learners (all) · Courses (5/6) · Podcasts (5/6) · Community (all) | **Audience (all 4)** · `time_on_activity` · `course_time_per_lesson` · `podcast_length_vs_listened` |

So we can fully wire **5 of the 7 tabs** with zero new data collection. Audience is the only tab that *requires* the event pipeline.

**Plan gating:** keep the area at `standard+`. Individual Tier B cards degrade to an "insufficient data" empty state rather than a plan error.

---

## 6. Phases & exit criteria

| Phase | Deliverable | Done when |
|---|---|---|
| **0** | This contract | approved |
| **1** | `analytics_events` model + migration (+ any missing index) + event taxonomy constants | migration runs clean on a fresh DB from head `c9d0e1f2a3b4` |
| **2** | Ingest aligned to Postgres + frontend capture layer | an emitted `page_view` shows up in `analytics_events` |
| **3** | Query services, one module per tab domain, returning §4 shapes + Redis cache | golden-value tests pass on a seeded org |
| **4** | Query registry in the analytics router + `/analytics/tabs/{tab}` + envelope + gating | contract tests pass for all 7 endpoints |
| **5** | Seeded test org, golden values, `EXPLAIN` perf check, e2e emit→store→query | suite green, no sequential scans on the aggregates |
| **6** | Wire tabs one by one (Overview → Learning → Audience → Learners → Courses → Podcasts → Community), delete `mockAnalytics.ts` | every card reads real data, no mock imports remain |
| **7** | Export, caching polish, legacy `CourseAnalyticsTab` consolidation, docs sync | docs match reality |

**Progress:** phases **1–6 are done** — migrations round-tripped (single head), the dual-write ingest path is live, all seven `board()` builders exist and were verified against seeded fixtures with exact values, every `/analytics/tabs/{tab}` returns its §4 cards over HTTP, and all seven tabs read real data (mock file and the orphaned `RevenueTab` removed). Remaining: phase 7 (export, `EXPLAIN` perf pass, `CourseAnalyticsTab` consolidation).

---

## 7. Gotchas (verified against the schema)

1. **`creation_date` may be `''`** → always `NULLIF(...,'')::timestamp`. This is the #1 way these queries break.
2. **No `analytics_events` exists today** — events currently go to Tinybird (`events.datasource` with `timestamp DateTime`). Phase 2 is net-new wiring, not a rename.
3. **`run_type` is `VARCHAR` on existing DBs** (added in migration `e1f2a3b4c5d6`) but a model enum on a fresh `create_all` → compare as a plain string.
4. **`user` has `email_verified`, not `is_verified`.** Join date = `userorganization.creation_date` (the API's `joined_at`).
5. **Certificates & payments are EE-only** in this checkout → "Certified" funnel stage and all money metrics are deferred.
6. **`upvote_count` is denormalised** on `discussion`/`discussioncomment` — use it, don't re-count votes.
7. **Community listings sort by the string `creation_date`** (the composite index includes it) → lexicographic ordering; fine for ISO-8601, but don't mix formats at ingest.
8. **Lesson ordering lives on the join tables**, not the entities: `coursechapter.order` (chapter position) and `chapteractivity.order` (activity position). `chapter` and `activity` have no `order` column — don't look for one.
9. **The upper date bound must be the *next* day.** The VARCHAR dates carry a time component (`2026-10-13T09:08:18`), so `< today` silently excludes everything created today. Use a half-open window `[start, end + 1 day)` — see `date_bounds()` in `tabs/_shared.py`.
10. **The live DB is stricter than the models.** `userorganization.role_id`, `user.failed_login_attempts`, `user.is_superadmin` and `activity.current_version` are all `NOT NULL` in Postgres although the SQLModel declares them defaulted/optional, and `trailrun` carries a `uq_trailrun_trail_course_user` unique constraint (one run per trail + course + user). Seeding fixtures (Phase 5) must satisfy the *live* constraints — check `information_schema.columns` / `pg_indexes` rather than trusting the model.
11. **Enum labels are UPPERCASE in Postgres but lowercase in the models.** The live `locktype` / `activitylocktype` labels are `PUBLIC · AUTHENTICATED · RESTRICTED`, while `LockType.PUBLIC == "public"`. Writing through the SQLModel would fail on insert; always compare/insert the uppercase label.
12. **`user` is a reserved word** → every hand-written SQL that touches it must quote the identifier (`FROM "user" u`). Raw `text()` also treats `::` as a bind marker, so casts go through `CAST(:param AS jsonb)`, never `:param::jsonb`.
13. **Names live on `user`, not a profile table**, and are nullable-ish: display name = `COALESCE(NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), username)`. Several `NOT NULL` boolean/int defaults (`email_verified`, `is_superadmin`, …) mean an insert that omits them fails.
14. **Community "contributors" counts what each member *wrote*** (discussions they authored + comments they authored + their reactions) — not comments received on their threads. The two are easy to conflate in one joined query.
15. **Podcast/episode time is Tier B with no emitter yet.** `podcast_length_vs_listened` reads `time_on_activity` keyed by `properties->>'episode_uuid'`; the course activity player is the only thing that emits `time_on_activity` today, so the card is intentionally empty until the podcast player emits it.

---

## 8. Related

- [Analytics — Feature Catalog & Plan](./overview.md) — metrics, tiers, UI rules, sub-tabs
- [Revenue Analytics](../payments/revenue-analytics.md) — the separate Revenue section
- [Data Model](../../02-architecture/data-model.md) — core entities
