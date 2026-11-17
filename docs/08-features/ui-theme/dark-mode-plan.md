> Status: plan · Created: 2026-11-17 · Companion to [theme-color-plan.md](./theme-color-plan.md)

# Dark mode — component inventory and design plan

A pro dark mode for the product, built component by component from the real CSS in the
codebase — not a filter, not an inverted palette, and not a guessed grey.

Scope is **desktop only**: the learner shell (`/orgs/<slug>/…`) and the dashboard
(`/orgs/<slug>/dash/…`). Mobile shells are the old untouched ones and stay out of scope.

---

## 1. What makes this dark mode "pro"

The design language we already have is **neutral surfaces + hairline borders + soft
shadow**. Dark mode keeps that language; it does not replace it with a different one.

Three rules carry the whole thing:

1. **Elevation in light mode is shadow. Elevation in dark mode is lightness + border.**
   A shadow cannot be seen on a dark surface, so the card must be lifted by being lighter
   than the page and outlined by a hairline. We keep the *same* visual step size — see §4.
2. **No pure black, no pure white.** The darkest surface is `#09090b` (zinc-950) and the
   brightest text is `#fafafa` (zinc-50). Pure `#000` / `#fff` cause halation on OLED and
   make the interface look like a terminal rather than a product.
3. **Accents are re-tuned, never reused verbatim.** A brand colour that reads well on white
   usually screams on `#18181b`. Each mode gets its own brand colour (see §7), which is why
   Branding → Theme is split into **Light theme** and **Dark theme**.

---

## 2. Architecture: token-first, then component classes

The codebase currently mixes three levels. We fix dark mode at level 2 and migrate level 3
into it — we do **not** hand-write a `dark:` class per element (that is 6,000 places, and
every one of them can drift).

| Level | What it is | Example | Dark strategy |
|---|---|---|---|
| 1. Primitives | raw palette | `#ffffff`, `#18181b` | never used directly in components |
| 2. Semantic tokens | named roles, already defined in `globals.css` | `--color-ui-bg-base`, `--color-ui-border-base`, `--color-ui-fg-subtle` | **redefined once inside `.dark`** |
| 3. Component classes | Tailwind classes in JSX | `bg-white`, `border-gray-100`, `text-gray-900` | migrated to level-2 utilities (`bg-ui-bg-base`, `border-ui-border-base`, `text-ui-fg-base`) |

Because Tailwind v4 emits each `@theme` entry as a CSS custom property and the utilities
read it via `var()`, redefining the property inside `.dark` recolours every consumer at once.
No `dark:` variants are needed for anything that speaks tokens.

**Light fidelity rule (important).** Anything hard-coded to the Tailwind grey ramp keeps its
existing class and gains a `dark:` variant — it is **not** swapped to a `ui-*` token. The two
ramps differ slightly (`text-gray-900` is `#111827`, `--color-ui-fg-base` is `#18181b`), so a
wholesale token swap would nudge the light theme. `dark:` variants are append-only and leave
the light theme pixel-identical. Token migration is reserved for components that already use
tokens.

**The unavoidable truth:** roughly 1,200 `bg-white`, ~460 `bg-gray-50` and ~840 `text-gray-400`
usages are hard-coded — a large share of them inside files that are not used (legacy mobile,
dead pages). Those are touched **only inside in-scope files**, by appending `dark:` variants,
and every migrated element is checked against §5 before it is changed.

### Dark token values (level 2)

These go into a new `.dark` block in `apps/web/styles/globals.css`. The light values stay
exactly as they are today.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-canvas` | `#fafafa` | `#09090b` | page background |
| `--color-ui-bg-base` | `#ffffff` | `#18181b` | cards, panels, popovers |
| `--color-ui-bg-base-hover` | `#f4f4f5` | `#27272a` | card / row hover |
| `--color-ui-bg-subtle` | `#fafafa` | `#111113` | sidebars, table headers |
| `--color-ui-bg-subtle-hover` | `#f4f4f5` | `#1f1f23` | sidebar item hover |
| `--color-ui-bg-subtle-pressed` | `#e4e4e7` | `#2b2b30` | sidebar item press |
| `--color-ui-bg-component` | `#fafafa` | `#18181b` | inner wells (upload rows) |
| `--color-ui-bg-component-hover` | `#f4f4f5` | `#27272a` | inner well hover |
| `--color-ui-bg-component-pressed` | `#e4e4e7` | `#3f3f46` | inner well press |
| `--color-ui-bg-field` | `#fafafa` | `#18181b` | inputs, selects |
| `--color-ui-bg-field-hover` | `#f4f4f5` | `#27272a` | input hover |
| `--color-ui-bg-disabled` | `#f4f4f5` | `#1f1f23` | disabled fields |
| `--color-ui-bg-switch-off` | `#e4e4e7` | `#3f3f46` | switch track |
| `--color-ui-fg-base` | `#18181b` | `#f4f4f5` | headings, primary text |
| `--color-ui-fg-subtle` | `#52525b` | `#d4d4d8` | body text |
| `--color-ui-fg-muted` | `#71717a` | `#a1a1aa` | secondary text, subtitles |
| `--color-ui-fg-disabled` | `#a1a1aa` | `#62626b` | disabled text |
| `--color-ui-fg-on-color` | `#ffffff` | `#0b0b0d` | text on light brand fills |
| `--color-ui-border-base` | `#e4e4e7` | `#27272a` | every hairline |
| `--color-ui-border-strong` | `#d4d4d8` | `#3f3f46` | emphasised borders |
| `--color-ui-border-loud` | `rgba(24,24,27,1)` | `rgba(250,250,250,1)` | hard outline |
| `--color-ui-bg-overlay` | `rgba(24,24,27,0.4)` | `rgba(0,0,0,0.6)` | modal scrim (needs more weight on dark) |
| `--color-ui-button-neutral` | `#ffffff` | `#27272a` | secondary button |
| `--color-ui-button-neutral-hover` | `#f4f4f5` | `#3f3f46` | secondary hover |
| `--color-ui-button-neutral-pressed` | `#e4e4e7` | `#52525b` | secondary press |
| `--color-ui-button-transparent-hover` | `#f4f4f5` | `#27272a` | ghost hover |
| `--color-ui-button-transparent-pressed` | `#e4e4e7` | `#3f3f46` | ghost press |
| `--color-ui-button-inverted` | `#27272a` | `#fafafa` | inverted button (inverts in dark) |
| `--color-ui-button-inverted-hover` | `#3f3f46` | `#e4e4e7` | inverted hover |
| `--color-ui-tag-neutral-bg` | `#f4f4f5` | `#27272a` | neutral badge |
| `--color-ui-tag-neutral-text` | `#52525b` | `#d4d4d8` | neutral badge text |
| `--color-ui-tag-neutral-border` | `#e4e4e7` | `#3f3f46` | neutral badge border |
| `--color-ui-tag-neutral-icon` | `#a1a1aa` | `#a1a1aa` | neutral badge icon |
| `--color-ui-border-menu-top` | `#e4e4e7` | `#27272a` | menu outer ring |
| `--color-ui-border-menu-bot` | `#ffffff` | `#333338` | menu inner ring |

Shadcn HSL tokens (`--background`, `--card`, `--popover`, `--muted`, `--border`, …) already
have a `.dark` block; it is harmonised to the same zinc steps so shadcn and Medusa surfaces
agree instead of sitting on two different greys.

**Shadow utilities do not change values — they change role.** `shadow-sm`, `shadow-lg`,
`nice-shadow` and `shadow-borders-base` are redefined in `.dark` as a hairline ring only
(`0 0 0 1px #27272a`) with the drop shadow removed. That keeps every existing call site
honest without touching 40 files.

The `@media (prefers-color-scheme: dark)` block at `globals.css:576`, which today forces
black text on `#fbfbfb`, is deleted — it is the only thing currently preventing a system
dark preference from doing anything.

---

## 3. Palette derivation

Zinc, because the product is already zinc-based (`#18181b` ink, `#f4f4f5`, `#e4e4e7`), so
the dark mode is the *same* design language and not a second one.

| Step | Hex | Used for |
|---|---|---|
| zinc-950 | `#09090b` | page canvas |
| zinc-925 | `#111113` | sidebars, table header |
| zinc-900 | `#18181b` | cards, inputs, popovers |
| zinc-850 | `#1f1f23` | sidebar hover, disabled |
| zinc-800 | `#27272a` | borders, secondary button, badge |
| zinc-700 | `#3f3f46` | strong border, switch off, hover |
| zinc-600 | `#52525b` | disabled text |
| zinc-500 | `#71717a` | muted text |
| zinc-400 | `#a1a1aa` | body text |
| zinc-300 | `#d4d4d8` | badge text |
| zinc-100 | `#f4f4f5` | — |
| zinc-50 | `#fafafa` | headings, primary text |

Contrast, checked with `getContrastRatio()` from `services/utils/ts/colorUtils.ts`:

| Pair | Ratio | Verdict |
|---|---|---|
| `#fafafa` on `#18181b` | 15.6:1 | AAA |
| `#a1a1aa` on `#18181b` | 7.2:1 | AAA |
| `#8b8b93` on `#18181b` | 5.4:1 | AA |
| `#71717a` on `#18181b` | 4.1:1 | AA large only — never use for body copy |
| `#27272a` border on `#18181b` | 1.3:1 | decorative only, correct for a hairline |
| `#3f3f46` border on `#18181b` | 1.9:1 | interactive boundaries |

The muted-text row above is the single most important correction to make: today the product
uses `text-gray-400` (#9ca3af) for a lot of *body* copy, and its dark counterpart `#8b8b93`
must be reserved for labels and meta. Body text goes to `#a1a1aa` or brighter.

---

## 4. The card rule — why the current border works and how it survives

This is the design decision the whole plan hangs on.

Light mode, today:

```
page  #fafafa
  card  #ffffff        ← +5% lighter than the page
    border #f3f4f6     ← hairline, invisible at a glance, defines the edge
    shadow-sm          ← the actual "lift"
```

Dark mode:

```
page  #09090b
  card  #141417        ← 1.08:1 above the page (GitHub: 1.09:1)
    border #2f2f35     ← 1.38:1 above the card (GitHub: 1.42:1)
    shadow-sm          ← a soft shadow, NOT a second ring
    well  #0d0d0f      ← inner blocks step *down*, so they read as recessed
```

The rule: **the border separates, the fill only hints.** Two earlier attempts got this
wrong in opposite directions:

| Attempt | Card fill | Border | What went wrong |
|---|---|---|---|
| v1 | `#18181b` (1.34:1) | `#27272a` + a shadow ring of the same colour | border and ring merged into a 2px edge that was indistinguishable from the fill |
| v2 | `#27272a` (but 1.34:1 vs page) | `#3f3f46` | every card became a bright grey slab; the toolbar button was brighter than the cards |
| **v3** | `#141417` (1.08:1) | `#2f2f35` (1.38:1) | matches GitHub/Linear proportions, and the shadow ring is gone |

Measured against the references: GitHub's dark card is only 1.09:1 above its canvas, and its
border is 1.42:1 above the card. Ours is 1.08:1 and 1.38:1 — the same relationship. A large
fill delta is what makes dark cards look like grey blocks; a crisp hairline is what makes them
look separated.

### The sidebar active pill

The pill is the same problem in miniature, and the current code already solves it correctly:

```ts
'--sidebar-active-bg':     sidebarBrand ? brand : '#ffffff',
'--sidebar-active-border': sidebarBrand ? brand : '#f3f4f6',
```

When the brand fill is **off**, the pill is `#ffffff` + `#f3f4f6` — white on the `#fafafa`
sidebar with a hairline. When the brand fill is **on**, background and border are the same
colour, so the pill is defined purely by its fill against the sidebar.

In dark mode the neutral pair becomes:

```ts
'--sidebar-active-bg':     sidebarBrand ? darkBrand : '#27272a',
'--sidebar-active-border': sidebarBrand ? darkBrand : '#3f3f46',
'--sidebar-active-fg':     sidebarBrand ? darkBrandFg : '#fafafa',
```

Same behaviour, one step up the zinc ladder. This is exactly why the "no border effect when
brand is on" observation is *correct* behaviour, not a bug — the fill replaces the border in
both modes.

### Utility ladder (what `dark:` class maps to what)

The six steps are declared once in `@theme` as `--color-dk-*` colours so components read a
named step instead of a hard-coded zinc value, and the whole ladder can be retuned in one
place. `.dark` tokens carry the same values for token-driven UI.

| Role | Light class | Dark variant | Value | Ratio |
|---|---|---|---|---|
| Page | `--color-canvas` | — | `#09090b` | — |
| Card / panel / popover | `bg-white` / `bg-ui-bg-base` | `dark:bg-dk-card` | `#141417` | 1.08:1 vs page |
| Recessed well / field / thumbnail | `bg-gray-50`, `bg-gray-100` | `dark:bg-dk-inset` | `#0d0d0f` | 1.06:1 vs card |
| Card hairline | `border-gray-100` | `dark:border-dk-line` | `#2f2f35` | 1.38:1 vs card |
| Emphasised border / card hover | `border-gray-200` | `dark:border-dk-line-strong` | `#41414a` | 1.95:1 vs card |
| Row hover / secondary button / chip | `hover:bg-gray-50` | `dark:hover:bg-dk-raised` | `#1d1d21` | 1.09:1 vs card |
| Progress track / inactive stepper | `bg-gray-200` | `dark:bg-dk-track` | `#26262b` | — |
| Heading / title | `text-gray-900` | `dark:text-dk-fg-1` | `#f4f4f5` | 16.6:1 |
| Body | `text-[#6B7280]` | `dark:text-dk-fg-2` | `#d4d4d8` | 12.5:1 |
| Secondary | `text-gray-500` | `dark:text-dk-fg-3` | `#a1a1aa` | 7.0:1 |
| Muted metadata | `text-gray-400` | `dark:text-dk-fg-4` | `#85858f` | 4.9:1 |
| Disabled | — | `dark:text-dk-fg-5` | `#62626b` | 3.0:1 |

Five text levels are deliberate: heading → body → secondary → muted → disabled. Never pure
white: it glares on a dark surface and leaves the lower levels nowhere to go, so every card
reads as one flat wall.

Elevation: `shadow-sm` / `shadow` / `shadow-md` are now a soft shadow only. They used to draw a
1px ring in the same colour as the border, which turned every bordered card into a 2px
outlined box. Large elevations (`lg` and up, all `shadow-elevation-*`) keep the 1px ring
because a modal needs a hard edge.

---

## 5. Component inventory

Legend: **Light recipe** is the code as it exists. **Dark** is the target. `→` means a
token-driven component (already reads a `ui-*` token, so it needs no edit). A `dark:` entry
means the light class stays and a variant is appended. "Verified" means the file was read
during this audit.

### 5.0 Class mapping cheat-sheet

Append-only. The light class is never removed, so the light theme cannot shift.

| Existing light class | Append |
|---|---|
| `bg-white` | `dark:bg-zinc-900` |
| `bg-gray-50`, `bg-gray-50/50`, `bg-gray-50/30` | `dark:bg-zinc-800/40` |
| `bg-gray-100` | `dark:bg-zinc-800` |
| `bg-gray-200` | `dark:bg-zinc-700` |
| `border-gray-100` | `dark:border-zinc-800` |
| `border-gray-200` | `dark:border-zinc-700` |
| `border-gray-300` | `dark:border-zinc-600` |
| `text-gray-900` | `dark:text-zinc-100` |
| `text-gray-800`, `text-gray-700` | `dark:text-zinc-200` |
| `text-gray-600` | `dark:text-zinc-300` |
| `text-gray-500` | `dark:text-zinc-400` |
| `text-gray-400` | `dark:text-zinc-400` |
| `text-gray-300` | `dark:text-zinc-600` |
| `hover:bg-gray-50`, `hover:bg-gray-100` | `dark:hover:bg-zinc-800` |
| `hover:text-gray-600`, `hover:text-gray-700` | `dark:hover:text-zinc-200` |
| `divide-gray-100` | `dark:divide-zinc-800` |
| `ring-black/5` | `dark:ring-white/10` |
| `placeholder:text-gray-400` | `dark:placeholder:text-zinc-500` |

Two rules that override the table: **body copy never goes below `zinc-400`**, and **anything
already using a `ui-*` token or a `shadow-*` utility is left alone** — the token layer and the
shadow-as-ring rule already handle it.

### 5.1 Layout shells

| Element | Light (verified) | Dark |
|---|---|---|
| Page canvas | `backgroundColor: 'var(--color-canvas)'` | token → `#09090b`, no code change |
| Learner shell container | `flex min-h-screen` | unchanged |
| Dashboard container | `flex flex-col w-full min-h-dvh relative isolate` | unchanged |
| Dashboard sidebar | `border-e border-gray-200 bg-ui-bg-subtle` | `border-e border-ui-border-base bg-ui-bg-subtle` (token handles both) |
| `AdminTopBar` | `bg-ui-bg-base` family | token |

Files: `app/orgs/[orgslug]/(withmenu)/layout.tsx`, `app/orgs/[orgslug]/dash/ClientAdminLayout.tsx`.

### 5.2 Sidebars

| Part | Light (verified) | Dark |
|---|---|---|
| Shell | `border-e border-gray-200 bg-ui-bg-subtle` | → `border-ui-border-base bg-ui-bg-subtle` |
| Nav base | `text-ui-fg-subtle hover:bg-ui-bg-subtle-hover` | token |
| Nav active label | `text-ui-fg-base` | token |
| Active pill | `--sidebar-active-*` | new dark values from §4 |
| Collapse button | `hover:bg-ui-bg-subtle-hover` | token |
| Logo placeholder square | `bg-ui-bg-base text-ui-fg-muted shadow-borders-base` | token + ring |
| "collapse" divider | `border-t border-gray-200` | → `border-ui-border-base` |
| Tooltip | `bg-ui-bg-base shadow-elevation-card-rest text-ui-fg-base` | token + ring |

Files: `components/Objects/Menus/UserLeftMenu.tsx`, `components/Dashboard/Menus/DashLeftMenu.tsx`,
`components/Objects/Account/AccountSidebar.tsx`, `components/Objects/Menus/OrgMenu.tsx`.

### 5.3 Section cards (settings / edit pages) — the highest-volume pattern

```tsx
className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
```

| Part | Light | Dark |
|---|---|---|
| Surface | `bg-white` | append `dark:bg-zinc-900` |
| Border | `border border-gray-100` | append `dark:border-zinc-800` |
| Radius | `rounded-xl` | unchanged |
| Shadow | `shadow-sm` | unchanged — redefined as a 1px ring in `.dark` |
| Section title | `text-sm font-semibold tracking-wide uppercase text-gray-500` | append `dark:text-zinc-400` |
| Row label | `text-sm font-medium text-gray-700` | append `dark:text-zinc-200` |
| Row description | `text-xs text-gray-400` | append `dark:text-zinc-500` |
| Inner row / upload well | `border border-gray-200 rounded-xl bg-gray-50/50` | append `dark:border-zinc-700 dark:bg-zinc-800/40` |
| Divider inside card | `border-b border-gray-100` | append `dark:border-zinc-800` |

Verified in: `OrgEditBranding.tsx`, `OrgEditSEO.tsx`, `OrgEditDomains.tsx`,
`OrgEditAPIAccess/APIDocumentation.tsx`, `OrgAuditLogs.tsx`, all `CommunityEdit*.tsx`,
all `EditCollection*.tsx`, `NotificationsManagement.tsx`, and the course/podcast edit pages.
This one card recipe accounts for roughly forty files.

### 5.4 Content cards

All four thumbnail cards share the same shell, verified:

```tsx
className="flex flex-col h-full bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
```

| Part | Light (verified) | Dark |
|---|---|---|
| Shell | `bg-white border border-gray-100 rounded-xl shadow-sm` | append `dark:bg-zinc-900 dark:border-zinc-800` |
| Title | `text-[15px] font-semibold text-gray-900` | append `dark:text-zinc-100` |
| Description | `text-[13px] text-[#6B7280]` | append `dark:text-zinc-400` |
| Meta row | `text-xs text-gray-400` (`CardMetaRow`) | append `dark:text-zinc-500` |
| Image placeholder | `bg-gray-100`, icon `text-gray-300` | append `dark:bg-zinc-800`, `dark:text-zinc-600` |
| Store card | `bg-white rounded-xl nice-shadow` (border only) | append `dark:bg-zinc-900` |

Files: `components/Objects/Thumbnails/CourseCard.tsx`, `PodcastCard.tsx`,
`CollectionCard.tsx`, `CommunityCard.tsx`, `CardMetaRow.tsx`,
`app/orgs/[orgslug]/(withmenu)/store/store.tsx`.

### 5.5 Tabs and page tab containers

| Part | Light (verified) | Dark |
|---|---|---|
| Tab strip rule | `border-b border-gray-200` | → `border-ui-border-base` |
| Inactive tab | `border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300` | → `border-transparent text-ui-fg-muted hover:text-ui-fg-base hover:border-ui-border-strong` |
| Active tab | `border-brand text-gray-900` | `border-brand` (dark brand) + `text-ui-fg-base` |
| Loading spinner | `border-b-2 border-gray-900` | → `border-ui-fg-base` |

Files: `app/orgs/[orgslug]/(withmenu)/user/[username]/UserProfileClient.tsx`.

### 5.6 Course detail page

| Element | Light (verified) | Dark |
|---|---|---|
| Hero fallback gradient | `from-indigo-50 via-white to-gray-100 ring-black/5` | dark: `from-zinc-900 via-zinc-900 to-zinc-800 ring-white/5` |
| Hero placeholder tile | `bg-white shadow-sm ring-black/5`, icon `text-indigo-400` | `bg-ui-bg-base ring-white/5`, icon `text-brand` |
| Page title | `text-ui-fg-base` | token |
| Lead paragraph | `text-ui-fg-subtle` | token |
| Meta badges | Medusa `grey` badge | token |
| Sidebar cards | `bg-white rounded-xl border border-gray-100 shadow-sm p-6` | §5.3 |
| Sidebar card heading | `text-gray-500` | → `text-ui-fg-muted` |
| Sidebar body row | `text-sm text-gray-600`, icon `text-gray-400` | → `text-ui-fg-subtle`, `text-ui-fg-muted` |
| Progress track | `bg-gray-100 rounded-full` | → `bg-ui-bg-component-pressed` (`#3f3f46`) |
| Progress fill | `bg-brand` | `bg-brand` reading the **dark** brand |
| Instructor avatar fallback | `bg-gray-200 text-gray-400` | → `bg-ui-bg-component-pressed text-ui-fg-muted` |
| Activity type badge | `bg-neutral-100 text-neutral-500` | → `bg-ui-tag-neutral-bg text-ui-tag-neutral-text` |
| "only available in X" notice | `border-amber-100 bg-amber-50 text-amber-800` | dark amber: `border-amber-500/25 bg-amber-500/10 text-amber-300` |

Files: `app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/course.tsx`.

### 5.7 Inputs and fields

| Element | Light (verified) | Dark |
|---|---|---|
| Search input | `bg-white shadow-borders-base rounded-md placeholder:text-gray-400` | → `bg-ui-bg-field shadow-borders-base placeholder:text-ui-fg-muted text-ui-fg-base` |
| Search icon | `text-gray-400` | → `text-ui-fg-muted` |
| Hex input (branding) | `bg-white border border-gray-100 shadow-sm font-mono` | → `bg-ui-bg-field border-ui-border-base` |
| Textarea / `Input` | shadcn `border-input bg-background` | shadcn dark tokens (already present, harmonise) |
| Select trigger | `bg-gray-50 border-none` | → `bg-ui-bg-component` |
| Upload row | `border border-gray-200 rounded-xl bg-gray-50/50` | → `border-ui-border-base bg-ui-bg-component` |
| Switch off track | `bg-ui-bg-switch-off` | token |
| Switch thumb | `bg-white shadow-sm` | `bg-zinc-100` thumb, no shadow |
| Checkbox | shadcn `peer-checked:bg-gray-500 border-gray-300 bg-white` | `peer-checked:bg-ui-fg-base border-ui-border-strong bg-ui-bg-field` |

`shadow-borders-base` is redefined in `.dark` as `0 0 0 1px #27272a` (drop shadow removed),
so every field that uses it gains the correct dark hairline without per-file edits.

### 5.8 Buttons

| Variant | Light (verified) | Dark |
|---|---|---|
| Primary | `bg-brand text-brand-fg hover:bg-brand-hover` | same classes, **dark brand tokens** |
| Secondary | `bg-ui-button-neutral shadow-borders-base` | tokens |
| Ghost / transparent | `hover:bg-ui-button-transparent-hover` | tokens |
| Inverted | `bg-ui-button-inverted text-white` | tokens (inverts) |
| Danger | `bg-ui-button-danger` | unchanged value, keep semantic red |
| Save strip — saved | `bg-white text-gray-600 border-gray-200` | → `bg-ui-bg-base text-ui-fg-muted border-ui-border-base` |
| Save strip — unsaved | `bg-brand text-brand-fg border-brand` | dark brand |
| Filter icon button | `bg-white hover:bg-gray-50 shadow-borders-base` | → `bg-ui-bg-base hover:bg-ui-bg-base-hover` |
| Pagination active | `bg-brand text-brand-fg` | dark brand |
| Auth primary | `authPrimaryBtnClass` → `bg-brand` | dark brand |

Files: `components/ui/button.tsx`, `components/ui/icon-button.tsx`,
`components/Auth/authStyles.ts`, every save strip in `Dashboard/Pages/**`.

### 5.9 Dropdowns, popovers, tooltips, command palette

| Element | Light (verified) | Dark |
|---|---|---|
| `DropdownMenuContent` | `bg-white` | → `bg-ui-bg-base border-ui-border-base` |
| Item hover | Medusa default `hover:bg-ui-bg-subtle-hover` | token |
| Check marker | `text-indigo-600` | → `text-brand` (single signal, not a second hue) |
| Tooltip | `bg-ui-bg-base shadow-elevation-card-rest text-ui-fg-base` | token + ring |
| Popover | shadcn `bg-popover` | shadcn dark token |
| Search palette | `bg-white` cmdk surface | → `bg-ui-bg-base`, input `bg-ui-bg-field`, result hover `bg-ui-bg-base-hover` |
| Palette overlay | `bg-black/50` | `bg-black/65` |

Files: `components/ui/dropdown-menu.tsx`, `components/ui/tooltip.tsx`,
`components/Objects/Modals/SearchModal.tsx`,
`components/Dashboard/CommandPalette/CommandPalette.tsx`.

### 5.10 Tables

| Part | Light (verified) | Dark |
|---|---|---|
| Table text | `text-ui-fg-subtle` | token |
| Header row | `bg-ui-bg-subtle border-y border-ui-border-base` | token (`#111113`) |
| Body row | `bg-ui-bg-base hover:bg-ui-bg-base-hover border-b` | token |
| Selected row | `bg-ui-bg-subtle` | → `bg-ui-bg-subtle-pressed` so selection is visible on dark |
| Footer | `bg-ui-bg-subtle border-t` | token |
| Name cell | `font-medium text-gray-900` | → `text-ui-fg-base` |
| Data cell | `text-gray-500` | → `text-ui-fg-subtle` |
| Date/meta cell | `text-[13px] text-gray-400` | → `text-ui-fg-muted` |
| Row action | `hover:bg-gray-100 text-gray-400 hover:text-gray-600` | → `hover:bg-ui-bg-base-hover text-ui-fg-muted hover:text-ui-fg-base` |
| Header cell | `bg-ui-bg-subtle text-ui-fg-muted` | token |

Files: `components/ui/table.tsx`, `components/Dashboard/Pages/Users/OrgUsers/OrgUsers.tsx`,
`components/Dashboard/Pages/Org/OrgAuditLogs/OrgAuditLogs.tsx`.

Note: `selected row = bg-ui-bg-subtle` is invisible in dark because the row is already
`bg-ui-bg-base`; the dark value must skip a step to `subtle-pressed`.

### 5.11 Badges and status

| Variant | Light (verified token) | Dark |
|---|---|---|
| Neutral (`grey`) | `#f4f4f5` / `#52525b` | `#27272a` / `#d4d4d8` |
| Green | `#d1fae5` / `#065f46` | `rgba(16,185,129,0.14)` / `#6ee7b7` |
| Red | `#ffe4e6` / `#9f1239` | `rgba(244,63,94,0.14)` / `#fda4af` |
| Blue | `#dbeafe` / `#1e40af` | `rgba(59,130,246,0.16)` / `#93c5fd` |
| Orange | `#ffedd5` / `#9a3412` | `rgba(249,115,22,0.16)` / `#fdba74` |
| Purple | `#ede9fe` / `#5b21b6` | `rgba(167,139,250,0.16)` / `#c4b5fd` |
| Status dot verified/unverified | `bg-green-500` / `bg-red-500` | unchanged (semantic) |

Neutral badges move to tokens; coloured badges switch from pale solid fills to a **low-alpha
tint of the same hue** — a pale `#d1fae5` block would glow on `#18181b`.

### 5.12 Progress and trail

| Element | Light (verified) | Dark |
|---|---|---|
| Progress track | `bg-gray-100` | → `bg-ui-bg-component-pressed` |
| Progress fill | `bg-brand` | dark brand |
| Empty state container | `border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30` | → `border-ui-border-base bg-ui-bg-subtle/40` |
| Empty state icon circle | `bg-white rounded-full nice-shadow` | → `bg-ui-bg-base rounded-full shadow-borders-base` |
| Empty state icon | `text-gray-300` | → `text-ui-fg-disabled` |
| Empty state title | `text-gray-600` | → `text-ui-fg-subtle` |
| Empty state subtitle | `text-gray-400` | → `text-ui-fg-muted` |
| Trail course card | card recipe (§5.4) | same |

Files: `app/orgs/[orgslug]/(withmenu)/trail/trail.tsx`,
`components/Pages/Trail/TrailCourseCard.tsx`.

### 5.13 Charts and analytics

Charts are rendered by Recharts, which writes SVG presentation attributes — CSS `var()`
does not resolve there. The theme is already computed in JS, which is the right place to
extend.

| Part | Light (in `chartTheme.ts`) | Dark |
|---|---|---|
| Grid lines | `#e4e4e7` | `#27272a` |
| Axis ticks | `#71717a` | `#8b8b93` |
| Tooltip surface | `#ffffff` | `#18181b` |
| Tooltip border | `#e4e4e7` | `#3f3f46` |
| Tooltip text | `#18181b` | `#fafafa` |
| Categorical ramp | brand mixed toward white | brand mixed toward white **and lifted in luminance** so it holds on dark |
| Positive / negative | emerald / rose | same hue, +8% lightness |

Files: `components/Analytics/chartTheme.ts` and its consumers.

### 5.14 Modals and dialogs

| Part | Light | Dark |
|---|---|---|
| Scrim | `bg-black/50` | `bg-black/65` |
| Panel | `bg-white rounded-2xl nice-shadow` | → `bg-ui-bg-base`, ring token |
| Title | `text-gray-900` | → `text-ui-fg-base` |
| Body | `text-gray-600` | → `text-ui-fg-subtle` |
| Footer rule | `border-t border-gray-100` | → `border-ui-border-base` |

Files: `components/Objects/StyledElements/Modal/Modal.tsx`,
`components/Objects/Modals/**`, `components/Dashboard/Onboarding/WelcomeModal.tsx`.

### 5.15 Auth pages

| Part | Light (verified) | Dark |
|---|---|---|
| Split shell | `bg-gray-50` | `bg-transparent` (page canvas — the inset well sits *below* the page) |
| Left artwork panel | uploaded image, no overlay | unchanged — artwork is not themed |
| Fallback gradient | `#202020 → #000000` | unchanged (already dark) |
| Form card | `bg-white` | `bg-dk-card` + `dark:border dark:border-dk-line` (the shadow is invisible on dark, the hairline carries the separation) |
| Field | `bg-white border-gray-200 text-gray-900` | `bg-dk-inset border-dk-line-strong text-dk-fg-1`, placeholder `dk-fg-4`; autofill neutralised by `.dark .auth-field:-webkit-autofill` |
| Label | `text-gray-700` | `dk-fg-2` |
| Muted link | `text-gray-500` | `dk-fg-3`, hover `dk-fg-1` |
| "or" divider | `border-t border-gray-100`, chip `bg-white text-gray-400` | `border-dk-line`, chip `bg-dk-card text-dk-fg-3` |
| Google / SSO button | `authSecondaryBtnClass` (white on white card + border) | `bg-dk-card` + `border-dk-line-strong` + `dk-fg-2` |
| Alert (error / success / warning / info) | `bg-*-50 border-*-200 text-*-900` | `bg-*-500/10 border-*-500/30 text-*-200`; info is `dk-raised` on `dk-line-strong` |
| State icon circle (check / warning) | `bg-gray-100` | `bg-dk-raised` — the inset is below the card and disappears |
| Terms checkbox | `border-gray-300`, checked `bg-gray-900 text-white` | checked `bg-dk-fg-1 border-dk-fg-1 text-dk-inset` |
| Submit | `bg-brand text-brand-fg` | dark brand |

Files: `app/auth/**` (login, signup / OpenSignup / InviteOnlySignUp, forgot,
reset, verify-email, sso/callback, callback/google, token-exchange),
`components/Auth/*` (`authStyles.ts`, `AuthAlert`, `AuthLayout`, `CheckEmailState`,
`PasswordStrengthIndicator`, `AuthBrandingPanel`).

### 5.16 Media players

| Part | Light | Dark |
|---|---|---|
| Podcast player bar | `bg-white border-t border-gray-200` | → `bg-ui-bg-base border-ui-border-base` |
| Player controls | `text-gray-600` | → `text-ui-fg-subtle` |
| Video chrome | neutral dark already | **unchanged** — it sits on video and must not fight it |
| Episode card | card recipe | §5.4 |

Files: `components/Objects/Podcasts/EpisodePlayer.tsx`,
`components/Objects/Activities/Video/CloudflarePlayer.tsx` (chrome untouched).

### 5.17 Miscellaneous

| Element | Light | Dark |
|---|---|---|
| Breadcrumbs | `text-ui-fg-muted`, active `text-ui-fg-base` | tokens |
| Page `h1` | `text-ui-fg-base` | token |
| Toasts | `bg-white` react-hot-toast | → `bg-ui-bg-base text-ui-fg-base` |
| Board canvas surface | `bg-white` block cards | → `bg-ui-bg-base`; canvas itself keeps its own neutral |
| Feature-disabled view | card recipe | §5.3 |
| Onboarding bar | `bg-white` card + `bg-brand` CTAs | §5.3 + dark brand |

---

## 6. Explicitly unchanged

These never take a dark value; they carry meaning or live on media:

- Destructive / success / warning semantics (`#e11d48`, emerald, amber).
- Video player chrome and controls.
- Certificate artwork.
- Uploaded images, thumbnails, banners, auth artwork.
- Brand logos and third-party marks (Chargily, Cloudflare, Discord, Google, SSO).
- Code editor (`ProseMirror` / Monaco) theming — separate concern.
- The upload/auth left panel fallback gradient, which is already dark.

---

## 7. Brand colour per mode

Branding → Theme is **two section cards, Light theme and Dark theme**, stacked in that
order. Each carries the same four controls (Primary, Hover, Text & Icons, sidebar switch)
and its own live "Aa" preview with the contrast read-out. There is no second save button:
both cards live in the Theme section and are written by the **single Branding action row**,
exactly like the one card today. Editing the dark card while the app is in light mode only
stores config and updates that card's previews — nothing on the light UI moves.

Config keys (flat, alongside the existing ones):

```
customization.general.color            existing — light primary
customization.general.brand_fg         existing — light foreground
customization.general.brand_hover      existing — light hover
customization.general.brand_sidebar    existing — light sidebar fill

customization.general.dark_color           dark primary
customization.general.dark_brand_fg        dark foreground
customization.general.dark_brand_hover     dark hover
customization.general.dark_brand_sidebar   dark sidebar fill
```

Resolution: the shell reads the pair that matches the active mode. When a dark key is empty,
`getBrandStyle()` **derives** it from the light value with a documented transform
(mix toward white ~22%, clamp to a luminance band) so an organization that only sets one
colour still gets a coherent dark mode. The dark card shows the derived value as a live
preview with its WCAG ratio, exactly like the light card shows its resolved value.

Per-card fallback, matching the light behaviour: a card with no colour configured resolves
to the platform default for its mode — **light falls back to ink `#27272a`** (black, as
today) and **dark falls back to `#fafafa` white** with the auto-resolved ink
foreground (`#18181b`). An organization that never opens Branding therefore keeps a black
brand in light and gets a white primary button in dark, instead of a dark-on-dark one.

---

## 8. Toggle mechanism

- Cookie `lh_theme` = `light` | `dark` | `system`, plus the same value in `localStorage`
  for instant client reads.
- The root layout reads the cookie **server-side** and puts `class="dark"` on `<html>` before
  first paint. No flash, no effect-based class shuffling.
- `system` resolves with `prefers-color-scheme` on the client and is re-evaluated on change.
- Entry point: a toggle in the account sidebar and in the dashboard sidebar footer.
- Removing the `prefers-color-scheme: dark` opt-out at `globals.css:576` is part of this step.

---

## 9. Implementation phases

Each phase ships on its own and is verifiable in isolation.

| Phase | Work | Acceptance |
|---|---|---|
| **0 — Tokens** ✅ | `.dark` block with all `--color-ui-*` overrides, shadow utilities redefined as rings, `prefers-color-scheme` opt-out removed, shadcn `.dark` harmonised | Adding `class="dark"` to `<html>` recolours every token-driven surface; nothing renders black text on black |
| **1 — Toggle** ✅ mechanism | Cookie + localStorage + server-side class, system option | Reload keeps the choice; no flash; `system` follows the OS |
| **2 — Shells** ✅ | Page canvas, both sidebars, top bar, breadcrumbs | Navigation is fully dark, including the active pill |
| **3 — Section cards** ✅ | The `bg-white rounded-xl border-gray-100 shadow-sm` recipe and its inner wells, titles, descriptions, dividers | Every settings/edit page is dark with the hairline step intact |
| **4 — Content cards & lists** ✅ | Four thumbnail cards, `CardMetaRow`, store cards, trail cards, empty states, podcast detail | All listing pages and the trail are dark |
| **5 — Forms** ✅ | Search inputs, hex inputs, upload rows, selects, switches, checkboxes | Every field is legible and has a dark hover/focus |
| **6 — Buttons** ✅ | Secondary / ghost / inverted / save strips / filter buttons / pagination | Only brand buttons carry colour; all others are zinc |
| **7 — Tables** ✅ | `table.tsx` + the custom dashboard tables | Header/row/selected states are distinguishable |
| **8 — Overlays** ✅ | Dropdowns, tooltips, popovers, command palette, modals, toasts | Nothing white flashes over a dark page |
| **9 — Charts** ✅ | `isDark` branch in `useChartTheme()` | Grid, axis, tooltip and ramps are tuned for dark |
| **10 — Brand per mode** ✅ | Branding → Theme is two cards (Light theme / Dark theme) with the same four controls, saved by the single Branding action row into `dark_*` config keys; `getBrandStyle(..., mode, dark)` reads the matching pair and `deriveDarkBrand()` fills an empty dark colour | Changing Dark → Primary recolours the dark button, progress and tab underline only; light mode is unchanged |
| **11 — Audit** ◐ | Coverage audit complete across every UI-reachable page section (learner + dashboard); route-by-route contrast check via `getContrastRatio()` still pending | No unstyled surface, no contrast failure, no pure `#000` / `#fff` |

Phase 0 and 1 are invisible until the toggle exists, so they cannot regress the light theme.

---

## 10. Validation checklist

To be completed against external references before Phase 3 begins (see §11).

- [ ] Surfaces: no `#000000` and no `#ffffff` used as a *surface* anywhere in scope
- [ ] Elevation: every card has a lighter-than-page fill **and** a hairline border
- [ ] Hairlines: card border is exactly one zinc step above its surface
- [ ] Text: body copy ≥ 4.5:1, meta ≥ 4.5:1, headings ≥ 7:1
- [ ] Muted text is never used for body copy (the `text-gray-400` habit)
- [ ] Every interactive element has a defined hover, pressed and focus state
- [ ] Focus rings stay neutral (not brand, not blue)
- [ ] Semantic colours are preserved and not desaturated into meaninglessness
- [ ] Coloured badges use low-alpha tints, not pale solid fills
- [ ] Selected table rows are distinguishable from unselected rows
- [ ] Shadows: no drop shadow carries meaning in dark mode
- [ ] Images and artwork are not tinted or dimmed
- [ ] Charts: grid/axis/tooltip are re-tuned, ramps are lifted
- [ ] Both modes pass the same contrast script; brand foreground resolves per mode

---

## 11. Open items to confirm against external references

These are deliberate open questions, answered by the research pass, not guessed now:

1. Radix Colors' exact dark step assignments per role (which step maps to card vs border vs
   hover) — confirms the "one step" rule in §4 or replaces it with a two-step recommendation.
2. Whether low-alpha tint badges are preferable to solid dark-tinted badges at our sizes.
3. Material Design 3 elevation-overlay percentages vs. our fixed lightness steps at 3 levels
   of nesting (page → card → inner well).
4. The standard derivation transform for a light brand colour into a dark brand colour
   (hue preservation vs. lightness clamp order).
5. Whether a "system" default should be on by default or opt-in for an education product.

---

## 12. Progress log

| Date | Change |
|---|---|
| 2026-11-17 | Plan written; every component below verified against the source. |
| 2026-11-17 | Phase 0 shipped: `.dark` token block, shadow-as-ring overrides, `prefers-color-scheme` opt-out removed, shadcn `.dark` harmonised. |
| 2026-11-17 | Phase 1 mechanism shipped: `ThemeContext` (cookie + localStorage + server read), `system` resolved by a blocking script, `ThemeToggle` component built. |
| 2026-11-17 | Phases 2–9 shipped. An append-only codemod added `dark:` variants to the hard-coded greys across 249 in-scope files (learner shell, dashboard pages, cards, menus, account, communities, analytics, auth, podcasts, activity content). Light classes were never removed, so the light theme is unchanged. Hand-fixed after the pass: switch thumbs, active-marker dots, the course hero gradients, the amber locale notice, focus rings, toasts, and the UI primitives (`button`, `icon-button`, `switch`, `badge`, `page-tabs`, `hover-menu`, `action-row`, `avatar`, `input`). |
| 2026-11-17 | Phase 10a shipped: `getBrandStyle()` takes a `mode` and emits the pair; `deriveDarkBrand()` lifts a light brand into a dark-safe fill (near-ink becomes a light fill, near-white is pulled down, mid-tones lift 22% toward white). All four shells pass the resolved theme, and the auth shell reads the cookie server-side. |
| 2026-11-17 | Phase 9 shipped: `useChartTheme()` has a dark branch — lifted brand ramp, darker grid, lighter axis, brighter positive/negative. |
| 2026-11-17 | Toggle mounted in the learner and dashboard sidebars (expanded = segmented Light/Dark/System, collapsed = cycling icon). |
| 2026-11-17 | **Page-section audit wave.** Audited the UI-reachable surface by *page section* (not by component registry): lesson/activity page (top bar, What You'll Learn, video area, curriculum sidebar, On This Page, mark-complete), podcast list + detail + `EpisodePlayer`, course detail (hero, authors & updates, share), collection detail, community detail + discussion editor, trail + certificates, search page, account, copilot, and the dashboard (home, courses, structure editor, podcasts, users, payments, org settings, notifications, analytics). Fixed: `CourseAuthors` (18 lines), `ActivityChapterDropdown`, `ActivityShareDropdown`, `CertificateVerificationPage`, `CourseShare`, `ActivityIndicators` (chapter circles + activity segments + progress bar), `PodcastThumbnail`, `UserAvatar` fallback/ring, `CourseUpdates`, `CommunityActions`, `CommunityCard`, `CreateDiscussionCard`, `CollectionThumbnail`, `Watermark`, `AccountGeneral` filter, `EditAssignmentModal` switch, and the whole `Dashboard/Analytics/**` tree (49 files, 231 variants). |
| 2026-11-17 | Reachable-surface scan result: **37 light-only lines left across 390 scanned files**, all deliberate (video scrubbers on video, dark chips that stay dark, the pass-fail pill on a coloured fill, and mobile-only components). |
| 2026-11-17 | **Surface-ladder correction.** The one-step card (`#18181b` on `#09090b`) read as flat: cards and page blurred together. Re-based the ladder on the sidebar's active pill — `page #09090b → card #27272a → border #3f3f46`, inner wells down to `#18181b`. Applied in `.dark` tokens, the shadcn HSL block, `useChartTheme()` grid/axis, and across 291 files / 1,727 `dark:` utilities (card `zinc-900→800`, well `zinc-800→900`, hairline `zinc-800→700`, strong border `zinc-700→600`, row hover `zinc-800→700`). Neutral buttons and chips moved to `#3f3f46` so a secondary control never shares the page colour. |
| 2026-11-17 | **Ladder locked after comparing with GitHub / Linear (v3).** v2 overshot: a 30-point fill delta made every card a bright grey slab and the secondary button became brighter than the cards. Re-measured the references — GitHub card is only 1.09:1 above its canvas with a 1.42:1 border — and rebuilt the ladder as **border-separates, fill-hints**: `page #09090b → card #141417 (1.08:1) → border #2f2f35 (1.38:1)`, wells down to `#0d0d0f`. Declared as six `--color-dk-*` theme colours (`dk-card`, `dk-raised`, `dk-track`, `dk-inset`, `dk-line`, `dk-line-strong`) so the whole ladder is one knob. Fixed three specific defects: the shadow ring no longer doubles the card border (a card was a 2px outlined box), text gained a third level (description `zinc-400`, meta `zinc-500` — both were `zinc-400`, so nothing receded), and listing search fields became recessed (`dk-inset`) instead of card-coloured. Applied across 293 files. |
| 2026-11-17 | **Auth surface pass.** The split shell used the inset well for its page (`#0d0d0f`, below the canvas) → page colour + `dk-card` form. Fields were card-coloured (invisible on the card) with zinc text → `dk-inset` well, `dk-line-strong` hairline, `dk-fg-1` text / `dk-fg-4` placeholder, plus a `.dark .auth-field:-webkit-autofill` override (Chrome was painting autofilled fields white). Labels / links / secondary button moved off zinc onto `dk-fg-1…3`; `AuthAlert` variants got real dark fills (`*-500/10`, `*-500/30` border, `*-200` text) instead of light pastel slabs; success / error icon circles went from the invisible inset to `dk-raised`; the terms checkbox inverts to `dk-fg-1` fill with a `dk-inset` tick; and the SSO / Google callback tips and error badge gained dark states. 15 auth files. |

### Known gaps (deliberately not migrated yet)

| Surface | Why |
|---|---|
| Tiptap editor block components (`Objects/Editor/**`: audio, PDF, quiz, callout, scenarios, code playground, image, file upload, version history) | Rich-content authoring and rendering; a separate design pass, listed as out of scope in §6. These blocks are not reachable from the UI: the DB only contains `TYPE_VIDEO` and `TYPE_ASSIGNMENT` activities, so no `TYPE_DYNAMIC` page can be created yet |
| Video player chrome (`Activities/Video/*`, `EpisodePlayer`, `PodcastPlayer`) | Sits on top of video and must stay neutral — verified as intentional (scrubber handle, play overlay) |
| Board canvas (`Dashboard/Boards/**`) | Free-form canvas with fixed colours; also not linked from the dashboard sidebar, so unreachable |
| `components/Pages/CourseEdit/**` | Legacy course editor; not imported anywhere in the app |
| Superadmin shell (`components/Admin/**`, `AdminLeftMenu`) | Separate product surface, not the org dashboard |
| Mobile-only components (`*Mobile.tsx`, mobile dropdowns) | Desktop only, per scope |
| `/test` route | Developer scratch page |

## 13. Related

- [Theme colour plan](./theme-color-plan.md)
- [Brand colour surface audit](./brand-surface-audit.md)
- [Design tokens](../../07-ui-reference/design-tokens.md)
- [Organization branding](../../04-admin-guide/org-settings/branding.md)
