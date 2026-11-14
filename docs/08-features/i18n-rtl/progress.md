# i18n & RTL — Progress & Handoff

> **Last updated:** 2026-11-14
> **Branch:** `feat/learnhouse-1.2.0-custom`
> **Latest checkpoint:** `0b488024` — *fix: add ACTIVITY_TRANSLATIONS with French (fr) locale keys for all 20 lessons* (collection-editor and metadata changes below are uncommitted)
> **Companion docs:** [RTL Plan](./rtl-plan.md) (research + strategy), [Content Localization](./content-localization.md), [Collections Localization](./collections-localization.md), [Podcasts Localization](./podcasts-localization.md), [Dashboard Polish](../dashboard-polish/consistency-plan.md)

This is the working log. Read this first when resuming; read `rtl-plan.md` for the reasoning behind the approach.

---

## 1. Where we are, in one paragraph

English is the master language. French and Arabic are fully translated (text only), and the hardcoded-JSX extraction pass for the **real UI** is done. **Phase 4 (RTL layout) is complete for every reachable screen** — 259/259 + 288/288 physical utilities converted in the final two sweeps. **Phase 5 (polish) is complete** except the lint guard, which is blocked by a broken ESLint pipeline in this repo (see §7.4): locale-aware `Intl.*` formatting, `dir="auto"` on user content, the embed resize delta and the logical CSS in discussion rich text are all in. **Content localization is shipped for courses, collections and podcasts** (§12): base row + translation table, `?locale=` on every read, locale-aware dashboard editors, Translations tabs and learner fallback notices.

---

## 2. Locked-in scope decisions

These came from the user and should not be re-litigated:

1. **English is the source of truth.** Every new key is added to `en.json` first, then mirrored to `fr` and `ar`.
2. **Translate only UI that actually exists.** A page counts as UI only if it is reachable from the platform nav (`MedusaSidebar`), the dashboard nav (`DashLeftMenu`), or a link/button inside an already-reachable page. Route-file existence is *not* evidence of UI.
3. **Boards and Playgrounds are out of scope.** They have no entry point in the shipped UI.
4. **Every phase is its own commit + push**, so the user can roll back to a text-only checkpoint at any time.
5. **No MCP, no browser** for the audit/translation passes.
6. **Platform admin, boards, playgrounds and `CertificatePreview` stay LTR** — see §10 for the reasons.

---

## 3. Architecture recap

| Piece | File | Notes |
|---|---|---|
| i18n config | `apps/web/lib/i18n.ts` | `supportedLngs: ['en','fr','ar']`, `fallbackLng: 'en'`, `ns: ['common']`, `defaultNS: 'common'`, `pluralSeparator: '_'`. Only English is bundled; `fr`/`ar` load lazily via `LOCALE_LOADERS`. |
| Locale files | `apps/web/locales/{en,fr,ar}.json` | ~6.8k lines each. `en.json` is written by PowerShell with `"key":  "value"` (double space). `fr`/`ar` were normalized to `JSON.stringify` (2-space) earlier — **that is why their diffs look enormous**. |
| Direction helpers | `apps/web/lib/direction.ts` | `RTL_LANGUAGES`, resolves `dir` from a language code. |
| SSR direction | `apps/web/app/layout.tsx` | Renders `<html lang dir>` from the `i18next` cookie, before paint — no LTR flash. |
| Client direction | `apps/web/components/Contexts/I18nContext.tsx` | Sets `document.documentElement.dir` and wraps the tree in Radix `DirectionProvider`. |
| RTL typography | `apps/web/app/globals.css` | `html[dir='rtl']` font/letter-spacing overrides (Noto Sans Arabic). |
| Provider tree | `apps/web/components/Providers.tsx` | Session → LHSession → `I18nProvider`. `useTranslation()` is safe anywhere under it. |

### Plural keys

| Locale | Forms written |
|---|---|
| `en` | `_one` / `_other` |
| `fr` | `_one` / `_many` / `_other` |
| `ar` | `_zero` / `_one` / `_two` / `_few` / `_many` / `_other` |

Arabic `_one` / `_two` legitimately drop `{{count}}` — that is correct CLDR behaviour, not a bug.

---

## 4. Commit ledger

### Phase 1 — French text
| Commit | What |
|---|---|
| `b7c88ea0` | Complete the French locale |

### Phase 2 — Arabic text + plurals
| Commit | What |
|---|---|
| `60c59eb0` | Complete the Arabic locale |

### Phase 3 — hardcoded JSX → i18n (real UI only)

Earlier passes:
| Commit | Area |
|---|---|
| `d9d2f0c9` | Organization settings |
| `4534db08` | Users settings |
| `bedde7b4` | Course settings |
| `e8cdb234` | Analytics dashboard + command palette |
| `95eabef8` | Podcast + community settings |
| `d2966c82` | Payments dashboard |
| `1ae32d54` | Sidebar sub-nav, breadcrumb, podcast tab, onboarding |
| `beab9f13` | Course landing page |
| `c68c4c2b` | Trail, communities, store |
| `f7d77bc5` | Podcast pages + cards |
| `35385dad` | Lesson preview |
| `a93563c3` | Certificate pages |
| `474f05bd` | Playground listing/viewer/options — **see open question #1** |

This cycle:
| Commit | Area |
|---|---|
| `e24d7251` | Dashboard listing filters + RTL-safe pagination (courses, collections, communities, podcasts) |
| `acffe98a` | Assignments task editor (code, form, quiz, file, number, short answer) |
| `8dc5907f` | Copilot page, bubble, session groups |
| `5774826d` | Sidebar, org menu, mobile menu, search modal |
| `1dedd222` | Account purchases, community discussion filters, embed activity |

### Phase 4 — RTL smart swap (done)

| Commit | Scope | State |
|---|---|---|
| `a28639fb` | Assignments section + copilot | done |
| `c49cd8de` | `components/ui` primitives, course/collection/podcast cards, course detail widgets, community components | done |
| `ef41bd70` | Dashboard analytics, settings pages, dashboard listings (78 files) | done |
| `0c3fc173` | Course player, public pages, rich-text editor, auth/embed/home (92 files) | done |

### Phase 5 — polish (in progress)

| Commit | Scope | State |
|---|---|---|
| `7165ed0e` | `Intl.*`/`toLocale*` locale args → `i18n.language` (31 files) + `dir="auto"` on user content | done |

### Content localization cycle (courses → collections → podcasts)

| Commit | Scope | State |
|---|---|---|
| `cb598e54` | Collections: `collection_translation`, `?locale=` on every read, locale-aware General/SEO, Translations tab, learner listing/detail | done |
| `504335af` | Podcasts: `podcast_translation` + `podcast_episode_translation`, localized `/meta` and episode list, locale-aware General/Episodes, Translations tab, learner pages, episode card surface | done |
| `fe324eba` | **Checkpoint:** i18n infrastructure for activity translations, locale-aware module editing (ModuleDetailForm rewrite), activity translation seed builder | done |
| `0b488024` | **Fix:** add `ACTIVITY_TRANSLATIONS` with French (fr) locale keys for all 20 lessons in seed data | done |

Lesson-page and breadcrumb work from the same cycle (reference for future surfaces):

| Commit | Scope |
|---|---|
| `1fa20fc6` | Rebuilt the 21 demo lessons in en/fr/ar with objectives, takeaways, knowledge checks and resources |
| `15a84779` | Lesson page renders only dashboard-authored blocks (video slot, learnings, takeaways, resources, quiz) |
| `4ba889e8` / `723f1e15` | Lesson page + module/lesson rows on the locked card surface |
| `b88bf0c1` | `Content` breadcrumb returns to the module list |
| `fc8fc091` | Removed the "MODULE N" label from the curriculum |

---

## 5. Phase 4 — what has been converted (detail)

### Shared primitives (`apps/web/components/ui`)
`dropdown-menu.tsx` (`ps-8`, `ms-auto`, `ps-[31px] pe-2`, `start-2`, mirrored sub-trigger chevron), `table.tsx` (first/last cell `ps/pe`, `text-start`), `input.tsx` (search icon `start-0`, `ps-*`), `alert.tsx` (`[&>svg]:start-4`, `ps-7`), `dialog.tsx` (`end-4`, `sm:text-start`), `status-badge.tsx`, `sub-nav.tsx`.

> Not converted on purpose: `navigation-menu.tsx`, `hover-card.tsx`, `popover.tsx`, `select.tsx`, `tooltip.tsx`. Their remaining matches are Radix **animation side classes** (`data-[side=left]:slide-in-from-right-2`) which describe physical pointer position and must stay physical. `navigation-menu.tsx` is also unused (no imports).

### Cards
`CourseThumbnail`, `CourseThumbnailLanding`, `CollectionThumbnail`, `CollectionCard`, `PodcastThumbnail`, `PodcastCardShowcase` — corner badges/action menus now use `start-*`/`end-*`, dropdown items `text-start`, icons `me-*`.

### Course widgets
`CourseCurriculum`, `CourseAuthors`, `CourseProgress`, `CourseRequirements`, `CourseLearnings`, `CourseShare`, `CourseActions`, `OfferCard`.

### Podcasts
`PodcastPlayer` (time column `text-end`), `PodcastSidebar` (timeline `ps-5` + `before:start-[3px]`), `EpisodeCard`.

### Communities
`CommentCard` (thread indent `ps-[36px]`), `DiscussionCard`, `DiscussionDetail`, `CommunityActionsMobile`, `EmojiPicker`.

### Assignments + copilot (previous checkpoint, `a28639fb`)
Task editor shell, all six task types, submissions list, student assignment activity, edit-assignment modal, copilot page + bubble.

### Patterns worth reusing

```tsx
// Corner badge that must stay centred on the edge in both directions
className="absolute top-0 end-0 translate-x-1/2 rtl:-translate-x-1/2"

// Pagination: mirror the chevrons, keep the labels logical
<ChevronLeft className="w-4 h-4 rtl:rotate-180" />
<span className="ms-1">{t('pagination.previous')}</span>

// Popover anchored to a button, opening from the inline-end corner
style={{ transformOrigin: i18n.dir() === 'rtl' ? 'bottom left' : 'bottom right' }}
```

Rule of thumb: **convert the inside of a component; leave the parent flex/grid alone** (they already follow `dir`).

---

## 6. What is left

Measured after `0c3fc173` on `apps/web/**/*.tsx`:

```
222 matches across 51 files for  (ml-|mr-|pl-|pr-|left-|right-|rounded-l-|rounded-r-|text-left|text-right)
```

Down from 806 matches / 205 files. **The remainder is almost entirely out-of-scope or benign:** `CertificatePreview.tsx` (68), `Dashboard/Boards/**` (~40), `components/Admin/**` (~23), `app/admin/**` (8), Playgrounds (~12), `demo-header`/`test-dev` (~16), and ~15 Radix animation sides that must stay physical.

**This number overstates the work.** A large share of matches are benign and should be left alone:

- Symmetric centring — `left-1/2 -translate-x-1/2`, `right-1/2 translate-x-1/2`.
- Symmetric full-width insets — `left-0 right-0`.
- Radix animation sides — `data-[side=left]:slide-in-from-right-2`.
- Unused shadcn primitives.

Use this grep to find the real work per file:

```powershell
cd apps/web
Get-ChildItem -Recurse -Include *.tsx | Select-String -Pattern '\b(ml-|mr-|pl-|pr-|left-\d|right-\d|rounded-l-|rounded-r-|text-left|text-right)' |
  Group-Object Path | Sort-Object Count -Descending | Select-Object Count, Name
```

### 6.1 Dashboard — analytics (~20 files, highest density)

`components/Dashboard/Analytics/`:
`CoreWidgetsRow.tsx` (19), `StatDetailModals.tsx` (12), `LearnerEngagementScore.tsx` (11), `ActivityEngagement.tsx` (7), `TopCoursesTable.tsx` (7), `CoursePeakHours.tsx` (6), `EventOverview.tsx` (5), `SearchEffectiveness.tsx` (5), `CourseEngagementByType.tsx` (9), `CourseActivityTypeBreakdown.tsx` (9), `AnalyticsExport.tsx` (3), `CourseActivityFunnel.tsx` (3), `BreakdownList.tsx` (3), `Filters.tsx` (3), plus `CohortRetention`, `PeakUsageHeatmap`, `AnalyticsTabs`, `CourseTimePerActivity`, `CourseActivityDropoff`, `CourseTopLearners`, `LearnersTab`.
Also `components/Analytics/` (`DataTable.tsx` (7), `TrendChart.tsx`, `BreakdownList.tsx`, `Filters.tsx`).

### 6.2 Dashboard — settings pages

- Org: `OrgEditDomains.tsx` (10), `OrgEditGeneral.tsx` (6), `OrgEditAPIAccess.tsx` + `APIDocumentation.tsx` (6), `OrgEditBranding/FontSelector.tsx` (4), `OrgEditSEO.tsx`, `OrgAuditLogs.tsx`, `OrgEditAutomations.tsx`
- Users: `OrgUserGroups.tsx` (8), `OrgRoles.tsx` (5), `OrgUsers.tsx` (4), `EditRole.tsx`, `AddRole.tsx`, `ManageUsers.tsx` (5)
- Course editor: `ModuleForm.tsx` (4), `EditCourseStructure.tsx` (4), `ActivityElement.tsx`, `LockPopover.tsx`, `NewActivityButton.tsx`, `CustomSelect.tsx`, `UnsplashImagePicker.tsx`, `KnowledgeCheckItemsList.tsx`, `TakeawayItemsList.tsx`, `EditCourseContributors.tsx` (4), `EditCourseAccess.tsx` (4), `CertificatePreview.tsx` (68 — **see open question #2**), `EditCourseCertification.tsx`
- Payments: `PaymentsOffersPage.tsx` (4), `OfferResourcesPanel.tsx`
- Podcast: `EditPodcastEpisodes.tsx` (5), `EditPodcastAccess.tsx` (4), `PodcastDistribution.tsx` (4), `EditPodcastGeneral.tsx`
- Collections: `EditCollectionContent.tsx` (4), `EditCollectionAccess.tsx` (4)
- Community: `CommunityEditCourse.tsx` (3), `CommunityEditAccess.tsx` (3)
- Misc: `OnboardingBar.tsx` (6), `UserProfileBuilder.tsx` (12), `CourseOverviewTop.tsx`, `PlanBadge.tsx`, `CommandPalette.tsx`, `CommandPaletteTrigger.tsx`
- Dashboard listings: `dash/collections/client.tsx` (4), `dash/courses/client.tsx`, `dash/communities/client.tsx`, `dash/podcasts/client.tsx`, `dash/courses/migrate/client.tsx` (2)

### 6.3 Course player / activity

`components/Pages/Activity/`: `ActivityNavigation.tsx` (5), `FixedActivitySecondaryBar.tsx` (4), `ActivityChapterDropdown.tsx` (3), `ActivityShareDropdown.tsx`, `CourseEndView.tsx`.
`components/Pages/Courses/ActivityIndicators.tsx` (5).
`components/Objects/Activities/Video/LearnHousePlayer.tsx` (6), `CloudflarePlayer.tsx` (8) — **media controls: do not mirror play/seek icons**, only the chrome around them.
`components/Objects/Activities/AI/AIActivityAsk.tsx` (5), `AIMarkdownRenderer.tsx` (5).

### 6.4 Public / learner pages

`app/orgs/[orgslug]/(withmenu)/courses/courses.tsx` (9), `collections/CollectionsClient.tsx` (5), `trail/trail.tsx` (5), `community/[communityuuid]/community.tsx` (9), `user/[username]/UserProfileClient.tsx` (7), `store/store.tsx`, `communities/communities.tsx` (2), `search/page.tsx` (5), `course/[courseuuid]/lesson-preview/page.tsx` (15).
`app/home/home.tsx` (2), `app/not-found.tsx` (3).
`components/Objects/Search/SearchBar.tsx` (4), `Objects/Account/subpages/AccountGeneral.tsx` (6), `Objects/Account/AccountActionsMobile.tsx` (2), `Objects/Banners/OrgJoinBanner.tsx` (2), `Objects/Menus/MedusaSidebar.tsx` (3), `Objects/Menus/OrgMenu.tsx` (1), `Objects/Menus/UserLeftMenu.tsx` (2).

### 6.5 Rich-text editor (`components/Objects/Editor/`)

Extension chrome only — `EmbedObjectsComponent.tsx` (7), `WebPreviewComponent.tsx` (5), `MathEquationBlockComponent.tsx` (5), `AudioBlockComponent.tsx` (3), `FlipcardExtension.tsx` (3), `BadgesExtension.tsx` (3), `ImageBlockComponent.tsx`, `PDFBlockComponent.tsx`, `VideoBlockComponent.tsx`, `QuizBlockComponent.tsx`, `MagicBlock*.tsx`, `ScenariosModal.tsx`, `Editor.tsx`, `AIEditorToolkit.tsx` (4).
**Prose itself is content, not chrome — use `dir="auto"`, never flip it.**

### 6.6 Auth

`app/auth/sso/callback/page.tsx` (8), `app/auth/signup/signup.tsx`, `InviteOnlySignUp.tsx`, `components/Auth/AuthMobileHeader.tsx` (2).

### 6.7 Explicitly excluded

- `components/Dashboard/Boards/**`, `app/orgs/[orgslug]/dash/boards/**` — no UI entry point.
- `components/Playground/**`, `app/orgs/[orgslug]/dash/playgrounds/**` — no UI entry point.
- `components/Admin/**`, `app/admin/**` — platform admin, undecided (open question #3).
- `app/test-dev/**`, `app/demo-header/**`, `app/progress-design/**` — dev-only scratch routes.

---

## 7. Phase 5 — polish (in progress)

1. ~~**`dir="auto"` on user-generated content**~~ — **done** in `7165ed0e` for: discussion titles/bodies/comments/replies, community names + descriptions, course/podcast/collection titles + descriptions + `about`, activity names, assignment task descriptions, profile bios, org name/description on the home picker, search result titles/subtitles, episode titles.
   Certificate names were added afterwards: `CertificatePreview.tsx` stays LTR by design but its title, description and instructor name carry `dir="auto"`. Admin organization pages are out of scope (see §10).
2. ~~**Hardcoded locale formatting.**~~ — **done** in `7165ed0e`: 31 files now pass `i18n.language` to `Intl.*` / `toLocale*`. Only deliberate exception is `components/Analytics/chartTheme.ts` `formatCurrency` (`fr-FR` + `DZD` — Algeria-specific business logic).
3. **Direction-aware JS coordinate math** — audited every `clientX - rect.left` / `offsetX` site:
   - `EmbedObjectsComponent.tsx` — **fixed**: the resize handle sits on `end-0`, so in RTL the horizontal delta is inverted (`dirSign`).
   - `AudioBlockComponent`, `CloudflarePlayer`, `LearnHousePlayer` — **left as-is**: seek position is physical media geometry, not reading flow.
   - `WelcomeGlobe`, `Dashboard/Boards/**` — out of scope.
   - `Dashboard/Boards/Extensions/{useFrameDrag,useDragResize}.ts` — out of scope (Boards).
4. **Lint guard** — **blocked, not implemented.** `npm run lint` cannot run in this repo at all: ESLint 10.0.2 crashes loading `eslint-config-next`'s React plugin (`TypeError: contextOrFilename.getFilename is not a function` in `eslint-plugin-react@7.37.5`), and `@eslint/js` is imported by [eslint.config.mjs](../../../apps/web/eslint.config.mjs) but not installed. Fixing that needs an ESLint / `eslint-config-next` version alignment first; the rule itself is a ~60-line inline flat-config plugin that scans `className` literals for physical utilities once the pipeline works again.
5. ~~**`space-x-*` verification**~~ — **confirmed safe**. Tailwind v4.1.16 compiles `space-x-*` to `margin-inline-start` / `margin-inline-end` on `:where(& > :not(:last-child))`, so all 521 occurrences are already RTL-aware and need no changes.
6. ~~**Raw CSS in styled-jsx**~~ — **done**: `DiscussionContent.tsx` and `DiscussionEditor.tsx` now use `padding-inline-start` / `border-inline-start` / `float: inline-start` instead of the physical properties.

### Remaining physical utilities — all deliberate

After the phase 5 sweep the only in-scope hits are intentional:

| Pattern | Why it stays |
|---|---|
| `left-0 right-0`, `left-4 right-4` (DashLeftMenu, DashMobileMenu) | symmetric full-width insets |
| Radix `data-[side=left]:slide-in-from-right-2` (ui primitives) | describes pointer entry position, not reading flow |
| `hover-menu.tsx` | already branches on `isRTL` for real coordinate math |
| `not-found.tsx` | nextra classes with explicit `ltr:` / `rtl:` variants |
| `ScormActivity.tsx` spinner borders | two-tone rotating ring, physical by nature |

---

## 8. Verification (run before every commit)

```powershell
# 1. Locales must parse
cd c:\Projects\learnhouse-dev\learnhouse-dev
foreach ($f in @('en','fr','ar')) { Get-Content "apps/web/locales/$f.json" -Raw | ConvertFrom-Json | Out-Null; Write-Output "$f OK" }

# 2. Typecheck must stay at exactly 25 lines
cd apps\web
.\node_modules\.bin\tsc.cmd --noEmit --ignoreDeprecations 6.0 | Measure-Object -Line
```

**Baseline is the pre-existing error set (24–25 lines, exit code 1–2 depending on the tsc version).** These errors are pre-existing and unrelated:

| Area | Count |
|---|---|
| `Community.banner_image` | 3 |
| `PodcastEpisode.created_at` | 4 |
| implicit `any` params | 7 |
| `extra_metadata` | 1 |
| `OrgRoles` `FormikErrors` | 2 |
| `ui/select` + `ui/switch` `size` prop | 4 |

Any new error is a regression — fix it before committing.

---

## 9. Gotchas

- **Editing anything under `apps/api/` kills the dev CLI.** Restart:
  ```powershell
  bun run apps/cli/bin/learnhouse.ts dev --admin-email admin@school.dev --admin-password admin123456
  ```
  Ports: web 3000, api 1338, collab 4000, postgres 5434, redis 6379.
- **`git add` with a path containing parentheses fails in PowerShell** — always quote: `git add "apps/web/app/orgs/[orgslug]/(withmenu)/copilot/copilot.tsx"`.
- **`git commit -m "$(cat <<'EOF' ...)"` does not work in PowerShell.** Use repeated `-m` flags.
- **`en.json` has a different formatting style than `fr`/`ar`.** Do not re-run a formatter over it; edit in place.
- **Glob before Grep on an unverified path.** Two files were previously guessed wrong (`AccountPurchases` lives under `components/Objects/Account/subpages/`, `EmbedActivity` under `components/Objects/Activities/Embed/`).
- **Hooks belong at the top of the component.** Adding `useTranslation()` mid-file has already caused one hooks-order violation in this project's history.
- Accumulated translation debt found while doing RTL has been fixed inline (e.g. `common.see_more` / `see_less` / `show_less`, `common.aria.actions_menu`, `common.aria.community_mobile_actions`, `common.select` / `deselect`). Keep doing this, but only inside files you are already touching.

---

## 10. Decisions taken (was “open questions”)

1. **Playground i18n (`474f05bd`) — keep.** No UI entry point, so the keys are unused, but they are harmless and we don't plan to expose playgrounds. No revert.
2. **`CertificatePreview.tsx` — stay LTR.** A certificate is a designed, printed artifact: logos, seals and signatures keep their positions. Its 64 physical utilities are therefore intentional and excluded from the refactor. Only the recipient/course name, the description and the instructor name got `dir="auto"` so Arabic text inside the fixed frame still renders with the correct base direction.
3. **Platform admin (`/admin/**`, `components/Admin/**`) — stay English + LTR.** Internal-only tool, single operator.
4. **Media controls — “mirror the chrome, never the play/seek glyphs”.** Confirmed. Seek math stays on `clientX - rect.left`.

---

## 11. Suggested order for tomorrow

1. `components/Dashboard/Analytics/**` — biggest density, contained, no tricky widgets.
2. Course editor settings (`components/Dashboard/Pages/Course/**`) minus `CertificatePreview`.
3. Org + users + payments settings pages.
4. Course player / activity shell, then the two video players (after open question #4).
5. Public pages (courses, collections, trail, community, store, search, profile).
6. Rich-text editor chrome.
7. Auth pages.
8. Phase 5 polish.

Commit + push after each numbered bucket so there is always a rollback point.

---

## 12. Content localization — as built

Three entities now share one contract. The per-entity details live in the companion docs; this is the cross-cutting summary.

### Status

| Surface | Storage | Status |
|---|---|---|
| Course metadata (name, description, about, learnings, tags, SEO, requirements/duration) | `course_translation` | done |
| Course content (chapters, lessons, objectives, takeaways, resources, knowledge checks) | `extra_metadata.translations[locale]` | done |
| Collections (name, description, about, learnings, tags, SEO) | `collection_translation` | done |
| Podcasts (name, description, about, tags, SEO) | `podcast_translation` | done |
| Episodes (title, description) | `podcast_episode_translation` | done |
| Podcast RSS, trail lists, receipts/entitlements | — | deliberately source-locale |
| Offers, certificates | — | not started |

### Contract (do not break these when adding a fourth entity)

1. **Base row = source locale.** A `source_locale` column on the parent (`course`, `collection`, `podcast`) names it. Existing queries keep working; no backfill.
2. **One translation table per entity** (episodes included), with `(parent_id, locale)` unique, `state`, `source_updated_at`, `translated_by`, dates.
3. **Resolution:** `requested locale → base row`; missing row sets `is_fallback: true` and `content_locale = source_locale`.
4. **Overlays run after access checks** (RBAC, publication, paid locks), so a translation can never reveal locked content.
5. **One query per page** on listings (`apply_*_overlay_bulk`); never join per row. Server-side caches store the **source payload only**.
6. **`PUT …/translations/{locale}` rejects the source locale with 422.** The source row is only written through the normal update endpoint.
7. **Dashboard fetches the parent without `locale`** — the editors need the source row as their baseline. Localized rows are fetched separately (hook or list SWR key).
8. **Structural fields are never localized**: media, price, access type, publish state, hosts, audio, ordering, course chapters.

### Dashboard UX (identical on all three editors)

- Action row chip: language native name + dot (`teal` = saved / `amber` = unsaved) + `Source` / `Translation` / `Missing`.
- **Copy from source** appears only in a non-source locale.
- Missing translation shows an "inherited" hint; typing creates the row on save.
- **Translations tab**: coverage matrix per language, copy-from-source, two-step delete, CSV export/import (UTF-8 BOM, so Excel opens Arabic correctly).
- SEO follows the same rule; it stays read-only until the locale has a translation row (the API needs a `name`).

### Learner surfaces

- Listing pages read the `i18next` cookie server-side and pass `locale` to the API.
- Detail pages pass `locale` in both the server fetch and the client SWR key, so a language switch re-fetches.
- `generateMetadata` uses the same cookie; translated titles/descriptions reach `<head>` and JSON-LD.
- Fallback hint above the title: "This … is only available in {{language}}." (`is_fallback`).

### Card surface (locked)

Every new container uses `bg-white rounded-xl border border-gray-100 shadow-sm`. Banned: `shadow-borders-base`, `nice-shadow`, `ring-1 ring-black/*`, `border-black/*`. The podcast episode rows (`shadow-borders-base` → card surface) and learner `EpisodeCard` (`border-black/10` → `border-gray-100`) were aligned in `504335af`.

### Verification

```powershell
# locales
foreach ($f in @('en','fr','ar')) { Get-Content "apps/web/locales/$f.json" -Raw | ConvertFrom-Json | Out-Null }

# migrations (single head, then upgrade)
cd apps/api; .\.venv\Scripts\alembic.exe heads; .\.venv\Scripts\alembic.exe upgrade head

# typecheck — pre-existing error set only
cd apps/web; .\node_modules\.bin\tsc.cmd --noEmit --ignoreDeprecations 6.0
```

API smoke tests used in this cycle (dev CLI, `admin@school.dev`):

```
PUT /collections/{uuid}/translations/fr   → 200, name = "… FR"
GET /collections/{uuid}?locale=fr         → content_locale=fr, is_fallback=false, seo overlaid
GET /collections/{uuid}?locale=ar         → source name, is_fallback=true
DELETE …/translations/fr                  → reads fall back

PUT /podcasts/{uuid}/translations/fr      → 200
PUT /podcasts/episodes/{uuid}/translations/fr → 200
GET /podcasts/{uuid}/meta?locale=fr       → localized podcast + episode title
GET /podcasts/{uuid}/meta?locale=ar       → source podcast, is_fallback=true, source episode title
```

### File map

| Layer | Courses | Collections | Podcasts |
|---|---|---|---|
| Migration | `w6b7c8d9e0f1_add_course_translations.py` | `y0f1a2b3c4d5_add_collection_translations.py` | `z1a2b3c4d5e6_add_podcast_translations.py` |
| Models | `src/db/courses/course_translations.py` | `src/db/collection_translations.py` | `src/db/podcast_translations.py` |
| Service | `src/services/courses/translations.py` | `src/services/courses/collection_translations.py` | `src/services/podcasts/translations.py` |
| Web service | `services/courses/translations.ts` | `services/courses/collectionTranslations.ts` | `services/podcasts/podcastTranslations.ts` |
| Hook | `Hooks/useCourseTranslation.ts` | `Hooks/useCollectionTranslation.ts` | `Hooks/usePodcastTranslation.ts` |
| Translations tab | `EditCourseTranslations.tsx` | `EditCollectionTranslations.tsx` | `EditPodcastTranslations.tsx` |

---

## 13. Latest fixes — SWR stale data and locale-aware re-fetching

### Problem

The home page (`OrgHomeClient`), user profile page (`UserProfileClient`), and course listing page (`courses.tsx`) displayed course/podcast names and descriptions only from the **initial server-rendered props**. Switching the content locale via the language switcher did **not** trigger a client-side re-fetch, so the displayed text remained in the old locale until a full page reload.

Root cause: SWR was configured with `fallbackData` from SSR but had no reactive trigger on locale change. The data was fetched once and never refreshed.

### Fixes applied (uncommitted, on top of `0b488024`)

| File | Change |
|---|---|
| `apps/web/components/Objects/Home/OrgHomeClient.tsx` | Added `useSWR` hooks with locale-aware URLs (`?locale=${contentLocale}`) for courses and podcasts. A `useEffect` calls `mutateCourses()` / `mutatePodcasts()` whenever `contentLocale` changes, so the cards update immediately on language switch. |
| `apps/web/app/orgs/[orgslug]/(withmenu)/courses/courses.tsx` | Added locale-aware SWR re-fetching for the course catalog listing, matching the home page pattern. |
| `apps/web/app/orgs/[orgslug]/(withmenu)/page.tsx` | Passes `orgslug` prop down to `OrgHomeClient` so it can construct SWR URLs. |
| `apps/web/app/orgs/[orgslug]/(withmenu)/user/[username]/UserProfileClient.tsx` | Added locale-aware SWR re-fetching for user profile course/podcast lists. |
| `apps/web/app/orgs/[orgslug]/dash/assignments/page.tsx` | Added locale-aware SWR re-fetching for assignments listing. |
| `apps/web/services/users/users.ts` | `getCoursesByUser()` now accepts an optional `locale` parameter and appends `&locale=` to the API call. |

**Pattern used (repeat for any future locale-aware list):**

```tsx
const contentLocale = (i18n.language || 'en').split('-')[0]
const { data, mutate } = useSWR(
  `${url}?locale=${contentLocale}`,
  fetcher,
  { fallbackData: initialData, revalidateOnFocus: false, dedupingInterval: 30000 }
)
useEffect(() => { mutate() }, [contentLocale, mutate])
```

### Supporting changes

| File | Change |
|---|---|
| `apps/web/components/Objects/Thumbnails/CourseCard.tsx` | Added `dir="auto"` to course title and description for correct RTL rendering when the card content is in Arabic while the surrounding UI stays LTR. |

### Activity translation seed data

| File | Change |
|---|---|
| `apps/api/src/services/seed/build_activity_translations.py` | Updated to include `ACTIVITY_TRANSLATIONS` in the seed output, mapping French locale keys for all 20 lessons. |
| `apps/api/src/services/seed/french_translations.json` | French translation strings for all 20 lesson activities (name, description, learning objectives, takeaways, resources, knowledge checks). |
| `apps/api/src/services/seed/copy.py` | Seed copy logic extended to handle activity translation rows during the seeding process. |
| `apps/api/src/services/courses/courses.py` | Minor adjustments to course service for activity translation overlay. |
| `apps/api/src/routers/users.py` | Minor adjustments to user routes for locale-aware course listing. |

### Verification

- Switch language from English to Arabic/French on the home page — course/podcast cards update immediately without page reload.
- Course card titles and descriptions render with correct base direction (`dir="auto"`) for Arabic content.
- User profile page shows localized course names when switching locale.
- Activity translations seed runs cleanly and produces French names/descriptions for all 20 demo lessons.

---

## 14. Collection editor wiring + translatable `extra_metadata`

### Problem

The collection General tab could edit name/description/about/learnings/tags, but the metadata the seed writes — requirements, target audience, difficulty, duration, certificate — had no editor at all, in any locale. The learner page already rendered those values, so they could only be changed by re-seeding. A translation row also had nowhere to put a translated requirement or duration.

### Changes

| Layer | File | Change |
|---|---|---|
| DB | `migrations/versions/b2c3d4e5f6a7_add_collection_translation_metadata.py` | `collection_translation.extra_metadata JSONB NULL` |
| Model | `src/db/collection_translations.py` | `extra_metadata` on the table model, `CollectionTranslationUpsert` and `CollectionTranslationRead` |
| Service | `src/services/courses/collection_translations.py` | `_overlay_from_translation(translation, base_extra_metadata)` merges the locale keys over the base object; both bulk and single readers pass the base object; upsert persists the column |
| Web service | `services/courses/collectionTranslations.ts` | `extra_metadata` on the read/payload types |
| Editor | `EditCollectionGeneral.tsx` | Requirements, audience (for / not for) in the Overview card; new **Details** card with difficulty, duration and certificate. Translation locale reads `translation.extra_metadata` with a base fallback; saves send `buildExtraMetadata()`. Source-locale saves merge over the stored object so `lessons_count`/`video_hours`/`resources_count` survive |
| Translations tab | `EditCollectionTranslations.tsx` | New `meta` column, `meta.*` rows in CSV export/import (arrays newline-joined), `extra_metadata` included in copy-from-source |

Seeded `requirements` rows only carry `{text}`; `LearningItemsList` drops objects without an `id`, so the editor assigns `req-{i}` ids on load — otherwise the four requirements rendered as an empty list.

`difficulty` is a `Select` limited to `Beginner | Intermediate | Advanced` in the source locale and a free-text `Input` in a translation, because the label itself is content there. The certificate toggle is disabled outside the source locale: the flag is shared, not translated.

### Verification (live, `admin@school.dev`, collection `collection_fc94dffd…`)

- AR editor at `/orgs/demo/dash/collections/collection/fc94dffd…/general`: `dir=rtl`, sections Overview / Learnings / Details / Tags, requirements (4), audience (3 for / 2 not for), duration `42h`, certificate toggle checked but disabled.
- Changed duration to `45h` and saved. `PUT …/translations/ar` stored `{difficulty, duration, requirements, target_audience}` only; `has_certificate`/`video_hours`/`lessons_count` were absent from the row.
- `GET /collections/{uuid}?locale=ar` returned `duration=45h`, `video_hours=28`, `resources_count=12`, `has_certificate=true` — locale overlay, base counts.
- Learner page rendered `45h`, the localized difficulty, the certificate row and "ابدأ من هنا". Reverted to `42h` through the editor; the translation row's `extra_metadata` was then reset to `NULL` to match the seed.
- EN editor: `dir=ltr`, difficulty renders as a combobox, certificate editable.
- `alembic upgrade head` clean (`a1b2c3d4e5f1 → b2c3d4e5f6a7`); `tsc --noEmit` reports 0 errors.

### Still open

Seed content is English-only for `about`, `learnings`, `tags` and every `extra_metadata` string in `generators/collections.py` (`TRANSLATIONS` only carries name + description). The Arabic learner page therefore shows Arabic title/description with English body sections until the seed generator is extended.

## 15. Communities — localized name + description

### Scope

A community only authors two display fields: `name` and `description`. Discussions, replies, reactions and votes are user-generated and stay in the language they were written in. Card metadata (linked course / general, public / private, relative date) is frontend i18n, not content.

### Changes

| Layer | File | Change |
|---|---|---|
| DB | `migrations/versions/d5e6f7a8b9c0_add_community_translations.py` | `community.source_locale VARCHAR(10) DEFAULT 'en'`; new `community_translation` table (`UNIQUE(community_id, locale)`, FK cascade) |
| Model | `src/db/communities/communities.py`, `src/db/communities/community_translations.py` | `source_locale` on `Community`; `CommunityRead` gains `source_locale`, `content_locale`, `is_fallback`; translation table + upsert/read models |
| Service | `src/services/communities/community_translations.py` | Overlay (name + description only), single + bulk readers, list/upsert/delete; source locale rejected with 422 |
| API | `src/routers/communities/communities.py`, `src/routers/users.py`, `src/services/search/search.py` | `?locale=` on community reads; `GET/PUT/DELETE /communities/{uuid}/translations[/{locale}]`; localized search + user communities |
| Web data | `services/communities/communities.ts`, `services/communities/communityTranslations.ts`, `components/Hooks/useCommunityTranslation.ts` | Locale query params, translation CRUD, hook resolving the editor's content row |
| Web reads | Communities listing/client, community detail, discussion page, dashboard list/client, course community section, user profile | `locale` from the `i18next` cookie; SWR keys include the locale and revalidate on switch |
| Card | `components/Objects/Thumbnails/CommunityCard.tsx` | Labels via `t()`, `Intl.RelativeTimeFormat` dates, `dir="auto"`, `min-h-[63px]` |
| Detail UI | `community.tsx`, `CommunitySidebar.tsx`, `CommunityActionsMobile.tsx`, locales | New button, Public/Private and discussion-count badges, sidebar cards (linked course, includes, members, created, updates) and dates localized. The detail client re-fetches `?locale=` through SWR when the language changes, so title, description, stats and sidebar update without a page reload |
| Discussions | `DiscussionCard.tsx` | Card keeps the English `dir="ltr"` layout, but the relative time, label chip (`Announcement`…) and See more / See less / Show less / Close buttons follow the platform language. Votes, reply placeholder and empty states stay English |
| Editor | `CommunityEditGeneral.tsx`, `CommunityEditTranslations.tsx`, dashboard `[subpage]/page.tsx` | General tab edits the current content locale; new **Translations** tab (name + description, copy-from-source, delete) |
| Seed | `generators/community.py`, `seed_community_translations.py`, `__main__.py`, `reset.py` | `COMMUNITY_TRANSLATIONS` fr/ar copy for all 18 communities; `--seed-community-translations`; reset deletes the rows |

### Verification (live, demo org 463)

- `alembic upgrade head` clean (`b2c3d4e5f6a7 → d5e6f7a8b9c0`).
- `python -m src.services.seed --seed-community-translations` → `0 updated, 36 created, 0 skipped` (18 communities × fr/ar).
- `GET /communities/org/463/page/1/limit/50?locale=ar` → 16 published rows, all `content_locale=ar`, `is_fallback=false`, Arabic name + description (`هندسة الواجهة الخلفية بلغة Python`, 318 chars).
- Same request with `locale=fr` → French; with `locale=en` → base row.
- `GET /communities/{uuid}?locale=fr` → translated detail.
- SSR `/orgs/demo/communities` with `Cookie: i18next=ar` → `<html lang="ar" dir="rtl">`, Arabic card title present, English absent; `fr` and `en` likewise.
- `/orgs/demo/community/{uuid}` with `i18next=ar` → Arabic title, English absent.
- Browser check on the detail page: AR shows `+ نشر`, `نقاشات`/`عام` badges and the sidebar in Arabic (`يشمل هذا المجتمع`, `153 أعضاء`, `أُنشئ في 4 أكتوبر 2026`, `آخر تحديث …`); FR shows `+ Publier`, `10 discussions`, `Aller au cours`, `153 membres`, `Créée le 4 oct. 2026`, `Dernière mise à jour …`.
- With the platform in Arabic (`lang=ar`, `dir=rtl`), all 50 discussion cards keep `direction: ltr` while the time and label are localized (`قبل شهرين`, `إعلان`, `عرض المزيد`).
- Language switch without reload on the detail page: AR → FR updates the community title/description, the stats row, the sidebar (`153 membres`, `Créée le 4 oct. 2026`) and the discussion cards (`il y a 2 mois`, `Annonce`); FR → AR switches everything back.
- `tsc --noEmit` / editor diagnostics: 0 errors.

## 16. Podcasts — localized show + episode content

### Scope

Podcasts carry two content layers: the show (`name`, `description`, `about`, `tags`, `extra_metadata.learnings`) and its episodes (`title`, `description`, `extra_metadata.learning_objectives` / `key_points`). Both are now localized end to end for fr/ar; audio is untouched. Episode `extra_metadata` was already part of the translation contract, the show `extra_metadata` was added here.

### Changes

| Layer | File | Change |
|---|---|---|
| DB | `migrations/versions/e6f7a8b9c0d1_add_extra_metadata_to_podcast_translation.py` | `podcast_translation.extra_metadata JSONB` |
| Model | `src/db/podcast_translations.py` | `extra_metadata` on `PodcastTranslation`, `PodcastTranslationUpsert`, `PodcastTranslationRead` |
| Service | `src/services/podcasts/translations.py` | Show overlay merges `extra_metadata` with the base row (single + bulk); upsert persists it |
| Seed | `generators/podcasts.py` | Faithful fr/ar copy for all 18 shows; localized `about` (host template) + `tags`; `PODCAST_META_TRANSLATIONS` + generic template for the "What you'll learn" bullets; hand-written fr/ar descriptions for the 14 flagship episodes; `FLAGSHIP_EPISODE_META_TRANSLATIONS` + `GENERIC_EPISODE_META` for episode objectives / key points |
| Backfill | `src/services/seed/seed_podcast_translations.py`, `seed/__main__.py` | `--seed-podcast-translations` updates show rows and creates/updates every episode translation (title, description, extra_metadata) |
| Web reads | `podcast/[podcastuuid]/podcast.tsx`, `episode/[episodeid]/episode.tsx` | Locale-keyed SWR; the episode page now re-fetches the episode (`?locale=`) instead of holding the SSR row, and loads the episode list with the content locale (was hardcoded `locale=en`) |
| Duration | `podcast.tsx`, `PodcastCard.tsx` | English short form in every locale (`7h 32min`, `45min`) — same convention as course cards |
| UI copy | locales en/fr/ar | `podcast.page.about_title`, `podcast.page.episodes`, `podcast.episode.{about_this_episode,now_playing,episode_of,continue_listening,all_caught_up,no_more_episodes}`, `activities.whats_next` (the episode "On this page" sidebar used to render the raw key) |
| Player | `components/Objects/Podcasts/EpisodePlayer.tsx`, `components/Contexts/PodcastPlayerContext.tsx` | Episode title de-emphasized (`font-bold` → `font-medium`, 700 → 500); playback speed (0.75x–2x) and loop added; `rate` / `isLooping` live in the shared context so the inline and sticky players agree and survive remounts (volume control already existed); keyboard shortcuts (Space/K play-pause, ←/→ seek 5s, ↑/↓ volume, M mute) that ignore typing fields and focused controls |
| Player volume | `components/Objects/Podcasts/EpisodePlayer.tsx` | Native `<input type="range">` popover replaced by a hover-revealed track that slides out of the speaker icon (a themed track + fill + 8px black thumb, no OS widget). The reveal box overlaps the icon by 4px and carries the gap as padding, so the hover target is contiguous and the track can't collapse while reaching for it. Drag-to-adjust uses pointer capture, RTL-aware math and `insetInlineStart`, arrow-key support, and the icon click mutes / restores the last audible level |

### Verification (live, demo org 463, The Pixel Hour)

- `alembic upgrade head` clean (`d5e6f7a8b9c0 → e6f7a8b9c0d1`).
- `python -m src.services.seed --seed-podcast-translations` → `36 podcast rows updated, 88 episode rows updated`.
- `GET /podcasts/{uuid}/meta?locale=fr` → `L'heure du pixel`, full French description/about/tags, `extra_metadata.learnings` French, all 14 episode titles French, `learning_objectives` / `key_points` French.
- `?locale=ar` → `ساعة البكسل`, Arabic description/about/tags, learnings, 14 episode titles and episode meta.
- Non-flagship show (`Motion Sickness`) and its generic episodes → `Vertige du mouvement` / `دوار الحركة`, generic objectives localized.
- Browser: FR detail page shows `7h 32min`, `À propos de ce podcast`, `Épisodes`; switching FR → AR without reload updates title, description, learnings, about and all episode titles (`7h 32min` stays English), `dir=rtl` applied.
- Browser: episode page AR → EN → FR updates title, "What you'll learn", description, key takeaways and headings (`عن هذه الحلقة`, `About This Episode`, `À propos de cet épisode`; `NOW PLAYING` / `LECTURE EN COURS`) without a reload.
- Podcast listing keeps localized names/descriptions and English-format durations.
- Arabic show descriptions were doubled (~120 → ~270 chars) to fill the 3-line card clamp; verified on the listing (`line-clamp-3`, 63px tall, `overflow: hidden`) and the full copy renders on the show page.
- The Pixel Hour `about` now matches the flagship course page: 5 paragraphs in en/fr/ar (2,355 / 2,533 / 1,812 chars, vs 2,380 chars for the flagship course) instead of the one-line host template.
- Player: episode title computed `font-weight: 500`; speed trigger shows `1x` and opens `0.75x / 1x / 1.25x / 1.5x / 2x` (RTL-safe `end-0`); picking `1.5x` sets `audio.playbackRate = 1.5`; loop toggle sets `audio.loop = true`; button titles are localized (`سرعة التشغيل`, `تكرار الحلقة`).
- Volume: collapsed track is `width: 16px; opacity: 0; pointer-events: none`; hovering the icon expands it to 96px (opacity 1) on the inline-end side in both directions, with the reveal box overlapping the icon by 4px so there is no dead zone (FR/LTR icon 313–349 → box 345–441; AR/RTL icon 931–967 → box 839–935). Hovering the track itself keeps it expanded. Thumb is 8×8, `gray-900`, no border. Dragging to 30% / 70% set `audio.volume` 0.30 / 0.70 with the fill and thumb landing on the inline-start edge; icon click muted to 0 and restored 0.7; slider is exposed as `role="slider"` with localized `aria-label` (`مستوى الصوت`).

## 17. Progress tab — localized course cards

The trail/progress page rendered the enrolled course row from `/trail/org/{id}/trail`, which returned raw `Course` rows (source locale only) and a hardcoded English "`1 of 25 lessons completed`" line.

| Layer | File | Change |
|---|---|---|
| Endpoint | `src/routers/trail.py` | `/trail/org/{org_id}/trail` accepts `?locale=` |
| Service | `src/services/trail/trail.py` | `_build_trail_read(..., locale=)` localizes every embedded course dict (main run + step data) through `build_translation_overlay`, so `name` / `description` / `about` / `learnings` / `tags` / `extra_metadata` follow the requested locale and `content_locale` is returned |
| Web | `trail/trail.tsx` | SWR key is locale-keyed (`useContentLocale()`), so a language switch refetches |
| Web | `components/Pages/Trail/TrailCourseCard.tsx` | `{{completed}} of {{total}} lessons completed` replaced by `trail.lessons_completed` |
| Copy | locales en/fr/ar | `trail.lessons_completed_{one,other}` + full Arabic plural set (`zero/one/two/few/many/other`) |

Verification: `?locale=fr` → `Developpement backend avec Python` (`content_locale: fr`); `?locale=ar` → `هندسة الواجهة الخلفية ببايثون` (`content_locale: ar`). Browser: FR renders `Progression`, French course name and `1 sur 25 leçons terminées`; AR renders `1 من 25 درسًا مكتملًا` under `dir=rtl`.

## 18. Search palette — sidebar parity + localization

`components/Objects/Modals/SearchModal.tsx` listed a hardcoded English page list (using plain English words as i18n keys, so it never translated) and included a `Store` tab the org doesn't have, while missing `Collections`.

- The page list now mirrors `UserLeftMenu`: Home, Courses, Collections (`resolved_features.collections`), Communities / Podcasts (feature-flagged), Progress — Store removed.
- Titles reuse the sidebar keys (`common.home`, `courses.courses`, `collections.collections`, `communities.title`, `podcasts.podcasts`, `courses.progress`); subtitles are new `search.page_*` keys in en/fr/ar.
- Content results are fetched with `?locale=` (`useContentLocale()` in the SWR key and `searchOrgContent` call), so result titles/descriptions follow the UI language.

Verified: FR → `Pages` + `Accueil / Cours / Collections / Communautés / Podcasts / Progression`, no Store; typing `python` hits `/search/org_slug/demo?...&locale=fr` and shows French excerpts under `Contenu`. AR → the same list in Arabic under `dir=rtl` (`الصفحات`, `فتح`).

The dialog itself was off-screen in RTL: it used `start-1/2` (= `right: 50%` in Arabic) together with a physical `-translate-x-1/2`, which pushed it half a width further left. Both palettes (`SearchModal`, `Dashboard/CommandPalette`) now use `left-1/2` so the inset and the transform share a physical axis. AR: dialog 320–960 of a 1280 viewport (was −320–320); FR unchanged.

**Search is now language-agnostic.** Two sides were involved:

| Layer | File | Change |
|---|---|---|
| API | `services/courses/courses.py` (`search_courses`) | Match also against every `course_translation` row (name / description / about / learnings / tags) |
| API | `services/search/search.py` | Same treatment for collections, communities and podcasts via `_translated_parent_ids` |
| Web | `components/Objects/Modals/SearchModal.tsx` | `shouldFilter={false}` — cmdk was re-filtering on the *localized* label, so an Arabic result titled `هندسة … ببايثون` was hidden from a `python` query. Static pages are filtered locally instead |

Verified in the palette: AR UI + `python` → 6 Arabic-titled results; AR UI + `بايثون` and `developpement` → same; EN UI + `بايثون` → English-titled courses; EN UI + `حزمة` → 5 English-titled collections. Note: accented French queries (`développement`) still miss because the seeded French copy is written without accents — the base data needs fixing, the search path itself is fine.





