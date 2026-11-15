# Frontend Architecture Overview

> Status: as-built · Last verified: 2026-11-15

> The LearnHouse frontend is a Next.js 16 App Router application (`apps/web/`) using React Server Components, Tailwind CSS v4, and a local UI kit **ported from Medusa UI design tokens** — there is no Medusa package dependency (see `apps/web/package.json`).

---

## Route Structure

All org pages live under `apps/web/app/orgs/[orgslug]/` and are split into two parallel route groups.

### `(withmenu)` — User-Facing Pages

Wrapped by a sidebar `OrgMenu` layout:

| Route | Page |
|-------|------|
| `/orgs/[orgslug]` | Org home |
| `/orgs/[orgslug]/courses` | Course listing |
| `/orgs/[orgslug]/course/[courseuuid]` | Course page |
| `/orgs/[orgslug]/course/[courseuuid]/activity/[activityid]` | Activity/lesson view |
| `/orgs/[orgslug]/collections`, `/collection/[collectionid]` | Collections |
| `/orgs/[orgslug]/communities`, `/community/[communityuuid]` | Communities and discussions |
| `/orgs/[orgslug]/podcasts`, `/podcast/[podcastuuid]` | Podcasts and episodes |
| `/orgs/[orgslug]/store` | Paid product catalogue (links to each resource page) |
| `/orgs/[orgslug]/account/[subpage]` | User account settings |
| `/orgs/[orgslug]/search` | Search |
| `/orgs/[orgslug]/trail` | Learning trail |
| `/orgs/[orgslug]/user/[username]` | Public user profile |
| `/orgs/[orgslug]/certificates/[uuid]/verify` | Certificate verification |
| `/orgs/[orgslug]/copilot` | AI copilot |
| `/orgs/[orgslug]/payment/[status]` | Payment return status |

Boards are **not** learner-facing here; they live in the dashboard (`/dash/boards`). Standalone editor/board/embed routes exist outside the org tree: `app/board/[boarduuid]`, `app/editor/main.ts`, `app/embed/[orgslug]` (layout only).

### `dash` — Admin Dashboard

| Route | Page |
|-------|------|
| `/orgs/[orgslug]/dash` | Dashboard home |
| `/dash/courses` (+ `course/[courseuuid]/[subpage]`, `migrate`) | Course management and editor tabs |
| `/dash/collections`, `/dash/collections/collection/[collectionuuid]/[subpage]` | Collections |
| `/dash/communities`, `/dash/communities/[communityuuid]/[subpage]` | Communities |
| `/dash/boards`, `/dash/boards/[boarduuid]/[subpage]` | Collaborative boards |
| `/dash/podcasts`, `/dash/podcasts/podcast/[podcastuuid]/[subpage]` | Podcasts |
| `/dash/playgrounds` | Playgrounds |
| `/dash/assignments`, `/assignments/[assignmentuuid]` | Assignments |
| `/dash/analytics` | Analytics |
| `/dash/notifications/[subpage]` | Notifications |
| `/dash/org/settings/[subpage]` | Organization settings |
| `/dash/payments/[subpage]` | Payments (overview, offers, transactions, payouts, configuration) |
| `/dash/users/settings/[subpage]` | Organization users, roles, user groups, access |

There is no `/dash/users` landing page — user management is reached through `/dash/users/settings/[subpage]`.

### Layout Chain

1. `app/layout.tsx` — root HTML shell, fonts, runtime config, `Providers`.
2. `app/orgs/[orgslug]/layout.tsx` — Server Component: fetches org metadata, `OrgProvider`, `OrgLanguageSync`, `NextTopLoader`, `Toast`, `Footer`.
3. `(withmenu)/layout.tsx` — `'use client'`: `SessionGate` → `OrgJoinBannerProvider` → `PodcastPlayerProvider` → `UserBreadcrumbProvider`; renders `PageViewTracker`, `OrgJoinBanner`, Google Font injection and the `OrgMenu` sidebar.
4. `dash/layout.tsx` — Server Component delegating to `ClientAdminLayout` (admin authorization, command palette, desktop/mobile menus, top bar, onboarding).

Route groups in parentheses do not add URL segments, so `(withmenu)` and `dash` share `/orgs/[orgslug]/` with different layouts.

---

## Server vs Client Components

- `page.tsx` files are Server Components by default: they fetch data, export `generateMetadata()`, and pass props to client components.
- Anything using hooks, browser APIs, or context has `'use client'` (layouts, forms, interactive widgets).
- `params` is a `Promise` and must be awaited in Server Components and `generateMetadata`; client components can read it with `use(props.params)`.

```tsx
export default async function Page(props: { params: Promise<{ orgslug: string; courseuuid: string }> }) {
  const params = await props.params
  // ...
}
```

---

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | App Router pages and route handlers |
| `app/api/` | `health`, `revalidate`, `robots`, `sitemap`, and the catch-all `v1/[...path]` proxy to the backend |
| `app/auth/` | Login, signup, forgot/reset, verify-email, SSO callback |
| `app/admin/` | Instance admin (superadmin) area |
| `components/ui/` | Local UI kit (see [ui-components](./ui-components.md)) |
| `components/Contexts/` | Auth, session, org, course, i18n, podcast contexts |
| `components/Dashboard/` | Dashboard pages, menus, analytics widgets |
| `components/Objects/` | Shared domain UI (courses, activities, communities, editor…) |
| `services/` | Typed API service layer (see [services](./services.md)) |
| `lib/` | Shared utilities (auth, i18n, SEO, fonts, constants) |
| `hooks/` | Cross-page hooks (analytics, contributor status, debounce, page views) |
| `locales/` | Translation JSON files |
| `styles/globals.css` | Global CSS and UI tokens |
| `ee/` | EE-only frontend code (multi-tenant resolver) |
| `proxy.ts` | Middleware: tenancy resolution and path rewrites |
| `next.config.js` | Next.js configuration (Sentry-wrapped) |

---

## How the Frontend Talks to the API

- Service functions build URLs with `getAPIUrl()` from `@services/config/config` (absolute backend URL, or `/api/v1/` on custom domains).
- `app/api/v1/[...path]/route.ts` forwards requests to the backend (streaming bodies, up to 5 minutes), which is how same-origin `/api/v1/*` calls work.
- `proxy.ts` resolves the tenant for each request, sets `LH_*` cookies, rewrites paths to `/orgs/{slug}/...`, and handles auth pages, `/admin`, `/health`, `/sitemap.xml`, `/robots.txt`, podcast feeds and Stripe Connect OAuth callbacks.

---

## Key Dependencies

From `apps/web/package.json`:

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^16.2.6 | App Router framework |
| `react` / `react-dom` | 19.2.6 | UI runtime |
| `swr` | ^2.3.6 | Client data fetching and cache revalidation |
| `tailwindcss` / `@tailwindcss/postcss` | ^4.1.16 | Styling |
| `@radix-ui/*` | various | Accessible UI primitives |
| `class-variance-authority` | ^0.7.1 | Variant-based component styling |
| `tailwind-merge` / `clsx` | ^3.3.1 / ^2.1.1 | `cn()` class merging |
| `formik` / `yup` | ^2.4.6 / ^1.7.1 | Forms and validation |
| `i18next` / `react-i18next` | ^26.0.0 / ^17.0.0 | Internationalization |
| `@tiptap/*` | ^3.x | Rich text editor |
| `@codemirror/*` | ^6.x | Code editor |
| `recharts` | ^3.0.0 | Charts |
| `cmdk` | ^1.1.1 | Command palette |
| `lucide-react` | ^1.0.0 | Icons |
| `@phosphor-icons/react` | ^2.1.10 | Remaining brand marks (e.g. `MarkdownLogo`) |
| `framer-motion` / `motion` | ^13.1.1 / ^12.34.3 | Animation |
| `@hello-pangea/dnd` | ^18.0.1 | Drag and drop |
| `react-hot-toast` | ^2.6.0 | Toasts |
| `dayjs` | ^1.11.19 | Dates |
| `usehooks-ts` | ^3.1.1 | Utility hooks |
| `@sentry/nextjs` | ^10.40.0 | Error monitoring |
| `yjs` / `@hocuspocus/provider` | ^13.6.20 / ^4.0.0 | Boards realtime |

---

## Build System

`next.config.js` (not `.ts`) is wrapped with `withSentryConfig` and sets:

- `output: 'standalone'` for containerized deployment
- `reactStrictMode: false`
- `experimental.optimizePackageImports` for TipTap, Radix, icons, charts and editor packages
- `generateBuildId` from `BUILD_ID` (default `learnhouse-production`) for multi-pod consistency
- Umami rewrites (`/umami/*`) and embed-friendly `X-Frame-Options` / CSP headers

There is no Turbopack configuration; the package scripts use plain `next dev` / `next build` / `next start` (plus `dev-https`).

```bash
npm run dev     # next dev
npm run build   # next build
npm run start   # next start
```
