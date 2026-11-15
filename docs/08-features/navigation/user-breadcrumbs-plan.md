> Status: as-built · Last verified: 2026-11-15

# User Breadcrumbs

The learner shell shows one breadcrumb trail in the top bar; entity pages register their real names, and a route-derived trail covers every other page.

## Resolution model

```
top bar (OrgMenu)
  └─ useUserBreadcrumb()
       ├─ 1. page-registered trail (preferred, from data the page already has)
       └─ 2. route-derived trail (fallback built from the pathname)
```

- **Page-registered trail.** Entity pages call `useRegisterBreadcrumb([...])` with names they already fetched, so no second request is made and no UUID flashes.
- **Route-derived trail.** `buildRouteTrail()` maps the pathname to a sensible trail on the first frame and on pages that do not register.
- **Cleared on unmount.** A stale trail never survives navigation.
- **Home is always prepended** by the top bar; pages do not include it.

## Files

| Piece | File |
|---|---|
| Context, provider, registration hook, route resolver | `components/Objects/Breadcrumbs/UserBreadcrumbContext.tsx` |
| Provider mount | `app/orgs/[orgslug]/(withmenu)/layout.tsx` |
| Top-bar renderer | `components/Objects/Menus/OrgMenu.tsx` (`BreadcrumbNav`) |
| Admin trail context | `components/Objects/Breadcrumbs/DashboardBreadcrumbContext.tsx` |
| Admin top bar | `components/Dashboard/Menus/AdminTopBar.tsx` |

## Learner trails

| Surface | Trail |
|---|---|
| `/` | Home |
| `/courses` | Home > Courses |
| `/podcasts` | Home > Podcasts |
| `/communities` | Home > Communities |
| `/trail` | Home > Progress |
| `/store` | Home > Store |
| `/search` | Home > Search |
| `/copilot` | Home > Copilot |
| `/account/{subpage}` | Home > Account > General / Profile / Security / Purchases |
| `/courses/{uuid}` | Home > Courses > Course name |
| Lesson page | Home > Courses > Course > Module > Lesson (module hidden below `lg`) |
| Course complete | Home > Courses > Course > Course Complete |
| `/podcast/{uuid}` | Home > Podcasts > Podcast name |
| `/community/{uuid}` | Home > Communities > Community name |
| Standalone discussion | Home > Communities > Community > Discussion title |
| `/user/{username}` | Home > First Last |
| Product resource | Home > Collection / Podcast / Course name |

Collections and playgrounds have no section parent because their learner listings are not reachable from the shipped navigation; their detail pages register `Home > {Entity}` only.

## Rendering rules

| Concern | Rule |
|---|---|
| Placement | Top bar, before the search and notification controls |
| Typography | Muted compact text; the current page uses the base foreground colour |
| Separator | `TriangleRightMini` with `rtl:rotate-180` |
| Truncation | Ancestors truncate at 110–160px; the current page allows up to 180–360px by breakpoint |
| Mobile | Middle crumbs are hidden below `lg`; the bar shows Home > … > Current |
| Accessibility | `<nav aria-label>`, ordered list, current item `aria-current="page"` |
| Loading | Ancestors render immediately; the entity crumb uses a generic label, never a UUID |
| Navigation | Ancestors are links with the organization prefix applied by the top bar; the current page is not a link |

## Admin breadcrumbs

The dashboard top bar derives `Home > Dashboard > {Section} > {Entity} > {Tab}` from the pathname. Pages that navigate inside local state can extend it through `useRegisterDashboardBreadcrumb`:

- `EditCourseStructure` registers the module (clickable back to its lesson list) and the open lesson, giving `… > Content > {Module} > {Lesson}`.
- Crumbs accept either an `href` or an `onClick` handler; the last crumb is never a link.
- Mobile collapse is the same `Home > … > Current` pattern as the learner shell.

## Exclusions

- Focus-mode activity player, board canvas, embed layout and editors render no breadcrumb.
- Community feeds expand discussions inline, so the feed never shows a discussion crumb.
- Podcast episodes play inline and have no route, so the trail stops at the podcast.
- The legacy `components/Objects/Breadcrumbs/Breadcrumbs.tsx` is only used by the admin course overview top; learner pages no longer render in-page trails.

## Not built

- A formal visual QA pass across English, French and Arabic at desktop and mobile widths is still pending.
- Collections and playgrounds do not get a section parent until their listings are surfaced in the learner navigation.

## Related

- [RTL and content localisation](../i18n-rtl/rtl-plan.md)
- [Dashboard consistency plan](../dashboard-polish/consistency-plan.md)
