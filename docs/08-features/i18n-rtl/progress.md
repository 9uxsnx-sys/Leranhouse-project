# i18n & RTL — Progress & Handoff

> **Last updated:** 2026-10-21
> **Branch:** `feat/learnhouse-1.2.0-custom`
> **Latest checkpoint:** `7165ed0e` — *i18n(rtl): localize Intl formatting and set dir=auto on user content*
> **Companion docs:** [RTL Plan](./rtl-plan.md) (research + strategy), [Dashboard Polish](../dashboard-polish/consistency-plan.md)

This is the working log. Read this first when resuming; read `rtl-plan.md` for the reasoning behind the approach.

---

## 1. Where we are, in one paragraph

English is the master language. French and Arabic are fully translated (text only), and the hardcoded-JSX extraction pass for the **real UI** is done. **Phase 4 (RTL layout) is complete for every reachable screen** — 259/259 + 288/288 physical utilities converted in the final two sweeps. Phase 5 (polish) is in progress: locale-aware `Intl.*` formatting is done (31 files) and `dir="auto"` is applied to the main user-generated content surfaces; the drag/resize coordinate math and the lint guard remain.

---

## 2. Locked-in scope decisions

These came from the user and should not be re-litigated:

1. **English is the source of truth.** Every new key is added to `en.json` first, then mirrored to `fr` and `ar`.
2. **Translate only UI that actually exists.** A page counts as UI only if it is reachable from the platform nav (`MedusaSidebar`), the dashboard nav (`DashLeftMenu`), or a link/button inside an already-reachable page. Route-file existence is *not* evidence of UI.
3. **Boards and Playgrounds are out of scope.** They have no entry point in the shipped UI.
4. **Every phase is its own commit + push**, so the user can roll back to a text-only checkpoint at any time.
5. **No MCP, no browser** for the audit/translation passes.

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
   Still uncovered (acceptable for now): certificate recipient/course names (blocked on the `CertificatePreview` decision), admin organization pages.
2. ~~**Hardcoded locale formatting.**~~ — **done** in `7165ed0e`: 31 files now pass `i18n.language` to `Intl.*` / `toLocale*`. Only deliberate exception is `components/Analytics/chartTheme.ts` `formatCurrency` (`fr-FR` + `DZD` — Algeria-specific business logic).
3. **Direction-aware JS coordinate math** — audited every `clientX - rect.left` / `offsetX` site:
   - `EmbedObjectsComponent.tsx` — **fixed**: the resize handle sits on `end-0`, so in RTL the horizontal delta is inverted (`dirSign`).
   - `AudioBlockComponent`, `CloudflarePlayer`, `LearnHousePlayer` — **left as-is**: seek position is physical media geometry, not reading flow.
   - `WelcomeGlobe`, `Dashboard/Boards/**` — out of scope.
   - `Dashboard/Boards/Extensions/{useFrameDrag,useDragResize}.ts` — out of scope (Boards).
4. **Lint guard** — a rule that flags `ml-*/mr-*/pl-*/pr-*/left-*/right-*/text-left/text-right/rounded-l-*/rounded-r-*` so the refactor cannot regress. Not implemented yet.
5. ~~**`space-x-*` verification**~~ — **confirmed safe**. Tailwind v4.1.16 compiles `space-x-*` to `margin-inline-start` / `margin-inline-end` on `:where(& > :not(:last-child))`, so all 521 occurrences are already RTL-aware and need no changes.

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

**Baseline is 25 lines / exit code 2.** These 8 errors are pre-existing and unrelated:

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

## 10. Open questions (need a decision)

1. **Revert `474f05bd`?** It translated the playground listing/viewer/options, but playgrounds have no UI entry point. Leaving it means dead translation keys; reverting means one more commit. Not decided.
2. **`CertificatePreview.tsx` (68 matches).** A certificate is a designed artifact — mirroring it may be wrong (logos, seals and signatures usually keep their position). Options: leave LTR entirely, mirror only the text blocks, or mirror fully. Not decided.
3. **Platform admin (`/admin/**`, ~68 literals).** Internal tool, probably single-language. Translate or not? Not decided.
4. **Media controls.** Current rule is "mirror the chrome, never the play/seek glyphs". Confirm that is what we want for the video player before touching `LearnHousePlayer` / `CloudflarePlayer`.

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
