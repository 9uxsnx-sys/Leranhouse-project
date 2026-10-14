# Dashboard Polish & Consistency — Plan (English-first)

> **Status:** Audit complete, plan proposed — nothing built.
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

## 1. Principles for "done"

1. **One verb per action.** `New X` on list pages, `Add X` inside a form, `Create` only as a modal submit. No `+ New` string literals.
2. **One component per pattern.** An action row, a tab bar, a select, and an icon set each become shared primitives.
3. **One icon per concept, one library.** Pick lucide (already dominant) and drop phosphor from the dashboard.
4. **Every user-visible string goes through `t()`.** No exceptions — this is what makes Arabic possible at all.
5. **A glossary decides the untranslatable terms** (SEO, Favicon…) once, so we don't argue per string later.

---

## 2. Findings (evidence)

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

### Phase 0 — Fix what is actually broken (do first, it's small)
Not polish — correctness:
1. **Blank pages.** Either restore `landing/ai/features/usage/other` or remove their search-registry entries + the `FeatureDisabledView` link + their translation keys. Recommend: **remove** (they're orphaned) and point "enable feature" at a page that exists.
2. **Decide the dead files.** `lib/dashboard-menu-items.ts` → either adopt as the single source of truth for nav, or delete. Orphaned `OrgEdit*` components → delete or restore.
3. **Nav divergence.** Make desktop and mobile menus agree (targets + plan gating).

### Phase 1 — Define the vocabulary (one decision, written down)
1. **CTA verb rule:** `New <Entity>` (list pages) · `Add <Thing>` (in-form adders) · `Create` (modal submit).
2. **Concept glossary (decide once):**
   - Chapter **or** Module → pick one word for the UI.
   - Lesson **or** Activity → pick one.
   - User **or** Member (recommend: "User" for admin surfaces, "Member" for community surfaces — but define where each applies).
3. **Untranslatable-terms glossary:** for each of SEO/Favicon/… decide **keep Latin** vs **translate** vs **"Latin + translated gloss"**. Recommend: keep genuinely technical brand terms Latin (Favicon, Robots.txt, Sitemap) but translate conceptual ones (SEO → تحسين محركات البحث, Webhook → نقطة اتصال) — and apply the same rule in **both** org and course settings.
4. Write all of it into a short `glossary.md` so it's enforceable.

### Phase 2 — Build the primitives
- `<ActionRow>` — search + filters + primary action (replaces families A–E).
- `<PageTabs>` — one tab bar with `variant="pill" | "underline"` (replaces 5 copies + 3 variants).
- `<Icon>` registry — one icon per concept, **lucide only**; ban phosphor in the dashboard.
- Standardise on **shadcn `Select`** for all selects; delete native `<select>` and bespoke dropdowns.

### Phase 3 — Apply, area by area
Convert each dashboard area to the primitives, one commit per area so it's reviewable:
Courses → Podcasts → Communities → Boards → Playgrounds → Users/Groups/Roles → Payments → Org settings → Course settings → Account.

### Phase 4 — Translation-readiness sweep
- Route **every** remaining visible string through `t()`.
- Translate all section headings (org SEO, course general, podcast, boards, payments).
- Apply the untranslatable glossary consistently (fix org-vs-course SEO).
- Add the new keys to `en.json`; then `fr`/`ar` can be filled mechanically.

### Phase 5 — Guardrails + QA
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

- [ ] No reachable dashboard route renders a blank page.
- [ ] Exactly one `New <Entity>` wording per list page; no `+ New` string literals.
- [ ] Every action row uses `<ActionRow>`; no bespoke toolbar variants remain.
- [ ] Every tab bar uses `<PageTabs>`.
- [ ] One icon per concept; no phosphor imports under `components/Dashboard/**`.
- [ ] All selects are the single shadcn `Select`.
- [ ] Chapter/Module and Lesson/Activity each resolve to one word everywhere.
- [ ] Every dashboard string goes through `t()` (verified by grep for bare JSX text).
- [ ] The untranslatable glossary is applied identically in org and course settings.
- [ ] `en.json` has a key for every visible string; `fr`/`ar` fallbacks are empty only where intentional.
