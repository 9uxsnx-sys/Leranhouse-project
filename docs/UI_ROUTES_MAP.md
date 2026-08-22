# UI Routes Map — User Part vs Admin Dashboard

> **Purpose**: Every route in this project belongs to either the **User Part** (Medusa redesign) or the **Admin Dashboard** (keep original). This map tells you which is which, so you never edit the wrong one.

---

## User Part Routes — `(withmenu)` Layout

**Design**: Medusa redesign applied here. Use `CourseCard`, Medusa-style components.

| Route | Page / Tab | Component File | Redesign Status |
|-------|-----------|----------------|-----------------|
| `/orgs/[orgslug]/` | **Home** | `(withmenu)/page.tsx` | 🔴 To do |
| `/orgs/[orgslug]/courses` | **Courses** | `(withmenu)/courses/courses.tsx` | ✅ Done |
| `/orgs/[orgslug]/course/[uuid]` | **Course Detail** | `(withmenu)/course/[uuid]/course.tsx` | 🔴 To do |
| `/orgs/[orgslug]/collections` | **Collections** | `(withmenu)/collections/page.tsx` | 🔴 To do |
| `/orgs/[orgslug]/collection/[id]` | **Collection Detail** | `(withmenu)/collection/[id]/collection.tsx` | 🔴 To do |
| `/orgs/[orgslug]/communities` | **Communities** | `(withmenu)/communities/communities.tsx` | 🔴 To do |
| `/orgs/[orgslug]/community/[uuid]` | **Community Detail** | `(withmenu)/community/[uuid]/community.tsx` | 🔴 To do |
| `/orgs/[orgslug]/playgrounds` | **Playgrounds** | `(withmenu)/playgrounds/playgrounds.tsx` | 🔴 To do |
| `/orgs/[orgslug]/playground/[uuid]` | **Playground Detail** | `(withmenu)/playground/[uuid]/view.tsx` | 🔴 To do |
| `/orgs/[orgslug]/podcasts` | **Podcasts** | `(withmenu)/podcasts/podcasts.tsx` | 🔴 To do |
| `/orgs/[orgslug]/podcast/[uuid]` | **Podcast Detail** | `(withmenu)/podcast/[uuid]/podcast.tsx` | 🔴 To do |
| `/orgs/[orgslug]/store` | **Store** | `(withmenu)/store/store.tsx` | 🔴 To do |
| `/orgs/[orgslug]/trail` | **Trail** | `(withmenu)/trail/trail.tsx` | 🔴 To do |
| `/orgs/[orgslug]/search` | **Search** | `(withmenu)/search/page.tsx` | 🔴 To do |
| `/orgs/[orgslug]/account` | **Account** | `(withmenu)/account/page.tsx` | 🔴 To do |
| `/orgs/[orgslug]/user/[username]` | **User Profile** | `(withmenu)/user/[username]/UserProfileClient.tsx` | 🔴 To do |
| `/orgs/[orgslug]/boards` | **Boards** | `(withmenu)/boards/boards.tsx` | 🔴 To do |
| `/orgs/[orgslug]/certificates` | **Certificates** | `(withmenu)/certificates/` | 🔴 To do |
| `/orgs/[orgslug]/copilot` | **Copilot** | `(withmenu)/copilot/copilot.tsx` | 🔴 To do |

---

## Admin Dashboard Routes — `dash` Layout

**Design**: Keep original LearnHouse design. **Do NOT apply Medusa redesign here.**

| Route | Page / Tab | Component File | Status |
|-------|-----------|----------------|--------|
| `/orgs/[orgslug]/dash/` | **Dashboard Home** | `dash/page.tsx` | ❌ Keep original |
| `/orgs/[orgslug]/dash/courses` | **Course Management** | `dash/courses/client.tsx` | ❌ Keep original |
| `/orgs/[orgslug]/dash/courses/course/[uuid]` | **Course Editor** | `dash/courses/course/[uuid]/` | ❌ Keep original |
| `/orgs/[orgslug]/dash/courses/migrate` | **Course Migration** | `dash/courses/migrate/client.tsx` | ❌ Keep original |
| `/orgs/[orgslug]/dash/analytics` | **Analytics** | `dash/analytics/page.tsx` | ❌ Keep original |
| `/orgs/[orgslug]/dash/assignments` | **Assignments** | `dash/assignments/page.tsx` | ❌ Keep original |
| `/orgs/[orgslug]/dash/boards` | **Boards Admin** | `dash/boards/client.tsx` | ❌ Keep original |
| `/orgs/[orgslug]/dash/communities` | **Communities Admin** | `dash/communities/client.tsx` | ❌ Keep original |
| `/orgs/[orgslug]/dash/playgrounds` | **Playgrounds Admin** | `dash/playgrounds/client.tsx` | ❌ Keep original |
| `/orgs/[orgslug]/dash/podcasts` | **Podcasts Admin** | `dash/podcasts/client.tsx` | ❌ Keep original |
| `/orgs/[orgslug]/dash/payments` | **Payments Admin** | `dash/payments/` | ❌ Keep original |
| `/orgs/[orgslug]/dash/org/settings` | **Org Settings** | `dash/org/settings/` | ❌ Keep original |
| `/orgs/[orgslug]/dash/users/settings` | **User Settings** | `dash/users/settings/` | ❌ Keep original |

---

## Shared Components

| Component | Used In | Notes |
|-----------|---------|-------|
| `CourseCard` | **User Part only** (Courses, Collections, etc.) | Medusa redesign component — `components/Objects/Thumbnails/CourseCard.tsx` |
| `CourseThumbnail` | **Admin Dashboard only** (dash/courses) | Original component — **DO NOT TOUCH** — `components/Objects/Thumbnails/CourseThumbnail.tsx` |

---

## Quick Check

> **Does the route path contain `/dash/`?**
> - **YES** → Admin Dashboard → ❌ Keep original, do NOT redesign
> - **NO** → User Part → ✅ Medusa redesign applies here
