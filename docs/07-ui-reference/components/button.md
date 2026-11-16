# Button

> Status: as-built · Last verified: 2026-11-16

> The Button component triggers actions and form submissions. It supports five Medusa visual variants, four shadcn-style aliases, five sizes, loading state, and icon slots — and can render as a child component via Radix's `Slot` pattern.

> **As-built:** every variant is a flat fill — no top-sheen, no drop shadow, no `overflow-hidden`. Geometry (padding, height, radius) is unchanged and signed off. See [Theme colour and button cleanup](../../08-features/ui-theme/theme-color-plan.md).

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
| `primary`    | Flat ink fill (`bg-ui-button-inverted`, `#27272a`), `text-ui-contrast-fg-primary` label |
| `secondary`  | White fill (`bg-ui-button-neutral`), 1px `ui-border-base` border, ink text |
| `transparent`| No fill, `text-ui-fg-base`, subtle hover background                          |
| `danger`     | Flat red fill (`bg-ui-button-danger`, `#e11d48`), white text                 |
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
  "text-ui-contrast-fg-primary bg-ui-button-inverted hover:bg-ui-button-inverted-hover active:bg-ui-button-inverted-pressed",
secondary:
  "text-ui-fg-base bg-ui-button-neutral border border-ui-border-base hover:bg-ui-button-neutral-hover active:bg-ui-button-neutral-pressed",
transparent:
  "text-ui-fg-base bg-ui-button-transparent hover:bg-ui-button-transparent-hover active:bg-ui-button-transparent-pressed disabled:!bg-transparent",
danger:
  "text-ui-fg-on-color bg-ui-button-danger hover:bg-ui-button-danger-hover active:bg-ui-button-danger-pressed focus-visible:ring-red-500/25",
link:
  "text-ui-fg-interactive underline-offset-4 hover:underline focus-visible:text-ui-fg-interactive-hover",
```

The aliases (`default` → `primary`, `destructive` → `danger`, `outline` → `secondary`, `ghost` → `transparent`) carry identical classes. Prefer the Medusa names in new code.

## Sizes

| Size      | Classes                                     | Notes                     |
| --------- | ------------------------------------------- | ------------------------- |
| `small`   | `txt-compact-small-plus px-2 py-1`          | Compact toolbar actions   |
| `base`    | `txt-compact-small-plus px-3 py-1.5`        | Default                   |
| `large`   | `txt-compact-medium-plus px-4 py-2.5`       | Page-level CTAs           |
| `xlarge`  | `txt-compact-large-plus px-5 py-3.5`        | Marketing / empty states  |
| `icon`    | `h-8 w-8 p-0`                               | Square 32×32 icon-only    |

Aliases: `default` → `base`, `sm` → `small`, `lg` → `large`. All sizes use a 6px icon gap (`gap-x-1.5`).

**Default size:** `base`

The `icon` size renders a square 32×32 button, ideal for icon-only toolbar actions (e.g., a search toggle or a "more" trigger).

## States

### Default

```tsx
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
```

### Hover

Each variant has its own hover fill from cva: `hover:bg-ui-button-inverted-hover` (primary), `hover:bg-ui-button-neutral-hover` (secondary), `hover:bg-ui-button-transparent-hover` (transparent), `hover:bg-ui-button-danger-hover` (danger).

### Active / pressed

`active:bg-ui-button-inverted-pressed` (primary), `active:bg-ui-button-neutral-pressed` (secondary), `active:bg-ui-button-transparent-pressed` (transparent), `active:bg-ui-button-danger-pressed` (danger).

### Focus

`focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900/20`. The `danger` variant overrides the ring to `ring-red-500/25`.

### Disabled

```tsx
<Button disabled>Cannot submit</Button>
```

Disabled buttons get `disabled:bg-ui-bg-disabled`, `disabled:border-ui-border-base`, `disabled:text-ui-fg-disabled` and `disabled:cursor-not-allowed` from the base class. There is no opacity change — the fill is replaced by the disabled surface colour.

### Loading

```tsx
<Button isLoading>Please wait…</Button>
```

The loading state sets the native `disabled` attribute and renders a full-size absolute overlay painted with `bg-ui-bg-disabled`, holding a centred 16px spinner:

```tsx
<span className="pointer-events-none">
  <span className="bg-ui-bg-disabled absolute inset-0 flex items-center justify-center rounded-md">
    <span className="size-4 animate-spin rounded-full border-2 border-ui-fg-subtle border-t-transparent" />
  </span>
  {children}
</span>
```

Because the overlay is opaque and the children still render after it, a `primary` button flips to the disabled grey surface while loading and the label stays visible on top of that overlay. That is the current as-built behaviour.

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
