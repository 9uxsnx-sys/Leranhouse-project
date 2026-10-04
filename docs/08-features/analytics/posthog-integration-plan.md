# PostHog Analytics Integration Plan

> **Status:** Planned
> **Target:** Post-redesign release
> **Type:** Self-hosted open-source analytics platform

---

## 1. Overview

Integrate [PostHog](https://posthog.com/) (MIT-licensed, 38K+ GitHub stars) as the platform's **native product analytics engine**. PostHog is an all-in-one developer platform that bundles 15+ products under one data model: product analytics, session replay, heatmaps, feature flags, A/B testing, surveys, error tracking, web analytics, data warehouse, CDP, LLM observability, user profiles, group analytics, AI signals, and structured logging.

### Why PostHog (vs. current setup)

| Capability | Current (Tinybird + Umami) | PostHog |
|---|---|---|
| Event tracking | 14 predefined events, manual instrumentation | Auto-capture + custom events, 1 SDK |
| Funnels | 1 predefined SQL query | Drag-and-drop builder, any steps |
| Session replay | None | Full replay + AI summaries + DOM explorer |
| Heatmaps | None | Click, scroll, rage-click |
| Feature flags | None | Full flag system + multivariate + kill switch |
| A/B testing | None | Bayesian experiments with statistical rigor |
| Surveys | None | In-product surveys + NPS + targeting |
| Error tracking | None | Error monitoring + linked to session replay |
| User profiles | None | Full profiles + event history + flag state |
| AI insights | None | Anomaly detection + auto-fix PRs via MCP |
| Data ownership | Data goes to Tinybird Cloud | Self-hosted, data stays on own infrastructure |

### What happens to existing analytics

- **Tinybird pipeline** remains untouched as a backup/fallback. The 49 SQL queries and 9 API endpoints continue to work.
- **Umami** can be replaced by PostHog's built-in web analytics (same pageview tracking, no cookies, no Umami script needed).
- **Migration path:** Send events to both Tinybird + PostHog during transition, then phase out Umami and optionally Tinybird once PostHog is stable.

---

## 2. Architecture

### High-Level Data Flow

```
User Browser / Mobile App
        │
        ▼
┌───────────────────────────────────┐
│  PostHog JS SDK (posthog-js)      │
│  • Auto-capture clicks/pageviews  │
│  • Session recording              │
│  • Feature flag evaluation        │
│  • Survey rendering               │
│  • Error capture                  │
└──────────┬────────────────────────┘
           │
           ▼
┌───────────────────────────────────┐
│  PostHog Proxy (next.config.js)   │
│  • /ingest/* → PostHog backend    │
│  • Avoids ad-blockers             │
│  • Same pattern as current /umami │
└──────────┬────────────────────────┘
           │
           ▼
┌───────────────────────────────────┐
│  PostHog Self-Hosted Backend      │
│  • ClickHouse (event storage)     │
│  • PostgreSQL (metadata)          │
│  • Redis (cache + queues)         │
│  • Kafka (event pipeline)         │
│  • Plugin server (CDP, exports)   │
└───────────────────────────────────┘
           │
           ▼
┌───────────────────────────────────┐
│  Analytics Tab (Frontend)         │
│  • PostHog's built-in dashboard   │
│    embedded or linked             │
│  • Custom widgets using HogQL API │
└───────────────────────────────────┘
```

### Layer Breakdown

```
Frontend (Next.js)
├── apps/web/services/analytics/posthog.ts   ← PostHog client init
├── apps/web/hooks/usePostHog.ts             ← React hook wrapper
├── apps/web/app/layout.tsx                  ← <PostHogProvider> + pageview tracking
├── apps/web/proxy.ts                        ← /ingest/* rewrite to PostHog
├── apps/web/next.config.js                  ← PostHog proxy rewrites
├── apps/web/.env.local                      ← NEXT_PUBLIC_POSTHOG_KEY, POSTHOG_HOST
│
API (FastAPI)
├── apps/api/src/services/analytics/posthog/ ← Server-side PostHog client
│   ├── __init__.py
│   ├── client.py                            ← PostHog REST API client init
│   └── events.py                            ← Server-side event capture helpers
├── apps/api/src/routers/analytics/posthog.py ← PostHog-specific endpoints
├── apps/api/config/config.yaml              ← posthog_config block
│
Infrastructure (Self-Hosted)
├── docker-compose.posthog.yml               ← PostHog services (ClickHouse, PG, Redis, Kafka, app)
├── .env.posthog                              ← PostHog config (secrets, domains)
│
Analytics Tab (Frontend UI)
├── apps/web/components/Dashboard/Analytics/PostHog/
│   ├── PostHogDashboard.tsx                 ← Embedded PostHog dashboard or custom UI
│   ├── SessionReplayPanel.tsx               ← Session replay viewer
│   ├── FeatureFlagsPanel.tsx                ← Feature flag manager
│   ├── ExperimentsPanel.tsx                 ← A/B test results viewer
│   ├── SurveysPanel.tsx                     ← Survey builder/results
│   ├── ErrorTrackingPanel.tsx               ← Error monitoring view
│   └── HeatmapViewer.tsx                    ← Heatmap overlay
├── apps/web/app/orgs/[orgslug]/dash/analytics/page.tsx ← Add PostHog tab
```

---

## 3. Implementation Steps

### Phase 1: Infrastructure (Setup Self-Hosted PostHog)

1. **Create `docker-compose.posthog.yml`** at repo root with:
   - PostHog app (web + worker)
   - ClickHouse (event analytics database)
   - PostgreSQL (metadata)
   - Redis (caching + queue)
   - Kafka + Zookeeper (event pipeline)
   - PostHog plugin server (CDP, exports)
   - Reference: [PostHog self-host docker-compose](https://github.com/PostHog/posthog/blob/master/docker-compose.yml)

2. **Create `.env.posthog`** with:
   - `POSTHOG_SECRET_KEY`
   - `POSTHOG_CLICKHOUSE_PASSWORD`
   - `POSTHOG_POSTGRES_PASSWORD`
   - `POSTHOG_REDIS_PASSWORD`
   - `POSTHOG_HOST` (e.g., `https://posthog.learnhouse.local`)
   - `SITE_URL` (the platform's public URL)

3. **Add PostHog services to the main docker-compose** or keep as a separate compose file (recommended: separate file for modularity).

4. **Add config block in `apps/api/config/config.yaml`:**
   ```yaml
   posthog:
     enabled: true
     host: ${POSTHOG_HOST}
     api_key: ${POSTHOG_API_KEY}
     personal_api_key: ${POSTHOG_PERSONAL_API_KEY}  # for read access
   ```

5. **Add env vars to `apps/web/.env.example` and `apps/api/.env.example`:**
   ```
   # PostHog
   NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
   NEXT_PUBLIC_POSTHOG_HOST=https://posthog.learnhouse.local
   POSTHOG_API_KEY=phx_xxx
   POSTHOG_PERSONAL_API_KEY=xxx
   ```

### Phase 2: Frontend SDK Integration

1. **Create `apps/web/services/analytics/posthog.ts`:**
   ```typescript
   import posthog from 'posthog-js'
   import { getConfig } from '../config/config'

   export function initPostHog() {
     const key = getConfig().NEXT_PUBLIC_POSTHOG_KEY
     const host = getConfig().NEXT_PUBLIC_POSTHOG_HOST
     if (typeof window !== 'undefined' && key && host) {
       posthog.init(key, {
         api_host: host,
         autocapture: true,          // auto-capture clicks, pageviews, etc.
         capture_pageview: false,    // we'll send pageviews manually via router
         capture_performance: true,  // web vitals
         session_recording: {
           maskAllInputs: true,      // privacy: mask sensitive input values
           maskAllText: false,       // keep visible text readable
         },
         advanced_diagnostics: true, // error tracking
         loaded: (posthog) => {
           if (process.env.NODE_ENV === 'development') {
             posthog.opt_out_capturing()  // disable in dev
           }
         },
       })
     }
   }

   export function captureEvent(event: string, properties?: Record<string, any>) {
     posthog.capture(event, properties)
   }

   export function identifyUser(userId: string, traits?: Record<string, any>) {
     posthog.identify(userId, traits)
   }

   export function resetUser() {
     posthog.reset()
   }
   ```

2. **Create `apps/web/hooks/usePostHog.ts`:**
   ```typescript
   import { useEffect } from 'react'
   import { usePathname, useSearchParams } from 'next/navigation'
   import posthog from 'posthog-js'

   export function usePostHogPageView() {
     const pathname = usePathname()
     const searchParams = useSearchParams()

     useEffect(() => {
       if (pathname) {
         posthog.capture('$pageview', {
           $current_url: pathname + (searchParams?.toString() ? `?${searchParams}` : ''),
         })
       }
     }, [pathname, searchParams])
   }
   ```

3. **Update `apps/web/app/layout.tsx`:**
   - Add `initPostHog()` call in a `useEffect` or in a `PostHogProvider` component
   - Add `usePostHogPageView()` hook call for automatic pageview tracking
   - Wrap the app in PostHog's `PostHogProvider` for feature flag evaluation

4. **Update `apps/web/proxy.ts`:** Add rewrite rule:
   ```typescript
   {
     source: '/ingest/:path*',
     destination: `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/:path*`,
   }
   ```

5. **Update `apps/web/next.config.js`:** Add PostHog host to allowed domains if needed.

### Phase 3: Server-Side Event Tracking

1. **Create `apps/api/src/services/analytics/posthog/client.py`:**
   ```python
   from posthog import Posthog
   from src.config import settings

   posthog_client = Posthog(
       project_api_key=settings.POSTHOG_API_KEY,
       host=settings.POSTHOG_HOST,
   )

   def capture_server_event(
       distinct_id: str,
       event: str,
       properties: dict | None = None,
       groups: dict | None = None,
   ):
       """Capture a server-side event with optional group analytics."""
       posthog_client.capture(
           distinct_id=distinct_id,
           event=event,
           properties=properties or {},
           groups=groups or {},
       )
   ```

2. **Create `apps/api/src/services/analytics/posthog/events.py`:**
   - Map existing Tinybird events (course_enrolled, course_completed, etc.) to PostHog events
   - Add new PostHog-specific events (session_start, feature_flag_triggered, etc.)
   - Add group analytics calls for org-level tracking

3. **Update existing routers** to fire PostHog events alongside (or instead of) Tinybird events.

### Phase 4: Analytics Tab UI

1. **Update `apps/web/app/orgs/[orgslug]/dash/analytics/page.tsx`:**
   - Add a new tab "PostHog" alongside the existing "Overview" and "Advanced" tabs
   - Or, embed PostHog's shared dashboard via iframe (quick option)
   - Or, build custom UI components using PostHog's HogQL API (better integration)

2. **Build PostHog UI Components** (in `apps/web/components/Dashboard/Analytics/PostHog/`):
   - `PostHogDashboard.tsx` — Main PostHog dashboard view with navigation
   - `SessionReplayPanel.tsx` — List + player for session recordings
   - `FeatureFlagsPanel.tsx` — View/create/edit feature flags
   - `ExperimentsPanel.tsx` — View A/B test results
   - `SurveysPanel.tsx` — Create surveys and view responses
   - `ErrorTrackingPanel.tsx` — Error list with stack traces
   - `HeatmapViewer.tsx` — Heatmap overlay selector

3. **PostHog API authentication** — Use Personal API Key for server-to-server API calls:
   ```
   GET {POSTHOG_HOST}/api/projects/{project_id}/insights/
   GET {POSTHOG_HOST}/api/projects/{project_id}/session_recordings/
   GET {POSTHOG_HOST}/api/projects/{project_id}/feature_flags/
   GET {POSTHOG_HOST}/api/projects/{project_id}/experiments/
   GET {POSTHOG_HOST}/api/projects/{project_id}/surveys/
   ```

### Phase 5: Feature Flags Integration

1. **Create `apps/web/hooks/useFeatureFlag.ts`:**
   ```typescript
   import { usePostHog } from './usePostHog'

   export function useFeatureFlag(key: string, defaultValue = false): boolean {
     const posthog = usePostHog()
     return posthog?.getFeatureFlag(key) ?? defaultValue
   }

   export function useFeatureFlagVariant(key: string, defaultValue = 'control'): string {
     const posthog = usePostHog()
     return posthog?.getFeatureFlag(key) ?? defaultValue
   }
   ```

2. **Create server-side flag evaluation** in the API for backend feature gating.

3. **Use feature flags** to control rollout of new features (e.g., new course player, redesigned dashboard).

### Phase 6: Dual-Write Migration (Optional)

1. Create a migration mode where events are sent to **both** Tinybird and PostHog simultaneously.
2. Add a config toggle: `ANALYTICS_PROVIDER = "tinybird" | "posthog" | "both"`
3. Monitor both systems in parallel for a validation period.
4. Once validated, switch default to `"posthog"` and keep Tinybird as cold backup.

---

## 4. PostHog Feature Details (What Each Enables in the Analytics Tab)

### 4.1 Product Analytics
- **Trends panel:** Any event over time with breakdowns by any property
- **Funnels builder:** Define arbitrary multi-step funnels visually (e.g., Visit Course → Enroll → Complete First Activity → Finish Course)
- **Retention tables:** % of users returning after 1d/7d/30d, grouped by cohort
- **Path analysis:** Visual user flow through pages and events
- **SQL access (HogQL):** Write raw SQL queries against all event data

### 4.2 Session Replay
- Watch recorded user sessions with full DOM state
- Filter by user, event, error, feature flag, or any property
- Console logs, network activity, performance metrics visible in replay
- AI session summaries auto-generate bullet points of key moments
- Save playlists of related sessions

### 4.3 Heatmaps
- Click heatmaps overlaid on any page
- Scroll depth visualization
- Rage-click detection (frustrated repeated clicks on non-interactive elements)

### 4.4 Feature Flags
- Create flags with percentage rollouts, user targeting, or group targeting
- Multivariate flags (multiple variants per flag)
- Instant kill switch to disable any feature
- Flags evaluated in-browser (milliseconds, no server round-trip) or server-side
- Full audit log of flag changes

### 4.5 A/B Testing (Experiments)
- Create experiments tied to feature flags
- Define success metrics (any event or property)
- Bayesian statistical analysis with automatic winner detection
- Sample size estimation before starting

### 4.6 Surveys
- Create in-product surveys (popup, sidebar, button, full-screen)
- Question types: rating, NPS, multiple choice, open text, link
- Target surveys by user properties, feature flags, or events
- Responses linked to user profiles and session replays

### 4.7 Error Tracking
- Capture frontend exceptions and unhandled rejections
- Group similar errors by stack trace
- Link errors directly to session replays
- Trend charts, assignees, status tracking

### 4.8 Web Analytics
- Pageviews, unique visitors, bounce rate, traffic sources
- UTM campaign attribution
- Real-time active users
- Country, device, browser breakdowns

### 4.9 Data Warehouse
- Import data from Stripe, HubSpot, Zendesk, S3, PostgreSQL
- Query external data alongside PostHog events using HogQL
- Scheduled exports to Snowflake, BigQuery

### 4.10 CDP (Customer Data Platform)
- Real-time audience sync to 25+ destinations (Google Ads, Facebook, Slack, etc.)
- Create segments by any behavior/property and sync automatically

### 4.11 LLM / AI Observability
- Capture LLM prompt completions, token usage, latency, costs
- Trace AI calls back to individual users
- Monitor per-feature AI costs

### 4.12 User Profiles
- Complete user profiles with all events, properties, replays, flag states, survey responses
- Group analytics (org-level tracking — e.g., "Org X has 50 users, 20 completions")
- Search, filter, and export user data

### 4.13 AI Signals (MCP)
- Auto-detected anomalies (e.g., "Enrollment rate dropped 40% in 24 hours")
- PostHog MCP server enables AI agents to query data, generate reports, and even open PRs with fixes

### 4.14 Logs
- Structured server-side log capture
- Searchable by level, source, message
- Logs linked to user sessions

---

## 5. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Self-hosted vs Cloud | Self-hosted (initially) | Data stays on own infrastructure; full feature access; no per-event costs |
| PostHog version | PostHog Cloud free tier (1M events/mo) for initial dev/testing, then self-host for production | Quickest path to start; self-host when scale demands it |
| Auto-capture | Enabled (with input masking) | Reduces manual instrumentation; masks sensitive fields (passwords, credit cards) |
| Session recording | On by default (masked inputs) | Most valuable debugging tool; privacy-safe with masking |
| Umami replacement | Yes, after PostHog is stable | Eliminates redundant tracking; one SDK instead of two |
| Tinybird retention | Keep as backup/fallback | No reason to remove; provides redundancy and a second data source |
| Frontend dashboard | Custom UI via PostHog API (not iframe) | Native look and feel; integrates with existing nav and auth |
| Feature flag evaluation | Client-side (posthog-js) + Server-side (posthog-python) | Flags needed in both contexts; SDKs handle this natively |

---

## 6. Dependencies & Requirements

### Infrastructure Requirements (Self-Hosted)
- **Docker** with at least 8GB RAM allocated (PostHog + ClickHouse + Kafka are memory-intensive)
- **CPU:** 4+ cores recommended
- **Storage:** 50GB+ for ClickHouse data (scales with event volume)
- **Domains:** `posthog.learnhouse.local` (or production domain) with SSL

### Third-Party Packages
- **Frontend:** `posthog-js` (npm)
- **API:** `posthog` (pip)
- **Infrastructure:** PostHog Docker images from Docker Hub

### Environment Variables
```
# Frontend (Next.js)
NEXT_PUBLIC_POSTHOG_KEY=           # PostHog project API key (public)
NEXT_PUBLIC_POSTHOG_HOST=          # PostHog instance URL (public)

# API (FastAPI)
POSTHOG_API_KEY=                    # PostHog project API key (secret)
POSTHOG_PERSONAL_API_KEY=           # PostHog personal API key (for read access)
POSTHOG_HOST=                       # PostHog instance URL (internal)

# Docker
POSTHOG_SECRET_KEY=                 # PostHog app secret
POSTHOG_CLICKHOUSE_PASSWORD=        # ClickHouse password
POSTHOG_POSTGRES_PASSWORD=          # PostgreSQL password
POSTHOG_REDIS_PASSWORD=             # Redis password
```

---

## 7. Rollout Sequence

```
Phase 1: Infrastructure Setup (1-2 days)
  ├── Docker Compose for PostHog services
  ├── DNS + SSL for PostHog domain
  ├── Env vars configured
  └── PostHog accessible and accepting events

Phase 2: Frontend SDK (1 day)
  ├── posthog.ts service created
  ├── usePostHog hook created
  ├── Proxy/rewrite configured
  └── Auto-capture verified in dev tools

Phase 3: Server-Side Events (1-2 days)
  ├── PostHog Python client setup
  ├── Events mapped from Tinybird
  └── Dual-write mode active (Tinybird + PostHog)

Phase 4: Analytics Tab UI (2-3 days)
  ├── PostHog dashboard tab added
  ├── Session replay viewer
  ├── Feature flags UI
  └── Heatmaps, surveys, error tracking

Phase 5: Feature Flags (1 day)
  ├── useFeatureFlag hook
  ├── Server-side flag evaluation
  └── First feature gated behind PostHog flag

Phase 6: Migration & Cleanup (ongoing)
  ├── Validate PostHog data against Tinybird
  ├── Deprecate Umami script
  ├── Optionally keep Tinybird as backup
  └── Remove old analytics code if desired
```

---

## 8. Real-Life Examples for Each Feature

| Feature | Real-Life Scenario |
|---|---|
| **Funnels** | "40% of users who visit a course page never enroll. The funnel shows they get stuck at the pricing display." |
| **Session Replay** | "User reports 'I can't submit my assignment.' Watch the replay, see the file upload button does nothing on Safari, console shows a JS error." |
| **Heatmaps** | "Rage-clicks cluster on a non-clickable element that users expect to be a button. Redesign it." |
| **Feature Flags** | "Roll out new course player to 10% of users. Monitor completion rates. Kill switch if something breaks." |
| **A/B Testing** | "Test two enrollment page designs. Variant B has 23% higher conversion at 95% confidence. Ship it." |
| **Surveys** | "Show NPS survey after course completion. Users who score 0-3 have replays showing they struggled with navigation." |
| **Error Tracking** | "Error spike: `TypeError: Cannot read property 'title' of undefined`. Watch a replay, see it happens when instructor hasn't set a course title." |
| **User Profiles** | "Search for a stuck learner. See they failed 3 assignment submissions. Watch the replay. Discover Safari-specific bug." |
| **AI Signals** | "PostHog auto-detects 'Enrollment rate dropped 40% in last 24 hours' and correlates it with a new deployment." |

---

## 9. Open Questions (To Be Decided Before Implementation)

1. **Self-hosted vs PostHog Cloud?** — Self-host gives full control but requires infrastructure. Cloud is simpler but events leave the network. Recommendation: Start with Cloud free tier for development, self-host for production.
2. **Replace or coexist with Tinybird?** — Recommendation: Dual-write during validation, then decide. Keep Tinybird as cold backup regardless.
3. **Replace Umami?** — Yes. PostHog's web analytics covers the same use case without an extra script.
4. **Analytics tab: embed PostHog dashboard or build custom UI?** — Recommendation: Build custom UI components using PostHog's HogQL API for native look and feel.
5. **Session recording privacy policy?** — Need to define: which pages to record, what to mask, user opt-out mechanism, data retention period.
