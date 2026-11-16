> Status: in progress · Created: 2026-11-16 · Phases 1–3 implemented, Phase 4 pending

# UI theme colour and button cleanup

Two things, in this order: **clean the buttons**, then **connect the brand colour**. The first is a prerequisite for the second — a themed button that still carries a glossy overlay looks wrong, and today the app ships two different button finishes.

This page is the agreed plan. Phases 1–3 are built; Phase 4 (brand colour) is not. The repository checkpoint for rolling back is commit `7a85a7cb`.

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

### Phase 4 — Connect the brand colour — in progress (step 1 done)

Infrastructure first, then surfaces. Until the tokens exist on both shells, nothing changes visually.

**Token set** — derived at runtime from the single hex in `customization.general.color`. No second colour is introduced anywhere.

| Token | Value | Used by |
|---|---|---|
| `--brand` | the org hex, sanitized; fallback `#27272a` (ink) | filled primary, progress fill, active marker, tab underline |
| `--brand-fg` | `#ffffff` or `#18181b`, chosen by the existing `isLightColor()` | label on a brand fill |
| `--brand-hover` | `color-mix(in oklab, var(--brand) 86%, black)` | hover |
| `--brand-pressed` | `color-mix(in oklab, var(--brand) 74%, black)` | active |
| `--brand-soft` | `color-mix(in oklab, var(--brand) 10%, transparent)` | selection tint |
| `--brand-ring` | `color-mix(in oklab, var(--brand) 35%, transparent)` | selected outline |

Add the matching utilities to `styles/globals.css`: `bg-brand`, `text-brand-fg`, `hover:bg-brand-hover`, `active:bg-brand-pressed`, `bg-brand-soft`, `border-brand`.

**Where it is allowed** — this list is exhaustive; anything not here stays neutral.

| # | Surface | Files | Note |
|---|---|---|---|
| 1 | Filled primary button | `ui/button.tsx` (`primary` + `default`), `ui/icon-button.tsx` (`primary`), and the 33 hand-written dark CTAs | The hand-written ones are the pills (`CourseEndView`, `CourseActionsMobile`, store card, `CourseThumbnailLanding`). If they are not converted to the token they keep ink while the component turns brand — that split is the main risk in this phase |
| 2 | Course / podcast progress fill | `TrailCourseElement:125`, `TrailCourseCard:92`, `CourseEndView:583`, `ActivityIndicators:435`, `course.tsx:506`, `PodcastPlayer:158`, `EpisodePlayer:276`, `EpisodeCard:76,103`, `episode-design-options:222,327`, `AssignmentStudentActivity:191` | Video player chrome stays neutral (it sits on top of video and must not fight it). Password strength stays semantic |
| 3 | Active navigation marker | `UserLeftMenu`, `DashLeftMenu`, `AccountSidebar` (`aria-current="page"`), plus `TabCard` underline | One marker per shell, not a filled nav block |
| 4 | Selection tint | active filter chips, selected table rows, current tab underline | 8–12% alpha only. Selected checkboxes stay ink — a tinted checkbox reads weaker |
| 5 | Charts | `components/Analytics/chartTheme.ts` | **Decision needed.** See below |

**Charts are currently in an inconsistent state** — `useChartTheme()` reads `--primary` for the primary series, so after Phase 2 that series is now ink, while `CHART_PALETTE` is still an indigo→violet ramp (`#6b8de3 → #c4b5fd`). A chart today paints one black series next to three indigo ones. Either point the whole palette at `--brand` (white-label look) or make it a neutral grey ramp (Claude look). The plan's default is the grey ramp.

**Order of work** — each step ships on its own:

1. ✅ **Done.** Tokens in `:root` (ink defaults), `getBrandStyle()` in `services/utils/ts/colorUtils.ts`, applied on both shells — `OrgMenu` for the learner side and `ClientAdminLayout` for the dashboard. Bad or missing values normalise to ink, so nothing can break the shell. The six utilities exist in `globals.css` and stay unemitted until a surface uses them.
2. Active nav marker + tab underline → smallest visible win.
3. Progress fills → the learner side starts to feel branded.
4. Primary buttons → needs the one-filled-primary-per-view audit first.
5. Selection tint → optional polish.
6. Charts → after the grey-ramp vs brand-ramp decision.

**Not themed, on purpose:** sidebar and header surfaces, links, focus rings, checkboxes and switches, status badges, destructive/success/warning, video player chrome, certificate artwork.

Acceptance: changing Branding → Primary Color recolours the primary button, progress, active marker and selection tint — and nothing else. Clearing the colour restores ink exactly. Text on a brand fill is at least 4.5:1, brand boundaries at least 3:1.

## Decisions taken

- Button geometry is frozen, and the buttons themselves are signed off as-is — no further button work in this plan.
- The brand colour applies to **both shells** (learner and dashboard). The guard is one filled primary per view, so dashboard screens that stack two primaries must demote one to `secondary` before the brand colour lands.
- The brand colour never touches text, links, borders, icons, surfaces or charts by default — only the four signal surfaces above.
- Default (no colour configured) remains monochrome.

## Out of scope

- Dark mode.
- Reworking layouts, spacing or the sidebar.
- Certificate artwork, video player chrome, code editor theming.
- Third-party brand marks (Chargily, Cloudflare, Discord).

## Related

- [UI reference — Button](../../07-ui-reference/components/button.md)
- [Design tokens](../../07-ui-reference/design-tokens.md)
- [Organization branding](../../04-admin-guide/org-settings/branding.md)
