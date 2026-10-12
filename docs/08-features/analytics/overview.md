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

## 6. UI — Analytics tab (proposal)

**Approach:** the Analytics area behaves like every other dashboard section — a **left sub-navigation of tabs**, each tab built from **section cards** (white `rounded-xl border shadow-sm`). A **global filter action-row** at the top (date range + org/course) drives every card. Charts and tables are **reusable our-own components**.

### Proposed sub-tabs

| # | Sub-tab | Who it's for | Core question it answers |
|---|---------|--------------|--------------------------|
| 1 | **Overview** | Everyone | "Is the platform healthy right now?" |
| 2 | **Revenue** | Admin / owner | "Are we making money?" |
| 3 | **Learning** | Admin / teacher | "Are learners using the content?" |
| 4 | **Audience** | Admin / marketing | "Where does traffic come from?" |
| 5 | **Learners** | Admin / support | "What is this specific user doing?" |
| 6 | **Community** | Admin | "Is the community alive?" |

*(Optional 7th: **Platform** — superadmin only, compares all orgs.)*

### Section cards per sub-tab

**1. Overview**
| Card | Content | Chart type |
|------|---------|-----------|
| KPI row | Active learners · New signups · Enrollments · Revenue · Completion % (each with Δ vs previous period) | Stat cards |
| Activity trend | Active users over time | Line / area |
| Enrollment funnel | Course view → enroll → start → complete | Funnel |
| Top courses | Ranked list | Horizontal bar / table |

**2. Revenue**
| Card | Content | Chart type |
|------|---------|-----------|
| KPI row | Revenue · Sales · AOV · View→purchase % · Refunded | Stat cards |
| Revenue over time | Daily/weekly revenue (DZD) | Area |
| Sales by course | Which courses earn | Bar / table |
| Checkout funnel | View → checkout started → paid | Funnel |
| Failed payments | Recent failures + reasons | Table |
| Teacher payouts | Gross → fees → net → 40/60 split | Table |

**3. Learning**
| Card | Content | Chart type |
|------|---------|-----------|
| KPI row | Enrollments · Completions · Avg completion % · Avg session | Stat cards |
| Completion by course | Per-course completion rate | Bar + table |
| Lesson drop-off | Where learners quit | Funnel / bar |
| Time on activity | Minutes per activity | Bar |
| Content type effectiveness | Video vs quiz vs PDF | Bar |

**4. Audience**
| Card | Content | Chart type |
|------|---------|-----------|
| KPI row | Visitors · Pageviews · New vs returning · Avg session | Stat cards |
| Traffic over time | Visits/pageviews | Line |
| Top pages | Most-viewed pages | Table |
| Sources | Referrers / UTM | Bar |
| Devices | Desktop / mobile / tablet | Donut |
| By org | Per-org traffic (multi-tenant) | Table |

**5. Learners**
| Card | Content | Chart type |
|------|---------|-----------|
| Search + filters | Find a user (name/email/org) | Controls |
| Learners table | Last active · Courses · Progress · Purchased · Status | Table |
| User detail (drill-in) | Activity history + progress timeline | Table + timeline |

**6. Community**
| Card | Content | Chart type |
|------|---------|-----------|
| KPI row | Discussions · Posts · Comments · Active members | Stat cards |
| Discussions trend | Posts over time | Line |
| Top contributors | Most active members | Table |

### Shared UI pieces to build once
- `StatCard` (label + value + delta)
- `LineChart` / `AreaChart` / `BarChart` / `HorizontalBar` / `Donut` / `Funnel`
- `DataTable` (sortable, paginated)
- `DateRangeFilter` + `OrgCourseFilter` (in the action row)
- `SectionCard` (the existing white card wrapper)

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
- [Data Model](../../02-architecture/data-model.md) — core entities
