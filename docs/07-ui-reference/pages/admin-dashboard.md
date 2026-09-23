# Admin Dashboard Pages

> The Koodook admin dashboard is a full-featured management interface under the `dash` route group, providing organization administrators with tools to manage courses, users, payments, content, analytics, and organization settings through a collapsible sidebar layout with role-based access control.

## Overall Layout

The dashboard is wrapped by `apps/web/app/orgs/[orgslug]/dash/layout.tsx` (server component) and `apps/web/app/orgs/[orgslug]/dash/ClientAdminLayout.tsx` (client component). The layout consists of:

- **SessionGate**: Ensures the user is authenticated.
- **AdminAuthorization** (`authorizationMode="page"`): Blocks non-admin access at the page level.
- **CommandPaletteProvider**: Enables the command palette (Ctrl+K / Cmd+K) across all dashboard pages.
- **Flex row container** (`flex flex-col md:flex-row`):
  - **Desktop sidebar** (`DashLeftMenu`) or **Mobile menu** (`DashMobileMenu`) based on `useMediaQuery('(max-width: 768px)')`.
  - **Full-width column** (`flex flex-col w-full h-dvh overflow-hidden`):
    - `AdminTopBar`
    - `FreePlanUpgradeBanner` (shown on free plans)
    - `children` (page content)
    - `OnboardingBar` (first-time setup wizard)
- **Modals**: `WelcomeModal` and `CommandPalette` are rendered globally.

### Dashboard Sidebar (DashLeftMenu)

Defined in `apps/web/components/Dashboard/Menus/DashLeftMenu.tsx`. Features:

- **Collapsible**: Toggles between `w-64` (256px) expanded and `w-[72px]` collapsed. State saved to `localStorage` (`dash-menu-collapsed`).
- **Org Header**: Logo or fallback initial with org name and collapse button.
- **Command palette trigger**: Search button that opens the command palette.
- **Navigation groups** with section labels:
  - **General**: Home (`/dash`)
  - **Content**: Courses (`/dash/courses`), Communities (`/dash/communities`, feature-gated), Podcasts (`/dash/podcasts`, feature-gated)
  - **Administration**: Users (`/dash/users/settings/users`), Payments (`/dash/payments/overview`), Organization (`/dash/org/settings/general`), Analytics (`/dash/analytics`)
- **User sub-navigation**: Animated sub-nav (framer-motion) with items: Users, UserGroups, Roles, Signups, Invite Members, Audit Logs. Only visible when the Users tab is active and sidebar is expanded.
- **Floating active indicator**: A white pill (`shadow-elevation-card-rest`) positioned via `ResizeObserver` measurement of the active nav item.
- **Bottom section**: Language switcher (hover menu with checkmark on current language), Help (hover menu with Documentation/Website/Discord/Feedback links), user avatar/profile.
- **Tooltips**: When collapsed, all nav items show tooltips on hover.

### AdminTopBar

Defined in `apps/web/components/Dashboard/Menus/AdminTopBar.tsx`.

- **Grid layout**: Breadcrumbs on the left, notifications bell and help dropdown on the right.
- **Breadcrumbs** (`AdminBreadcrumbNav`): Strips the `/orgs/{slug}/dash` prefix and maps URL segments to human-readable labels for: users, settings, payments, org, analytics, courses, communities, podcasts.

## Dashboard Pages

### Dashboard Home

**Route**: `/orgs/[orgslug]/dash` — Component: `apps/web/components/Dashboard/Home/DashboardHome.tsx`

- **Welcome header**: "Welcome back, {username}" with plan badge (color-coded by plan level: free/gray, oss/emerald, standard/blue, pro/purple, enterprise/amber) and org name.
- **Action buttons row**:
  - "Create Course" (primary, links to `/dash/courses?new=true`)
  - "Analytics" (links to `/dash/analytics`)
  - "Members" (links to `/dash/users/settings/users`)
  - "Settings" (links to `/dash/org/settings/general`)
- **QuickStats**: Summary statistics (total courses, active users, revenue, etc.).
- **RecentCourses**: List of recently updated or created courses.
- **RecentMembers**: Recently joined or active members.
- **ContentOverview**: Overview of all content types and their status.
- **UsageOverview**: Organization usage metrics (storage, bandwidth, active users).

### Course Management

#### Course List

**Route**: `/orgs/[orgslug]/dash/courses` — File: `apps/web/app/orgs/[orgslug]/dash/courses/client.tsx`

- **Course table/grid** with search and filtering.
- **Create new course** action.
- **Course migrate** tool at `/orgs/[orgslug]/dash/courses/migrate`.

#### Course Editor (6 Tabs)

**Route**: `/orgs/[orgslug]/dash/courses/course/[courseuuid]/[subpage]` — File: `apps/web/app/orgs/[orgslug]/dash/courses/course/[courseuuid]/[subpage]/page.tsx`

The course editor has 6 tabs, each guarded by permissions and plan requirements:

1. **General** (`/general`) — `Settings` icon
   - Required permission: `update`
   - Component: `EditCourseGeneral`
   - Course name, description, thumbnail, category, difficulty, tags.

2. **Content** (`/content`) — `BookOpen` icon
   - Required permission: `update_content`
   - Component: `EditCourseStructure`
   - Chapter and activity management: reorder, add, edit, delete chapters and activities. Drag-and-drop curriculum builder.

3. **Access** (`/access`) — `Globe` icon
   - Required permission: `manage_access`
   - Component: `EditCourseAccess`
   - Visibility settings (public/private), pricing, access control lists.

4. **Contributors** (`/contributors`) — `Users` icon
   - Required permission: `manage_contributors`
   - Component: `EditCourseContributors`
   - Add/remove contributors, set roles (instructor, assistant, reviewer).

5. **Certification** (`/certification`) — `Award` icon (plan-restricted)
   - Required permission: `update`
   - Requires plan: `standard` or above
   - Component: `EditCourseCertification`
   - Certificate design, passing criteria, expiration settings.

6. **SEO** (`/seo`) — `Search` icon (plan-restricted)
   - Required permission: `update`
   - Requires plan: `standard` or above
   - Component: `EditCourseSEO`
   - Meta title, description, Open Graph image, custom URL slug.

- **Analytics tab**: `CourseAnalyticsTab` component — course-specific analytics (enrollments, completion rates, engagement).
- **Context**: Wrapped in `CourseProvider` for shared course state.
- **Rights checking**: `useCourseRights` hook verifies user permissions for each tab.
- **Navigation**: Tab bar with icons and labels; active tab highlighted with bottom border or underline.

### User Management

**Route**: `/orgs/[orgslug]/dash/users/settings/[subpage]` — File: `apps/web/app/orgs/[orgslug]/dash/users/settings/[subpage]/page.tsx`

Subpages (accessed via sidebar sub-nav):

1. **Users** (`/users`)
   - User list with search, filter, pagination.
   - User details, role assignment, status management (active/suspended).

2. **UserGroups** (`/usergroups`)
   - Create and manage user groups.
   - Assign users to groups, configure group-based course access.

3. **Roles** (`/roles`)
   - Role definitions and permission matrices.
   - Create custom roles with granular permissions.

4. **Signups** (`/signups`)
   - Pending registration requests.
   - Approve or reject new member signups.

5. **Invite Members** (`/add`)
   - Invite new members via email.
   - Bulk invite and invite link generation.

6. **Audit Logs** (`/audit-logs`)
   - User activity audit trail.
   - Filterable by user, action, and date range.

### Organization Settings

**Route**: `/orgs/[orgslug]/dash/org/settings/[subpage]` — File: `apps/web/app/orgs/[orgslug]/dash/org/settings/[subpage]/page.tsx`

Subpages:

1. **General** (`/general`)
   - Organization name, description, logo, contact information.

2. **Branding** (`/branding`)
   - Custom colors, fonts, and visual identity settings.

3. **Landing** (`/landing`)
   - Custom landing page configuration and design.

4. **Domains** (`/domains`)
   - Custom domain setup and SSL configuration.

5. **Features** (`/features`)
   - Feature toggles and resolved_features configuration.

6. **SSO** (`/sso`)
   - Single Sign-On configuration (OAuth, SAML, LDAP).

7. **API Access** (`/api-access`)
   - API key management and rate limiting.

8. **Audit Logs** (`/audit-logs`)
   - Organization-level audit trail.

9. **SEO** (`/seo`)
   - Global SEO settings, default meta tags, Google Search Console verification.

### Payments

**Route**: `/orgs/[orgslug]/dash/payments/[subpage]` — File: `apps/web/app/orgs/[orgslug]/dash/payments/[subpage]/page.tsx`

- **Overview** (`/overview`): Payment dashboard with revenue charts, transaction volume.
- **Transactions**: List of all payments with status, amount, customer, date.
- **Plans**: Subscription plan management and pricing configuration.
- **Payouts**: Instructor/organization payout management.

### Analytics

**Route**: `/orgs/[orgslug]/dash/analytics` — File: `apps/web/app/orgs/[orgslug]/dash/analytics/page.tsx`

- **Dashboard analytics**: Charts and metrics for:
  - User growth and engagement
  - Course completion rates
  - Revenue trends
  - Content performance
  - Geographic distribution

### Community Management

**Route**: `/orgs/[orgslug]/dash/communities` — File: `apps/web/app/orgs/[orgslug]/dash/communities/client.tsx`

- **Community list** with search and management actions.
- **Community editor**: `/orgs/[orgslug]/dash/communities/[communityuuid]/[subpage]` — Edit community settings, moderate discussions, manage members.

### Podcast Management

**Route**: `/orgs/[orgslug]/dash/podcasts` — File: `apps/web/app/orgs/[orgslug]/dash/podcasts/client.tsx`

- **Podcast list** with search.
- **Podcast editor**: `/orgs/[orgslug]/dash/podcasts/podcast/[podcastuuid]/[subpage]` — Edit podcast details, manage episodes, upload audio.

### Board Management

**Route**: `/orgs/[orgslug]/dash/boards` — File: `apps/web/app/orgs/[orgslug]/dash/boards/client.tsx`

- **Board list** with search.
- **Board editor**: `/orgs/[orgslug]/dash/boards/[boarduuid]/[subpage]` — Edit board content, manage cards.

### Assignment Management

**Route**: `/orgs/[orgslug]/dash/assignments` — File: `apps/web/app/orgs/[orgslug]/dash/assignments/page.tsx`

- **Assignment list** with search and filter.
- **Assignment detail**: `/orgs/[orgslug]/dash/assignments/[assignmentuuid]` — Includes:
  - **Task Editor**: Create and edit assignment tasks (code, file, form, quiz, short answer, number answer).
  - **Submissions**: View and evaluate student submissions with the `EvaluateAssignment` modal.
  - **Analytics**: Assignment performance metrics.

### Playground Management

**Route**: `/orgs/[orgslug]/dash/playgrounds` — File: `apps/web/app/orgs/[orgslug]/dash/playgrounds/client.tsx`

- **Playground list** with search.
- Create and manage interactive playground environments.

## Mobile Responsive Behavior

- **Sidebar**: Automatically switches to `DashMobileMenu` on screens smaller than 768px. The desktop `DashLeftMenu` is hidden.
- **Layout**: Changes from `flex-row` to `flex-col` on mobile.
- **Content area**: Full viewport height with overflow hidden on desktop, auto-scrolling on mobile.

## Key UI Patterns

- **Medusa design tokens**: Dashboard uses the same design system as the user-facing section: CSS variables, `shadow-borders-base`, `shadow-elevation-card-rest`, `bg-ui-bg-subtle`, `text-ui-fg-muted`, etc.
- **Role-based access**: `AdminAuthorization` component wraps the entire dashboard at the "page" level. Individual pages and actions use `useCourseRights` and permission checks.
- **Plan-based restrictions**: `PlanBadge`, `PlanRestrictedFeature`, and plan-gated tabs (Certification, SEO) restrict features based on the organization's subscription plan.
- **Command palette**: Global `CommandPalette` component triggered by `CommandPaletteTrigger` in the sidebar or via Ctrl+K / Cmd+K keyboard shortcut.
- **SWR data fetching**: Dashboard components use SWR for data fetching with caching and deduplication.
- **Animated sub-navigation**: User management sub-nav uses `framer-motion`'s `AnimatePresence` for smooth expand/collapse animations.
- **LocalStorage persistence**: Sidebar collapse state is saved to and restored from localStorage.
- **Onboarding flow**: `OnboardingBar` and `WelcomeModal` guide first-time administrators through initial setup.
