# UI Reference

> A comprehensive reference for the Medusa design system components, design tokens, and common UI patterns used throughout the Koodook platform.

## Overview

This section documents the visual design system and reusable UI components powering the Koodook dashboard. The interface is built on a **ported subset of Medusa UI** — the design system from `@medusajs/ui` — adapted into local Tailwind CSS v4 utilities and React components. Every component, token, and pattern documented here reflects the actual code in the repository.

### Purpose

This reference serves two audiences:

- **Developers** building or modifying dashboard pages need to know which components exist, how to use them correctly, and what tokens are available.
- **Designers** and reviewers need a shared vocabulary for discussing layout, spacing, color, and interaction behavior.

### How to Use This Reference

| If you want to... | Start here |
|---|---|
| Understand the color palette, spacing, typography | [Design Tokens](./design-tokens.md) |
| Build a button for a form or action | [Button](./components/button.md) |
| Add a text field, textarea, or search input | [Input](./components/input.md) |
| Create a toggle or switch control | [Switch](./components/switch.md) |
| Build a context menu or dropdown | [Dropdown Menu](./components/dropdown-menu.md) |
| Implement auto-save, drag-and-drop, or layout patterns | [Patterns](./patterns.md) |

### Relationship to Medusa UI

The Koodook dashboard does **not** use the `@medusajs/ui` npm package directly. Instead, it ports a subset of Medusa's visual language:

- **Design tokens** (colors, shadows, typography) are defined as Tailwind v4 `@theme` values and `@utility` classes in `apps/web/styles/globals.css`.
- **Components** (Button, Input, Switch, DropdownMenu, etc.) are implemented as local React components under `apps/web/components/ui/`, ported 1:1 from the Medusa source and adapted to use the local token classes via the `cn()` utility.
- **Form primitives** (Form.Item, Form.Label, Form.Control, Form.ErrorMessage, Form.Hint) provide a Medusa-style wrapper around Formik integration.

## Source Files

The following table maps each documented UI element to its source file and location.

| Component / Token | Source File | Path |
|---|---|---|
| All design tokens (colors, shadows, typography) | `globals.css` | `apps/web/styles/globals.css` |
| Button | `button.tsx` | `apps/web/components/ui/button.tsx` |
| Input | `input.tsx` | `apps/web/components/ui/input.tsx` |
| Textarea | `textarea.tsx` | `apps/web/components/ui/textarea.tsx` |
| Switch | `switch.tsx` | `apps/web/components/ui/switch.tsx` |
| DropdownMenu (and sub-components) | `dropdown-menu.tsx` | `apps/web/components/ui/dropdown-menu.tsx` |
| Form.Item, Form.Label, Form.Control, Form.ErrorMessage, Form.Hint | `form.tsx` | `apps/web/components/ui/form.tsx` |
| Label | `label.tsx` | `apps/web/components/ui/label.tsx` |
| Hint | `hint.tsx` | `apps/web/components/ui/hint.tsx` |
| IconButton | `icon-button.tsx` | `apps/web/components/ui/icon-button.tsx` |
| Container (card) | `container.tsx` | `apps/web/components/ui/container.tsx` |
| StatusBadge | `status-badge.tsx` | `apps/web/components/ui/status-badge.tsx` |
| Badge | `badge.tsx` | `apps/web/components/ui/badge.tsx` |
| Dialog/Modal | `dialog.tsx` | `apps/web/components/ui/dialog.tsx` |
| Select | `select.tsx` | `apps/web/components/ui/select.tsx` |
| Checkbox | `checkbox.tsx` | `apps/web/components/ui/checkbox.tsx` |
| Tabs | `tabs.tsx` | `apps/web/components/ui/tabs.tsx` |
| Tooltip | `tooltip.tsx` | `apps/web/components/ui/tooltip.tsx` |
| Alert | `alert.tsx` | `apps/web/components/ui/alert.tsx` |
| cn() utility | `utils.ts` | `apps/web/lib/utils.ts` |
| debounce() utility | `utils.ts` | `apps/web/lib/utils.ts` |
| CourseContext (DebounceManager, auto-save) | `CourseContext.tsx` | `apps/web/components/Contexts/CourseContext.tsx` |
| SaveState component | `SaveState.tsx` | `apps/web/components/Dashboard/Misc/SaveState.tsx` |

## Design Philosophy

The Medusa port retains the core visual philosophy of the original design system:

- **Monochromatic by default** — roughly 95% of the UI uses black, white, and shades of gray. Color is used sparingly as an accent (primary interactive elements) or as a semantic signal (error states, status badges).
- **Borders instead of shadows** — containers and cards use hairline borders (`shadow-elevation-card-rest`) rather than large box-shadows for depth.
- **Subtle hover states** — interactive elements change background color on hover rather than adding shadows or transforms.
- **Consistent density** — a 4px spacing grid (via Tailwind's standard scale) and compact typography keep the interface information-dense but readable.
