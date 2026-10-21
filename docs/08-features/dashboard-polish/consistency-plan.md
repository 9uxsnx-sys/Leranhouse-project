# Dashboard Polish & Consistency — Plan (English-first)

> **Status:** Phases 0–4 complete for desktop-reachable areas. Phase 5 (guardrails + QA) pending.
> **Goal:** Make the English dashboard internally consistent (buttons, action rows, tabs, icons, section naming) **and translation-ready**, so the later Arabic pass is mechanical instead of re-deciding the same things twice.
> **Scope:** `components/Dashboard/**` and `app/orgs/[orgslug]/dash/**`.
> **Companion docs:** [RTL Plan](../i18n-rtl/rtl-plan.md), [design-tokens.md](../../07-ui-reference/design-tokens.md), [patterns.md](../../07-ui-reference/patterns.md), [admin-dashboard.md](../../07-ui-reference/pages/admin-dashboard.md).

---

## 0. TL;DR

The dashboard was built area-by-area over time, so the same things are done differently in different places:

| Dimension | Reality today |
|---|---|
| "Create" wording | **5 different conventions** — `+ New`, `New Board`, `Create`, `Add Domain`, `Create New Offer` — and most are **hardcoded**, not translated |
| Action row (search + filters + create) | **5 bespoke layouts**, no shared component |
| Icons | **Two libraries** (lucide + phosphor) with duplicate meanings — Delete alone is rendered 4 ways |
| Select controls | **4 widget families** — even two different ones inside Payments |
| Tab bars | **5 copy-pasted pill bars** + 3 underline variants + 1 stray shadcn Tabs |
| Section names | Drifted; several **hardcoded**; **5 sections exist in search/translations but render blank** |
| Same concept, many names | Chapter / Module / Lesson / Activity · User / Member / Student / Learner |

**And two of these are outright bugs** (§3): reachable blank pages, and a dead "canonical" menu file.

---

## 0.1 Delivered (as built)

| Phase | State | What actually shipped |
|---|---|---|
| 0 — broken things | ✅ | Orphaned settings pages / dead menu resolved; only reachable routes remain. |
| 1 — vocabulary | ✅ | [`glossary.md`](./glossary.md) locked (CTA verbs, Module + Lesson, User + Role, untranslatable terms). |
| 2 — primitives | ✅ | `ActionRow` (+ `ActionRowSearch` / `Spacer` / `Actions`), `PageTabs` (`pill` \| `underline`), `ConceptIcon` + `SectionIcon` registries, shared `Select`. |
| 3 — apply | ✅ | All 6 settings tab bars + Payments + Analytics moved to `PageTabs` (**0** `layoutId="tab-indicator"` left). Every tab icon on `SectionIcon`; action icons on `ConceptIcon`; all 6 filter triggers are identical icon-only `IconButton`s; native `<select>`s and the last bespoke dropdowns replaced. |
| 4 — translation-readiness | ✅ | Every visible string in Org, Users, Course, Account, Analytics, Podcast, Community and Payments goes through `t()`, with matching `en` / `fr` / `ar` keys (~850 new keys). The breadcrumb's hardcoded `SECTION_LABELS` / `SUBPAGE_LABELS` maps were replaced by `dashboard.breadcrumb.*`. |
| 5 — guardrails + QA | ⬜ next | ESLint bans, single page-label source, QA checklist. |

**Deliberately out of scope:** Boards, Playgrounds, mobile/tablet navigation, and the editor/playground surfaces. Remaining dashboard Latin strings are intentional brand names (Apple Podcasts, Spotify, YouTube Music, Amazon Music / Audible) or dev-only/dead-component text.

**Card surface (locked).** Every content container uses the same surface:

```
bg-white rounded-xl border border-gray-100 shadow-sm
```

Applied to dashboard section cards, the course page sidebar cards, the learner lesson page cards (What You'll Learn, Key Takeaways, Resources, Quick Check, Course Outline, Up Next), and the module/lesson rows in the course Content tab. Do **not** use `shadow-borders-base`, `nice-shadow`, `ring-1 ring-black/*`, or `shadow-[0_0_0_1px_...]` for these containers — those read as a black outline. Media frames (thumbnail placeholders, the video fallback gradient) keep their own ring treatment.

---

## 1. Principles for "done"

1. **One verb per action.** `New X` on list pages, `Add X` inside a form, `Create` only as a modal submit. No `+ New` string literals.
2. **One component per pattern.** An action row, a tab bar, a select, and an icon set each become shared primitives.
3. **One icon per concept, one library.** Pick lucide (already dominant) and drop phosphor from the dashboard.
4. **Every user-visible string goes through `t()`.** No exceptions — this is what makes Arabic possible at all.
5. **A glossary decides the untranslatable terms** (SEO, Favicon…) once, so we don't argue per string later.

---

## 2. Findings (evidence)

> These describe the **pre-work state** that motivated the sweep. Many of the examples below have since been fixed — see [§0.1 Delivered](#01-delivered-as-built) for what actually shipped.

### 2.1 "Create" wording is split five ways

| Area | Literal label | Translated? | Where |
|---|---|---|---|
| Courses / Podcasts / Communities lists | `+&nbsp;New` | ❌ hardcoded | `dash/courses/client.tsx:476`, `podcasts/client.tsx:222`, `communities/client.tsx:245` |
| Boards / Playgrounds | `New Board` / `New Playground` | mixed | `boards/client.tsx:276`, `playgrounds/client.tsx:209` |
| Users / Roles / Groups | `+  Create` | ❌ hardcoded | `OrgRoles.tsx:780`, `OrgUserGroups.tsx:793` |
| Org settings | `Add Domain`, `Add Endpoint`, `Create Token` | ❌ hardcoded | `OrgEditDomains.tsx:333`, `OrgEditAutomations.tsx:224`, `OrgEditAPIAccess.tsx:276` |
| Payments | `Create New Offer`, `New Group` | ❌ hardcoded | `PaymentsOffersPage.tsx:213`, `PaymentsGroupsPage.tsx:446` |
| Home | `Create Course` | ✅ `dashboard.home.create_course` | `DashboardHome.tsx:74` |

Plus **4 competing i18n keys** for "make a course" (`courses.new_course`, `dashboard.home.create_course`, `dashboard.home.create_your_first_course`, `courses.create.choose_type`), and empty-state hints that disagree with their own button (`EditCourseStructure.tsx` button says "New", hint says `'Click "Add Module"'`).

### 2.2 No shared action row — 5 implementations

| Family | Layout | Examples |
|---|---|---|
| A | `flex items-center gap-3 mb-8` + `flex-1` spacer + create-right | courses / podcasts / communities `client.tsx` |
| B | header `justify-between` + **separate** search row | boards / playgrounds `client.tsx` |
| C | `flex items-center gap-3 mb-5` ("Toolbar Row — identical to ModuleForm") | OrgUsers, OrgUserGroups, ModuleForm, EditPodcastEpisodes |
| D | search + create + filter, no spacer | OrgRoles |
| E | pills toolbar, **no create button** | `dash/assignments/page.tsx` |

The only genuinely shared primitive is `AnalyticsToolbar` (`components/Analytics/Filters.tsx:103`) — used by one area, and it puts a date filter where every other row puts a create button.

### 2.3 Icons: two libraries, duplicate meanings

- **Delete** → `Trash2` (28 files) · `Trash` (1) · `XCircle` (3, status) · `X` (removal)
- **Edit** → `Pencil` (10) · `Edit` (2) · `FilePenLine` (2) · `PencilLine` (1) · `PencilSimple` (3, phosphor)
- **Save** → `SaveAllIcon` (14) · `Save` (5)
- **Upload** → `UploadCloud` (9) · `Upload` (2) · `Cloud` (2) · `ArrowBigUpDash` (1)
- **Search** → `Search` (lucide, ~20) · `MagnifyingGlass` (phosphor, 3)
- **Settings** → `Settings` · `Settings2` · `Gear` (phosphor) · `GearSix` (phosphor)
- **Filter** → `Filter` (lucide) · **raw inline `<svg>`** (3 files) · `SlidersHorizontal` · none
- **Add** → `Plus` (22) · `PlusCircle` (phosphor, 3) · `PlusMini` · literal `"+&nbsp;New"`

### 2.4 Select controls: 4 widget families

`@/components/ui/select` (shadcn) · native `<select>` · Radix `DropdownMenu`-as-select · bespoke `CustomSelect` / `SimpleDropdown`.
Worst case: **Payments uses shadcn `Select` in `PaymentsOffersPage` and a native `<select>` in `PaymentsGroupsPage:213`.**

**2026-10 update — two intentional trigger variants, one dropdown:**
The stock `select.tsx` trigger is button-styled (borderless, `shadow-buttons-neutral`), so inside forms it looked empty next to `Input` fields. `@/components/ui/select-field` now re-exports the same `Select`/`Content`/`Item`/`Value` with a trigger that copies the Input field design (`bg-ui-bg-field`, `shadow-borders-base`, `h-8`, `rounded-md`, single `ChevronDown`, no blue open ring). Both export the same names, so a screen switches variants by changing the import path. The course editor (difficulty, Twitter card type) uses `select-field`; toolbars keep the button trigger. `CustomSelect.tsx` remains unused.

### 2.5 Tab bars: 5 copies + 3 variants + 1 stray

- Pill style **copy-pasted 5×** (org, users, course, community, podcast settings pages) — identical markup, `layoutId="tab-indicator"`
- A 6th pill variant in `AnalyticsTabs.tsx` (different `layoutId`, `overflow-x-auto`)
- Underline style, 3 different implementations (Payments `TabLink`, Boards inline, Assignments state-based)
- Plus a stray real shadcn `Tabs` inside `OrgEditLanding.tsx:525`

### 2.6 Section naming drift — and **5 reachable blank pages (bug)**

`org/settings/[subpage]/page.tsx:123-128` renders only **general, branding, seo, domains, automations, api**.
But `landing`, `ai`, `features`, `usage`, `other` are:
- declared in `en.json` / `ar.json` as tabs and pages,
- registered in `app/.../org/page.search.ts` (command palette results),
- linked from `FeatureDisabledView.tsx:54,116` ("enable feature" button).

→ Clicking any of those opens a **blank settings page**. Also: `OrgEditFeatures`, `OrgEditOther`, `OrgEditAI`, `OrgEditLanding`, `OrgEditSSO`, `OrgEditUsage` are **orphaned components** (never imported).

**And** `lib/dashboard-menu-items.ts` (`DASHBOARD_MENU_ITEMS`) — the "canonical" 9-item menu — is **never imported**; the real sidebar (`DashLeftMenu.tsx`) renders a different 8 items.

Desktop/mobile nav also diverge: Home targets `/dash` vs `/`; Assignments is mobile-only; Analytics is desktop-only; Payments is unconditional on desktop but plan-gated on mobile.

### 2.7 Untranslated (hardcoded) strings

Top-level nav: `"Analytics"`. Users sub-nav: `'Users' 'UserGroups' 'Roles' 'Invite Codes' 'Audit Logs'`. Payments tabs + titles. Boards tabs + `"Board Settings"`. Org tabs/H1s for **SEO** and **Automations**. Course headings: `Basic Information`, `Course Details`, `Instructor`, `Media`, `What You'll Learn`, `Key Takeaways`, `Resources`, `Knowledge Checks`. Podcast: `Basic Information`, `Podcast Details`, `Media`, `RSS Feed`. Org SEO: `Quick Links`, `Default Meta Tags`, `Social & Open Graph`, `Search Engine Verification`, `Indexing Controls`, `Sitemap`, `Robots.txt`. Org: `Custom Domains`, `Webhook Endpoints`, `API Tokens`, `Permissions`.

Also **three places** define page labels and have already drifted: each `page.tsx` tab array, `AdminTopBar.tsx` (`SUBPAGE_LABELS` / `SECTION_LABELS`), and `page.search.ts`.

### 2.8 One concept, many names

- **Chapter / Module / Lesson / Activity** — the UI says "Module" + "Lesson", the services/keys say "Chapter", activities say "Activity", the sidebar says "Chapters"/"Activities".
- **User / Member / Student / Learner** — nav says "Users", search says "Members", home widgets say "Members", `en.json:3696` adds "Students".

### 2.9 Untranslatable / brand-technical terms

`SEO` · `Favicon` · `Logomark` · `Sitemap` · `Robots.txt` · `Open Graph` · `Webhook` · `API` · `RSS` · `SSO`.

Note the **inconsistency that already exists**: SEO is translated in **course** settings (key) but hardcoded in **org** settings — and `ar.json` even has the org translation (`تحسين محركات البحث`) sitting unused.

---

## 3. The plan — phases

### Phase 0 — Fix what is actually broken ✅
Not polish — correctness:
1. **Blank pages.** Either restore `landing/ai/features/usage/other` or remove their search-registry entries + the `FeatureDisabledView` link + their translation keys. Recommend: **remove** (they're orphaned) and point "enable feature" at a page that exists.
2. **Decide the dead files.** `lib/dashboard-menu-items.ts` → either adopt as the single source of truth for nav, or delete. Orphaned `OrgEdit*` components → delete or restore.
3. **Nav divergence.** Make desktop and mobile menus agree (targets + plan gating).

### Phase 1 — Define the vocabulary ✅
1. **CTA verb rule:** `New <Entity>` (list pages) · `Add <Thing>` (in-form adders) · `Create` (modal submit).
2. **Concept glossary (decide once):**
   - Chapter **or** Module → pick one word for the UI.
   - Lesson **or** Activity → pick one.
   - User **or** Member (recommend: "User" for admin surfaces, "Member" for community surfaces — but define where each applies).
3. **Untranslatable-terms glossary:** for each of SEO/Favicon/… decide **keep Latin** vs **translate** vs **"Latin + translated gloss"**. Recommend: keep genuinely technical brand terms Latin (Favicon, Robots.txt, Sitemap) but translate conceptual ones (SEO → تحسين محركات البحث, Webhook → نقطة اتصال) — and apply the same rule in **both** org and course settings.
4. Write all of it into a short `glossary.md` so it's enforceable.

### Phase 2 — Build the primitives ✅
- `<ActionRow>` — search + filters + primary action (replaces families A–E).
- `<PageTabs>` — one tab bar with `variant="pill" | "underline"` (replaces 5 copies + 3 variants).
- **Icon registries** — `ConceptIcon` (one icon per action) and `SectionIcon` (one icon per dashboard section) in `components/ui/icons.tsx`, **lucide only**; phosphor removed from the dashboard (the `MarkdownLogo` brand mark is the sole exception).
- Standardise on the shared **`Select`** (`@components/ui/select`) for value pickers and **`DropdownMenu`** for action pickers; delete native `<select>` and bespoke dropdowns.

### Phase 3 — Apply, area by area ✅
Convert each dashboard area to the primitives, one commit per area so it's reviewable.
**UI-only scope:** only areas the dashboard actually surfaces are converted. **Boards and Playgrounds are skipped** — they are not reachable from the sidebar or mobile nav (only from feature-gated Home widgets / onboarding / search), and this platform does not use them.
Courses → Podcasts → Communities → Users/Groups/Roles → Payments → Org settings → Course settings → Account.

### Phase 4 — Translation-readiness sweep ✅
- Route **every** remaining visible string through `t()` — done for all desktop-reachable dashboard areas.
- Translate all section headings (org SEO, course general, podcast, payments) — done via `common.sections.*` and area namespaces.
- Apply the untranslatable glossary consistently (fix org-vs-course SEO) — done.
- Add the new keys to **all three** shipped locales (`en`, `fr`, `ar`), not just English. Key parity is identical across the three files; legacy locale files remain on disk but are unreachable (`supportedLngs` is `en`/`fr`/`ar`).

### Phase 5 — Guardrails + QA ⬜ (next)
- **ESLint rules:** ban `@phosphor-icons` imports inside `components/Dashboard/**`; ban native `<select>` there; (stretch) flag JSX text nodes in dashboard components as a warning.
- Collapse the **three** page-label sources into one.
- Consistency QA checklist, run per area.

---

## 4. Decisions needed

1. **Phase 0 outcome** — delete the orphaned settings pages + dead menu file, or restore them?
2. **Chapter vs Module**, and **Lesson vs Activity** — which word survives?
3. **User vs Member vs Student** — what's the rule?
4. **Icon library** — confirm lucide-only for the dashboard.
5. **Untranslatable terms** — confirm the keep-Latin vs translate split.
6. **Sequencing** — do this fully before the Arabic pass (recommended), or interleave?

---

## 5. Acceptance checklist

- [x] No reachable dashboard route renders a blank page.
- [ ] Exactly one `New <Entity>` wording per list page; no `+ New` string literals. *(not verified in this pass)*
- [ ] Every action row uses `<ActionRow>`; no bespoke toolbar variants remain. *(list-page toolbars do; settings save rows still use their bespoke top row)*
- [x] Every tab bar uses `<PageTabs>`.
- [x] One icon per concept; no phosphor imports under `components/Dashboard/**`. *(exception: the `MarkdownLogo` brand mark; Boards/mobile are out of scope)*
- [x] All selects are the shared `Select`. *(the unused `CustomSelect.tsx` duplicate still exists but has zero importers)*
- [x] Form selects use `select-field` so the trigger matches `Input`; the course editor has no remaining button-style selects.
- [ ] Chapter/Module and Lesson/Activity each resolve to one word everywhere.
- [x] Every dashboard string goes through `t()` (verified by grep for bare JSX text). *Desktop-reachable areas; brand names and dev-only/dead-component text excluded.*
- [x] The untranslatable glossary is applied identically in org and course settings.
- [x] `en.json` has a key for every visible string; the same keys exist in `fr` and `ar` (no intentional gaps).
