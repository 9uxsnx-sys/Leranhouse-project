# Select

> Value picker built on [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select). Two trigger variants share the same dropdown: the original Medusa button-style trigger (`@/components/ui/select`) and the form-field trigger (`@/components/ui/select-field`).

## Import

```tsx
// Form-field trigger — use this inside dashboard forms
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-field"

// Button-style trigger — use for toolbars and compact controls
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
```

Both modules export the same compound API, so switching a screen between the two variants is a one-line import change.

## Anatomy

```tsx
<Select value={difficulty} onValueChange={setDifficulty}>
  <SelectTrigger>
    <SelectValue placeholder="Select a level" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="Beginner">Beginner</SelectItem>
    <SelectItem value="Intermediate">Intermediate</SelectItem>
    <SelectItem value="Advanced">Advanced</SelectItem>
  </SelectContent>
</Select>
```

| Part | Responsibility |
|---|---|
| `Select` | Radix root; owns `value`, `onValueChange`, `disabled`, `open` |
| `SelectTrigger` | The closed control; renders the selected value plus a chevron |
| `SelectValue` | Renders the selected item's text, or the `placeholder` |
| `SelectContent` | Portalled dropdown panel (`position="popper"`, 8px offset, collision padding 24px) |
| `SelectItem` | Row with a 15px check indicator column and truncated text |

## Trigger variants

### `select-field` — matches `<Input/>`

Used across the course editor (difficulty, Twitter card type). The trigger is visually indistinguishable from a text field and can take the same `className` as its sibling inputs.

| Token class | Purpose |
|---|---|
| `bg-ui-bg-field` / `hover:bg-ui-bg-field-hover` | Same background as Input |
| `shadow-borders-base` | 1px hairline border |
| `h-8 rounded-md px-2 py-1.5` | Same box metrics as `Input size="base"` |
| `txt-compact-small` | 13px text |
| `data-[placeholder]:text-ui-fg-muted` | Muted placeholder |
| `ChevronDown` (`h-4 w-4`, `text-ui-fg-muted`) | Single affordance icon |
| `disabled:!bg-ui-bg-disabled disabled:text-ui-fg-disabled` | Disabled state |

Deliberate design decisions:

- **No blue focus/open ring.** The trigger keeps the field border while the menu is open; the dropdown panel is the interaction feedback.
- **A single chevron**, not the Medusa `TrianglesMini` (two triangles).
- Pass `className={fieldClassName}` when adjacent inputs use the bordered field style (as in the General tab).

### `select` — button-style trigger

The stock Medusa trigger (`bg-ui-bg-field` + `shadow-buttons-neutral`, `h-8`, `TrianglesMini` icon, blue active ring). Because it has no visible border it disappears next to bordered form fields — prefer `select-field` inside forms.

## Content and items

The dropdown is identical in both variants:

- `SelectContent` is portalled, `max-h-[200px]`, at least as wide as the trigger, rounded-lg with flyout shadow.
- Opening/closing uses fade + zoom + slide animations.
- `SelectItem` shows a check for the selected row, truncates long labels and applies the compact-small font.

## RTL

- The trigger uses `justify-between`, so the chevron moves to the left edge automatically under `dir="rtl"`.
- Text alignment inherits from the document direction; no physical `left`/`right` classes are used.
- Width is `w-full`; the popper matches `--radix-select-trigger-width`.

## Accessibility

- Radix handles `role="listbox"`, keyboard navigation, typeahead and focus return.
- `SelectValue placeholder` is announced as the `data-placeholder` state.
- Always provide an accessible name through the surrounding `FormLabelAndMessage` / `Form.Label`, or `aria-label` for icon-only contexts.

## Props

### Select (root)

| Prop | Type | Description |
|---|---|---|
| `value` | `string` | Controlled value |
| `defaultValue` | `string` | Uncontrolled initial value |
| `onValueChange` | `(value: string) => void` | Called when an item is chosen |
| `disabled` | `boolean` | Disables the trigger and items |
| `open` / `onOpenChange` | `boolean` / `(open: boolean) => void` | Controlled open state |

### SelectTrigger

| Prop | Type | Description |
|---|---|---|
| `className` | `string` | Merged after the base classes (last wins) |
| `disabled` | `boolean` | Field-disabled styling |
| `aria-label` / `id` | `string` | Forwarded to the trigger button |

All remaining Radix trigger props are forwarded.

## Related components

- **[Input](./input.md)** — the field design the `select-field` trigger mirrors.
- **[Dropdown Menu](./dropdown-menu.md)** — use for actions, not for choosing a value.
