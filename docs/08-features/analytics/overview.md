# Analytics — Feature Catalog & Plan

> **Status:** Proposed
> **Approach:** Build on infrastructure we already run (Postgres) instead of adding a dedicated analytics engine.
> **Out of scope:** Session replay, heatmaps, and AI anomaly detection (see §4).

---

## 1. Method (the short version)

Every metric belongs to one of three tiers:

| Tier | What it means | New infrastructure |
|------|---------------|--------------------|
| **A** | Already stored in existing Postgres tables (`users`, `user_organizations`, `trail_runs`, `trail_steps`, `courses`, payments…) | **None** — just SQL |
| **B** | Behavioral events (page views, clicks, dwell time) written to **one** new `analytics_events` table in Postgres | **One table** |
| **C** | Errors / crashes | **None** — already handled by `@sentry/nextjs` |

Rendering is **our own** — reusable chart/table components querying our own API. No third-party dashboard, no external event engine.

> **Why not PostHog / Tinybird self-hosted:** both need ~8–16 GB RAM and ~100 GB storage (ClickHouse + Kafka / ClickHouse + region container). That is the same weight class and is rejected — see §5.

---

## 2. ✅ Core metrics we will build

Grouped by area. Every row here is achievable with the method above.

### 2.1 Traffic & Audience

| Metric | Example question | Source | Tier |
|--------|------------------|--------|------|
| Pageviews & unique visitors | "How many saw the course page?" | `analytics_events` (`page_view`) | B |
| New vs returning | "Fresh or repeat visitors?" | `analytics_events` (visitor id) | B |
| Referrer / source | "Google or Instagram?" | `analytics_events.referrer` | B |
| UTM campaigns | "Which ad drove signups?" | `analytics_events.properties.utm_*` | B |
| Device / browser / OS | "% on mobile?" | parsed user-agent on `analytics_events` | B |
| Real-time active users | "Who's on right now?" | recent `analytics_events` | B |
| DAU / WAU / MAU | "Active this month?" | distinct users per period from events | B |

### 2.2 Signups & Onboarding

| Metric | Example question | Source | Tier |
|--------|------------------|--------|------|
| Signups per day / org | "How many joined this week?" | `users`, `user_organizations` | A |
| Email-verified rate | "How many verified?" | `users.is_verified` | A |
| Visit → signup conversion | "200 visitors → 12 signups" | events ⋈ `users` | B |

### 2.3 Money (highest priority)

| Metric | Example question | Source | Tier |
|--------|------------------|--------|------|
| Checkout started | "How many began buying?" | `analytics_events` (`checkout_started`) | B |
| Sales / completed orders | "How many bought?" | payments (Chargily) | A |
| Payment success / fail | "How many payments failed?" | payments / webhook result | A |
| Revenue per day/week/month (DZD) | "How much did we earn?" | payments | A |
| Revenue per course / org / teacher | "Which course earns most?" | payments joined | A |
| View → purchase conversion | "How many browsers became buyers?" | events ⋈ payments | B |
| AOV / ARPU | "Average order value?" | payments | A |
| Refunds | "How much refunded?" | payments | A |
| Gateway fees | "What did Chargily take?" | payments | A |
| Failed-payment reasons | "Why do payments fail?" | `analytics_events.properties.error` | B |

### 2.4 Learning Engagement

| Metric | Example question | Source | Tier |
|--------|------------------|--------|------|
| Enrollments | "How many enrolled?" | `trail_runs` | A |
| Course starts | "How many began?" | `trail_runs` | A |
| Activities completed | "Lessons finished?" | `trail_steps` | A |
| Completion rate per course | "% who finished?" | `trail_steps` / `trail_runs` | A |
| Time on activity | "How long on lesson 3?" | `analytics_events` (`time_on_activity`) | B |
| Avg session duration | "How long is a visit?" | `analytics_events` sessions | B |

### 2.5 Retention & Value

| Metric | Example question | Source | Tier |
|--------|------------------|--------|------|
| Churn (paid but inactive) | "Who paid then stopped?" | payments ⋈ activity | A |
| Repeat purchases | "Bought twice?" | payments | A |
| Lifetime value (LTV) | "Value per user?" | payments aggregate | A |

### 2.6 Content Quality

| Metric | Example question | Source | Tier |
|--------|------------------|--------|------|
| Top / least popular courses | "Which is loved?" | views + enrollments | A |
| Completion funnel per course | "Where do learners quit?" | `trail_steps` | A |
| Search queries | "What are they searching?" | `analytics_events` (`search_query`) | B |
| Searches with no results | "What can't they find?" | `analytics_events` (result count) | B |
| Content type effectiveness | "Video vs quiz?" | `trail_steps` by type | A |

### 2.7 Per-org / Multi-tenant / Payouts

| Metric | Example question | Source | Tier |
|--------|------------------|--------|------|
| Per-org users / revenue / enrollments | "How is org X doing?" | filtered by `org_id` | A |
| Org growth over time | "Is this org growing?" | `user_organizations` | A |
| Teacher gross → fees → net → 40/60 | "What does teacher Y get?" | payments + split logic | A |
| Active teachers | "Who's publishing?" | courses/authors | A |

### 2.8 User-level views

| Metric | Example question | Source | Tier |
|--------|------------------|--------|------|
| A user's activity history | "What did this learner do?" | `analytics_events` by user | B |
| A user's progress / courses | "Where are they stuck?" | `trail_runs` / `trail_steps` | A |

### 2.9 Product health

| Metric | Example question | Source | Tier |
|--------|------------------|--------|------|
| Frontend errors + stack traces | "What's crashing?" | **Sentry** (already installed) | C |
| Failed API calls | "Which endpoint errors?" | API logs | A |
| Payment failures | "Gateway errors?" | payments | A |

---

## 3. ⚠️ Deferred — low priority (build later or skip)

These are **possible** with the same method but need extra plumbing (geo lookups, session grouping, precomputed rollups). **Treat as last priority.** We revisit only after the ✅ set is live.

| Metric | Why deferred |
|--------|--------------|
| Country / geography | needs a MaxMind (or similar) IP→country lookup, plus a data file we must keep updated |
| Bounce rate & exit pages | needs session boundaries inferred from events |
| Signup funnel step-by-step drop-off | funnel-over-events, needs ordered-step logic |
| Drop-off per lesson | needs per-learner progression precompute over `trail_steps` |
| Return rate (1 / 7 / 30-day) | cohort SQL — must be precomputed to be fast |
| Cohort retention tables | same — a daily rollup job |
| Web Vitals / slow pages | better served by Sentry/RUM than by DIY capture |

> **Decision rule:** if it needs a nightly rollup job or an external data file, it goes here until the core is done.

---

## 4. ❌ Out of scope (won't build)

| Feature | Why |
|---------|-----|
| Session replay | heavy storage + records protected course content (conflicts with the video-DRM/privacy rule) |
| Click / scroll heatmaps | needs coordinate capture + a rendering layer; low value vs effort |
| AI anomaly detection / "insights" | needs a real ML pipeline |
| Feature-flag / A-B platform | not an analytics need; a *light* per-user variant flag in Postgres is possible later if wanted |

---

## 5. Rejected tools (and why)

| Tool | Verdict | Reason |
|------|---------|--------|
| **PostHog** | ❌ Rejected | ~8 GB+ RAM, 4 cores, 50 GB, Kafka + ClickHouse; session replay leaks paid content |
| **Tinybird self-managed** | ❌ Rejected | 4 vCPU / **16 GB** RAM / 100 GB ClickHouse + 10 GB Redis — same weight class as PostHog |
| **Tinybird Cloud (current)** | 🟡 Optional | costs ~0 local resources, but events leave the infra (violates the self-host rule) — keep only as an optional mirror |
| **Umami / Plausible CE / Matomo** | 🟡 Optional | fine for traffic only; weak on custom **money/product** events, which is our priority |
| **ClickHouse self-hosted** | ⏳ Future escape hatch | ~2–4 GB; drop-in replacement for `analytics_events` **only if** Postgres stops keeping up |

---

## 6. UI — Analytics area

**Approach:** the Analytics area behaves like every other dashboard section — a **pill sub-navigation of tabs**, each tab built from **section cards** (white `rounded-xl border shadow-sm`, 13px uppercase gray-500 titles). A **date-range action row** sits above the content. Charts and tables are **reusable our-own components**.

**Layout rules** (12-column grid, top-to-bottom hierarchy):

- **Charts first — no KPI stat cards.** Stat cards are a *home page* pattern; inside an analytics tab they repeat one number each. Single numbers belong in the **card header** instead.
- **12-column grid** with `items-start`: one full-width hero per view, then 2-up rows.
- **One card = one question.** Features that answer the same question share one card.
- **Small component vocabulary:** (a) **bar chart** — vertical for short labels, horizontal for long labels (course names); (b) **trend chart** (line/area) for anything over time; (c) **data table** for detail rows. Other chart types are avoided unless they earn their place.
- **No entity filter in the global bar.** The filter belongs to the tab that owns the entity (a Courses tab selects a course, a Podcasts tab selects a podcast, a Community tab selects a community).

### Sub-tabs

| # | Sub-tab | Scope | Core question it answers |
|---|---------|-------|--------------------------|
| 1 | **Overview** | Org-wide | "Is the platform healthy right now?" |
| 2 | **Learning** | Org-wide | "Are learners using the content?" |
| 3 | **Audience** | Org-wide | "Where does traffic come from?" |
| 4 | **Learners** | Org-wide (search) | "What is this specific user doing?" |
| 5 | **Courses** | Select a course | "How is this course doing?" |
| 6 | **Podcasts** | Select a podcast | "Is anyone listening?" |
| 7 | **Community** | Select a community (+ table switch) | "Is the community alive?" |

**"The entity owns its selector":** the org-wide tabs (Overview, Learning, Audience, Learners) carry no entity filter; **Courses**, **Podcasts** and **Community** each put their own selector in the shared action row.

> **Revenue is not here.** Money is deep and audience-different (teachers, payouts, refunds, failures), so it is its own dashboard section — see [Revenue Analytics](../payments/revenue-analytics.md). The Revenue tab was **removed from the Analytics shell** for this reason.

*(Optional future: **Platform** — superadmin only, compares all orgs. Open question: whether **Learning** merges into **Courses**, since both cover enrollments/completion.)*

### Section cards per sub-tab

**1. Overview** — org-wide, chart-only. Row 1 full width, then two 2-up rows.
| Card | Content | Chart type |
|------|---------|-----------|
| Activity over time | Active learners + new signups | Trend (area) |
| Enrollments over time | Enrollments per period | Bar |
| Enrollment by stage | View → enroll → start → complete | Bar (ordered) |
| Top courses | Ranked by enrollments | Horizontal bar |
| Completion by course | Completion rate per course | Horizontal bar |

**2. Learning**
| Card | Content | Chart type |
|------|---------|-----------|
| Completion by course | Per-course completion rate | Bar |
| Lesson drop-off | Where learners quit | Bar (ordered) |
| Time on activity | Minutes per activity | Bar |
| Content type effectiveness | Video vs quiz vs reading | Bar |

**3. Audience**
| Card | Content | Chart type |
|------|---------|-----------|
| Traffic over time | Visits/pageviews | Trend |
| Sources | Referrers / UTM | Bar |
| Devices | Desktop / mobile / tablet | Breakdown list |
| Top pages | Most-viewed pages | Table |

**4. Learners**
| Card | Content | Chart type |
|------|---------|-----------|
| Search + filters | Find a user (name/email) | Controls |
| Learners table | Last active · Courses · Progress · Spent · Status | Table |
| User detail (drill-in) | Activity history + progress timeline | Table + timeline |

**5. Courses** — course-scoped (selector in the action row)
| Card | Content | Chart type |
|------|---------|-----------|
| Enrollments over time | New enrollments + active learners | Trend (area) |
| Completion funnel | Enrolled → started → halfway → completed → certified | Bar |
| Learner progress | Progress distribution (0–25 … 75–100%) | Bar |
| Lesson drop-off | Views per lesson | Horizontal bar |
| Time per lesson | Avg minutes per lesson | Horizontal bar |
| Students | Learner · enrolled · progress · status | Table |

**6. Podcasts** — podcast-scoped (selector in the action row)
| Card | Content | Chart type |
|------|---------|-----------|
| Listening over time | Episode starts + completions | Trend (area) |
| Episode plays | Plays per episode | Horizontal bar |
| Episode completion | Completion % per episode | Horizontal bar |
| Episode length vs listened | Minutes, grouped | Bar |
| Series progress | How far listeners get | Bar |
| Episodes | Episode · status · duration · plays · completion | Table |

**7. Community** — community-scoped (selector + cycle button in the action row)
| Card | Content | Chart type |
|------|---------|-----------|
| Activity over time | Discussions + comments | Trend (area) |
| Discussions by label | General / Q&A / Ideas / Show & Tell / Announcements | Bar |
| Detail table (swaps) | Contributors · Top discussions · Unanswered — swapped by the cycle button | Table |

### Shared UI pieces

**Component library — built & locked** (live in `apps/web/components/Analytics/`):
- `TrendChart` — area/line over time · `BarsChart` — vertical bars (single or grouped) · `RankedBars` — horizontal bars / top-N (auto-sized label column) · `BreakdownList` — distribution · `FunnelSteps` — conversion funnel (kept in the library; unused)
- `DataTable` — sortable, fully column-driven (checkbox select, avatar cells, role dropdown, status dot, actions all via `render`). **No pagination** — the card grows with the list; **no in-table title** — the `SectionCard` owns it; uniform `px-6` gutters.
- `SectionCard` / `ChartCard` — the white card shells (13px uppercase gray-500 titles). `SectionCard` has a **`bleed`** mode for tables: drops the horizontal padding so rows hover edge-to-edge.
- `AnalyticsToolbar` — the shared action row (date range on the right, tab controls on the left)
- `FilterSelect` — the entity selector used by the Courses / Podcasts / Community tabs: a filter-icon trigger + the platform's **card-styled dropdown menu** (no native `<select>` popup)
- `SearchInput` — the Learners search field (Users/Contributors styling)
- `DeltaBadge` (arrow + colored value, no pill) · `EmptyState` / `Skeleton` / `ChartSkeleton` (states)
- `useChartTheme()` — reads live `:root` CSS vars; categorical series use the platform palette (`#6b8de3 · #818cf8 · #a78bfa · #c4b5fd`)
- `StatCard` — kept for the **dashboard home**; never used inside analytics tabs

**Assembled tabs** (live in `apps/web/components/Dashboard/Analytics/`):
- `AnalyticsTabs` — the pill-tab shell (page title · pill tab bar · shared action row), same pattern as the dashboard settings pages; 7 tabs, each owning its selector when it has an entity
- `tabs/OverviewTab` · `tabs/LearningTab` · `tabs/AudienceTab` · `tabs/LearnersTab` · `tabs/CoursesTab` · `tabs/PodcastsTab` · `tabs/CommunityTab`
- `mockAnalytics.ts` — the placeholder dataset every tab renders from until the API is wired

---

## 7. `analytics_events` schema (Tier B)

```
analytics_events
├── id            bigserial   PK
├── org_id        bigint      (multi-tenant filter)
├── user_id       bigint NULL (null for anonymous visitors)
├── visitor_id    text        (anonymous id, for new-vs-returning)
├── session_id    text        (groups events into a visit)
├── event_name    text        (page_view, course_view, checkout_started, …)
├── properties    jsonb       (referrer, utm_*, course_id, price, error, …)
└── created_at    timestamptz (indexed)

Indexes: (org_id, created_at), (event_name, created_at), (user_id, created_at)
Retention: keep raw 30–90 days; keep daily rollups long-term.
```

Ingestion goes through the existing FastAPI (events validated against a whitelist of `event_name`s). Queries are SQL, cached in Redis like the current analytics router.

---

## 8. Related

- [PostHog Integration Plan](./posthog-integration-plan.md) — **rejected**; kept for the record
- [Payments — Overview](../payments/overview.md) — payment/order data source
- [Revenue Analytics](../payments/revenue-analytics.md) — the separate Revenue dashboard section (money moved out of Analytics)
- [Data Model](../../02-architecture/data-model.md) — core entities
