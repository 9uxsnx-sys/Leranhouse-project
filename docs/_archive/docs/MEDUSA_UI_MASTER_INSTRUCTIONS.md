# Medusa UI — Master Instructions (how we convert LearnHouse to Medusa)

The doctrine for converting **any** LearnHouse UI to the Medusa design language,
using the exact process we followed for the navigation (Phase 4).

Read these first (in order):

1. `MEDUSA_UI_REFERENCE.md` — the **visual language** (tokens, typography,
   spacing, what Medusa looks like).
2. `LEARNHOUSE_MEDUSA_UI_PLAN.md` — the **overall plan** (phases 1–9).
3. **This file** — the **how**: where to pull code, and the step-by-step
   strategy for swapping any screen/block/component.

---

## 1. Core principle

> We **copy real Medusa source code** and adapt it into LearnHouse.
> We **never install** `@medusajs/ui`.

Why:

- `@medusajs/ui` requires React 18 (`^18.3.1`); LearnHouse runs **React 19.2.6**.
- It is an admin-kit built for Medusa dashboards — most of it has no public-site
  counterpart, and it ships its own Tailwind 3 preset that fights our Tailwind 4
  setup.
- It is **MIT licensed** — copying and adapting the source is fully allowed.

So the workflow is always: **fetch the real component → port it → adapt tokens → drop it in.**

---

## 2. Source of truth (where we pull from)

Medusa monorepo, `develop` branch. Everything is public — no auth needed.

| What | URL pattern |
|---|---|
| Component source | `https://raw.githubusercontent.com/medusajs/medusa/develop/packages/design-system/ui/src/components/<name>/<name>.tsx` |
| Icons | `https://raw.githubusercontent.com/medusajs/medusa/develop/packages/design-system/icons/src/components/<name>.tsx` |
| Icon name list | `https://raw.githubusercontent.com/medusajs/medusa/develop/packages/design-system/icons/src/components/index.ts` |
| Component folder list | `https://api.github.com/repos/medusajs/medusa/contents/packages/design-system/ui/src/components?ref=develop` |

Rules for fetching:

- Icon file names are **kebab-case** of the export name (`QuestionMark` →
  `question-mark.tsx`). Verify names against `index.ts` before fetching.
- A fetch that returns nothing usually means the guessed file name is wrong —
  check `index.ts`.
- Do **not** `git clone` the repo — the sandbox blocks writes outside the
  workspace, and raw-file fetching is faster anyway.

---

## 3. The workflow (the strategy — do this for every block)

This is the process we used on the navigation. Repeat it for every part of the
project, one block at a time.

### Step 1 — Inventory (list everything in the target)

Open the target (screen/component/block) and list **every visual element**:

- Icons (and which icon library each comes from)
- Components (buttons, inputs, dropdowns, avatars, switches, badges…)
- Layout primitives (bar heights, paddings, containers)
- Typography (sizes, weights)
- Colors / borders / shadows

Example from the navigation inventory (13 elements):

| # | Element | Was |
|---|---|---|
| 1 | Top bar | `h-[60px]` blur, `border-b border-border` |
| 2 | Icon chips (Trail/Boards/Copilot/Dashboard/Help) | hand-rolled `p-2 rounded-lg` buttons |
| 3 | Account avatar | `<UserAvatar>` plain `<img>` |
| 4 | Search input | `h-9 rounded-lg bg-gray-50` |
| 5 | Nav links | text-only links |
| 6–12 | Dropdowns, badges, bubble toggle, hamburger, icons | Phosphor/lucide, raw SVGs |
| 13 | Language switcher | lucide icons |

### Step 2 — Fetch the Medusa source for each element

For each element in the inventory, fetch the matching Medusa component/icon from
Section 2. Don't guess — fetch the real file and read it.

### Step 3 — Map (decide what each element becomes)

Build a swap map. Examples from the nav:

| LearnHouse element | Medusa swap |
|---|---|
| Icon chips | `IconButton` `transparent` `size="small"` |
| Account avatar | `Avatar` `rounded` `size="xsmall"` + initials fallback |
| Search input | `Input` `type="search"` (`h-8 rounded-md` + built-in icon) |
| Dropdowns | existing Radix `DropdownMenu`, restyled to Medusa item classes |
| Role/custom-role tags | `Badge` `grey` soft pill |
| Bubble toggle | hand-rolled switch, restyled to Medusa proportions |
| Hamburger | `IconButton` + `BarsThree`/`XMark` |
| All icons | `@medusajs/icons` copied as local SVGs |

### Step 4 — Copy + adapt (the port)

Rules for every port:

- Copy the real `.tsx`, keep structure and class semantics.
- Replace `clx()` with LearnHouse's `cn()` (`@/lib/utils`).
- Replace Medusa `ui-*` tokens with LearnHouse equivalents (see Section 5).
- Use `cn(componentVariants(...), className)` — LearnHouse already uses `cva`.
- Preserve `asChild` / `Slot` support where the original has it.
- **Keep all business logic, feature gating, permissions, links, i18n keys and
  org-branding (`--brand`) intact. UI swap only.**
- Never introduce new dependencies if a `components/ui/*` port exists.

### Step 5 — Apply + verify

- Wire the ports into the target.
- No screenshots during review — the user reviews live on `localhost:3000`.
- Check browser console for errors (logged-in session: `admin@school.dev` /
  `admin123456`) and click through every interactive element.

---

## 4. Component port conventions

Ports live in `apps/web/components/ui/` (general) and
`apps/web/components/Objects/` (domain). Follow the existing shadcn/cva pattern.

### Ported so far (inventory — reuse, don't rebuild)

| File | Source | Notes |
|---|---|---|
| `components/ui/icon-button.tsx` | Medusa `icon-button.tsx` | variants `primary`/`transparent`, sizes `2xsmall`…`xlarge`, `asChild` |
| `components/ui/avatar.tsx` | Medusa `avatar.tsx` | Radix-free: `<img>` + initials fallback, `rounded`/`squared`, sizes |
| `components/ui/input.tsx` | Medusa `input.tsx` | added `type="search"` variant → `h-8 rounded-md` + built-in icon |
| `components/ui/dropdown-menu.tsx` | Medusa dropdown | items `text-[13px] font-medium rounded-md px-2 py-1.5`, labels `text-[12px] text-muted-foreground`, separators `bg-border` |
| `components/ui/badge.tsx` | Medusa badge | added `grey` variant (soft pill) |
| `components/Objects/Icons/MedusaIcons.tsx` | `@medusajs/icons` | 17 icons ported (see below) |

### Icon port conventions (add more the same way)

- All icons live in one module: `components/Objects/Icons/MedusaIcons.tsx`.
- Pattern: `React.forwardRef<SVGSVGElement, MedusaIconProps>` + shared `base`
  svg attrs (15×15, `viewBox 0 0 15 15`, `fill="none"`), `color` defaults to
  `currentColor`.
- **Strip `<clipPath>`/`<defs>` wrappers** — their ids collide when many icons
  render on one page. The inner paths are identical to the originals.
- Ported so far: `BarsThree`, `Check`, `ChevronDownMini`, `XMark`, `Spinner`,
  `ChatBubble`, `QuestionMark`, `Directions`, `GridLayout`, `GridList`, `Book`,
  `GlobeEurope`, `Language`, `ArrowRightOnRectangle`, `MagnifyingGlassMini`,
  `IdBadge`, `CreditCard`.
- When Medusa has no semantic match (e.g. Trail), pick the closest Medusa icon
  (Trail → `Directions`) — **one icon family, no mixing**.

### Typography mapping

Medusa `txt-*` classes → Tailwind equivalents:

| Medusa | Tailwind |
|---|---|
| `txt-compact-xsmall-plus` | `text-[12px] font-medium` |
| `txt-compact-small-plus` | `text-[13px] font-medium` (dropdown items, nav) |
| `txt-compact-medium-plus` | `text-[14px] font-medium` |
| `txt-ui-fg-muted` / placeholder | `text-muted-foreground` |
| micro-label (uppercase) | `text-[11px] font-medium uppercase tracking-wider` |

---

## 5. Token / class mapping (ui-* → LearnHouse)

Medusa's tokens are Tailwind class names (`ui-bg-base`, `shadow-borders-base`…).
Map them to LearnHouse equivalents — do not copy them literally.

| Medusa class | LearnHouse equivalent |
|---|---|
| `ui-bg-base` | `bg-background` / `bg-white` |
| `ui-bg-subtle` | `bg-muted` / `bg-gray-50` |
| `ui-bg-component-hover` | `bg-gray-100` / `hover:bg-accent` |
| `ui-fg-base` | `text-foreground` / `text-gray-900` |
| `ui-fg-subtle` | `text-muted-foreground` / `text-gray-600` |
| `ui-fg-muted` | `text-muted-foreground` / `text-gray-400` |
| `ui-fg-interactive` / accent | `bg-primary` (`--primary` = indigo `#6366f1`) |
| `shadow-borders-base` | `border border-border` |
| `shadow-borders-strong` | `border border-gray-300` |
| `shadow-borders-interactive-with-active` (focus) | `focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30` |
| `rounded-md` (buttons/inputs) | `rounded-md` (unchanged) |
| `rounded-xl` (cards/modals) | `rounded-xl` |

**Branding:** the public site must stay brand-aware. Org color is injected via
the `--brand` CSS var on the nav (fallback indigo). Active states /
focus rings on the public header use `text-(--brand)` / `ring-(--brand)`.

---

## 6. Rules (Do / Don't)

| Do | Don't |
|---|---|
| Copy real Medusa source, adapt it | Install `@medusajs/ui` / `@medusajs/icons` |
| Swap every element of the target (icons, avatar, dropdown, text) | Keep a half-converted mix of icon families |
| Keep business logic / gating / branding intact | Touch logic during a UI swap |
| Strip `clipPath` ids from copied icons | Copy `clx` imports (use `cn`) |
| Reuse existing ports | Rebuild `IconButton`/`Avatar`/etc. |
| Report the plan → wait for confirmation → execute | Start editing before the swap map is approved |
| Verify live (user reviews in browser) | Take review screenshots |

---

## 7. Worked example — navigation swap (done, Phase 4)

Processed with the 5-step workflow above:

| Was | Now |
|---|---|
| Bar `h-[60px]` | `h-14` (56px), same border/backdrop |
| Trail/Boards/Copilot/Dashboard/Help chips | `IconButton transparent size="small"` + Medusa icons |
| `UserAvatar` img | `Avatar` rounded xsmall + initials fallback |
| Search `h-9 bg-gray-50` | `h-8 rounded-md border-border` + brand focus ring |
| Account chip (avatar+name+dot+caret) | Medusa Avatar + `ChevronDownMini`, role dot muted |
| Account dropdown | Avatar label, `IdBadge`/`CreditCard`/`GridLayout` items, grey role pills, `Language` submenu, red sign-out |
| Dashboard/Help/Copilot dropdowns | Medusa labels/icons, `text-[13px] font-medium` items |
| Phosphor `Signpost`/`ChalkboardSimple` | `Directions` / `GridList` |
| Raw hamburger SVGs | `IconButton` + `BarsThree` / `XMark` |
| `LanguageSwitcher` lucide | `Language` + `ChevronDownMini`, `rounded-md` trigger |

---

## 8. Running a new phase (next blocks)

For every future block (dashboard pages, tables, cards, editor, settings…):

1. **Inventory** the block (Step 1) and **fetch** the Medusa sources (Step 2).
2. Present the **swap map** to the user and **wait for approval**.
3. On approval: port components (if new), then apply, then verify live.
4. Prefer `components/ui/*` ports for anything reused across screens; keep
   one-off restyles local to the block.

Current phase map from `LEARNHOUSE_MEDUSA_UI_PLAN.md`:
Phase 1–4 done → **Phase 5** branding-to-whole-theme → Phase 6 pages/tables →
Phase 7 icon unification → Phase 8 editor → Phase 9 QA.
