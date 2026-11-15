# UI Component Library

> Status: as-built · Last verified: 2026-11-15

> `apps/web/components/ui/` is a local component kit built on Radix UI primitives and Tailwind CSS v4. It is a **port of Medusa UI tokens** (`styles/globals.css` documents the token source) — there is no Medusa package dependency.

---

## Component Inventory

Every file currently in `apps/web/components/ui/`:

| File | Export(s) | Purpose |
|------|-----------|---------|
| `action-row.tsx` | `ActionRow`, `ActionRowSearch`, `ActionRowSpacer`, `ActionRowActions` | List-page toolbar: search plus an end-aligned action cluster. |
| `alert.tsx` | `Alert`, `AlertTitle`, `AlertDescription` | Inline alert banners. |
| `avatar.tsx` | `Avatar` | User avatar (falls back to initials/image). |
| `badge.tsx` | `Badge`, `badgeVariants` | Small label pill. |
| `button.tsx` | `Button`, `buttonVariants` | Variants `primary` / `secondary` / `transparent` / `danger` (plus shadcn aliases); sizes `small` / `base` / `large` / `xlarge`. |
| `checkbox.tsx` | `Checkbox` | Radix checkbox. |
| `container.tsx` | `Container` | Page-width layout wrapper. |
| `dialog.tsx` | Dialog parts | Radix dialog / modal. |
| `dropdown-menu.tsx` | Dropdown menu parts | Radix dropdown menu (action menus). |
| `file-upload.tsx` | `FileUpload` | File drop/upload zone. |
| `form.tsx` | `Form` | Radix Form primitives (`Form.Field`, `Form.Label`, `Form.Control`, `Form.Message`). |
| `heading.tsx` | `Heading`, `headingVariants` | Typography headings. |
| `hint.tsx` | `Hint` | Helper/error text (`variant="info" \| "error"`). |
| `hover-card.tsx` | `HoverCard`, `HoverCardTrigger`, `HoverCardContent` | Radix hover card. |
| `hover-menu.tsx` | `HoverMenu`, `HoverMenuContent`, `HoverMenuItem` | Hover-triggered menu. |
| `icon-button.tsx` | `IconButton`, `iconButtonVariants` | Icon-only button. |
| `icons.tsx` | `ConceptIcon`, `SectionIcon` | Single source for action/section icons (lucide). |
| `input.tsx` | `Input` | Text input; `type="search"` renders a search icon. |
| `label.tsx` | `Label`, `labelVariants` | Form label. |
| `navigation-menu.tsx` | Navigation menu parts | Radix navigation menu. |
| `page-tabs.tsx` | `PageTabs` | The dashboard tab bar (`variant="pill" \| "underline"`). |
| `popover.tsx` | `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor` | Radix popover. |
| `select.tsx` | Select parts | Radix select. |
| `select-field.tsx` | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`, `SelectValue` | Form-field select primitives. |
| `status-badge.tsx` | `StatusBadge`, `statusDotVariants` | Status pill with dot. |
| `sub-nav.tsx` | `SubNav` | Secondary navigation links. |
| `switch.tsx` | `Switch` | Radix switch. |
| `table.tsx` | Table parts | Table primitives (`Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`). |
| `tabs.tsx` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Radix tabs primitive. |
| `text.tsx` | `Text`, `textVariants` | Body text. |
| `textarea.tsx` | `Textarea` | Multi-line input. |
| `toggle.tsx` | `Toggle`, `toggleVariants` | Radix toggle button. |
| `toggle-group.tsx` | `ToggleGroup`, `ToggleGroupItem` | Radix toggle group. |
| `tooltip.tsx` | `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`, `TooltipPortal` | Radix tooltip. |

> There is **no** `radio-group.tsx` in the kit. Use `select.tsx` / `select-field.tsx`, `toggle-group.tsx`, or native radios for exclusive choices.

---

## Dashboard Primitives

| Primitive | File | Purpose |
|-----------|------|---------|
| `ActionRow*` | `ui/action-row.tsx` | Standard toolbar composition across dashboard list pages. |
| `PageTabs` | `ui/page-tabs.tsx` | Use instead of raw `Tabs` for dashboard tab bars. Supports links (`href`), state-driven tabs (`onSelect`), disabled tabs and rich tooltips. `indicatorId` must be unique per tab bar. |
| `ConceptIcon` | `ui/icons.tsx` | One glyph per action: `add`, `edit`, `delete`, `save`, `upload`, `search`, `filter`, `settings`, `back`, `previous`, `expand`, `duplicate`, `download`, `check`, `close`. |
| `SectionIcon` | `ui/icons.tsx` | One glyph per dashboard section (general, content, access, contributors, seo, translations, certification, analytics, domains, branding, automations, api, moderation, linkedCourse, episodes, distribution, notifications, announcements, users, userGroups, roles, signups, auditLogs, overview, learning, audience, learners, courses, podcasts, community). |

```tsx
import { ActionRow, ActionRowSearch, ActionRowSpacer, ActionRowActions } from '@components/ui/action-row'
import { PageTabs } from '@components/ui/page-tabs'
import { ConceptIcon, SectionIcon } from '@components/ui/icons'

<ActionRow>
  <ActionRowSearch value={q} onValueChange={setQ} placeholder="Search…" />
  <ActionRowSpacer />
  <ActionRowActions>
    <Button variant="primary" size="small">
      <ConceptIcon.add size={14} />
      New course
    </Button>
  </ActionRowActions>
</ActionRow>

<PageTabs
  variant="pill"
  indicatorId="course-settings-tabs"
  active={subpage}
  tabs={tabs.map((tab) => ({ ...tab, icon: SectionIcon[tab.id] }))}
/>
```

---

## Form Control and `asChild`

`Form.Control` from `ui/form.tsx` wraps Radix Form. With `asChild`, it forwards `setCustomValidity()`, which only exists on real form elements — wrap `Input`, `Textarea` or `select`, never a `<div>` component.

```tsx
// ✅ Input renders an <input>
<Form.Control asChild>
  <Input type="text" value={value} onChange={handleChange} />
</Form.Control>

// ❌ Renders a <div> → "setCustomValidity is not a function"
<Form.Control asChild>
  <LearningItemsList value={value} onChange={handleChange} />
</Form.Control>
```

---

## Styling Tokens

Tokens are CSS custom properties in `apps/web/styles/globals.css`, used through Tailwind classes. Examples that exist today:

| Class | Use |
|-------|-----|
| `bg-ui-bg-field` / `bg-ui-bg-field-hover` | Field background and hover |
| `text-ui-fg-base` / `text-ui-fg-muted` / `text-ui-fg-subtle` | Text colors |
| `shadow-borders-base` | 1px hairline border shadow |
| `txt-compact-small`, `txt-compact-small-plus`, `txt-compact-xsmall`, `txt-compact-medium-plus` | Compact text scales |

Common field style in forms:

```tsx
const fieldClassName =
  "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

<Input className={fieldClassName} />
```

---

## Icons

- `ConceptIcon` — recurring actions (add/edit/delete/save/upload/search/filter/settings/back/expand/duplicate/download/check/close).
- `SectionIcon` — dashboard section and tab icons.
- Plain `lucide-react` imports are fine for one-off glyphs, but recurring actions should go through `ConceptIcon`.

```tsx
import { ConceptIcon, SectionIcon } from '@components/ui/icons'

<ConceptIcon.filter size={14} />
<SectionIcon.settings size={16} />
```
