> Status: in progress · Created: 2026-11-16 · Phases 1–3 done, Phase 4 steps 1–6 done; `--brand-fg` override shipped

# UI theme colour and button cleanup

Two things, in this order: **clean the buttons**, then **connect the brand colour**. The first is a prerequisite for the second — a themed button that still carries a glossy overlay looks wrong, and today the app ships two different button finishes.

This page is the agreed plan. Phases 1–3 are built; Phase 4 is built except the optional selection tint. The repository checkpoint for rolling back is commit `7a85a7cb`.

## Goal

Move the product to a neutral-first ("Claude-style") visual system:

- Black, grey and white carry the interface.
- The organization's brand colour marks a **small, fixed set of signal spots**.
- No decorative colour, no gloss, no gradients, no coloured surfaces.

## Hard constraints

- **Button sizes, padding, heights and radii do not change.** `Continue learning`, `Get access`, `New course` and every other button keeps its current geometry. Only the inside of the fill changes.
- No API, database or configuration change.
- Destructive, success and warning colours are never themed.
- With no brand colour configured, the interface must look exactly like today (ink primary button).

## What the code looked like before Phases 1–3

| Area | Finding |
|---|---|
| Primary buttons | One shared component (`components/ui/button.tsx`) used in 55 places across 27 files |
| Button finish | Every variant paints a white top-sheen over its fill (`button-inverted-gradient`, `button-neutral-gradient`, `button-danger-gradient` in `styles/globals.css`) plus a drop shadow — a physical, e-commerce look inherited from the Medusa kit |
| Competing button language | 16 hand-written buttons with a flat `bg-neutral-900` / `bg-gray-900` fill across 9 files (`Get access`, store cards, search, activity, copilot) |
| Accent tokens | `--primary` and `--ring` resolve to `hsl(243 75% 59%)` — indigo. Used in **133 places across 30 files**: checkboxes, badges, icon buttons, boards, playgrounds, assignments, onboarding, course migrate, SCORM |
| Hard-coded accents | **64** blue/indigo classes across 30 files: trail, certificates, course-end, analytics charts, podcast distribution |
| Brand colour | The setting exists (Branding → Theme → Primary Color, stored in `customization.general.color`) and `--brand` is set on the learner shell, but **nothing consumes `var(--brand)`**. The dashboard shell never receives it |

## Where the brand colour is allowed

| # | Surface | Notes |
|---|---|---|
| 1 | Filled primary button | The signal layer; black when no brand colour is set |
| 2 | Progress fill | Course and podcast progress bars and rings |
| 3 | Active navigation marker | Small marker in the sidebar / tab bar, not a fully filled block |
| 4 | Selection tint | Selected table row, active filter chip, current tab underline (8–10% alpha) |
| 5 | Small status badge | Optional, e.g. "New" |

Everything else stays neutral: links (ink, underlined), focus rings (neutral), chart series, icons, headers, empty states, surfaces.

## Phases

### Phase 1 — Flatten and unify the buttons (no theme) — done

- Removed the `button-*-gradient` sheens and the button drop shadows from `styles/globals.css` and `components/ui/button.tsx`.
- Kept every size, padding, height and radius exactly as it is.
- Normalised the hand-written dark buttons (`bg-black`, `bg-gray-900`, `bg-neutral-900`) to one ink fill (`bg-zinc-800`, hover `bg-zinc-700`) instead of rewriting them as `<Button>`, so no geometry moved.
- Hover = slightly darker fill; pressed = slightly darker again; focus = neutral ring; disabled unchanged.

Acceptance: no visible gradient on any button, geometry unchanged, one ink fill everywhere.

### Phase 2 — Neutralise the accent tokens — done

- `--primary` is ink (`240 6% 10%`, dark mode `0 0% 98%` with `0 0% 9%` foreground) and `--ring` is neutral, so the indigo spots (checkboxes, badges, focus rings, boards, playgrounds, onboarding) fall in line with the black buttons.
- No layout change; this was a token-only edit in `styles/globals.css`.

Acceptance: no indigo appears anywhere in the product with no brand colour configured.

### Phase 3 — Remove the hard-coded blue/indigo — done for CTAs

- Replaced the blue/indigo **buttons, progress fills and play-state markers** with the same ink fill.
- Kept intentional semantic colour: destructive red, success emerald, warning amber, the "paid" badge, Copilot's violet identity, the editor's colour pickers and analytics chart series.

Acceptance: no blue/indigo remains on any call-to-action, progress fill or active marker. Remaining hits are semantic.

### Phase 4 — Connect the brand colour — in progress (steps 1–4 done)

Infrastructure first, then surfaces. Until the tokens exist on both shells, nothing changes visually.

**Token set** — derived at runtime from the single hex in `customization.general.color`. No second colour is introduced anywhere.

| Token | Value | Used by |
|---|---|---|
| `--brand` | the org hex, sanitized; fallback `#27272a` (ink) | filled primary, progress fill, active marker, tab underline |
| `--brand-fg` | `#ffffff` or `#18181b`, chosen by the existing `isLightColor()`, unless the org pins `customization.general.brand_fg` | label on a brand fill |
| `--brand-hover` | `customization.general.brand_hover` when pinned, otherwise a step of black — 14% for white labels, 6% for dark ones | hover |
| `--brand-pressed` | one further 12% step in the hover's direction; the unpinned path uses 26% / 12% of black from the brand | active |
| `--brand-soft` | `color-mix(in oklab, var(--brand) 10%, transparent)` | selection tint |
| `--brand-ring` | `color-mix(in oklab, var(--brand) 35%, transparent)` | selected outline |

Add the matching utilities to `styles/globals.css`: `bg-brand`, `text-brand-fg`, `hover:bg-brand-hover`, `active:bg-brand-pressed`, `bg-brand-soft`, `border-brand`.

`--brand-fg` and `--brand-hover` are the tokens an organization can override. Branding → Theme has a "Text & Icons" row that writes `customization.general.brand_fg` and a "Hover Color" row that writes `customization.general.brand_hover`; empty means auto on both. They exist because the automatic choice is not always the wanted one — a mango orange resolves to dark text, while many brands want white on it. The rows show the live WCAG ratio but never block saving.

**Foreground and dimming are contrast-aware.** `resolveBrandFg()` compares `#18181b` and `#ffffff` against the brand and keeps the higher-contrast one — a brightness threshold is wrong for mid-tones, where clay resolves to white at 3.12:1 while ink on the same fill is 5.68:1. Hover and pressed then depend on that foreground: dark text gets a 6% / 12% black mix, light text keeps 14% / 26%. Dimming raises contrast under white text but lowers it under dark text, so the single mix that shipped first took clay from 5.68:1 down to 4.32:1 / 3.36:1 on interaction. With the split, clay holds 5.07:1 / 4.51:1 and petrol keeps its existing hover feel.

**Where it is allowed** — this list is exhaustive; anything not here stays neutral.

| # | Surface | Files | Note |
|---|---|---|---|
| 1 | Filled primary button | `ui/button.tsx` (`primary` + `default`), `ui/icon-button.tsx` (`primary`), and the hand-written dark CTAs | Converted. The pills (`CourseEndView`, store card, `CourseThumbnailLanding`) keep their geometry and only the fill moved to the token |
| 2 | Course / podcast progress fill | `TrailCourseElement:125`, `TrailCourseCard:92`, `CourseEndView:583`, `ActivityIndicators:435`, `course.tsx:506`, `PodcastPlayer:158`, `EpisodePlayer:276`, `EpisodeCard:76,103`, `episode-design-options:222,327`, `AssignmentStudentActivity:191` | Video player chrome stays neutral (it sits on top of video and must not fight it). Password strength stays semantic. Assignment task bars are pass/fail, so they stay emerald/rose rather than brand |
| 3 | Tab underline | `UserProfileClient.tsx` learner profile tabs | Sidebars keep their existing animated active container. A brand marker was tried there and removed — it was a second chromatic element on every page, against one signal per screen |
| 4 | Selection tint | active filter chips, selected table rows, current tab underline | 8–12% alpha only. Selected checkboxes stay ink — a tinted checkbox reads weaker |
| 5 | Charts | `components/Analytics/chartTheme.ts` + every recharts consumer | **Brand ramp.** One hue, five steps, derived from the org hex |
| 6 | Progress rings | SVG circles in the trail card, episode list and community card | `stroke: var(--brand)` — same signal as the progress bars |

**Charts use the brand ramp.** `useChartTheme()` derives everything from the org hex: `primary` is the brand **exactly as configured**, and `categorical` is a five-step ramp made by mixing that hue toward white only. `positive` / `negative` stay emerald / rose because they carry meaning, and grid / axis stay neutral.

Two rules that are easy to get wrong:

- **Never mix a chart colour toward black.** That is what turned a mango orange brand into brown. The only exception is a near-white brand (luminance above 0.82), which is deepened because it would otherwise vanish on a white card. The 0.4 luminance threshold used for *text* contrast is not the right test for a *fill* — a saturated orange needs dark text but must still be drawn at full strength.
- **Read the brand from the org context, not from `--brand` on `document.documentElement`.** Child effects run before the shell's, so reading the custom property would capture the ink fallback on first paint and never update.
- Recharts renders SVG presentation attributes, where CSS `var()` does not resolve, so the ramp is computed in JS and handed over as real hex strings. Raw SVG progress rings are the exception — they use `style={{ stroke: 'var(--brand)' }}`, which does resolve.

**Order of work** — each step ships on its own:

1. ✅ **Done.** Tokens in `:root` (ink defaults), `getBrandStyle()` in `services/utils/ts/colorUtils.ts`, applied on all four shells — `OrgMenu` + `(withmenu)/layout.tsx` for the learner side, `ClientAdminLayout` for the dashboard, `auth/layout.tsx` and `embed/[orgslug]/layout.tsx` for the two previously blocked shells. The same values are mirrored onto `document.documentElement` because Radix dialogs and popovers portal to `<body>` and would otherwise fall back to ink. Bad or missing values normalise to ink, so nothing can break the shell.
2. ✅ **Done.** The learner profile tab strip in `UserProfileClient.tsx` uses `border-brand` for its active underline. A 3px brand bar was tried in the sidebars and removed: the existing animated active container is already the state, and the bar added a second chromatic element to every page. `PageTabs` has an `underline` variant no caller sets — dormant, not visible.
3. ✅ **Done.** Every progress fill reads `bg-brand`: course cover bar, course-end bar, trail card and trail row, activity indicators, podcast player, episode player/card, episode design options, assignment task progress, onboarding bar.
4. ✅ **Done.** Primary buttons read the token: the shared `Button` (`primary` + `default`), `IconButton` primary, the 33 hand-written CTAs, the 15 save strips, every `bg-primary` CTA in the dashboard (boards, playgrounds, assignments, course migrate, SCORM, activity-create modals, roles/user-groups modals, onboarding), the selection fills (active filter chips, active page numbers, selected member rows), and the auth submit CTA (`authPrimaryBtnClass` covers login, signup, forgot, reset and verify). Checkboxes, switches, status dots and media controls were left ink/semantic on purpose; on auth, Google / SSO / text links stay neutral so each screen keeps one filled button.
5. Selection tint → optional polish. `--brand-soft` is emitted but no surface consumes it yet.
6. ✅ **Done.** Charts read the brand ramp — `TrendChart`, `BarsChart`, `RankedBars`, `FunnelSteps`, `BreakdownList`, plus every dashboard widget (core row, funnel, DAU, event overview, growth, new vs returning, progress snapshot, grade distribution, certification, time-to-completion, retention, view-to-enrollment, session duration, activity-type breakdown, course effectiveness, assignment analytics). Only the dropoff bar (`#f87171`) and the A–F grade bands keep semantic colour.

**Not themed, on purpose:** sidebar and header surfaces, links, focus rings, checkboxes and switches, status badges, destructive/success/warning, video player chrome, certificate artwork.

Acceptance: changing Branding → Primary Color recolours the primary button, progress, active marker and selection tint — and nothing else. Clearing the colour restores ink exactly. Text on a brand fill is at least 4.5:1, brand boundaries at least 3:1.

## Decisions taken

- Button geometry is frozen, and the buttons themselves are signed off as-is — no further button work in this plan.
- The brand colour applies to **both shells** (learner and dashboard). The guard is one filled primary per view, so dashboard screens that stack two primaries must demote one to `secondary` before the brand colour lands.
- The brand colour never touches text, links, borders, icons, surfaces or charts by default — only the four signal surfaces above.
- Desktop only. The mobile shells are the old, untouched ones and are out of scope; they inherit shared components but are not audited or designed for in this work.
- Sidebar navigation is neutral by default. A brand *marker bar* is still rejected — it was a second chromatic element on every page. The active container itself can be branded per organization from Branding → Theme (`customization.general.brand_sidebar`), which is off by default; when on, the floating pill takes the brand fill and its label takes `--brand-fg`.
- Default (no colour configured) remains monochrome.

## Out of scope

- Dark mode — planned separately in [dark-mode-plan.md](./dark-mode-plan.md).
- Reworking layouts, spacing or the sidebar.
- Certificate artwork, video player chrome, code editor theming.
- Third-party brand marks (Chargily, Cloudflare, Discord).

## Related

- [Brand colour surface audit](./brand-surface-audit.md) — every screen and element, with its status
- [Dark mode plan](./dark-mode-plan.md) — component inventory, palette and per-mode brand
- [UI reference — Button](../../07-ui-reference/components/button.md)
- [Design tokens](../../07-ui-reference/design-tokens.md)
- [Organization branding](../../04-admin-guide/org-settings/branding.md)
