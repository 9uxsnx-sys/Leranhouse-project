# Frontend Architecture Overview

> The Koodook frontend is a Next.js 16 application using the App Router, React Server Components, Tailwind CSS v4, and the Medusa UI component library.

---

## Next.js App Router Structure

All frontend code lives under `apps/web/`. The App Router (`apps/web/app/`) defines pages via a file-system-based routing convention. Every folder with a `page.tsx` becomes a route; every folder with a `layout.tsx` wraps its children with shared UI.

```
apps/web/
├── app/                    # App Router pages
├── components/             # React components
├── services/               # API service layer
├── lib/                    # Utility functions
├── public/                 # Static assets
├── styles/                 # Global CSS
├── package.json
└── next.config.ts
```

---

## The Two-Layout Split

Under `apps/web/app/orgs/[orgslug]/`, pages are split into two parallel route groups:

### `(withmenu)` — User-Facing Pages

This route group wraps learner-facing pages with a sidebar navigation menu. Routes include:

- `/orgs/[orgslug]/courses` — course listing
- `/orgs/[orgslug]/course/[courseuuid]` — individual course page
- `/orgs/[orgslug]/course/[courseuuid]/activity/[activityid]` — lesson/activity view
- `/orgs/[orgslug]/communities` — community listing
- `/orgs/[orgslug]/boards` — boards
- `/orgs/[orgslug]/store` — payment/storefront
- `/orgs/[orgslug]/account` — user account settings
- `/orgs/[orgslug]/search` — search

The layout at `(withmenu)/layout.tsx` is a `'use client'` component that:
1. Wraps children in a `SessionGate` (blocks rendering until session is loaded)
2. Provides `OrgJoinBannerProvider` and `PodcastPlayerProvider` contexts
3. Renders the `OrgMenu` sidebar alongside the main content area
4. Injects custom Google Fonts from org branding config
5. Includes a `PageViewTracker` for analytics

### `dash` — Admin Dashboard

This route group wraps administrator-facing pages with a different layout. Routes include:

- `/orgs/[orgslug]/dash` — dashboard home
- `/orgs/[orgslug]/dash/courses` — course management
- `/orgs/[orgslug]/dash/courses/course/[courseuuid]/[subpage]` — course editor tabs
- `/orgs/[orgslug]/dash/analytics` — analytics
- `/orgs/[orgslug]/dash/org/settings` — organization settings
- `/orgs/[orgslug]/dash/users` — user management
- `/orgs/[orgslug]/dash/payments` — payment management

The `dash/layout.tsx` is a Server Component that delegates to `ClientAdminLayout`, which:
1. Checks authorization via `AdminAuthorization`
2. Provides `CommandPaletteProvider` for the command palette
3. Renders the `DashLeftMenu` (desktop) or `DashMobileMenu` (mobile)
4. Renders the `AdminTopBar`, `OnboardingBar`, and `WelcomeModal`

### Route Groups (Parentheses)

Route groups (folders named with parentheses, e.g. `(withmenu)`) are a Next.js App Router feature. They group routes without adding segments to the URL path. Both `(withmenu)` and `dash` share the same URL prefix (`/orgs/[orgslug]/`) but have entirely different layouts.

```
app/orgs/[orgslug]/
├── layout.tsx              # Shared org layout (OrgProvider, metadata)
├── (withmenu)/layout.tsx   # User-facing layout (sidebar menu)
└── dash/layout.tsx         # Admin layout (admin sidebar)
```

---

## Server Components vs Client Components

Koodook follows a clear separation pattern:

### Server Components (default in App Router)

Page files (`page.tsx`) are Server Components by default. They:
- Fetch data on the server (direct API calls, no client-side waterfalls)
- Generate metadata via `generateMetadata()` exported functions
- Pass data as props to client components
- Can `await` params (Next.js 16 pattern: `params: Promise<...>`)

Example pattern:

```tsx
// page.tsx — Server Component
const CoursePage = async (props: { params: Promise<{ orgslug: string; courseuuid: string }> }) => {
  const params = await props.params
  const session = await getServerSession()
  const course = await getCourseMetadata(params.courseuuid, ...)

  return <CourseClient courseuuid={params.courseuuid} course={course} />
}
```

### Client Components

Components that need interactivity, browser APIs, React hooks, or context use the `'use client'` directive. These are typically:
- Layouts that wrap children with providers
- Form components (EditCourseGeneral, etc.)
- Interactive UI elements (DropdownMenu, Tabs, etc.)
- Components that use `useState`, `useEffect`, `useContext`, or SWR

```
'use client'
import { useState } from 'react'
// ...
```

### The `params: Promise<>` Pattern (Next.js 16)

In Next.js 16, `params` is a `Promise` that must be `await`ed. This applies to both Server Components and `generateMetadata`:

```tsx
// Server Component
export default async function Page(props: {
  params: Promise<{ orgslug: string; courseuuid: string }>
}) {
  const params = await props.params
  // params.orgslug, params.courseuuid
}

// generateMetadata
export async function generateMetadata(props: {
  params: Promise<{ orgslug: string; courseuuid: string }>
}): Promise<Metadata> {
  const params = await props.params
  // ...
}
```

Client Components that receive params can use the `use()` hook:

```tsx
'use client'
import { use } from 'react'

function MyComponent(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  // params.id
}
```

---

## Key Directories Under `apps/web/`

| Directory | Purpose |
|-----------|---------|
| `app/` | App Router pages and API routes |
| `app/orgs/[orgslug]/(withmenu)/` | User-facing pages with sidebar menu |
| `app/orgs/[orgslug]/dash/` | Admin dashboard pages |
| `app/auth/` | Authentication pages (login, signup, reset password) |
| `app/api/` | API proxy routes (auth, revalidation, health) |
| `components/` | All React components |
| `components/ui/` | Medusa design system primitives |
| `components/Contexts/` | React context providers |
| `components/Dashboard/` | Admin dashboard components |
| `components/Objects/` | Shared UI objects (courses, activities, menus) |
| `services/` | API service functions (one file per domain) |
| `lib/` | Shared utilities (auth, i18n, SEO, fonts) |
| `public/` | Static assets |
| `styles/` | Global CSS files |

---

## How Pages Are Organized by Route Structure

Pages follow the URL structure directly. A typical course page route:

```
app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/
├── page.tsx              # Server Component — fetches data, renders CourseClient
├── course.tsx            # CourseClient — 'use client' component
├── loading.tsx           # Loading skeleton
├── error.tsx             # Error boundary
└── activity/
    └── [activityid]/
        ├── page.tsx      # Server Component
        ├── activity.tsx  # ActivityClient
        ├── loading.tsx
        └── error.tsx
```

The dashboard course editor uses a `[subpage]` dynamic segment for tabbed navigation:

```
app/orgs/[orgslug]/dash/courses/course/[courseuuid]/
└── [subpage]/
    └── page.tsx          # Renders different editors based on subpage value
```

The `[subpage]` values are: `general`, `content`, `access`, `contributors`, `seo`, `certification`, `analytics`.

---

## Key Dependencies

The frontend relies on the following major packages (see `apps/web/package.json`):

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^16.2.6 | React framework with App Router |
| `react` / `react-dom` | 19.2.6 | UI library |
| `swr` | ^2.3.6 | Server state fetching, caching, and revalidation |
| `tailwindcss` | ^4.1.16 | Utility-first CSS framework |
| `@radix-ui/*` | various | Accessible UI primitives (Dialog, Select, Switch, Tabs, DropdownMenu, Tooltip, etc.) |
| `class-variance-authority` | ^0.7.1 | Variant-based component styling (used by Button, Switch, etc.) |
| `tailwind-merge` / `clsx` | latest | Class merging utility (`cn()` helper) |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities |
| `formik` | ^2.4.6 | Form state management |
| `yup` | ^1.7.1 | Form validation schemas |
| `i18next` / `react-i18next` | latest | Internationalization |
| `framer-motion` / `motion` | latest | Declarative animations |
| `@phosphor-icons/react` / `lucide-react` | latest | Icon libraries |
| `react-hot-toast` | ^2.6.0 | Toast notifications |
| `dayjs` | ^1.11.19 | Date formatting |
| `@hello-pangea/dnd` | ^18.0.1 | Drag and drop |
| `@tiptap/*` | ^3.x | Rich text editor (ProseMirror-based) |
| `recharts` | ^3.0.0 | Charts and analytics |
| `cmdk` | ^1.1.1 | Command palette |
| `usehooks-ts` | ^3.1.1 | Utility hooks |
| `sentry/nextjs` | ^10.x | Error tracking |

---

## Build System

The project uses **Webpack** (Next.js's default bundler) for production builds. Turbopack is **not** enabled, even in development mode.

```js
// next.config.js — no turbopack config
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  // ...
}
```

While Next.js 16 supports Turbopack as an opt-in alternative (`next dev --turbo`), it is deliberately disabled in this project due to known compatibility issues:

- **CSS `@import` ordering** — Turbopack resolves CSS imports differently than Webpack, causing style regressions in the Medusa token system.
- **SWC plugin compatibility** — Some Tailwind CSS v4 PostCSS plugins used by this project do not work reliably under Turbopack's Rust-based module graph.
- **Hot Module Replacement edge cases** — Certain Medusa UI components with complex Radix UI compositions produce hydration mismatches under Turbopack's faster but less mature HMR.

For development, the standard `next dev` command (which uses Webpack) is the recommended and supported approach. The build also outputs as a standalone application (`output: 'standalone'`) for Kubernetes deployment.

```bash
# Development (Webpack)
npm run dev

# Production build (Webpack)
npm run build
```

Key build configuration highlights from `next.config.js`:
- **`output: 'standalone'`** — Produces a self-contained build for containerized deployment
- **`reactStrictMode: false`** — Disabled because some third-party components (TipTap, Radix) trigger double-mount warnings
- **`optimizePackageImports`** — 40+ packages optimized for tree-shaking (TipTap extensions, Radix primitives, icons, charts)
- **Sentry integration** — Wrapped with `withSentryConfig` for error monitoring (DSN resolved at runtime)

---

## The App Layout Chain

The full layout nesting from outermost to innermost is:

1. **`app/layout.tsx`** — Root HTML shell. Sets up the Inter font, injects runtime config scripts, renders the `Providers` wrapper (Auth → LHSession → I18n), and the `<main>` element with a fade-in animation.

2. **`app/orgs/[orgslug]/layout.tsx`** — Org-level Server Component layout. Fetches org metadata, provides `OrgProvider` and `OrgLanguageSync`, renders `NextTopLoader`, `Toast`, and `Footer`.

3. **`app/orgs/[orgslug]/(withmenu)/layout.tsx`** — User-facing layout. Client component with `SessionGate`, `OrgJoinBanner`, `PodcastPlayer`, and sidebar `OrgMenu`.

4. **`app/orgs/[orgslug]/dash/layout.tsx`** — Admin layout. Delegates to `ClientAdminLayout` with `DashLeftMenu`, `AdminTopBar`, authorization gate, and `CommandPalette`.

Individual page components render inside this chain, so providers like `OrgContext`, `AuthContext`, and `I18nContext` are available everywhere.
