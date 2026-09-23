# UI Component Library

> Koodook uses a custom port of the Medusa UI design system, built on Radix UI primitives with Tailwind CSS v4 styling, providing a consistent set of accessible, composable components.

---

## Medusa UI Components

The Medusa design system components live under `apps/web/components/ui/`. Each component is a thin wrapper around a Radix UI primitive with Medusa design tokens applied via Tailwind classes.

### Component Inventory

| Component | File | Based On | Purpose |
|-----------|------|----------|---------|
| `Button` | `ui/button.tsx` | Custom `<button>` | Primary, secondary, danger actions |
| `IconButton` | `ui/icon-button.tsx` | Custom `<button>` | Icon-only buttons |
| `Input` | `ui/input.tsx` | Custom `<input>` | Text inputs with search variant |
| `Textarea` | `ui/textarea.tsx` | Custom `<textarea>` | Multi-line text input |
| `Select` | `ui/select.tsx` | Radix Select | Dropdown selection |
| `Switch` | `ui/switch.tsx` | Radix Switch | Toggle control |
| `Checkbox` | `ui/checkbox.tsx` | Radix Checkbox | Checkbox input |
| `RadioGroup` | `ui/radio-group.tsx` | Radix RadioGroup | Radio button group |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | Radix DropdownMenu | Context menus |
| `Dialog` | `ui/dialog.tsx` | Radix Dialog | Modal dialogs |
| `Tabs` | `ui/tabs.tsx` | Radix Tabs | Tabbed interfaces |
| `Table` | `ui/table.tsx` | Custom `<table>` | Data tables |
| `Popover` | `ui/popover.tsx` | Radix Popover | Floating panels |
| `Tooltip` | `ui/tooltip.tsx` | Radix Tooltip | Hover tooltips |
| `Badge` | `ui/badge.tsx` | Custom `<span>` | Status badges |
| `StatusBadge` | `ui/status-badge.tsx` | Custom | Status indicators |
| `Avatar` | `ui/avatar.tsx` | Radix Avatar | User avatars |
| `Label` | `ui/label.tsx` | Radix Label | Form labels |
| `Hint` | `ui/hint.tsx` | Custom | Form hint text |
| `Form` | `ui/form.tsx` | Radix Form | Form primitives |
| `Heading` | `ui/heading.tsx` | Custom `<h1>`-`<h6>` | Typography headings |
| `Text` | `ui/text.tsx` | Custom `<p>` | Body text |
| `Container` | `ui/container.tsx` | Custom `<div>` | Layout container |
| `SubNav` | `ui/sub-nav.tsx` | Custom | Sub-navigation |
| `NavigationMenu` | `ui/navigation-menu.tsx` | Radix NavigationMenu | Main navigation |
| `Toggle` | `ui/toggle.tsx` | Radix Toggle | Toggle button |
| `ToggleGroup` | `ui/toggle-group.tsx` | Radix ToggleGroup | Toggle button group |
| `HoverCard` | `ui/hover-card.tsx` | Radix HoverCard | Hover card |
| `FileUpload` | `ui/file-upload.tsx` | Custom | File upload zone |
| `Alert` | `ui/alert.tsx` | Custom | Alert banners |

---

## Key Component Examples

### Input (`@components/ui/input`)

Supports `size` prop (`"base"` | `"small"`) and auto-detects `type="search"` to show a search icon:

```tsx
import { Input } from '@/components/ui/input'

<Input
  className="bg-ui-bg-field shadow-borders-base"
  onChange={handleChange}
  value={value}
  type="text"
  required
/>
<Input type="search" placeholder="Search..." size="small" />
```

### Button (`@components/ui/button`)

Supports variants (`primary`, `secondary`, `danger`, `transparent`) and sizes:

```tsx
import { Button } from '@/components/ui/button'

<Button variant="primary" size="base" onClick={handleSave}>
  Save Changes
</Button>
<Button variant="secondary" size="small">
  Cancel
</Button>
```

### DropdownMenu (`@components/ui/dropdown-menu`)

Built on Radix DropdownMenu with Medusa styling:

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { MoreVertical } from 'lucide-react'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <IconButton>
      <MoreVertical size={16} />
    </IconButton>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Switch (`@components/ui/switch`)

Built on Radix Switch:

```tsx
import { Switch } from '@/components/ui/switch'

<Switch checked={enabled} onCheckedChange={setEnabled} />
```

### Tabs (`@components/ui/tabs`)

Built on Radix Tabs:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="content">Content</TabsTrigger>
    <TabsTrigger value="access">Access</TabsTrigger>
  </TabsList>
  <TabsContent value="general">...</TabsContent>
  <TabsContent value="content">...</TabsContent>
  <TabsContent value="access">...</TabsContent>
</Tabs>
```

### Table (`@components/ui/table`)

```tsx
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Course Name</TableCell>
      <TableCell><StatusBadge status="published" /></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## The `asChild` Pattern with Radix

Radix UI components support an `asChild` prop that forwards the component's behavior to a single child element. This is used extensively with `Form.Control`:

```tsx
import * as Form from '@radix-ui/react-form'
import { Input } from '@/components/ui/input'

<Form.Field name="name">
  <Form.Label>Name</Form.Label>
  <Form.Control asChild>
    <Input type="text" onChange={handleChange} value={value} />
  </Form.Control>
  <Form.Message match="valueMissing">Required</Form.Message>
</Form.Field>
```

---

## ⚠️ WARNING: `Form.Control asChild` Wrapping a `<div>`

`Form.Control` with `asChild` passes through all Radix form control attributes, including `setCustomValidity()`. If `asChild` wraps a `<div>` (or a component that renders a `<div>`), the browser will throw:

> `Uncaught TypeError: element.setCustomValidity is not a function`

**This happens because `setCustomValidity` is only available on actual form elements** (`<input>`, `<textarea>`, `<select>`), not on `<div>` elements.

### Safe Pattern — wrap actual form elements:

```tsx
// ✅ CORRECT — Input renders an <input>
<Form.Control asChild>
  <Input type="text" onChange={handleChange} value={value} />
</Form.Control>

// ✅ CORRECT — Textarea renders a <textarea>
<Form.Control asChild>
  <Textarea onChange={handleChange} value={value} />
</Form.Control>
```

### Unsafe Pattern — avoid wrapping non-form elements:

```tsx
// ❌ WRONG — LearningItemsList might render a <div>
<Form.Control asChild>
  <LearningItemsList value={value} onChange={handleChange} />
</Form.Control>
```

When you need to use a custom component that doesn't render a native form element, place the `Form.Control` wrapper on an actual input inside the component, or use `Form.Control` without `asChild`:

```tsx
// ✅ Alternative — don't use asChild with custom components
<Form.Label>Learning Objectives</Form.Label>
<LearningItemsList value={value} onChange={handleChange} />
```

---

## Styling with Tailwind + Medusa Tokens

Medusa design tokens are applied as Tailwind utility classes. These tokens map to CSS custom properties defined in the design system:

### Common Token Classes

| Token Class | Purpose |
|-------------|---------|
| `bg-ui-bg-field` | Field background color (#fafafa) |
| `bg-ui-bg-field-hover` | Field hover state |
| `bg-ui-bg-component` | Component surface background |
| `bg-ui-bg-component-hover` | Component hover state |
| `bg-ui-bg-disabled` | Disabled state background |
| `shadow-borders-base` | Default border shadow |
| `shadow-borders-interactive-with-active` | Focus ring (blue-600) |
| `shadow-borders-error` | Error state border |
| `shadow-elevation-flyout` | Dropdown/dialog shadow |
| `text-ui-fg-base` | Primary text color |
| `text-ui-fg-muted` | Muted text color |
| `text-ui-fg-subtle` | Subtle text color |
| `text-ui-fg-disabled` | Disabled text color |
| `txt-compact-small` | Compact small text style |
| `txt-compact-small-plus` | Compact small text (semibold) |
| `txt-compact-xsmall-plus` | Extra small compact text |

### Custom Field Style (common pattern in forms)

```tsx
const fieldClassName =
  "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

<Input className={fieldClassName} ... />
```

### Layout Cards (dashboard pattern)

```tsx
<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
  {/* Card content */}
</div>
```

---

## Icon Usage

Icons come from two sources:

### Lucide React (recommended for most icons)

```tsx
import { Settings, Users, BookOpen, Globe, Lock, Search, BarChart3, Plus, X, GripVertical } from 'lucide-react'

<Settings size={16} />
<Plus size={13} className="text-blue-500" />
```

### Custom Icons (`@components/Objects/Icons`)

```tsx
import { DiscordIcon } from '@components/Objects/Icons/DiscordIcon'
import { MedusaIcons } from '@components/Objects/Icons/MedusaIcons'
```

Used for brand-specific icons that aren't in the Lucide set.
