# User-Facing Breadcrumbs — Design & Implementation

> **Status:** Implemented for the learner shell. Visual QA (desktop / mobile / Arabic) still pending.
> **Scope:** the learner shell — `apps/web/app/orgs/[orgslug]/(withmenu)/**` and `components/Objects/Menus/OrgMenu.tsx`.
> **Goal:** One accurate, translated breadcrumb trail on every learner-facing page, mirroring the pattern already shipped for the admin dashboard ([`AdminTopBar.tsx`](../../../apps/web/components/Dashboard/Menus/AdminTopBar.tsx)).
> **Companion docs:** [Consistency Plan](../dashboard-polish/consistency-plan.md), [RTL Plan](../i18n-rtl/rtl-plan.md).

---

## 0. TL;DR — the verdict

The learner breadcrumb was **not a styling problem, it was a resolution problem**:

- The top bar ([`OrgMenu.tsx`](../../../apps/web/components/Objects/Menus/OrgMenu.tsx)) only ever read the **first URL segment**. Every detail page therefore collapsed to `Home > Course`, `Home > Community`, `Home > Podcast` — never the entity name, never the lesson.
- Four pages rendered a second, separate in-page `<Breadcrumbs>` block; the course detail page imported it but **never rendered it**; ~15 other pages had none.
- Three of the four in-page trails had **hardcoded English** labels, so they stayed English in French and Arabic.

**Shipped approach:** keep **one** breadcrumb, in the top bar, and make it resolve in two layers:

1. **Route-derived skeleton** — section labels and links from the pathname (instant, no data).
2. **Page-registered detail** — entity pages push `{ label, href }` segments from data they already fetched (no duplicate requests).

The in-page `<Breadcrumbs>` usages on the learner side were removed.

**Verified against the UI (not just the routes):** community discussions expand **inline** (no navigation, so no discussion crumb on the feed), podcast episodes have **no route**, and the `/collections`, `/playgrounds` and `/boards` listings are **orphaned** (no learner entry point) — so their detail pages do not advertise a section parent. See §4.1.

### 0.1 As built

| Piece | File |
|---|---|
| Trail model, provider, page registration hook, route resolver | [`UserBreadcrumbContext.tsx`](../../../apps/web/components/Objects/Breadcrumbs/UserBreadcrumbContext.tsx) |
| Provider mounted in the learner shell | [`(withmenu)/layout.tsx`](../../../apps/web/app/orgs/[orgslug]/(withmenu)/layout.tsx) |
| Top-bar renderer (links, mobile collapse, RTL, `aria-current`) | [`OrgMenu.tsx`](../../../apps/web/components/Objects/Menus/OrgMenu.tsx) |
| Page registrations | Course, lesson (+ `end`), collection, podcast, community, discussion, playground, offer, account, user profile |
| Translation keys (14) | `navigation.breadcrumb.*` in `en` / `fr` / `ar` |
| Bonus fix | `HeaderProfileBox` account link now uses the org-scoped URL |

---

## 1. Before the change (evidence)

### 1.1 Top bar — `BreadcrumbNav` in `OrgMenu.tsx`

| Behaviour | Code |
|---|---|
| Crumbs start with `Home` (link) | `OrgMenu.tsx:104-106` |
| Only `segs[0]` is used | `OrgMenu.tsx:108-114` |
| Section label comes from a small map, then falls back to the capitalised URL segment | `OrgMenu.tsx:92-110` |
| Section has **no href** — it is rendered as plain text | `OrgMenu.tsx:113` |
| Mobile collapses non-active crumbs to `...` | `OrgMenu.tsx:131-137` |
| RTL chevron handled | `OrgMenu.tsx:141` |

The map covers `courses`, `collections`, `podcasts`, `communities`, `playgrounds`, `store`, `trail`, `boards`, `copilot`. It does **not** cover the singular detail segments (`course`, `collection`, `podcast`, `community`, `playground`, `account`, `user`, `certificates`, `search`), so those render as capitalised raw segments.

### 1.2 In-page `<Breadcrumbs>` usages

| Page | Trail rendered | Notes |
|---|---|---|
| Course activity (`activity.tsx:644-648`) | `Courses > {course} > {activity}` | `Courses` translated; no chapter/module |
| Community discussion (`discussion.tsx:39-43`) | `Communities > {community} > {discussion}` | `Communities` **hardcoded English** |
| Playground (`view.tsx:97-102`) | `Playgrounds > {playground}` | `Playgrounds` **hardcoded English**; href `'/playgrounds'` **missing the org prefix** |
| Account (`AccountClient.tsx:60-69`) | `Account > {subpage}` | Fully translated |
| Course detail (`course.tsx:17`) | — | **Import only, never rendered** |
| Dashboard course overview (`CourseOverviewTop.tsx:150-153`) | `Courses > {course}` | Admin surface — out of scope |

### 1.3 SEO breadcrumbs already exist (and disagree with the UI)

`buildBreadcrumbJsonLd` is emitted on the course, activity, collection, podcast, community and offer pages. The activity page already declares `Home > Courses > {course} > {activity}` — the visible UI does not match it. Fixing the UI also fixes the structured-data mismatch.

---

## 2. What is broken (ranked)

1. **Detail pages lose their identity.** `/course/abc` shows `Home > Course`; `/course/abc/activity/xyz` shows the same thing. The user cannot tell where they are or go back one level.
2. **Two breadcrumbs, one of them wrong.** On activity/discussion/playground/account pages the top bar and the page body show different trails.
3. **No trail on most pages.** Course detail, courses list, collections, podcasts, communities, store, offer, trail, search, user profile, boards — none.
4. **Untranslated labels** in the in-page trails (`Communities`, `Playgrounds`).
5. **Multi-tenant bug:** `Playgrounds` links to `/playgrounds` instead of the org-scoped URL (`getUriWithOrg`). Related: podcast/community list cards also hardcode `/orgs/${orgslug}`.
6. **No chapter/module crumb**, although the activity page header already prints `Chapter N : {name}`.
7. **Course-end page has no breadcrumb at all** (`activityid === 'end'` renders `CourseEndView` above the in-page breadcrumb branch).
8. **SEO JSON-LD vs visible UI divergence** on all detail pages.
9. **Mock/dev pages could leak in:** `lesson-preview`, `podcast/.../episode-design-options`, `progress-design` are preview surfaces built on mock data — they must be excluded from breadcrumbs.

---

## 3. Rules the new system must follow

1. **One breadcrumb per screen** — the top bar. No second in-page trail on learner pages.
2. **The last crumb is the current page** — never a link, `aria-current="page"`.
3. **Every ancestor is a link** — including the section crumb (`Courses`, `Podcasts`, …).
4. **Never show raw UUIDs or URL slugs.** While a name loads, show the generic entity label (`Course`, `Podcast`, `Community`, `Discussion`, `Collection`, `Playground`, `Offer`, `Profile`).
5. **Never translate user data.** Only static labels go through `t()`.
6. **Max 4 visible levels.** `Home > Section > Entity > Item`; the module level is the 5th and is handled as described in §4.2.
7. **Collapse on mobile:** show `Home > … > Current` below `lg`.
8. **RTL:** separator rotates (`rtl:rotate-180`), ordering follows the document direction.
9. **No breadcrumb on full-bleed surfaces:** focus-mode activity player, board canvas, embed, editors, and the mock preview pages.

---

## 4. Complete breadcrumb map

Legend: **[L]** = link, **[T]** = current page (text), *(module)* = informational, not linked.

### 4.1 What the UI actually navigates to (verified in the components)

Checking the learner UI changed several assumptions. These are the facts the trail must be built on:

| Assumption | Reality in the UI |
|---|---|
| Discussions open a detail page | **No.** [`DiscussionList`](../../../apps/web/components/Objects/Communities/DiscussionList.tsx) renders [`DiscussionCard`](../../../apps/web/components/Objects/Communities/DiscussionCard.tsx) cards that **expand in place** (content + replies). There is no link to `/community/.../discussion/...` in the feed. The detail route exists but is reached from **search results** and the **course page's community section** ([`CourseCommunitySection.tsx:99`](../../../apps/web/components/Objects/Communities/CourseCommunitySection.tsx#L99)). |
| Podcasts have episodes as pages | **No.** Episodes play inline in [`podcast.tsx`](../../../apps/web/app/orgs/[orgslug]/(withmenu)/podcast/[podcastuuid]/podcast.tsx); there is no episode route. The trail stops at the podcast. |
| Collections are a section | **Not in the learner UI.** The org home is a placeholder ([`(withmenu)/page.tsx`](../../../apps/web/app/orgs/[orgslug]/(withmenu)/page.tsx)), `LandingClassic` is unused, and nothing links to `/collections`. Collection detail is reachable only from **search results** (and direct URLs). |
| Playgrounds are a section | **Listing is orphaned.** `/playgrounds` exists and its cards open detail pages, but no learner nav/search entry points to `/playgrounds`; search links straight to `/playground/{uuid}`. |
| Boards are a section | **Listing is orphaned.** `/boards` exists and its cards open `/board/{uuid}`, but nothing in the learner nav points to `/boards`. The canvas lives outside the shell. |
| Account is easy to reach | Reachable from `HeaderProfileBox`, **but** its first item links to `/account/general` **without the org prefix** ([`HeaderProfileBox.tsx:89`](../../../apps/web/components/Security/HeaderProfileBox.tsx#L89)) — a multi-tenancy bug. |
| Lesson → lesson keeps the URL | **No.** Next/previous and "mark complete" call `router.push(...)` to a new activity URL ([`activity.tsx:302-307`](../../../apps/web/app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/activity/[activityid]/activity.tsx#L302-L307)), so the trail must re-resolve on every lesson change. |
| `Home` is a real landing page | It is a **placeholder** (`Home / Welcome to your learning dashboard`). The `Home` crumb is technically valid but lands on a near-empty page. |

### 4.2 Root and listing pages

| Route | Breadcrumb | Reachable from UI | Applies |
|---|---|---|---|
| `/` | Home **[T]** | Sidebar, search | Yes |
| `/courses` | Home **[L]** > Courses **[T]** | Sidebar, search, landing | Yes |
| `/collections` | Home **[L]** > Collections **[T]** | **Nothing** (orphaned) | Only if surfaced; otherwise skip |
| `/collections/new` | Home **[L]** > Collections **[L]** > New Collection **[T]** | Only from `/collections` | Only with the parent above |
| `/podcasts` | Home **[L]** > Podcasts **[T]** | Sidebar, search | Yes |
| `/communities` | Home **[L]** > Communities **[T]** | Sidebar, search | Yes |
| `/playgrounds` | Home **[L]** > Playgrounds **[T]** | **Nothing** (orphaned) | Only if surfaced; otherwise skip |
| `/boards` | Home **[L]** > Boards **[T]** | **Nothing** (orphaned) | Only if surfaced; otherwise skip |
| `/store` | Home **[L]** > Store **[T]** | Sidebar, search | Yes |
| `/trail` | Home **[L]** > Progress **[T]** | Sidebar, search | Yes |
| `/search` | Home **[L]** > Search **[T]** | Search modal "see all" (`/search?q=`) | Yes |
| `/copilot` | Home **[L]** > Copilot **[T]** | Top bar | Yes |
| `/account/*` | Home **[L]** > Account **[L]** > {General \| Profile \| Security \| Purchases} **[T]** | Profile menu (`HeaderProfileBox`) | Yes (fix the `/account/general` link) |
| `/certificates/[uuid]/verify` | Home **[L]** > Certificate Verification **[T]** | Trail page, course-end page | Yes |
| `/user/[username]` | Home **[L]** > {First Last} **[T]** | Avatar hover card, search users tab | Yes |

### 4.3 Entity detail pages

| Route | Breadcrumb | How the user actually gets there |
|---|---|---|
| `/course/[courseuuid]` | Home **[L]** > Courses **[L]** > {Course name} **[T]** | Courses list, search, trail |
| `/course/[courseuuid]/activity/[activityId]` | Home **[L]** > Courses **[L]** > {Course name} **[L]** > {Lesson name} **[T]** | "Start course", curriculum, trail, next/previous |
| — with module context (recommended) | Home **[L]** > Courses **[L]** > {Course name} **[L]** > {Module name} *(module)* > {Lesson name} **[T]** | same; module hidden below `lg` |
| `/course/[courseuuid]/activity/end` | Home **[L]** > Courses **[L]** > {Course name} **[L]** > Course Complete **[T]** | "Mark complete" on the last lesson |
| `/collection/[collectionid]` | Home **[L]** > **{Collection name}** **[T]** — *until a Collections listing exists* | Search results, direct URL |
| `/podcast/[podcastuuid]` | Home **[L]** > Podcasts **[L]** > {Podcast name} **[T]** | Podcasts list, search |
| `/community/[communityuuid]` | Home **[L]** > Communities **[L]** > {Community name} **[T]** | Communities list, search, course community section |
| `/community/[communityuuid]/discussion/[discussionId]` | Home **[L]** > Communities **[L]** > {Community name} **[L]** > {Discussion title} **[T]** | Search results, course community section — **not** the community feed |
| `/playground/[playgrounduuid]` | Home **[L]** > **{Playground name}** **[T]** — *until a Playgrounds listing is surfaced* | Search results, direct URL |
| `/store/offers/[offerid]` | Home **[L]** > Store **[L]** > {Offer name} **[T]** | Store cards, course offer card |

**Consequences for the design:**

1. **Community page never shows a discussion crumb** while the feed is inline. Only the standalone discussion route does.
2. **Collections and playgrounds get no section parent** until their listing pages are discoverable. A clickable `Collections` / `Playgrounds` parent would send users to an orphaned page.
3. **No episode crumb** exists by design.
4. **The trail follows the URL, not the entry path.** A user arriving at a discussion from a course sees `Communities > {Community} > {Discussion}`, which is what the URL says and what the back-nav should do.
5. **`/boards` and `/board/{uuid}` get no breadcrumb work** in this pass.

**Module level — decision needed.** The user example is 4 levels (`Home > Courses > Course > Lesson`). The module name is valuable because lesson names repeat and the page header already shows it, but 5 levels is too much on mobile. Recommendation: include the module **only on `lg+`**, and on smaller screens drop it (`Home > … > Lesson`). Alternative: always 4 levels, module stays in the page header only.

### 4.4 Inline surfaces — no crumb change

| Surface | Why |
|---|---|
| Community feed (expanded discussion card) | Inline state; the URL stays on `/community/{uuid}` |
| Podcast episode player | Inline state; no episode route |
| Course curriculum accordion | Inline state until a lesson is opened (then the lesson URL takes over) |
| Store offer preview cards | No detail state; the card links to the offer page |

### 4.5 Explicitly excluded

| Surface | Why |
|---|---|
| `/course/[uuid]/lesson-preview` | Mock-data design preview; not linked in the product |
| `/podcast/[uuid]/episode-design-options` | Mock-data design preview |
| `/progress-design` | Mock-data design preview |
| `/board/[uuid]` | Full-screen canvas, rendered **outside** `(withmenu)` — no `OrgMenu`, so no top bar |
| `/embed/[orgslug]/**` | Embed layout has its own chrome |
| `/editor/course/**`, `/editor/playground/**` | Editor surfaces |
| Activity page in **focus mode** | `OrgMenu` returns children only (`OrgMenu.tsx:311-313`); no shell, no breadcrumb |

---

## 5. Recommended architecture

### 5.1 Two-layer resolution

```
top bar renders  ←  useUserBreadcrumb()
                     ├─ 1. page-registered trail   (context, preferred)
                     └─ 2. route-derived trail     (fallback, always available)
```

**Why not URL + SWR only (the admin approach)?**
The admin approach works because its entities are addressed by a single UUID and the name can be fetched with one request. The lesson breadcrumb needs `course → chapter → activity`, which is three pieces of data — and every learner page **already has them in memory**. Re-fetching in the top bar would duplicate requests and still flash `...`.

**Why not page-registration only?**
On a cold navigation the top bar would render `Home` alone until the page effect runs. The route-derived fallback guarantees a sane trail on the first frame (`Home > Courses > Course`).

### 5.2 Provider API

New file: `apps/web/components/Objects/Breadcrumbs/UserBreadcrumbContext.tsx`

```tsx
export interface Crumb {
  label: string
  href?: string          // omitted on the current page
  mobileHidden?: boolean // e.g. the module crumb
}

// Page side — call with data the page already has.
useRegisterBreadcrumb(crumbs: Crumb[]): void

// Top bar side — returns the final trail.
useUserBreadcrumb(): { crumbs: Crumb[]; isResolved: boolean }
```

- Provider mounted in [`(withmenu)/layout.tsx`](../../../apps/web/app/orgs/[orgslug]/(withmenu)/layout.tsx) next to `OrgJoinBannerProvider`.
- `useRegisterBreadcrumb` registers on mount/update and **clears on unmount** so a stale trail never survives navigation.
- The route-derived fallback lives in the same module (`buildRouteCrumbs(pathname, orgslug, t)`), reusing the section-label map already in `OrgMenu`.

### 5.3 Data sources (all already available on the page)

| Segment | Source already in the page | Name field |
|---|---|---|
| Course | `course` prop in `course.tsx` / `activity.tsx` | `course.name` |
| Module | `course.chapters[]` | `chapter.name` (matched by `activity.id`) |
| Lesson | `activity` prop in `activity.tsx` | `activity.name` |
| Collection | `useSWR` data in `collection.tsx` | `col.name` |
| Podcast | `initialPodcast` in `podcast.tsx` | `podcast.name` |
| Community | `community` prop in `community.tsx` / `discussion.tsx` | `community.name` |
| Discussion | `discussion` state in `discussion.tsx` | `discussion.title` |
| Playground | `playground` prop in `view.tsx` | `playground.name` |
| Offer | `offer` prop in `offer-detail.tsx` | `offer.name` |
| Account subpage | `subpage` prop | existing `account.*` keys |
| User profile | `userData` in `UserProfileClient.tsx` | `first_name` + `last_name` |

Fallback labels while loading: `Course`, `Collection`, `Podcast`, `Community`, `Discussion`, `Playground`, `Offer`, `Profile`.

### 5.4 Worked example — activity page

```tsx
const chapter = course.chapters.find((ch: any) =>
  ch.activities.some((a: any) => a.id === activity.id)
)

useRegisterBreadcrumb([
  { label: t('common.home'), href: getUriWithOrg(orgslug, '/') },
  { label: t('courses.courses'), href: getUriWithOrg(orgslug, '/courses') },
  { label: course.name, href: getUriWithOrg(orgslug, `/course/${courseuuid}`) },
  // Optional module crumb — hidden below lg
  ...(chapter ? [{ label: chapter.name, mobileHidden: true }] : []),
  { label: activity.name },
])
```

`OrgMenu.BreadcrumbNav` then renders the trail instead of parsing the pathname itself.

---

## 6. Rendering rules

| Concern | Rule |
|---|---|
| Placement | Top bar, left of the notifications/search cluster (current position is correct) |
| Typography | `txt-compact-small-plus`, muted; last crumb `text-ui-fg-base` |
| Separator | `TriangleRightMini`, `rtl:rotate-180` |
| Truncation | Each crumb `truncate`, `max-w-[150px]` (mobile) / `max-w-[220px]` (desktop) |
| Mobile | `Home > … > Current` below `lg`; `mobileHidden` crumbs never render |
| Desktop | Full trail, max 5 levels |
| Accessibility | `<nav aria-label="Breadcrumb">`, `<ol>`, last item `aria-current="page"` |
| Loading | Ancestors render immediately; the entity crumb shows the generic label, never `...` or the UUID |
| Error / 404 | Parent trail still renders; the current page is dropped by the error boundary |
| RTL | Order follows `dir`; separators rotate; no `flex-row-reverse` hacks |

---

## 7. i18n keys to add (en / fr / ar)

Reuse where possible: `common.home`, `common.search`, `common.boards`, `common.playgrounds`, `courses.courses`, `courses.progress`, `courses.chapter`, `podcasts.podcasts`, `communities.title`, `collections.collections`, `collections.new_collection`, `account.general`, `account.profile`, `account.security`, `account.purchases`.

New keys — proposed under `navigation.breadcrumb.*`:

| Key | English |
|---|---|
| `navigation.breadcrumb.store` | Store |
| `navigation.breadcrumb.copilot` | Copilot |
| `navigation.breadcrumb.account` | Account |
| `navigation.breadcrumb.certificate_verification` | Certificate Verification |
| `navigation.breadcrumb.course_complete` | Course Complete |
| `navigation.breadcrumb.course_fallback` | Course |
| `navigation.breadcrumb.collection_fallback` | Collection |
| `navigation.breadcrumb.podcast_fallback` | Podcast |
| `navigation.breadcrumb.community_fallback` | Community |
| `navigation.breadcrumb.discussion_fallback` | Discussion |
| `navigation.breadcrumb.playground_fallback` | Playground |
| `navigation.breadcrumb.offer_fallback` | Offer |
| `navigation.breadcrumb.profile_fallback` | Profile |

Notes:
- `dashboard.breadcrumb.*` stays admin-only; do not reuse it, the key space diverges.
- All three locale files must receive the same keys in the same commit (same rule as Phase 4 of the dashboard polish).

---

## 8. Implementation phases

| Phase | Work | State |
|---|---|---|
| 0 — foundation | `UserBreadcrumbContext` + `buildRouteTrail`; provider in `(withmenu)/layout.tsx`; `BreadcrumbNav` reads the context | ✅ Done |
| 1 — static sections | Reachable listings: `/`, courses, podcasts, communities, store, trail, search, copilot, account, certificate verify. Collections/playgrounds/boards intentionally have no section parent | ✅ Done |
| 2 — entity details | Course, activity (+ `end`), collection, podcast, community, discussion, playground, offer, account, user profile. **No discussion crumb on the community feed** | ✅ Done |
| 3 — cleanup | Removed all learner-side in-page `<Breadcrumbs>` and dead imports; fixed the org prefix in `HeaderProfileBox` | ✅ Done |
| 4 — i18n | 14 keys added to `en` / `fr` / `ar`; hardcoded labels removed | ✅ Done |
| 5 — QA | Desktop + mobile + Arabic visual pass, `aria-current`, truncation, collapse | ⬜ Pending |

---

## 9. Acceptance checklist

Verified in code (`tsc` clean against the 23-error baseline, all route fallbacks unit-checked, routes return 200); visual items still need a pass.

- [x] `Home > Courses > {Course}` on the course page.
- [x] `Home > Courses > {Course} > {Lesson}` on a lesson (module crumb only on `lg+`).
- [x] `Home > Courses > {Course} > Course Complete` on `activity/end`.
- [x] `Home > Communities > {Community}` on the community feed — **no discussion crumb**, even when a card is expanded.
- [x] `Home > Communities > {Community} > {Discussion}` on the standalone discussion page.
- [x] `Home > Podcasts > {Podcast}` and `Home > Store > {Offer}` register real names.
- [x] `Home > Account > {Subpage}` now sourced from the top bar.
- [x] No page shows `Home > Course` / `Home > Community` (singular, nameless).
- [x] No UUID or slug appears as a crumb label; loading uses the generic fallback (never `...`).
- [x] Exactly one breadcrumb per screen.
- [x] All labels route through `t()` with en / fr / ar keys; user data untouched.
- [x] Mobile renders `Home > … > Current`; desktop renders up to 5 levels.
- [x] RTL separator orientation preserved (`rtl:rotate-180`).
- [x] Focus mode, board canvas, embed and editor pages render no breadcrumb.
- [x] Trail re-registers when navigating lesson → lesson (new URL, new data).
- [ ] Visual QA in en / fr / ar at desktop and mobile widths.

---

## 10. Decisions (locked)

| # | Decision | Outcome |
|---|---|---|
| 1 | **Module crumb** | Included, `mobileHidden` so it only shows on `lg+` |
| 2 | **In-page breadcrumbs** | Removed on the learner side; the top bar is the single breadcrumb |
| 3 | **User profile trail** | `Home > {First Last}` (falls back to username, then `Profile`) |
| 4 | **Collections / Playgrounds parents** | No section parent while the listings are orphaned; detail pages register `Home > {Entity}` |
| 5 | **Board canvas** | Out of scope — it renders outside the learner shell |
| 6 | **`Home` landing** | Left as-is (placeholder page); revisit with the learner home work |
