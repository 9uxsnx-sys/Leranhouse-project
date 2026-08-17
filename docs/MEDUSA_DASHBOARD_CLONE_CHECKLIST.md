# Medusa Dashboard Clone — Master Checklist

**Goal:** Make the LearnHouse org shell + pages 100% pixel-accurate to the Medusa v2.18.0 admin dashboard.
**Reference source (local clone):** `c:\Projects\learnhouse-dev\learnhouse-dev\medusa` (shallow clone, pinned to `v2.18.0`).
**Doctrine:** Never hand-approximate. Copy the real Medusa source from the local clone.
**Status:** Analysis complete — not yet started.

---

## PHASE 1 — Shell & chrome (topbar, sidebar, search, drawer)

### 1.1 Root shell — `OrgMenu.tsx` (from `medusa/packages/admin/dashboard/src/components/layout/shell/shell.tsx#L42-L67`)

| Medusa (exact) | Ours (current) | Action |
|---|---|---|
| `relative flex h-screen flex-col items-start overflow-hidden lg:flex-row` | `relative flex min-h-screen w-full flex-col items-start lg:flex-row` | change |
| Right col: `flex h-screen w-full flex-col overflow-auto` | `flex w-full min-w-0 flex-1 flex-col` | change |
| Main: `flex h-full w-full flex-col items-center overflow-y-auto` | raw `flex-1 relative` div | **content centered** |
| **Gutter**: `flex w-full max-w-[1600px] flex-col gap-y-2 p-3` | none | wrap every page in max-1600px gutter, `p-3` (12px), blocks spaced `gap-y-2` (8px) |
| Nav loading → top `ProgressBar` (`fixed h-1 z-50`, blue gradient) | none | add |

### 1.2 Topbar (shell.tsx#L208-L237) — kills horizontal scroll

- `p-3` (not `px-4 py-3`), **no `bg-white`** — canvas `#fafafa` shows through, `border-b` border `#e4e4e7`
- Left: `ToggleSidebar` icon button **visible on desktop too** (collapses sidebar, `SidebarLeft` icon, `text-ui-fg-muted`) + breadcrumbs, `gap-x-1.5`
- Right: `gap-x-3`, icons only — **remove the `w-56` SearchBar from the topbar entirely**

### 1.3 Search moves to the sidebar (main-layout.tsx#L262-L288)

Full-width `⌘K` button, first item in the nav:

```tsx
<button className="bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover flex w-full items-center gap-x-2.5 rounded-md px-2 py-1 ...">
  <MagnifyingGlass />
  <div className="flex-1 text-start"><Text size="small" leading="compact" weight="plus">Search</Text></div>
  <Text size="small" className="text-ui-fg-muted">⌘K</Text>
</button>
```

### 1.4 Breadcrumb deltas (shell.tsx#L107-L181)

- Hover: `text-ui-fg-subtle` (#52525b), not `gray-900`
- Separator: `TriangleRightMini` full 16px (drop `h-3.5 w-3.5`), `mx-2 rtl:rotate-180`
- Mobile: when >1 crumb, show `...` and hide all but the last

### 1.5 Sidebar — `MedusaSidebar.tsx` (main-layout.tsx#L43-L67 + nav-item.tsx#L51-L56)

- Inactive color `text-ui-fg-subtle` = **#52525b** (we use gray-500 #6b7280)
- Icon color `[&>svg]:text-ui-fg-subtle` (icons follow text color)
- Active chip ✓ already exact (`bg-white` + `card-shadow-rest`)
- Header + bottom user section get `bg-ui-bg-subtle sticky` wrapper
- **Dashed divider** (the "black line"): `h-px w-full bg-[linear-gradient(90deg,var(--border-strong)_1px,transparent_1px)] bg-[length:4px_1px]` — 4px dashes in `#d4d4d8`, not a plain `border-t dashed`

### 1.6 User section (user-menu.tsx#L88-L145)

Trigger: `bg-ui-bg-subtle grid w-full cursor-pointer grid-cols-[24px_1fr_15px] items-center gap-2 rounded-md py-1 pe-2 ps-0.5` + avatar (xsmall, rounded-full) + name (xsmall/plus) + `EllipsisHorizontal` muted. Dropdown: profile / docs / changelog / shortcuts modal / **theme submenu** / logout.

### 1.7 Mobile drawer (shell.tsx#L253-L293)

`bg-ui-bg-subtle shadow-elevation-modal fixed inset-y-2 start-2 w-full max-w-[304px] rounded-lg border-r` + **XMark close button** + sr-only title. (Ours: full-height, 280px, no rounding, no close.)

### 1.8 Topbar right = Notifications bell (notifications.tsx#L70-L79)

`IconButton transparent size small text-ui-fg-muted hover:text-ui-fg-subtle` + `BellAlert`/`BellAlertDone` (unread dot) + Drawer. **Medusa has NO dashboard/help dropdowns in the topbar.**

---

## PHASE 2 — Design tokens (globals.css)

From `medusa/packages/design-system/ui-preset/src/theme/tokens/colors.ts` + `effects.ts` + `typography.ts`.

### Colors (light mode, exact)

| Token | Medusa exact | Ours | Status |
|---|---|---|---|
| Canvas `bg-subtle` | `#fafafa` | `--color-canvas: #fafafa` | ✅ |
| `bg-base` (cards) | `#ffffff` | white | ✅ |
| `fg-base` | `#18181b` | gray-900 #111827 | ❌ |
| `fg-subtle` (nav/body) | `#52525b` | gray-500 | ❌ |
| `fg-muted` (icons) | `#71717a` | gray-400 #9ca3af | ❌ |
| `border-base` | `#e4e4e7` | `--border: 220 13% 91%` ≈ #e8eaed | ❌ |
| `border-strong` (dashed divider) | `#d4d4d8` | — | ❌ |
| `border-interactive` / focus | blue `#3b82f6` | brand indigo | ❌ |

### Shadows (exact)

| Token | Value |
|---|---|
| `elevation-card-rest` | `0 0 0 1px rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.08), 0 2px 4px 0 rgba(0,0,0,.04)` — ✅ have |
| `elevation-card-hover` | ring `.08` + `0 1px 2px -1px .08` + `0 2px 8px 0 .10` |
| `borders-base` (inputs/buttons) | `0 1px 2px 0 rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.08)` |
| `elevation-flyout` (dropdowns) | ring `.08` + `0 4px 8px` + `0 8px 16px` `.08` |
| `elevation-modal` | white inset ring + ring `.08` + `0 8px 16px` + `0 16px 32px` |
| `elevation-tooltip` | ring `.08` + `0 2px 4px` + `0 4px 8px` `.08` |
| `borders-focus` | `0 0 0 1px #fff, 0 0 0 3px rgba(59,130,246,.6)` |

### Typography (typography.ts)

| Style | Value |
|---|---|
| `h1-core` (page title) | 18px / 28px, weight 500 |
| `h2-core` | 16px / 24px, weight 500 |
| `h3-core` | 14px / 20px, weight 500 |
| `txt-compact-small-plus` (nav/labels) | 13px / 20px, medium |
| `txt-small` (body) | 13px / 20.8px |
| Font family | Inter |

---

## PHASE 3 — Blocks / cards / pages

### 3.1 Container (white block) — container.tsx

```tsx
className="shadow-elevation-card-rest bg-ui-bg-base w-full rounded-lg px-6 py-4"
```

White card, `rounded-lg`, `px-6 py-4` (24/16px padding). Blocks stack **`gap-y-3` (12px)** between cards (two-column-page.tsx#L82).

### 3.2 Page header pattern

`flex items-center justify-between` → `Heading level="h1"` (h1-core, 18px) left; right = primary `Button` ("New …") + secondary/icon actions.

### 3.3 Buttons — button.tsx#L8-L54 (our button.tsx uses shadcn variant names — port the real ones)

| Variant | Recipe |
|---|---|
| `primary` | **black** `rgba(24,24,27)` bg, `text rgba(255,255,255,.88)`, inset white line + black 1px ring + drop shadow; hover #27272a |
| `secondary` | white bg + `borders-base` shadow (1px ring .08 + 0 1px 2px .12), hover `#f4f4f5` |
| `transparent` | fg-base, hover `bg-subtle-hover` #f4f4f5 |
| `danger` | red |
| sizes | `small px-2 py-1`, `base px-3 py-1.5`, `large px-4 py-2.5`, `xlarge px-5 py-3.5`; all `rounded-md txt-compact-small-plus` |

### 3.4 List pages → DataTable (data-table.tsx)

Search + filters + paginated table inside a Container. Header cells `bg-ui-bg-subtle h-11`, row hover, pagination `flex items-center justify-between px-3 py-2`. → Courses / Collections / Users tables.

### 3.5 Detail pages → two-column (two-column-page.tsx#L86)

```tsx
<div className="flex w-full flex-col items-start gap-x-4 gap-y-3 xl:grid xl:grid-cols-[minmax(0,_1fr)_440px]">
```

Main column + **440px right sidebar** (order-detail style: general + payment + timeline).

### 3.6 Common blocks

`MetadataSection`, `JsonViewSection`, `EmptyTableContent` (centered icon + title + description), `SectionRow` (settings rows: label left / control right), `ListSummary`, `BadgeListSummary`, `Thumbnail` (product thumb 40px rounded).

---

## PHASE 4 — Component library to port (from `@medusajs/ui`)

**Already ported ✓:** `Text`, `Heading`, `IconButton`, `Avatar`, `Badge`, `DropdownMenu`, `Divider` (partial).

**Still to port/align:**

- `Table` (header `bg-ui-bg-subtle`, rows `h-10`)
- `Input` (`bg-ui-bg-field` #fafafa, `borders-base` shadow, `h-8 rounded-md`, blue focus ring)
- `Button` (real variants above)
- `StatusBadge` (grey/green/red chips)
- `Switch`, `Checkbox`, `RadioGroup`, `Select`, `Tabs`, `ProgressTabs`
- `Drawer` (right panel, `elevation-modal`, rounded-lg)
- `Prompt` (confirm dialog)
- `Command` + `CommandBar` (⌘K palette — align SearchBar dropdown to Command styling)
- `Tooltip`, `Toast/Toaster`, `Kbd`
- `Container`, `Copy`, `InlineTip`, `Alert`

---

## Execution order

1. **Phase 1** — shell, topbar, sidebar, search move, breadcrumb, drawer → kills horizontal scroll, chrome pixel-accurate
2. **Phase 2** — tokens + typography in globals.css → everything downstream snaps to Medusa colors
3. **Phase 3** — Container recipe + page headers + gutter → the "blocks" look (space around blocks, black ring, block gaps)
4. **Phase 4** — component sweep, page by page

---

## Local clone reference index

| What | Path |
|---|---|
| Shell / topbar / breadcrumbs / drawer | `medusa/packages/admin/dashboard/src/components/layout/shell/shell.tsx` |
| Sidebar structure + search entry | `medusa/packages/admin/dashboard/src/components/layout/main-layout/main-layout.tsx` |
| Nav item recipe | `medusa/packages/admin/dashboard/src/components/layout/nav-item/nav-item.tsx` |
| User menu | `medusa/packages/admin/dashboard/src/components/layout/user-menu/user-menu.tsx` |
| Notifications | `medusa/packages/admin/dashboard/src/components/layout/notifications/notifications.tsx` |
| Page layouts | `medusa/packages/admin/dashboard/src/components/layout/pages/` |
| DataTable | `medusa/packages/admin/dashboard/src/components/data-table/data-table.tsx` |
| All ui components | `medusa/packages/design-system/ui/src/components/` |
| Icons | `medusa/packages/design-system/icons/src/components/` |
| Tokens (colors/shadows/type) | `medusa/packages/design-system/ui-preset/src/theme/tokens/` |
| Example list page | `medusa/packages/admin/dashboard/src/routes/orders/order-list/order-list.tsx` |
