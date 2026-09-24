# Button

> The Button component triggers actions and form submissions. It supports five Medusa visual variants, four shadcn-style aliases, five sizes, loading state, and icon slots — and can render as a child component via Radix's `Slot` pattern.

## Import

```tsx
import { Button } from "@/components/ui/button"
```

The Button is built with `class-variance-authority` (cva) and `clsx`/`tailwind-merge` via the shared `cn()` utility. It wraps a native `<button>` element and optionally uses `@radix-ui/react-slot` for the `asChild` prop.

## Variants

The component defines two sets of variant names — the canonical **Medusa** names and **shadcn/ui-style** aliases that map to the same visual styles.

### Medusa variants (preferred)

| Variant      | Visual style                                                    |
| ------------ | --------------------------------------------------------------- |
| `primary`    | `bg-ui-bg-interactive` background, white text, `shadow-buttons-inverted` |
| `secondary`  | `bg-ui-button-neutral` background, `shadow-buttons-neutral`     |
| `transparent`| No background, `text-ui-fg-base`, subtle hover                   |
| `danger`     | `bg-ui-button-danger` background (`#e11d48`), white text         |
| `link`       | Underlined text only — no padding, no background, `text-ui-fg-interactive` |

### shadcn/ui aliases

| Alias         | Maps to      |
| ------------- | ------------ |
| `default`     | `primary`    |
| `destructive` | `danger`     |
| `outline`     | `secondary`  |
| `ghost`       | `transparent`|

**Default variant:** `primary`

### Variant code reference

```tsx
// From the cva definition in button.tsx
primary:
  "bg-ui-bg-interactive text-ui-fg-on-color shadow-buttons-inverted",
secondary:
  "bg-ui-button-neutral text-ui-fg-base shadow-buttons-neutral",
transparent:
  "bg-transparent text-ui-fg-base hover:bg-ui-button-neutral-hover",
danger:
  "bg-ui-button-danger text-ui-fg-on-color",
link:
  "text-ui-fg-interactive underline-offset-4 hover:underline !p-0 !h-auto",
```

## Sizes

| Size      | Height | Padding            | Text style                |
| --------- | ------ | ------------------ | ------------------------- |
| `small`   | `h-7`  | `px-3`             | `txt-compact-xsmall-plus` |
| `base`    | `h-8`  | `px-3`             | `txt-compact-small-plus`  |
| `large`   | `h-10` | `px-4`             | `txt-compact-medium-plus` |
| `xlarge`  | `h-12` | `px-6`             | `txt-compact-large-plus`  |
| `icon`    | `h-8`  | `w-8` (square)     | —                         |

**Default size:** `base`

The `icon` size renders a square 32×32 button, ideal for icon-only toolbar actions (e.g., a search toggle or a "more" trigger).

## States

### Default

```tsx
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
```

### Hover

Each variant has a hover state defined in cva. For example, `secondary` uses `hover:bg-ui-button-neutral-hover`, and `transparent` uses `hover:bg-ui-button-neutral-hover`.

### Active / pressed

Active state is conveyed via `active:bg-ui-bg-interactive-pressed` (primary), `active:bg-ui-button-neutral-pressed` (secondary), etc.

### Disabled

```tsx
<Button disabled>Cannot submit</Button>
```

Disabled buttons apply `opacity-50 pointer-events-none` via the group state `group-disabled/button:opacity-50`. The cursor becomes `not-allowed`.

### Loading

```tsx
<Button isLoading>Please wait…</Button>
```

The loading state overlays the button content with a centered spinner:

- The original children are wrapped in a `<span className="invisible">` to preserve layout width.
- A spinner `<span>` is absolutely positioned at the center:
  ```tsx
  <span className="absolute inset-0 flex items-center justify-center">
    <span className="animate-spin rounded-full border-2 border-ui-fg-subtle border-t-transparent h-4 w-4" />
  </span>
  ```
- The button itself gets `pointer-events-none` and `bg-ui-bg-disabled` (if the variant normally uses a colored background).

## Icons

Icons are passed as children alongside text. Use `gap-x-1.5` on the Button wrapper (already applied by the component) to space the icon and label.

```tsx
<Button variant="secondary">
  <Plus />
  Add Module
</Button>
```

The icon size should typically be 16×16 (`h-4 w-4`) to match the `txt-compact-small-plus` text at the default size.

## `asChild` — Slot usage

When `asChild` is `true`, the Button delegates rendering to its child element using `@radix-ui/react-slot`. This is useful when the trigger element needs to be a different HTML element (e.g., a `<div>`, or a `<a>` for navigation).

```tsx
<Button asChild variant="link">
  <a href="/dashboard/courses">View all courses</a>
</Button>
```

## Props

| Prop        | Type                                                                  | Default     | Description                                   |
| ----------- | --------------------------------------------------------------------- | ----------- | --------------------------------------------- |
| `variant`   | `"primary" \| "secondary" \| "transparent" \| "danger" \| "link"`     | `"primary"` | Visual style                                  |
| `size`      | `"small" \| "base" \| "large" \| "xlarge" \| "icon"`                  | `"base"`    | Button dimensions                             |
| `isLoading` | `boolean`                                                             | `false`     | Shows spinner overlay, disables interactions  |
| `asChild`   | `boolean`                                                             | `false`     | Delegates rendering to child via Radix Slot   |
| `type`      | `"button" \| "submit" \| "reset"`                                     | `"button"`  | Native button type                            |

All standard HTML button attributes (`onClick`, `disabled`, `className`, etc.) are forwarded to the underlying element.

## Usage examples

### Toolbar buttons (ModuleForm)

```tsx
import { Button } from "@/components/ui/button"

// Primary save button with icon
<Button variant="primary" size="base" type="submit">
  <SaveAllIcon />
  Save
</Button>

// Secondary cancel / back button
<Button variant="secondary" size="base" onClick={handleBack}>
  <ArrowLeft />
  Back
</Button>

// Transparent select mode toggle
<Button variant="transparent" size="small" onClick={toggleSelectMode}>
  {selectMode ? "Done" : "Select"}
</Button>

// Small icon-only button in toolbar
<Button variant="transparent" size="icon" onClick={handleSort}>
  <ArrowUpDown className="h-4 w-4" />
</Button>
```

### Danger confirmation

```tsx
<Button variant="danger" onClick={confirmDelete}>
  <Trash2 />
  Delete course
</Button>
```

### Link-style navigation

```tsx
<Button variant="link" asChild>
  <a href="/courses/new">Create new course</a>
</Button>
```

## Related components

- **[DropdownMenu](./dropdown-menu.md)** — DropdownMenu.Trigger often wraps an IconButton or a plain `asChild` Button.
