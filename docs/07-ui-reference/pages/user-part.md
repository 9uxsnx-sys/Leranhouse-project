# User-Facing Pages (Public & Member)

> The user-facing section of Koodook is a Medusa v2.18.0-inspired shell layout that wraps all public and member-facing pages under the `(withmenu)` route group, providing sidebar navigation, a top bar, breadcrumbs, and focus-mode support for learning activities.

## Overall Layout

The entire user-facing section is wrapped by `apps/web/app/orgs/[orgslug]/(withmenu)/layout.tsx` and the `OrgMenu` component (`apps/web/components/Objects/Menus/OrgMenu.tsx`). The shell is a port of the Medusa v2.18.0 shell layout and consists of:

- **NavigationBar**: A fixed top progress bar (`z-50`, height `0.25rem`) that animates on route changes.
- **Flex row container**: `h-screen overflow-hidden` with two columns:
  - **Desktop sidebar** (`240px` wide, `border-e`): Renders `MedusaSidebarContent` with org logo, nav items, and user profile.
  - **Right column**: A full-height scrollable column containing:
    - **Topbar**: A grid (`grid-cols-2`) with `ToggleSidebar` + `BreadcrumbNav` on the left, and `NotificationsBell`, Copilot menu, and Help dropdown on the right.
    - **Main content**: A vertically and horizontally centered container (`max-w-[1600px]`, `px-1 py-3`) with `flex-1` content area at `z-index: var(--z-content)`.
    - **Footer**: Custom footer text from org config, plus a LearnHouse watermark.
- **Mobile drawer**: Fixed overlay with slide-in sidebar (`max-w-[304px]`) when the hamburger menu is toggled.
- **Focus mode**: When the path includes `/activity/` and `globalFocusMode` is `"true"` in localStorage, the entire shell (sidebar, topbar, footer) is hidden, rendering only the activity content.
- **Providers**: `SessionGate`, `OrgJoinBannerProvider`, `PodcastPlayerProvider`.
- **Custom font support**: Dynamically injects Google Font stylesheets from org configuration.

### Sidebar Navigation (MedusaSidebar)

Defined in `apps/web/components/Objects/Menus/MedusaSidebar.tsx`. The sidebar has:

- **Org Header**: Logo image or fallback initial, org name, and a `MoreHorizontal` icon. Links to the org home.
- **Dashed divider** between header and nav.
- **Navigation items** (filtered by `resolved_features`):
  - `/search` — Opens the `SearchModal` (a button, not a link)
  - `/` — Home
  - `/courses` — Course listing (requires `courses` feature)
  - `/podcasts` — Podcast listing (requires `podcasts` feature)
  - `/communities` — Community listing (requires `communities` feature)
  - `/store` — Store (requires `payments` feature)
  - `/trail` — Learning progress
- **Floating active indicator**: A white pill (`shadow-elevation-card-rest`) that transitions between nav items based on the active index.
- **Bottom section**:
  - Dashboard link (for admin/maintainer/instructor roles): Links to `/dash`.
  - Divider
  - `HeaderProfileBox`: User avatar, name, and logout.

## Pages

### Home / Landing Page

**Route**: `/orgs/[orgslug]/` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/page.tsx`

- **Server component** with `force-dynamic`.
- Generates SEO metadata (OpenGraph, Twitter cards, JSON-LD structured data for the organization).
- Fetches courses, collections, and org info in parallel.
- Renders either `LandingClassic` (default) or `LandingCustom` based on `org.config.config.customization.landing.enabled`.

#### LandingClassic

**File**: `apps/web/components/Landings/LandingClassic.tsx`

- **Collections section**: A responsive grid (`1-4 columns`) of `CollectionThumbnail` components, or an empty state with placeholder text.
- **Courses section**: A responsive grid (`1-4 columns`) of `CourseThumbnail` components (max 12 courses), or an empty state.
- **"View All" link**: If more than 12 courses exist, a ghost button linking to `/courses` shows the total count.

### Course Listing

**Route**: `/orgs/[orgslug]/courses` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/courses/courses.tsx`

- **Client component** with SWR data fetching.
- **Search bar**: Left-aligned with search icon, filters courses by name/description/tags.
- **Results count**: Shown next to the search bar when a query is active.
- **Filter dropdown**: Dropdown menu with difficulty options (All/Easy/Medium/Hard).
- **Usergroup filter** (personal/family plans only): A select dropdown that fetches usergroups and filters courses by their resource UUIDs. Includes an info tooltip.
- **Course grid**: Responsive `1-4 columns` grid of `CourseCard` components with thumbnail, title, description, lesson count, duration, and difficulty.
- **Pagination**: 8 items per page with Previous/Next buttons and up to 5 visible page numbers with ellipsis.
- **Empty states**:
  - No search results: Book icon, "No results found" message.
  - No courses at all: Book icon, "No courses" message.
  - Filter with no results (implicit from the filtered list being empty).
- **Layout**: CSS grid with `grid-template-rows: auto auto 1fr auto` to keep the footer at the bottom.

### Course Detail

**Route**: `/orgs/[orgslug]/course/[courseuuid]` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/course.tsx`

- **Client component** with server-provided initial data and client-side SWR fallback.
- **Hero section**: Image or video thumbnail (`3:1 aspect ratio`) with gradient fallback. Toggleable between image and video.
- **Two-column layout**:
  - **Main content** (left):
    - Course title
    - Stats badges: Lessons count, duration, difficulty level
    - Share button
    - "What You'll Learn" section
    - "About This Course" description
    - Course curriculum (expandable chapters with activities)
    - Requirements section
  - **Sidebar** (right):
    - Progress bar with "Continue Learning" button
    - "This Course Includes" stats (video hours, lessons, resources, certificate)
- **Error states**: 403 "No permission" page and generic load error with back link.
- **Analytics**: Tracks `course_view` event on mount.
- **Mobile**: `CourseActionsMobile` component replaces the sidebar on small screens.

### Activity / Lesson Page

**Route**: `/orgs/[orgslug]/course/[courseuuid]/activity/[activityid]` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/activity/[activityid]/activity.tsx`

This is the most complex page in the user-facing section.

- **Breadcrumbs** at the top.
- **Header**: Chapter name, activity title, authors (avatars), focus mode toggle button, and share dropdown.
- **Two-column layout**:
  - **Left content column**:
    - "What You'll Learn" section
    - Activity content (lazy-loaded based on type):
      - `VideoActivity` for video lessons
      - `DocumentPdfActivity` for documents
      - `DynamicCanva` for dynamic/interactive content
      - `AssignmentStudentActivity` for assignments
      - `ScormActivity` for SCORM packages (enterprise feature)
      - `MarkdownActivity` for markdown content
      - `EmbedActivity` for embedded content
    - Practice/Exercise section
    - Resources (downloadable files)
    - Knowledge Check section
    - "What's Next" / "Course End" view
    - Navigation buttons (Previous/Next activity)
  - **Right sidebar**:
    - Course Outline sidebar: Chapters with activities showing completion status
    - "On This Page" sidebar: Section navigation using `IntersectionObserver` for scroll tracking
- **Focus Mode**: Full-screen overlay that hides the entire shell. Shows a progress circle, course thumbnail, minimize button, and a bottom navigation bar with prev/next. Activated via localStorage (`globalFocusMode`) and custom events.
- **Assignment Workflow** (for `TYPE_ASSIGNMENT` activities):
  - Submit for grading button
  - "Grading in Progress" state
  - Graded pill with confetti celebration modal (`react-confetti`)
  - Task breakdown with scores
  - Feedback display
  - Retry attempts
- **Completion Tracking**: `MarkStatus` component with mark/unmark toggle. Auto-advances to the next activity on completion.
- **Analytics**: Tracks `activity_view` on mount and `time_on_activity` (seconds spent) on unmount.
- **Error states**: 403 for unauthorized access, load errors, and a dedicated loading skeleton.

### Communities

**Route**: `/orgs/[orgslug]/communities` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/communities/communities.tsx`

- **Feature-guarded** with `FeatureDisabledView` for the `communities` feature.
- **Search bar** with results count.
- **Filter**: Tabs for All / Newest / Course / General.
- **Grid**: Paginated community cards.
- **Empty states**: No results and no communities states.

### Community Detail

**Route**: `/orgs/[orgslug]/community/[communityuuid]` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/community/[communityuuid]/community.tsx`

- **Two-column forum layout**:
  - **Left**: Discussion feed with search bar, "New Discussion" button, "Select mode" button (for managers), and filter dropdown (sort by Recent/Top/Hot, filter by labels).
  - **Right**: Community info sidebar (description, members, stats).

### Discussion Detail

**Route**: `/orgs/[orgslug]/community/[communityuuid]/discussion/[discussionuuid]` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/community/[communityuuid]/discussion/[discussionuuid]/discussion.tsx`

- **Breadcrumbs** linking back to the community.
- **Two-column layout**:
  - **Left** (desktop only): Discussion info sidebar (author, stats, labels).
  - **Right**: Discussion content and replies.
- **Edit modal**: `EditDiscussionModal` with callback to update local state.

### Boards

**Route**: `/orgs/[orgslug]/boards` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/boards/boards.tsx`

- **Feature-guarded** with `FeatureDisabledView` for the `boards` feature.
- **Search bar** with results count.
- **Paginated grid** of board cards.
- **Empty states**: No results and no boards.

### Podcasts

**Route**: `/orgs/[orgslug]/podcasts` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/podcasts/podcasts.tsx`

- **Feature-guarded** with `FeatureDisabledView` for the `podcasts` feature.
- **Search bar** with results count.
- **Visibility filter**: All / Public / Private.
- **Paginated grid** of `PodcastCard` components.
- **Empty states**: No results and no podcasts.

### Store

**Route**: `/orgs/[orgslug]/store` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/store/store.tsx`

- **Offer cards** with:
  - Thumbnail boxes
  - Resource type icons (course / podcast / playground)
  - Benefits list
- **Offer detail**: `/orgs/[orgslug]/store/offers/[offerid]` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/store/offers/[offerid]/offer-detail.tsx`

### Account / Settings

**Route**: `/orgs/[orgslug]/account` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/account/page.tsx`

- **Simple redirect** to `/orgs/[orgslug]/account/general`.
- **Subpages**: Account settings with sub-navigation for different settings sections.

### Trail / Learning Progress

**Route**: `/orgs/[orgslug]/trail` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/trail/trail.tsx`

- **Learning progress dashboard**: Shows courses in progress, completed courses, and overall stats.
- **Progress bars** per course.
- **Continue learning** links to the last activity.

### Copilot

**Route**: `/orgs/[orgslug]/copilot` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/copilot/copilot.tsx`

- **AI assistant chat interface**: Full-page AI copilot with conversation history.
- Also accessible via the floating bubble mode from the topbar.

### Search

**Route**: `/orgs/[orgslug]/search` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/search/page.tsx`

- **Global search page** with results across courses, communities, and other content types.
- Also accessible via the sidebar search button which opens a `SearchModal`.

### Playgrounds

**Route**: `/orgs/[orgslug]/playgrounds` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/playgrounds/playgrounds.tsx`

- **Playground listing**: Grid of interactive playgrounds.

### Collections

**Route**: `/orgs/[orgslug]/collections` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/collections/CollectionsClient.tsx`

- **Collection grid**: Shows all collections with thumbnails.
- **Collection detail**: `/orgs/[orgslug]/collection/[collectionid]` — Shows courses within a collection.

### User Profile

**Route**: `/orgs/[orgslug]/user/[username]` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/user/[username]/UserProfileClient.tsx`

- **Public user profile**: Shows user information, activity, and contributions.

### Podcast Detail

**Route**: `/orgs/[orgslug]/podcast/[podcastuuid]` — File: `apps/web/app/orgs/[orgslug]/(withmenu)/podcast/[podcastuuid]/podcast.tsx`

- **Podcast player page**: Episode list, player controls, and podcast info.
- Global `PodcastPlayer` persists playback across pages via the `PodcastPlayerProvider`.

## Mobile Responsive Behavior

- **Sidebar**: Hidden on mobile; a fixed overlay drawer (`max-w-[304px]`) slides in from the left when the hamburger menu is toggled.
- **Breadcrumbs**: On mobile, breadcrumbs show `...` for non-current segments, only displaying the full path on larger screens.
- **Grid layouts**: All content grids (courses, communities, podcasts) use responsive breakpoints: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- **Course detail**: A mobile-specific `CourseActionsMobile` component replaces the desktop sidebar.
- **Activity page**: The right sidebar (course outline and "On This Page") is hidden on mobile; navigation is handled via the bottom bar.

## Key UI Patterns

- **Medusa design tokens**: All components use CSS variables (`--color-canvas`, `--z-content`, `--z-nav-menu`, `--z-overlay`), utility classes (`shadow-borders-base`, `shadow-elevation-card-rest`, `bg-ui-bg-subtle`, `text-ui-fg-muted`, `text-ui-fg-base`), and the Medusa component library (`Container`, `Heading`, `Text`, `Badge`, `Button`, `IconButton`, `DropdownMenu`).
- **Feature flags**: Navigation items and page content are conditionally rendered based on `resolved_features` from the org configuration API.
- **SWR data fetching**: Client components use SWR with `swrFetcher` for data fetching with caching and revalidation.
- **Lazy loading**: Heavy activity components (Video, Document, Assignment, AI panels, SCORM) are lazy-loaded with `next/dynamic` and wrapped in `Suspense` with a `LoadingFallback` spinner.
- **Authentication**: `AuthenticatedClientElement` and `SessionGate` control access to authenticated features.
- **Plan-based restrictions**: `PlanBadge`, `PlanRestrictedFeature`, and `FeatureDisabledView` components restrict features based on the organization's subscription plan.
