# Design Tokens

> All visual design tokens (colors, shadows, typography, spacing, and border radii) used by the Koodook Medusa UI port, defined as Tailwind v4 `@theme` values and `@utility` classes in `apps/web/styles/globals.css`.

## Color Palette

### Primary / Brand

The brand accent color is used for primary buttons, interactive elements, and focus rings.

| Token | Value | Usage |
|---|---|---|
| `--primary` / `--ring` | `hsl(243 75% 59%)` — equivalent to `#6366f1` (Indigo) | Primary buttons, focus rings, brand elements |
| `--brand` | `#6366f1` | Public header brand color (overridable per-org) |

### Gray Scale

The Medusa UI port defines a full gray scale through `ui-fg-*` (foreground/text) and `ui-bg-*` (background) tokens. These are the core neutral colors.

| Token | Value | Usage |
|---|---|---|
| `--color-ui-fg-base` | `#18181b` (Zinc-900) | Primary body text |
| `--color-ui-fg-subtle` | `#52525b` (Zinc-600) | Secondary text, hints |
| `--color-ui-fg-muted` | `#71717a` (Zinc-500) | Placeholder text, disabled labels |
| `--color-ui-fg-disabled` | `#a1a1aa` (Zinc-400) | Disabled text |
| `--color-ui-fg-on-color` | `#ffffff` | Text on colored backgrounds (buttons) |
| `--color-ui-fg-on-inverted` | `#ffffff` | Text on inverted backgrounds |
| `--color-ui-fg-interactive` | `#3b82f6` (Blue-500) | Interactive text (links) |
| `--color-ui-fg-interactive-hover` | `#2563eb` (Blue-600) | Interactive text hover |
| `--color-ui-fg-error` | `#e11d48` (Rose-600) | Error text and icons |

### Semantic Colors

| Token | Value | Usage |
|---|---|---|
| `--color-ui-bg-interactive` | `#3b82f6` (Blue-500) | Switch checked state, active indicators |
| `--color-ui-border-interactive` | `#3b82f6` | Focused input borders |
| `--color-ui-border-error` | `#e11d48` (Rose-600) | Error state borders |
| `--color-ui-border-danger` | `#be123c` (Rose-700) | Danger button borders |
| `--color-ui-border-loud` | `rgba(24, 24, 27, 1)` | Strong borders |

### Background Colors

| Token | Value | Usage |
|---|---|---|
| `--color-ui-bg-base` | `#ffffff` | Card/container backgrounds |
| `--color-ui-bg-base-hover` | `#f4f4f5` | Card/container hover |
| `--color-ui-bg-subtle` | `#fafafa` | Page background, subtle sections |
| `--color-ui-bg-subtle-hover` | `#f4f4f5` | Subtle background hover |
| `--color-ui-bg-subtle-pressed` | `#e4e4e7` | Subtle background pressed |
| `--color-ui-bg-overlay` | `rgba(24, 24, 27, 0.4)` | Modal/overlay backdrops |
| `--color-ui-bg-component` | `#fafafa` | Dropdown menu, popover backgrounds |
| `--color-ui-bg-component-hover` | `#f4f4f5` | Dropdown item hover |
| `--color-ui-bg-component-pressed` | `#e4e4e7` | Dropdown item pressed |
| `--color-ui-bg-field` | `#fafafa` | Input field background |
| `--color-ui-bg-field-hover` | `#f4f4f5` | Input field hover |
| `--color-ui-bg-disabled` | `#f4f4f5` | Disabled field/button background |
| `--color-ui-bg-highlight` | `#eff6ff` | Highlighted/selected rows |
| `--color-ui-bg-switch-off` | `#e4e4e7` | Switch track (unchecked) |
| `--color-ui-bg-switch-off-hover` | `#d4d4d8` | Switch track hover (unchecked) |
| `--background` | `hsl(0 0% 98.5%)` → `#f8f8f8` | Root page background (`bg-background`) |
| `--color-canvas` | `#fafafa` | Board/canvas background |

### Text Colors

| Token | Value | Usage |
|---|---|---|
| `--color-ui-fg-base` | `#18181b` | Primary text |
| `--color-ui-fg-subtle` | `#52525b` | Secondary text, metadata |
| `--color-ui-fg-muted` | `#71717a` | Placeholder, disabled text |
| `--color-ui-fg-disabled` | `#a1a1aa` | Disabled element text |
| `--color-ui-fg-error` | `#e11d48` | Error messages |

### Border Colors

| Token | Value | Usage |
|---|---|---|
| `--color-ui-border-base` | `#e4e4e7` | Default borders |
| `--color-ui-border-strong` | `#d4d4d8` | Stronger borders (focus) |
| `--color-ui-border-interactive` | `#3b82f6` | Active/focused border |
| `--color-ui-border-error` | `#e11d48` | Error state border |

### Button Colors

| Token | Value | Usage |
|---|---|---|
| `--color-ui-button-inverted` | `#27272a` | Primary button bg |
| `--color-ui-button-inverted-hover` | `#3f3f46` | Primary button hover |
| `--color-ui-button-inverted-pressed` | `#52525b` | Primary button pressed |
| `--color-ui-button-neutral` | `#ffffff` | Secondary button bg |
| `--color-ui-button-neutral-hover` | `#f4f4f5` | Secondary button hover |
| `--color-ui-button-neutral-pressed` | `#e4e4e7` | Secondary button pressed |
| `--color-ui-button-transparent` | `transparent` | Transparent button bg |
| `--color-ui-button-transparent-hover` | `#f4f4f5` | Transparent button hover |
| `--color-ui-button-transparent-pressed` | `#e4e4e7` | Transparent button pressed |
| `--color-ui-button-danger` | `#e11d48` | Danger button bg |
| `--color-ui-button-danger-hover` | `#be123c` | Danger button hover |
| `--color-ui-button-danger-pressed` | `#9f1239` | Danger button pressed |

### Tag / Status Badge Colors

Status badges use a consistent pattern of `bg` / `text` / `border` / `icon` tokens per color.

| Token Group | Background | Text | Border | Icon |
|---|---|---|---|---|
| Neutral | `#f4f4f5` | `#52525b` | `#e4e4e7` | `#a1a1aa` |
| Green | `#d1fae5` | `#065f46` | `#a7f3d0` | `#10b981` |
| Red | `#ffe4e6` | `#9f1239` | `#fecdd3` | `#f43f5e` |
| Blue | `#dbeafe` | `#1e40af` | `#bfdbfe` | `#60a5fa` |
| Orange | `#ffedd5` | `#9a3412` | `#fed7aa` | `#f97316` |
| Purple | `#ede9fe` | `#5b21b6` | `#ddd6fe` | `#a78bfa` |

## Spacing

The Koodook dashboard uses the standard Tailwind spacing scale, which is based on a 4px grid (1 unit = 4px). Common spacing values:

| Class | Value | Common Usage |
|---|---|---|
| `gap-1` / `space-y-1` | 4px | Tight icon+text spacing |
| `gap-1.5` | 6px | Button icon gap (`gap-x-1.5`) |
| `gap-2` | 8px | Dropdown item icon spacing |
| `gap-3` | 12px | Between related form elements |
| `gap-4` / `p-4` | 16px | Standard padding |
| `gap-5` / `p-5` | 20px | Section padding |
| `gap-6` / `p-6` | 24px | Card padding (Container) |
| `gap-8` / `space-y-8` | 32px | Between form sections |

## Typography

### Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...;
```

Set on `html, body` with `letter-spacing: -0.01em`.

### Text Utilities

All text styles are defined as Tailwind v4 `@utility` classes:

| Utility | Font Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `txt-compact-small-plus` | 13px | 20px | 500 | Buttons (all sizes), body emphasis |
| `txt-compact-small` | 13px | 20px | 400 | Dropdown items, labels |
| `txt-compact-xsmall` | 12px | 16px | 500 | Small labels, metadata |
| `txt-compact-xsmall-plus` | 12px | 20px | 500 | Dropdown labels, status badges |
| `txt-compact-medium-plus` | 14px | 20px | 500 | Large buttons |
| `txt-compact-large-plus` | 16px | 20px | 500 | XLarge buttons |
| `txt-small` | 13px | 20.8px | 400 | Textarea content, hints |
| `txt-medium-plus` | 14px | 22.4px | 500 | Body emphasis |

### Heading Utilities

| Utility | Font Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `h1-core` | 18px | 28px | 500 | Page titles |
| `h2-core` | 16px | 24px | 500 | Section headings |
| `h3-core` | 14px | 20px | 500 | Sub-section headings |

### Label Variants

The `<Label>` component supports these size/weight combinations via `labelVariants` cva:

| size | weight | Utility |
|---|---|---|
| `xsmall` | `regular` | `txt-compact-xsmall` |
| `small` | `plus` | `txt-compact-small` with `font-medium` |
| `base` (default) | `regular` | `txt-compact-medium` (not defined as utility, uses font-medium) |
| `large` | `regular` | `txt-compact-large` (not defined as utility) |

## Shadows

All shadow utilities are defined as Tailwind v4 `@utility` classes in `globals.css`:

### Card Elevation

| Utility | Box Shadow | Usage |
|---|---|---|
| `shadow-elevation-card-rest` | 1px hairline + 2px y-offset + 4px blur | Container cards, module/lesson cards |
| `shadow-elevation-card-hover` | 1px hairline + 2px y-offset + 8px blur | Card hover state |
| `shadow-elevation-flyout` | 1px hairline + 8px y-offset + 16px blur | Dropdown menus, popovers |
| `shadow-elevation-modal` | White inset + hairline + 16px blur | Modal dialogs |
| `shadow-elevation-tooltip` | 1px hairline + 4px y-offset + 8px blur | Tooltips |

### Borders (Input/Button)

| Utility | Box Shadow | Usage |
|---|---|---|
| `shadow-borders-base` | 1px y-offset + 1px hairline | Default input/button border |
| `shadow-borders-error` | 1px red hairline + 3px red glow | Invalid input state |
| `shadow-borders-focus` | White gap + blue ring | Focus ring |
| `shadow-borders-interactive-with-active` | 4px blue glow + 1px blue border | Active/focused input |

### Button Shadows

| Utility | Usage |
|---|---|
| `shadow-buttons-inverted` | Primary button |
| `shadow-buttons-inverted-focus` | Primary button focused |
| `shadow-buttons-neutral` | Secondary button |
| `shadow-buttons-neutral-focus` | Secondary button focused |
| `shadow-buttons-danger` | Danger button |
| `shadow-buttons-danger-focus` | Danger button focused |

### Switch Shadows

| Utility | Usage |
|---|---|
| `shadow-details-switch-background` | Switch track (unchecked) |
| `shadow-details-switch-background-focus` | Switch track focused |
| `shadow-details-switch-handle` | Switch thumb |

## Border Radii

| Class | Value | Usage |
|---|---|---|
| `rounded-md` | 6px (default `--radius`) | Buttons, inputs, dropdown items |
| `rounded-lg` | 8px | Container cards, dropdown menu |
| `rounded-xl` | 12px | Sectioned cards, module/lesson cards |
| `rounded-full` | 9999px | Switch track, status dots |

## Z-Index Layering System

Defined as CSS custom properties on `:root`:

| Variable | Value | Usage |
|---|---|---|
| `--z-behind` | -10 | Behind everything |
| `--z-dropdown` | 100 | Dropdown menus |
| `--z-popover` | 250 | Popovers |
| `--z-tooltip` | 250 | Tooltips |
| `--z-modal-backdrop` | 200 | Modal overlay |
| `--z-modal` | 210 | Modal content |
| `--z-toast` | 300 | Toast notifications |
| `--z-max` | 9999 | Critical overlays |

## Animations

### Transition Utility

```css
@utility transition-fg {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Used on all interactive elements (buttons, inputs, dropdown items) for smooth color/border transitions.

### Modal Animations

- **Enter**: `modalEnter` — 200ms, cubic-bezier(0.16, 1, 0.3, 1), opacity 0→1 + scale 0.94→1
- **Exit**: `modalExit` — 120ms, cubic-bezier(0.4, 0, 1, 1), opacity 1→0 + scale 1→0.96
- **Overlay enter**: 160ms ease-out
- **Overlay exit**: 130ms ease-in

### Dropdown Menu Animations

Dropdown menus use Tailwind's built-in `animate-in` / `animate-out` classes for enter/exit transitions, including fade, zoom, and slide-from-side effects.
