# Applying Medusa UI to LearnHouse — Implementation Plan

Detailed, phase-by-phase plan to transform LearnHouse's frontend UI into the
Medusa design language. Read `MEDUSA_UI_REFERENCE.md` first.

---

## 0. Decisions (locked)

| Decision | Value |
|---|---|
| Accent color | Indigo `#6366f1` (authentic Medusa) |
| Font | Inter as default (orgs can override via Branding) |
| Theme scope | Light + Dark (both token sets updated) |
| New dependency? | **No** — restyle existing shadcn components |
| Branding behavior | Org color → overrides accent via CSS variables (upgrade) |
| Default accent fallback | Indigo when no org color set |

### Why no `@medusajs/ui` package
LearnHouse already uses the exact foundation Medusa is built on (Radix +
shadcn). Adding the package would bring a foreign token system and version
risk for zero visual benefit — the look lives in tokens, not the package.

---

## 1. Phase 1 — Design Token Layer

**File:** `apps/web/styles/globals.css` — replace the `:root` and `.dark`
token blocks (currently around lines 311–386).

### Light mode (current → Medusa)

| Token | Current | Target | Effect |
|---|---|---|---|
| `--background` | `0 0% 100%` | `0 0% 98.5%` | gray canvas (#fbfbfb) |
| `--foreground` | `0 0% 3.9%` | `0 0% 10%` | #1a1a1a text |
| `--card` | `0 0% 100%` | `0 0% 100%` | unchanged |
| `--card-foreground` | `0 0% 3.9%` | `0 0% 10%` | match fg |
| `--popover` | `0 0% 100%` | `0 0% 100%` | unchanged |
| `--popover-foreground` | `0 0% 3.9%` | `0 0% 10%` | match fg |
| `--primary` | `0 0% 9%` | `243 75% 59%` | **indigo #6366f1** |
| `--primary-foreground` | `0 0% 98%` | `0 0% 100%` | white on indigo |
| `--secondary` | `0 0% 96.1%` | `0 0% 96.5%` | gray-100 hover |
| `--secondary-foreground` | `0 0% 9%` | `0 0% 10%` | match fg |
| `--muted` | `0 0% 96.1%` | `0 0% 96.5%` | muted bg |
| `--muted-foreground` | `0 0% 45.1%` | `220 9% 46%` | #697386 |
| `--accent` | `0 0% 96.1%` | `0 0% 96.5%` | hover bg |
| `--accent-foreground` | `0 0% 9%` | `0 0% 10%` | match fg |
| `--destructive` | `0 84.2% 60.2%` | `0 72% 51%` | keep red-ish |
| `--border` | `0 0% 89.8%` | `220 13% 91%` | #e5e7eb |
| `--input` | `0 0% 89.8%` | `220 13% 91%` | same as border |
| `--ring` | `0 0% 3.9%` | `243 75% 59%` | indigo focus ring |
| `--radius` | `0.5rem` | `0.625rem` | smaller radius |

### Dark mode (current → Medusa)

| Token | Current | Target |
|---|---|---|
| `--background` | `0 0% 3.9%` | `0 0% 7%` (#121212) |
| `--foreground` | `0 0% 98%` | `0 0% 100%` |
| `--card` | `0 0% 3.9%` | `0 0% 10%` (#1a1a1a) |
| `--primary` | `0 0% 98%` | `243 75% 59%` (indigo) |
| `--primary-foreground` | `0 0% 9%` | `0 0% 100%` |
| `--secondary` | `0 0% 14.9%` | `0 0% 15%` |
| `--muted-foreground` | `0 0% 63.9%` | `220 9% 63%` |
| `--accent` | `0 0% 14.9%` | `0 0% 15%` |
| `--border` | `0 0% 14.9%` | `0 0% 16.5%` (#2a2a2a) |
| `--input` | `0 0% 14.9%` | `0 0% 16.5%` |
| `--ring` | `0 0% 83.1%` | `243 75% 59%` |

### Also in globals.css
- Replace `.nice-shadow` / `.light-shadow` utilities with border-first
  alternatives (e.g. `border border-border shadow-none`) — or keep the class
  name but redefine it, so hundreds of call sites change at once.
- Change `body { letter-spacing: -0.02em }` → `-0.01em`.
- Replace font stack default Wix Madefor → Inter.

### Font file
`apps/web/app/layout.tsx` — swap `Wix_Madefor_Text` for `Inter` from
`next/font/google`.

---

## 2. Phase 2 — Core UI Components

**Folder:** `apps/web/components/ui/` (20 shadcn components). Restyle to Medusa
proportions. All changes are class-string edits.

### button.tsx
- Base: `rounded-lg text-sm font-medium` (was `rounded-md`)
- Remove `shadow-sm`/`shadow-xs` from default/outline/secondary/destructive
- Default (primary): `bg-primary text-primary-foreground hover:bg-primary/90`
  (now indigo via tokens — no code change needed)
- Outline: `border border-input bg-background hover:bg-accent`
- Sizes: keep `h-9` default / `h-8 sm` / `h-10 lg`

### input.tsx
- `h-10 rounded-lg border-input bg-background px-3 text-sm`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring`

### badge.tsx
- Keep variants but soft-tint: success `bg-emerald-50 text-emerald-700`, etc.
  (add if missing)

### table.tsx
- Header: uppercase micro-label style
- Rows: `text-sm`, hairline dividers
- Add hover state

### dialog.tsx, dropdown-menu.tsx, popover.tsx, select.tsx, tooltip.tsx
- Ensure `rounded-xl`/`rounded-lg`, 1px border, soft shadow (floating allowed),
  header/footer with border separators

### checkbox.tsx, switch.tsx, radio
- Indigo checked state (inherits `--primary` automatically)

### Result
Every page using these components updates automatically. No page-level edits
needed for the base look.

---

## 3. Phase 3 — Dashboard Shell

### DashLeftMenu (`apps/web/components/Dashboard/Menus/DashLeftMenu.tsx`)
Already dark `#0f0f10` — keep. Changes:
- Add **uppercase micro-labels** above nav groups ("General", "Content",
  "Administration") using `text-[11px] uppercase tracking-wider text-white/40`
- Keep active state `bg-white/[0.08]` + 3px white indicator (already Medusa-like)
- Ensure icon set is Phosphor (already is)

### DashMobileMenu (`apps/web/components/Dashboard/Menus/DashMobileMenu.tsx`)
- Keep black pill layout (`bottom-4 left-4 right-4 rounded-2xl`)
- Replace `shadow-xl` → `border border-white/10`
- Swap lucide icons → Phosphor (consistency)
- Add the `signOut` action button (import already exists on line 3)

### HeaderProfileBox (`apps/web/components/Security/HeaderProfileBox.tsx`)
- Hover states → `hover:bg-accent`, muted text → `text-muted-foreground`

---

## 4. Phase 4 — Public Site Header (OrgMenu)

**File:** `apps/web/components/Objects/Menus/OrgMenu.tsx`

- Keep structure and links (Home, Courses, Communities, Podcasts, search,
  language, profile) — **layout unchanged**
- Remove `nice-shadow` on the bar → flat with `border-b border-border`
- Keep `getMenuColorClasses(primaryColor)` logic — public site stays
  **brand-aware**
- Restyle dropdowns to Medusa proportions (inherit Phase 2)

---

## 5. Phase 5 — Branding Controls the Whole Theme (upgrade)

**Goal:** org owner picks a color → whole platform (dashboard buttons, links,
active states, focus rings) recolors. No color → Medusa indigo fallback.

### Files
- `apps/web/app/orgs/[orgslug]/(withmenu)/layout.tsx` (public)
- `apps/web/app/orgs/[orgslug]/dash/ClientAdminLayout.tsx` (dashboard)

### Mechanism (in both layouts)
```tsx
useEffect(() => {
  const root = document.documentElement.style
  if (primaryColor) {
    root.setProperty('--primary', hexToHsl(primaryColor))
    root.setProperty('--ring', hexToHsl(primaryColor))
  } else {
    root.setProperty('--primary', '243 75% 59%') // Medusa indigo default
    root.setProperty('--ring', '243 75% 59%')
  }
}, [primaryColor])
```

- Add `hexToHsl()` helper in `apps/web/services/utils/ts/colorUtils.ts`
  (hexToRgb already exists; convert RGB → HSL)
- Preserve existing `getMenuColorClasses` for the public header (text/icon
  contrast on the colored bar)

### Result
| Case | Result |
|---|---|
| No color set | Full Medusa theme (indigo default) |
| Color set (e.g. green) | Dashboard + public UI recolor to green |
| Color cleared | Back to indigo Medusa |

---

## 6. Phase 6 — Pages & Data Presentation

Iterate the highest-visibility dashboard pages to Medusa patterns:

- **Dashboard home** (`dash/page.tsx`) — cards → bordered containers, remove
  `nice-shadow`
- **Course lists / users / assignments** — convert card-per-row to dense tables
  where the data model allows (keep card layouts for content-heavy items)
- **Org settings tabs** — standardize page headers (title + actions) and
  section cards
- **Copilot chat** — `rounded-2xl nice-shadow` → `rounded-xl border`
- Grep for `nice-shadow|light-shadow|text-blue-|bg-gray-100` and migrate to
  tokens

---

## 7. Phase 7 — Icon Unification

- **Standard: Phosphor** (`@phosphor-icons/react`) — already the majority in
  the dashboard (`lib/dashboard-menu-items.ts`, DashLeftMenu, search metas)
- Migrate remaining lucide usages in chrome components (DashMobileMenu at
  minimum)
- Radix icons: migrate where trivial, keep for radix internals if low-visibility

---

## 8. Phase 8 — Editor & Hardcoded Colors

- `apps/web/styles/globals.css` editor rules: `#2563eb` links, `#f3f4f6`
  toolbar, hardcoded grays → tokens (`--primary`, `--accent`, `--border`)
- Keep editor **dark code blocks** and prose styling (function over form)
- Verify boards / collab cursors unaffected

---

## 9. Phase 9 — QA & Safety Checks

### Branding regression (must still work)
| Setting | Mechanism | Status after plan |
|---|---|---|
| Favicon | Next Metadata icons | Unaffected |
| Logo | img tag + media dir | Unaffected |
| Font | Google Fonts link injection | Unaffected |
| Color | getMenuColorClasses + CSS vars | Upgraded (Phase 5) |

### Check list
1. Light + dark mode in dashboard and public pages
2. Mobile: DashMobileMenu looks right, no overflow
3. Buttons/inputs/modals on all 20 ui components
4. Editor: bold/italic/links/code blocks render correctly
5. Boards: cursors, blocks, chat
6. Tables: horizontal scroll, alignment
7. Collab presence + toasts
8. No TS/ESLint errors (`unused-imports`)

### Rollback
Token changes live in `globals.css` + one font file — revert via git. Phase 2
changes are isolated to `components/ui/*`. Nothing touches business logic.

---

## 10. Execution order (summary)

| Phase | What | Review point |
|---|---|---|
| 1 | Tokens + font | Check whole app after — **temperature check** |
| 2 | 20 core components | Buttons/inputs/modals look right |
| 3 | Dashboard shell + mobile | Sidebar, mobile pill |
| 4 | Public header | OrgMenu flat + brand-aware |
| 5 | Branding → whole theme | Set/clear org color, see recolor |
| 6 | Pages & tables | Data surfaces |
| 7 | Icon unification | Consistency |
| 8 | Editor hardcoded colors | Editor polish |
| 9 | QA + safety | Full pass |

---

## 11. Files touched (master list)

- `apps/web/styles/globals.css`
- `apps/web/app/layout.tsx` (font)
- `apps/web/components/ui/*.tsx` (20 files, Phase 2)
- `apps/web/components/Dashboard/Menus/DashLeftMenu.tsx`
- `apps/web/components/Dashboard/Menus/DashMobileMenu.tsx`
- `apps/web/components/Security/HeaderProfileBox.tsx`
- `apps/web/components/Objects/Menus/OrgMenu.tsx`
- `apps/web/app/orgs/[orgslug]/(withmenu)/layout.tsx`
- `apps/web/app/orgs/[orgslug]/dash/ClientAdminLayout.tsx`
- `apps/web/services/utils/ts/colorUtils.ts` (+ hexToHsl)
- Various dashboard pages (Phase 6, iterative)
