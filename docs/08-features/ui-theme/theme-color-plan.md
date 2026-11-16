> Status: plan · Created: 2026-11-16 · Not implemented yet

# UI theme colour and button cleanup

Two things, in this order: **clean the buttons**, then **connect the brand colour**. The first is a prerequisite for the second — a themed button that still carries a glossy overlay looks wrong, and today the app ships two different button finishes.

This page is the agreed plan. Nothing here is built yet. The repository checkpoint for rolling back is commit `7a85a7cb`.

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

## What the code does today

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

### Phase 1 — Flatten and unify the buttons (no theme)

- Remove the `button-*-gradient` sheens and the button drop shadows from `styles/globals.css` and `components/ui/button.tsx`.
- Keep every size, padding, height and radius exactly as it is.
- Replace the 16 hand-written `bg-neutral-900` / `bg-gray-900` buttons with the shared `Button` so there is one finish everywhere.
- Hover = slightly darker fill; pressed = slightly darker again; focus = neutral ring; disabled unchanged.

Acceptance: no visible gradient on any button, geometry unchanged, one component drives all buttons.

### Phase 2 — Neutralise the accent tokens

- Set `--primary` to the ink colour and `--ring` to a neutral ring, so the 133 indigo spots (checkboxes, badges, focus rings, boards, playgrounds, onboarding) fall in line with the black buttons.
- No layout change; this is a token-only edit in `styles/globals.css`.

Acceptance: no indigo appears anywhere in the product with no brand colour configured.

### Phase 3 — Remove the hard-coded blue/indigo

- Replace the 64 blue/indigo classes with neutral ink/grey equivalents.
- Analytics charts keep one neutral primary series colour; secondary series stay grey.

Acceptance: grep for `text-blue-`, `bg-blue-`, `text-indigo-`, `bg-indigo-` inside `apps/web` returns no hits outside intentional semantic colours.

### Phase 4 — Connect the brand colour

- Add the token set: `--brand`, `--brand-fg` (auto contrast via the existing `isLightColor`), `--brand-hover`, `--brand-soft`, `--brand-ring`.
- Set the tokens on **both** shells — the learner `(withmenu)` layout and the dashboard layout. Today only the learner shell sets `--brand`.
- Apply them only to the five signal spots listed above.
- Fallback: no configured colour → ink, i.e. today's look.

Acceptance: changing Branding → Primary Color recolours the CTA, progress, active marker and selection tint, nothing else; clearing the colour restores black.

## Decisions taken

- Button geometry is frozen.
- Learner-facing CTAs get the brand colour first; dashboard CTAs stay ink unless we decide otherwise later.
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
