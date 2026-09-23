# DropdownMenu

> The DropdownMenu component presents a compact list of actions or navigation options in a floating panel. Built on `@radix-ui/react-dropdown-menu`, it supports items with icons, separators, sub-menus, checkbox items, radio groups, keyboard shortcuts, and danger-style items — all styled with Medusa tokens.

## Import

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
```

The component is a full port of `@radix-ui/react-dropdown-menu` wrapped with Medusa styling via `cn()`.

## Trigger

The trigger is any interactive element wrapped in `DropdownMenuTrigger`. The standard pattern uses `asChild` with an **IconButton**:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <IconButton variant="transparent">
      <MoreVertical className="h-4 w-4" />
    </IconButton>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* items */}
  </DropdownMenuContent>
</DropdownMenu>
```

Alternatively, a plain `<button>` or `<Button>` can be used:

```tsx
<DropdownMenuTrigger asChild>
  <button className="p-1">
    <MoreHorizontal className="h-5 w-5" />
  </button>
</DropdownMenuTrigger>
```

## Content (the menu panel)

### Styling

| Token class                       | Purpose                          |
| --------------------------------- | -------------------------------- |
| `bg-ui-bg-component`              | White background                 |
| `shadow-elevation-flyout`         | Elevated shadow                  |
| `rounded-lg`                      | 8px border radius                |
| `p-1`                             | 4px inner padding                |

### Animations

The content uses Radix's built-in animation utilities:

```tsx
data-[side="top"]:animate-slide-in-from-bottom
data-[side="bottom"]:animate-slide-in-from-top
data-[side="left"]:animate-slide-in-from-right
data-[side="right"]:animate-slide-in-from-left
```

These animate the menu entrance with a subtle translate + fade.

## Menu items

### Default item

```tsx
<DropdownMenuItem>
  <Edit className="h-3.5 w-3.5" />
  Rename
  <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
</DropdownMenuItem>
```

| Property     | Token class / value                         |
| ------------ | ------------------------------------------- |
| Padding      | `px-2 py-1`                                 |
| Border radius| `rounded-md` (6px)                          |
| Hover        | `bg-ui-bg-base-hover`                       |
| Cursor       | `cursor-pointer`                            |
| Icon spacing | `gap-2` between icon and text               |

### Danger item

```tsx
<DropdownMenuItem className="text-red-600">
  <Trash2 className="h-3.5 w-3.5" />
  Delete
</DropdownMenuItem>
```

Apply `text-red-600` to the item for destructive actions. No special variant prop exists — the class is added directly.

### Disabled item

```tsx
<DropdownMenuItem disabled>
  <Lock className="h-3.5 w-3.5" />
  Archived
</DropdownMenuItem>
```

Disabled items use `pointer-events-none` and reduced opacity.

## Separator

```tsx
<DropdownMenuSeparator />
```

Renders as a `<hr>` with `bg-ui-bg-base-hover` and `mx-1 my-0.5`.

## Labels

```tsx
<DropdownMenuLabel>Actions</DropdownMenuLabel>
<DropdownMenuSeparator />
<DropdownMenuItem>Item 1</DropdownMenuItem>
<DropdownMenuItem>Item 2</DropdownMenuItem>
```

Labels use `txt-compact-xsmall-plus` and `text-ui-fg-subtle` with `px-2 py-1` padding.

## Keyboard shortcuts

```tsx
<DropdownMenuItem>
  Duplicate
  <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
</DropdownMenuItem>
```

Shortcuts are rendered with `ml-auto txt-small text-ui-fg-subtle`.

## Sub-menus

```tsx
<DropdownMenuSub>
  <DropdownMenuSubTrigger>
    <Move className="h-3.5 w-3.5" />
    Move to
  </DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <DropdownMenuItem>Module 1</DropdownMenuItem>
    <DropdownMenuItem>Module 2</DropdownMenuItem>
  </DropdownMenuSubContent>
</DropdownMenuSub>
```

Sub-triggers include a `ChevronRight` icon at the end (added automatically). Sub-content uses the same styling as the main content.

## Checkbox items

```tsx
<DropdownMenuCheckboxItem
  checked={showCompleted}
  onCheckedChange={setShowCompleted}
>
  Show completed
</DropdownMenuCheckboxItem>
```

Checkbox items include a checkmark indicator rendered by Radix.

## Radio items

```tsx
<DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
  <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>
```

## Width control

The content panel auto-sizes to fit its content. For narrow menus (e.g., 2 items), apply a width class:

```tsx
<DropdownMenuContent className="w-28 min-w-0">
  <DropdownMenuItem>Duplicate</DropdownMenuItem>
  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
</DropdownMenuContent>
```

Typical widths:

| Width    | Class         | Use case                          |
| -------- | ------------- | --------------------------------- |
| Narrow   | `w-28`        | 2-item menus (Duplicate / Delete) |
| Default  | `min-w-[220px]` | 3+ items with icons             |
| Wide     | `w-48`        | Items with long labels            |

## Real-world examples

### 3-dot menu in course structure (EditCourseStructure.tsx)

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <IconButton variant="transparent" size="small">
      <MoreVertical className="h-4 w-4" />
    </IconButton>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-28 min-w-0">
    <DropdownMenuItem onSelect={() => handleDuplicate(item)}>
      <Copy className="h-3.5 w-3.5" />
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuItem
      className="text-red-600"
      onSelect={() => handleDelete(item)}
    >
      <Trash2 className="h-3.5 w-3.5" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Module-level actions (ModuleForm.tsx)

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <IconButton variant="transparent" size="small">
      <MoreVertical className="h-4 w-4" />
    </IconButton>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Module actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={handleRename}>
      <Edit className="h-3.5 w-3.5" />
      Rename
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={handleDuplicate}>
      <Copy className="h-3.5 w-3.5" />
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-red-600" onSelect={handleDelete}>
      <Trash2 className="h-3.5 w-3.5" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Props

### DropdownMenuContent

| Prop       | Type               | Default | Description                      |
| ---------- | ------------------ | ------- | -------------------------------- |
| `className`| `string`           | —       | Additional classes (e.g., `w-28`)|
| `sideOffset`| `number`          | `4`     | Gap between trigger and content  |

### DropdownMenuItem

| Prop       | Type                     | Default | Description                      |
| ---------- | ------------------------ | ------- | -------------------------------- |
| `disabled` | `boolean`                | —       | Disabled state                   |
| `onSelect` | `(event: Event) => void` | —       | Called when the item is selected |
| `className`| `string`                 | —       | Additional classes               |

All standard Radix DropdownMenu props are forwarded.

## Related components

- **[IconButton](./icon-button.md)** — The standard trigger for 3-dot menus (MoreVertical icon).
- **[Button](./button.md)** — Alternative trigger for text-labeled menus.
