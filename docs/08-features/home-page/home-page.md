> Status: as-built · Last verified: 2026-11-15

# Home Pages

There are two home surfaces: `/home` is the authenticated organization picker, and `/orgs/{slug}` is the learner home of one organization.

## `/home` — organization picker

`apps/web/app/home/home.tsx` renders a centered panel over a blueprint grid.

| Behaviour | Implementation |
|---|---|
| Authentication | Unauthenticated visitors are redirected to `/login` |
| Organization list | `GET /orgs/user/page/1/limit/50` for the signed-in user |
| Loading | Three skeleton rows, then the list |
| Empty state | A "no organizations" card |
| Navigation | Each row links to `/orgs/{slug}` |
| Language | The user menu switches between English, French and Arabic |
| Account | The same menu offers sign out |

## `/orgs/{slug}` — learner home

The server component fetches the organization, its courses, its podcasts and the trending payload, then passes them to `OrgHomeClient`.

| Order | Section | Source | Content |
|---|---|---|---|
| 1 | Trending Courses | `GET /orgs/{org_id}/home-trending` | Top courses by enrollment count |
| 2 | Trending Podcasts | `GET /orgs/{org_id}/home-trending` | Top podcasts by listener count |
| 3 | New Courses | `GET /courses/org_slug/{slug}/...` | Newest published courses |
| 4 | New Podcasts | `GET /podcasts/org_slug/{slug}/...` | Newest published podcasts |

Every section shows up to **four** cards in a single row and a **See All** link to `/courses` or `/podcasts`. A section with no data is not rendered.

## Trending endpoint

`GET /orgs/{org_id}/home-trending?limit=8&locale=xx`.

- Requires organization membership; non-members receive `403`.
- Courses are ranked by `COUNT(TrailRun.id)` where `run_type = RUN_TYPE_COURSE`.
- Podcasts are ranked by `COUNT(TrailRun.id)` where `run_type = RUN_TYPE_PODCAST`.
- Each row is overlaid with the requested locale and returns `content_locale` / `is_fallback`.
- Podcast rows also include `episode_count` and `total_duration_seconds`, computed with one grouped query, so the card meta row is never empty.
- The default limit is 8; the learner home uses 8 and renders the first 4.

## Client behaviour

- `OrgHomeClient` seeds SWR with the server data as `fallbackData`, so the first render does not wait for a client fetch.
- Course and podcast SWR keys include `?locale=`; changing the language re-fetches them without a reload.
- Trending has its own locale-keyed SWR entry, so its server-computed cards also follow a language switch.
- Card titles and descriptions carry `dir="auto"` for mixed-direction content.

## Card and layout conventions

`SectionRow` renders the section title at 22px semibold, a muted **See All** link with an arrow, and a responsive grid: one column on mobile, two on small screens, three on large and four on extra large, with the same card size as the listing pages. Sections are separated by `space-y-10`; the page uses the standard learner container.

## Related

- [RTL and content localisation](../i18n-rtl/rtl-plan.md)
- [Courses](../../06-api-reference/courses.md)
- [Podcasts](../../06-api-reference/podcasts.md)
