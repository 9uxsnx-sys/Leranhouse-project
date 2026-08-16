# Medusa UI — Design System Reference

A complete breakdown of the Medusa UI design system (the visual language used by
the Medusa Admin dashboard) that we will replicate in LearnHouse.

---

## 1. Design Philosophy

Medusa UI is built on three principles:

1. **The interface disappears** — content/data is the hero. The chrome is quiet,
   functional, and precise.
2. **Monochrome by default, one accent only** — ~95% of every screen is
   black/white/gray. Exactly one accent color (indigo `#6366f1`) is used,
   sparingly, for interactive/active/important elements.
3. **Borders, not shadows** — depth comes from the contrast between a light gray
   canvas and white cards separated by 1px borders. Shadows are reserved for
   floating surfaces (popovers, modals, dropdowns).

Technical foundation: React + Radix Primitives + Tailwind CSS. The Medusa team
explicitly credits shadcn/ui as an inspiration. **This means LearnHouse's
existing shadcn/new-york component stack is the same DNA** — we can replicate
the look by restyling existing components instead of adding a dependency.

---

## 2. Color System (Design Tokens)

Medusa uses CSS variables named `--medusa-*`. They come in two groups:
surfaces/text and borders/interactive.

### Light theme (default)

| Token | Value | Role |
|---|---|---|
| `--medusa-bg-base` | `#ffffff` | Card / container surfaces |
| `--medusa-bg-subtle` | `#fbfbfb` | Page canvas behind cards |
| `--medusa-fg-base` | `#1a1a1a` | Primary text (headings) |
| `--medusa-fg-subtle` | `#697386` | Secondary text (descriptions) |
| `--medusa-fg-muted` | `#a3a8b2` | Tertiary / placeholders / disabled |
| `--medusa-border-base` | `#e5e7eb` | Default 1px borders |
| `--medusa-border-strong` | `#d1d5db` | Stronger borders (tables, focus) |
| `--medusa-bg-interactive` | `#6366f1` | **The accent** (indigo-500) |
| `--medusa-fg-interactive` | `#ffffff` | Text on the accent |
| `--medusa-bg-danger` | `#fee2e2` | Danger surfaces (soft red) |
| `--medusa-fg-danger` | `#b91c1c` | Danger text |
| `--medusa-bg-success` | `#dcfce7` | Success surfaces (soft green) |
| `--medusa-fg-success` | `#15803d` | Success text |
| `--medusa-bg-warning` | `#fef3c7` | Warning surfaces (soft amber) |
| `--medusa-fg-warning` | `#b45309` | Warning text |

### Dark theme

| Token | Value |
|---|---|
| `--medusa-bg-base` | `#1a1a1a` |
| `--medusa-bg-subtle` | `#111111` |
| `--medusa-fg-base` | `#ffffff` |
| `--medusa-fg-subtle` | `#a3a8b2` |
| `--medusa-border-base` | `#2a2a2a` |
| `--medusa-bg-interactive` | `#6366f1` (unchanged) |

### The accent rule

Indigo is used **only** for:
- Primary buttons
- Links
- Active nav item indicator
- Focus rings / selected states
- Checkboxes/radios/switches when on

Status colors (danger/success/warning) are always **soft tints** (light
background + darker foreground), never saturated neon.

---

## 3. Typography

- **Font:** Inter (400/500/600/700). This is a core part of the identity.
- **Tracking:** `-0.01em` on large text, normal on body. No decorative spacing.
- **Size hierarchy (by weight + size, not color):**

| Role | Size | Weight |
|---|---|---|
| Page title | `text-xl` (20px) | semibold 600 |
| Section title | `text-base` (16px) | medium 500 |
| Body / table text | `text-sm` (14px) | normal 400 |
| Meta / descriptions | `text-sm` (14px) | normal 400, `fg-subtle` color |
| Micro-labels | `text-[11px]` | medium 500, **uppercase**, `tracking-wider` |

- Micro-labels (uppercase small-caps) are used above nav groups, form sections,
  and as table column headers.

---

## 4. Spacing, Radius, Shadows

- **Spacing scale:** standard Tailwind 4px grid. Content padding `p-4`–`p-8`.
  Sections separated by generous whitespace, not dividers.
- **Radius (consistent):**
  - Buttons / inputs: `rounded-md` (6px) to `rounded-lg` (8px)
  - Cards / containers: `rounded-xl` (12px)
  - Modals: `rounded-xl`
- **Shadows:** effectively none on cards. Only floating surfaces use a soft,
  subtle shadow. **No `shadow-md`+ on cards, no colored glows.**

---

## 5. Layout (Admin Shell)

### Sidebar (left, ~256px, collapsible)
- Logo at top (full version; collapses to icon-only)
- Search field below logo
- Nav items grouped under **uppercase micro-labels** ("OVERVIEW", "SALES",
  "SETTINGS")
- Item: 40px height, icon + label, `text-sm`
- Active: subtle background tint (`bg-black/5` light / `bg-white/10` dark) +
  colored text; sometimes a left indicator bar
- Hover: same tint, lighter
- Icons: one consistent set, single color, 16–20px

### Top bar
- Thin (56–64px), mostly empty: page title left, actions right (search,
  notifications, theme toggle, user avatar dropdown)

### Content canvas
- `bg-subtle` (#fbfbfb) page background
- White cards floating on it, separated by whitespace
- Max content width for reading (not full-bleed)

---

## 6. Components (the key building blocks)

### Container / Card
```tsx
<div className="rounded-xl border border-border bg-card">
  {/* header */}
  <div className="flex items-center justify-between border-b border-border px-6 py-4">
    <h2 className="text-base font-medium">Section title</h2>
    <Button variant="secondary" size="sm">Action</Button>
  </div>
  {/* body */}
  <div className="p-6">…</div>
</div>
```
Flat, 1px border, small radius, no shadow, header separated by a border.

### Button
| Variant | Style |
|---|---|
| Primary | `bg-interactive (indigo) text-white`, hover darker indigo |
| Secondary | `bg-white border border-border`, hover `bg-subtle` |
| Ghost | transparent, hover `bg-subtle` |
| Danger | soft red surface + danger text, or red primary |
| Sizes | `h-8` (sm), `h-9` (default), `h-10` (lg); `rounded-md`/`rounded-lg`; `text-sm` |
| Focus | 2px indigo ring |

### Input / Select / Textarea
- `h-10`, `rounded-lg`, white bg, 1px `border-base`
- Placeholder `fg-muted`
- Focus: 1px `border-strong` + indigo ring (2px)
- Disabled: `bg-subtle` + `fg-muted`

### Table (the crown jewel)
- Dense: `py-2`–`py-3` rows, `px-4` cells
- `text-sm`; header cells = micro-labels (uppercase, `fg-subtle`)
- Hairline row dividers (`border-b border-border`)
- Right-aligned tabular numbers
- No card wrapper by default; sits directly on canvas or inside a plain container
- Hover row: `bg-subtle`
- Actions column: icon buttons (ghost), visible on hover

### Badge / Status pill
- `text-xs`, `rounded-full` or `rounded-md`
- Muted: `bg-subtle text-fg-subtle`
- Tinted (success/danger/warning/info): soft bg + darker fg (e.g.
  `bg-emerald-50 text-emerald-700`)

### Dialog / Modal
- Centered on a dimmed overlay (`bg-black/40` + backdrop-blur)
- White `rounded-xl`, 1px border, soft shadow
- Header: title (semibold) + close X, bottom border
- Body: `p-6`
- Footer: right-aligned actions, top border

### Dropdown / Popover
- White, `rounded-lg`, 1px border, **soft shadow** (floating = allowed)
- Items: `h-9`, `text-sm`, hover `bg-subtle`
- Separator: 1px hairline
- Checked/selected item: subtle tint

### Empty state
- Centered, airy (`py-16`+): gray icon (48px), title (semibold), one-line
  description (`fg-subtle`), one primary button

### Tabs
- Underline style: active tab = `fg-base` + 2px indigo underline; inactive =
  `fg-subtle`; hover = `fg-base`

### Skeleton
- `animate-pulse`, `bg-subtle` (gray blocks)

---

## 7. Iconography

- One icon set (`@medusajs/icons` — 24px grid, 1.5px stroke, consistent fill
  style). Single color, inherits `currentColor`.

---

## 8. Motion

- Subtle and short: 150–200ms, ease-out.
- Fades + micro-translations for modals/dropdowns. No bounce, no float.

---

## 9. Do / Don't

| Do | Don't |
|---|---|
| Use indigo for the one accent only | Rainbow colors / multiple accents |
| Use borders + canvas contrast for depth | Card drop shadows everywhere |
| Uppercase micro-labels for sections | Purple/blue default links everywhere |
| Dense, readable tables | Card-per-row layouts for lists |
| One icon set | Mixing icon sets |
| Inter, tight tracking | Decorative letter-spacing on body |
