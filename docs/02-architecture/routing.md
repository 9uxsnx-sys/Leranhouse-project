# Routing

> Frontend routing structure --- how the two layouts are organized.

---

## The Two Layouts

Every route in the project belongs to one of two layouts:

| Layout | Path prefix | Design | Redesign Status |
|--------|-------------|--------|-----------------|
| **User Part** `(withmenu)` | `/orgs/[orgslug]/` | Medusa UI | In progress |
| **Admin Dashboard** `dash` | `/orgs/[orgslug]/dash/` | Original Learnhouse | Do NOT touch |

---

## Quick Check

> **Does the route path contain `/dash/`?**
> - **YES** -> Admin Dashboard -> Keep original, do NOT redesign
> - **NO** -> User Part -> Medusa redesign applies

---

## User Part Routes --- `(withmenu)`

| Route | Page | Status |
|-------|------|--------|
| `/orgs/[orgslug]/` | Home | To do |
| `/orgs/[orgslug]/courses` | Courses | Done |
| `/orgs/[orgslug]/course/[uuid]` | Course Detail | In progress |
| `/orgs/[orgslug]/course/[uuid]/lesson-preview` | Lesson Preview | In progress |
| `/orgs/[orgslug]/course/[uuid]/activity/[activityid]` | Activity / Lesson | To do |
| `/orgs/[orgslug]/collections` | Collections | To do |
| `/orgs/[orgslug]/collection/[id]` | Collection Detail | To do |
| `/orgs/[orgslug]/communities` | Communities | To do |
| `/orgs/[orgslug]/community/[uuid]` | Community Detail | To do |
| `/orgs/[orgslug]/playgrounds` | Playgrounds | To do |
| `/orgs/[orgslug]/playground/[uuid]` | Playground Detail | To do |
| `/orgs/[orgslug]/podcasts` | Podcasts | To do |
| `/orgs/[orgslug]/podcast/[uuid]` | Podcast Detail | To do |
| `/orgs/[orgslug]/store` | Store | To do |
| `/orgs/[orgslug]/trail` | Trail | To do |
| `/orgs/[orgslug]/search` | Search | To do |
| `/orgs/[orgslug]/account` | Account | To do |
| `/orgs/[orgslug]/user/[username]` | User Profile | To do |
| `/orgs/[orgslug]/boards` | Boards | To do |
| `/orgs/[orgslug]/certificates` | Certificates | To do |
| `/orgs/[orgslug]/copilot` | Copilot | To do |

## Admin Dashboard Routes --- `dash`

| Route | Page | Status |
|-------|------|--------|
| `/orgs/[orgslug]/dash/` | Dashboard Home | Keep original |
| `/orgs/[orgslug]/dash/courses` | Course Management | Keep original |
| `/orgs/[orgslug]/dash/courses/course/[uuid]` | Course Editor | Keep original |
| `/orgs/[orgslug]/dash/courses/migrate` | Course Migration | Keep original |
| `/orgs/[orgslug]/dash/analytics` | Analytics | Keep original |
| `/orgs/[orgslug]/dash/assignments` | Assignments | Keep original |
| `/orgs/[orgslug]/dash/boards` | Boards Admin | Keep original |
| `/orgs/[orgslug]/dash/communities` | Communities Admin | Keep original |
| `/orgs/[orgslug]/dash/playgrounds` | Playgrounds Admin | Keep original |
| `/orgs/[orgslug]/dash/podcasts` | Podcasts Admin | Keep original |
| `/orgs/[orgslug]/dash/payments` | Payments Admin | Keep original |
| `/orgs/[orgslug]/dash/org/settings` | Org Settings | Keep original |
| `/orgs/[orgslug]/dash/users/settings` | User Settings | Keep original |

---

## How It Works

The `(withmenu)` and `dash` folders both exist under the same org slug path:

```
app/orgs/[orgslug]/
  (withmenu)/              <- User Part (has sidebar menu layout)
    layout.tsx             <- Sidebar menu layout
    page.tsx               <- Home page
    courses/
    course/[uuid]/
    ...
  dash/                    <- Admin Dashboard
    layout.tsx             <- Admin layout
    page.tsx               <- Dashboard home
    courses/
    org/settings/
    ...
```

Next.js uses the parenthetical folder `(withmenu)` as a **route group** --- it does not affect the URL path. Both layouts receive the same `[orgslug]` parameter.
