# Home Page Layout

> Learner-facing home page showing trending and new content in a responsive grid layout.

## Overview

The home page is the first thing learners see when visiting an org. It displays 4 content sections in a clean, responsive grid — each showing up to 4 cards in a single row with a "See All" link pointing to the full listing page.

## Sections

| Order | Section | Source | Logic |
|-------|---------|--------|-------|
| 1 | **Trending Courses** | `GET /orgs/{org_id}/home-trending` | Top 8 courses by enrollment count (trailrun GROUP BY) |
| 2 | **Trending Podcasts** | `GET /orgs/{org_id}/home-trending` | Top 8 podcasts by listener count (trailrun GROUP BY) |
| 3 | **New Courses** | `getOrgCourses()` | Ordered by `creation_date desc` |
| 4 | **New Podcasts** | `getOrgPodcasts()` | Ordered by `creation_date desc` |

Empty sections are automatically hidden.

## Component Architecture

```
page.tsx (server component)
  └─ fetches trending data from API, courses, podcasts
  └─ OrgHomeClient.tsx (client component)
       └─ SectionRow × 4
            ├─ title + "See All" link
            └─ responsive grid of CourseCard / PodcastCard
```

### Key Components

**SectionRow** ([`components/Objects/Home/SectionRow.tsx`](file:///c:\Projects\learnhouse-dev\learnhouse-dev\apps\web\components\Objects\Home/SectionRow.tsx))
- Reusable component: renders a section title, "See All" link, and a grid of children
- Title: `text-[22px] font-semibold text-ui-fg-base` with `mb-5` spacing below
- "See All" link: muted gray (`text-gray-400 hover:text-gray-600`) with `ArrowRight` icon
- Grid: `grid-cols-1 sm:2 lg:3 xl:4 gap-6` — responsive, matches listing page card size

**OrgHomeClient** ([`components/Objects/Home/OrgHomeClient.tsx`](file:///c:\Projects\learnhouse-dev\learnhouse-dev\apps\web\components\Objects\Home/OrgHomeClient.tsx))
- Client component that receives pre-fetched data as props
- Renders all 4 sections with `space-y-10` between them
- Card images use `removeCoursePrefix()` / `removePodcastPrefix()` before passing IDs (PodcastCard internally adds the `podcast_` prefix)

### Page Server Component

**page.tsx** ([`app/orgs/[orgslug]/(withmenu)/page.tsx`](file:///c:\Projects\learnhouse-dev\learnhouse-dev\apps\web\app/orgs/%5Borgslug%5D/(withmenu)/page.tsx))
- Fetches courses, podcasts, and trending data server-side
- Passes all data to `OrgHomeClient`

## Backend

### Trending Endpoint

**`GET /orgs/{org_id}/home-trending`** ([`routers/orgs/orgs.py`](file:///c:\Projects\learnhouse-dev\learnhouse-dev\apps\api\src\routers\orgs\orgs.py))

Returns:
```json
{
  "trending_courses": [...],
  "trending_podcasts": [...]
}
```

- Courses ranked by enrollment count (trailrun where course_id is not null, GROUP BY course_id)
- Podcasts ranked by listener count (trailrun where run_type = RUN_TYPE_PODCAST, GROUP BY podcast_uuid)
- Each returns top 8 results, limited by `LIMIT 8`
- Returns full course/podcast data with thumbnail_image for card rendering

## Design Rules

- Cards match the exact size and style of the listing pages (same grid breakpoints, same gap)
- Only 4 cards per row — no scrolling, no overflow
- Section titles are smaller than the page title (`22px` vs `28px`)
- "See All" link is subtle gray — does not compete with content
- Spacing: `space-y-10` between sections, `mb-5` between title and card row
- Container: `w-full px-6` — matches courses listing page layout
