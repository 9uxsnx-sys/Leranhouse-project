# i18n & RTL — Research & Plan

> **Status:** Direction plumbing shipped (`<html lang/dir>` + `DirectionProvider` + Arabic font). Logical-property refactor, RTL exceptions, JS coordinate fixes and QA pending.
> **Goal:** Ship **three** languages — English (exists), French (exists), Arabic (exists) — with **accurate RTL** for Arabic, done the *professional* way (real bidirectional layout, not a global CSS flip).
> **Scope:** the Next.js web app at `apps/web`.
> **Companion docs:** [design-tokens.md](../../07-ui-reference/design-tokens.md), [patterns.md](../../07-ui-reference/patterns.md), [frontend/overview.md](../../05-developer-guide/frontend/overview.md).

---

## 0. TL;DR

**The translations are done. The direction plumbing is in place. The layout refactor is not.**

Three locales ship (`en`, `fr`, `ar`) and i18n is fully wired (lazy loading, language switcher, org-default-language sync). Direction plumbing now exists too:

- `<html lang>` and `<html dir>` are **SSR-rendered before paint** from the `i18next` cookie (`app/layout.tsx` → `lib/direction.ts`), so there is no flash of LTR.
- Radix **`DirectionProvider`** wraps the app in `I18nContext.tsx`; `useDirection()` is consumed where overlays need it (`hover-menu.tsx`).
- **Noto Sans Arabic** is loaded next to Inter.

What remains is the hard part: **~900 physical directional utilities**, RTL exceptions (charts, media controls, code blocks), JS coordinate math, `dir="auto"` for user content, `cmdk`/DnD direction props, and the lint guard. Until those are converted, the page shell is correctly RTL but individual components can still be pinned LTR.

---

## 1. What already exists (and what it means for the plan)

| Area | State | Implication |
|---|---|---|
| i18n engine | `i18next@26`, `react-i18next@17`, `i18next-browser-languagedetector@8` | Solid, no change needed |
| Config | `apps/web/lib/i18n.ts` — English bundled, the other 18 lazy-loaded via `LOCALE_LOADERS` | Good pattern already |
| Detection | `localStorage → cookie → querystring → navigator → path → subdomain`, cached in localStorage + cookie | Works |
| Locales on disk | 19 files in `apps/web/locales/`, but only **en / fr / ar** are shipped (`supportedLngs`) | The other 16 are unreachable until re-added |
| Language list | `apps/web/lib/languages.ts` → `AVAILABLE_LANGUAGES` has **3** entries (en, fr, ar) | Matches `supportedLngs` |
| Switchers | `LanguageSwitcher.tsx`, `DashLeftMenu`, `UserLeftMenu`, `home.tsx` | Reusable |
| Org default | `components/Contexts/OrgLanguageSync.tsx` (respects a `i18nextLng_userPicked` override) | Reusable |
| Provider tree | `Providers.tsx`: Session → LHSession → `I18nProvider` | `I18nContext` now provides `DirectionProvider` |
| **Direction** | **`<html lang>` + `<html dir>` SSR-driven from `lib/direction.ts` (cookie); Radix `DirectionProvider`; `useDirection()` in overlays** | **Plumbing done; component-level logical properties still to do** |
| Fonts | `app/layout.tsx` loads **Inter (latin)** + **Noto Sans Arabic** | Arabic glyphs covered |

**Consequence:** we are not choosing a translation vendor or plumbing locale files. We are retrofitting bidirectional layout into an LTR-only UI. Budget accordingly.

---

## 2. How professionals do RTL (research findings)

### 2.1 Logical properties are the foundation, not `rtl:` hacks

The professional approach is to stop writing *physical* CSS and write *logical* CSS, then let one attribute (`dir="rtl"`) resolve everything. Physical values are pinned to screen coordinates; logical values resolve against the text flow and mirror automatically.

| Physical (avoid) | Logical (use) |
|---|---|
| `margin-left` / `mr-*` | `margin-inline-start` / `ms-*` |
| `margin-right` / `ml-*` | `margin-inline-end` / `me-*` |
| `padding-left` / `pr-*` | `padding-inline-start` / `ps-*` |
| `padding-right` / `pl-*` | `padding-inline-end` / `pe-*` |
| `left` / `right` | `inset-inline-start` / `inset-inline-end` (`start-*` / `end-*`) |
| `text-align: left` | `text-align: start` (`text-start`) |
| `border-left` / `border-right` | `border-inline-start/end` (`border-s-*` / `border-e-*`) |
| `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` |

**Flexbox and CSS Grid already respect `dir`** — they do not need rewriting. This is why the refactor is concentrated in margins, paddings, borders, absolute insets and text alignment.

**Tailwind v4 gives us all of this natively** (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start/end`, `rounded-s/e-*`) plus the `rtl:` / `ltr:` variants (which compile to `:where([dir=rtl], [dir=rtl] *)`). The tooling is ready; the code isn't using it.

> ⚠️ **Verify before relying on it:** one claim we could not confirm is whether Tailwind v4 rewrites `space-x-*` to a logical `margin-inline-start` (521 occurrences hinge on this). **Check the compiled CSS** during Phase 2; if it stays physical, `space-x-*` joins the refactor list.

### 2.2 Icons: flip reading-flow, never flip physical reality

The most common RTL bug. The rule:

**Mirror** — icons whose meaning follows text direction: back/forward chevrons, breadcrumb arrows, pagination, undo/redo, list indentation, reply arrows, "send" arrows, progress indicators implying forward motion.

**Never mirror** — media playback controls (play/pause), the audio/video progress bar, clocks and timers, checkmarks, close/X, search, shopping carts, cameras/phones, logos.

> Specifically for us: **the podcast player and the video/audio progress bars must stay LTR.** A mirrored player is a classic tell that the RTL pass was done mechanically.

### 2.3 Charts do not auto-flip

**recharts has no RTL support.** It renders SVG with physical coordinates. The community-standard workarounds are either to force a chart subtree back to `direction: ltr`, or to reverse the value axis deliberately. Neither is automatic — this needs an explicit decision per chart. We have **29 recharts files**, so this is the single largest risk item (see §6).

### 2.4 Numerals and dates

Arabic has two numeral systems: **Western (0–9)** and **Eastern Arabic (٠–٩)**. Convention varies by country, and **Algeria, Tunisia and Morocco use Western digits** — which matches our market (DZD / Chargily). So:

- **Keep Western numerals** (`123`, not `١٢٣`) — consistent with the target market and with any mixed technical content.
- Route all number/currency/date formatting through `Intl.NumberFormat` / `Intl.DateTimeFormat` with the active locale, so French gets its own separators (`1 234,50`) instead of English ones.
- **Never mix** the two numeral forms in one view.

### 2.5 Direction-aware JavaScript must be fixed by hand

CSS handles styling, but anywhere the code computes left/right in JS it breaks silently. Known offenders in our codebase (§4).

### 2.6 Overlays need `dir` too

Radix UI components (`DropdownMenu`, `Select`, `Popover`, `Tooltip`, `HoverCard`, `NavigationMenu`, `Tabs`) accept direction via `DirectionProvider`. Without it, submenu placement, `side`/`align` flipping and arrow-key navigation stay LTR. `cmdk` (command palette) also takes a `dir` prop.

### 2.7 Fonts and typography

Arabic needs a real Arabic typeface (e.g. **Noto Sans Arabic**, **IBM Plex Sans Arabic**, **Cairo**, **Almarai**) — Inter has no Arabic glyphs, so today it falls back to whatever the OS provides and looks inconsistent. Arabic also wants **more line-height** and **no letter-spacing**, and its glyphs connect, so any `tracking-*` on Arabic text must be removed.

### 2.8 Mixed-direction content: `dir="auto"`

The subtle one. User-generated content (course titles, descriptions, discussion posts) is authored in *one* language but displayed inside a UI that may be in *another*. A French course title inside an Arabic UI must still read LTR. The fix is `dir="auto"` on the text containers, or `unicode-bidi: plaintext`. Skipping this produces visibly scrambled sentences — and it is the difference between a demo that looks native and one that looks broken.

---

## 3. Our layout surface (mapped to the code)

Everything below was found in `apps/web`; these are the surfaces that need attention.

| Category | Files (high-impact examples) | Why it's affected |
|---|---|---|
| **App shell / nav** | `Menus/DashLeftMenu.tsx`, `Menus/UserLeftMenu.tsx`, `Admin/AdminLeftMenu.tsx`, `Menus/OrgMenu.tsx`, `Menus/AdminTopBar.tsx`, `ui/sub-nav.tsx`, `Objects/Breadcrumbs/Breadcrumbs.tsx` | `border-r`, physical inset panels, **and JS `getBoundingClientRect().left` used to position the active-item highlight** |
| **Course / lesson player** | `course/[courseuuid]/course.tsx`, `activity/[activityid]/activity.tsx`, `Pages/Activity/FixedActivitySecondaryBar.tsx`, `ActivityNavigation.tsx` | Side rails + prev/next controls |
| **Podcast player** | `Objects/Podcasts/PodcastPlayer.tsx`, `PodcastSidebar.tsx`, `EpisodeCard.tsx` | Player must **stay LTR** (icons + seek bar) |
| **Tables / data** | `ui/table.tsx` (`pl-6`/`pr-6`, `text-left`), `Analytics/DataTable.tsx` (`flex-row-reverse`), Analytics tabs, `Users/OrgUsers`, `Payments/PaymentsCustomersPage`, `Org/OrgAuditLogs` | Cell padding + column alignment are physical |
| **Charts** | **29 files** using recharts (all of `components/Analytics/*` and `Dashboard/Analytics/*`) | **No RTL support — needs explicit handling** |
| **Editors** | tiptap imported in **73 files**; CodeMirror in `CodePlaygroundComponent.tsx` + assignment `TaskCodeObject.tsx` | Editor chrome, drag handles, slash menu, tooltips — plus **code blocks must stay LTR** |
| **Board canvas** | `Dashboard/Boards/BoardCanvas.tsx`, `useDragResize.ts`, `useFrameDrag.ts`, `RemoteCursors.tsx` | Pervasive `clientX - rect.left` / `translate(x,y)` coordinate math |
| **Drag & drop** | `@hello-pangea/dnd` in **11 files** (course structure, podcast episodes, landing, profile builder, migration wizard) | Library supports `direction="rtl"`; not configured |
| **Media seek** | `LearnHousePlayer.tsx`, `CloudflarePlayer.tsx`, `AudioBlockComponent.tsx`, `PodcastBlockComponent.tsx` | Click-to-seek uses `(clientX - rect.left) / rect.width` — must flip for the bar **only**, not the controls |
| **Overlays** | `ui/{dialog,dropdown-menu,popover,tooltip,hover-card,sheet,navigation-menu,select,tabs}.tsx` (`side`/`align` used ~57×), `SearchModal`, `CommandPalette` (cmdk) | Need `DirectionProvider` / `dir` |
| **Global CSS** | `styles/globals.css` (~2,639 lines) | ~40 physical rules: editor drag handle, drop indicators, slash menu, collaboration cursors, tippy placement, blockquote/list padding, table headers |

---

## 4. Direction-aware JavaScript (the silent bugs)

These compute positions in JS and will not be fixed by CSS:

- **Drag & drop** — 11 files, no `direction="rtl"` passed.
- **Video / audio click-to-seek** — `(clientX - rect.left) / rect.width` in 4 files. (Flip the *bar*, keep the *controls* LTR.)
- **Nav highlight pills** — `DashLeftMenu`, `UserLeftMenu`, `ui/sub-nav.tsx` measure with `getBoundingClientRect().left`.
- **Board canvas** — dozens of `e.clientX - rect.left` for create/marquee/pan/drop.
- **Popover/context positioning** — `hover-menu.tsx`, admin lists, bespoke dropdowns.
- **AI bubble clamping** — `AICanvaToolkit.tsx` (`window.innerWidth - bubbleWidth`).

---

## 5. Scale estimate

Physical directional utility usage across `apps/web` source (line-level counts, lower bounds):

| Pattern | Count | Verdict |
|---|---:|---|
| `left-*` | ~190 | Refactor |
| `right-*` | ~146 | Refactor |
| `ml-*` | ~144 | Refactor → `ms-*` |
| `mr-*` | ~132 | Refactor → `me-*` |
| `text-left` | ~117 | Refactor → `text-start` |
| `pl-*` | ~113 | Refactor → `ps-*` |
| `text-right` | ~99 | Refactor → `text-end` |
| `pr-*` | ~98 | Refactor → `pe-*` |
| `translate-x-*` | ~65 | **Mostly `-translate-x-1/2` centering → direction-neutral, leave alone** |
| `border-l-*` / `border-r-*` | ~50 | Refactor → `border-s/e-*` |
| `flex-row-reverse` | ~10 | Review case-by-case |
| `space-x-*` | ~521 | **Verify** — likely already logical in v4; if not, this dominates |

**Net:** roughly **900–1,000** genuinely directional usages, but they are **concentrated** — a short list of ~10 files accounts for a disproportionate share (led by `CertificatePreview.tsx`, `OrgEditLanding.tsx`, `PodcastDistribution.tsx`, analytics widgets, the activity page). The long tail is mostly one or two classes per file.

---

## 6. Risks (ranked — this is the part to read)

| # | Risk | Severity | Why | Mitigation |
|---|---|---|---|---|
| **R1** | **recharts doesn't flip** | **High** | 29 chart files; axes, tooltips and labels stay LTR inside an RTL page. No library support. | Decide per chart: `direction: ltr` wrapper for purely numeric charts, or reverse axes for time-series. Do it once in a shared chart wrapper. |
| **R2** | **Mixed-direction content** | **High** | Course/discussion text authored in one language shown in another UI reads scrambled. Very visible in a demo. | `dir="auto"` / `unicode-bidi: plaintext` on all user-content containers. |
| **R3** | **Silent JS coordinate bugs** | **High** | Click-to-seek, DnD, board canvas, rect-based highlights fail *only* in RTL and are hard to unit-test. | Fix explicitly; manual QA per area; add `direction` to DnD contexts. |
| **R4** | **Editors (tiptap) + `globals.css`** | **Med-High** | The editor is LTR-centric; ~40 physical CSS rules; **code blocks must stay LTR**. | Scope content direction with `dir="auto"`; keep `dir="ltr"` on code/pre; hand-fix the ~40 rules. |
| **R5** | **Third-party libs** | **Medium** | recharts, `re-resizable`, tippy, cmdk, emblor, react-hot-toast, `@hello-pangea/dnd` — mixed support. | Audit each; wrap where needed. |
| **R6** | **Fonts / typography** | **Medium** | Inter has no Arabic glyphs → wrong fallback; `tracking-*` breaks Arabic. | Add an Arabic font (subset), bump line-height, strip letter-spacing for `ar`. |
| **R7** | **Flash of LTR on load** | **Medium** | If `dir`/`lang` are set client-side after hydration, the first paint is LTR. | Set `dir`/`lang` **before paint** (SSR from org/user language, or a blocking inline script like the existing `embed-bg.js`). |
| **R8** | **Scope: 19 languages, we want 3** | **Low-Med** | `AVAILABLE_LANGUAGES` exposes 19; 18 locale files exist. | Decide: keep the files but show only 3, or delete the other 16. |
| **R9** | **No regression guard** | **Medium** | New code will reintroduce `ml-`/`text-left` and silently break RTL. | **Add a lint rule** banning physical utilities (see §8). This is the pro move. |
| **R10** | **Blind find/replace** | **Medium** | Some physical classes are intentional (`left-1/2 -translate-x-1/2` centering, media controls, code blocks). | Never mass-replace; go file-by-file with the exception list. |
| **R11** | **QA cost** | **Medium** | RTL bugs are visual; there is limited automated coverage. | Structured visual QA checklist per screen, both directions. |

---

## 7. Recommended approach (phased)

**Phase 0 — Lock scope. ✅** en/fr/ar chosen; `AVAILABLE_LANGUAGES` reduced to 3; the other 16 locale files remain on disk but are unreachable.

**Phase 1 — Direction plumbing (the enabler). 🟡 Partial**
- ✅ `dir` + `lang` on `<html>`, **before paint** (SSR from the `i18next` cookie in `app/layout.tsx`, via `lib/direction.ts`).
- ✅ Radix `DirectionProvider` in `I18nContext.tsx`; `useDirection()` used in `hover-menu.tsx`.
- ✅ Arabic font (**Noto Sans Arabic**) loaded alongside Inter.
- ⬜ Pass `dir` to `cmdk` (Command Palette).
- ⬜ Set `direction="rtl"` on `@hello-pangea/dnd` contexts.
- ⬜ Route number/currency/date formatting through `Intl` with the active locale.
- ⬜ Adopt a `dir="auto"` convention for user-generated content.

**Phase 2 — Logical-property refactor.** Convert the ~900 directional usages, precedence order: **shell/nav → tables → cards/lists → forms → analytics**. Do **not** touch centering transforms or media controls. Verify the `space-x-*` question here.

**Phase 3 — Exceptions.** Icon mirroring (apply the §2.2 rule), chart handling (R1), keep code/media LTR (R4).

**Phase 4 — JS / coordinate fixes.** DnD direction, click-to-seek, rect-based highlights, board canvas, popover positioning.

**Phase 5 — Editors & `globals.css`.** The ~40 physical rules; editor chrome; ensure code blocks stay LTR.

**Phase 6 — QA.** Screen-by-screen visual pass in both `en` and `ar`, using a checklist.

---

## 8. Guardrails (what makes it "pro" rather than one-off)

1. **Prevent regressions with lint.** Add an ESLint/stylelint rule that **fails** on physical directional utilities (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `border-l-`, `border-r-`) in JSX/className, with an allow-list for intentional exceptions. Without this, the RTL work decays within weeks.
2. **One source of truth for direction.** A single hook/context (`useDirection()` / `isRTL`) that reads the active language — never ad-hoc checks.
3. **A visual QA checklist** committed with the work, so each release can be re-verified.
4. **Convention doc** so new components are written logically from day one.

---

## 9. Decisions

| # | Decision | State |
|---|---|---|
| 1 | **Which 3 languages** — en / fr / ar; the other 16 locale files stay on disk but are unreachable (`AVAILABLE_LANGUAGES` + `supportedLngs` both list 3). | ✅ Decided |
| 2 | **Numeral convention** — Western digits (`123`), matching the Algerian market; never mix both forms. Formatting still needs to move to `Intl` (Phase 1). | ✅ Decided |
| 3 | **Chart strategy (R1)** — LTR-wrapped numeric charts vs mirrored/reversed axes. Affects 29 recharts files. | ⬜ Open |
| 4 | **Arabic font** — **Noto Sans Arabic**, loaded in `app/layout.tsx` (`--font-arabic`). Self-hosting/subsetting still open. | ✅ Decided / 🟡 partially done |
| 5 | **Direction source of truth** — `lib/direction.ts` (`getDirection` / `isRTL` / `localeCode`); `OrgLanguageSync` respects a user override (`i18nextLng_userPicked`). | ✅ Decided |
| 6 | **Lint guard** — add a rule failing on physical directional utilities in dashboard JSX. | ⬜ Open (Phase 6 of the polish plan has the same guardrail) |

---

## 10. Sources

- [MDN — `margin-inline-start`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/margin-inline-start)
- [W3C — CSS Logical Properties and Values Level 1](https://drafts.csswg.org/css-logical-1/)
- [Material Design — Bidirectionality](https://m1.material.io/usability/bidirectionality.html)
- [Iconstash — RTL Iconography Mirroring Guide](https://iconstash.io/articles/rtl-iconography-mirroring-guide/)
- [Tailwind CSS — Margin (`ms-*` / `me-*`)](https://v3.tailwindcss.com/docs/margin)
- [Recharts — Fix `direction: rtl` problem](https://bleepingcoder.com/recharts/178304452/fix-direction-rtl-problem)
- [Recharts — `XAxis` `reversed` prop](https://recharts.org/en-US/api/XAxis)
- [APEX — RTL CSS Guide](https://apex.sy/en/blog/rtl-css-guide)
- [APEX — Arabic Numerals, Currency, and Formats](https://apex.sy/en/blog/arabic-numerals-formats)
- [Mozilla — RTL Guidelines](https://raw.githubusercontent.com/mozilla-firefox/firefox/main/docs/code-quality/coding-style/rtl_guidelines.md)
