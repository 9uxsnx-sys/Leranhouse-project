# UI Interaction Patterns

> This guide documents the common interaction patterns used throughout the Koodook dashboard — auto-saving, drag-and-drop reordering, sectioned card layouts, search bars with sort toggles, loading states, and error handling. These patterns are repeated across multiple form and list views.

## Auto-save

Auto-save automatically persists user changes after a brief delay, eliminating the need for explicit "Save" buttons in form views. The pattern is implemented at two levels: **component-local** (e.g., LessonDetailForm) and **global via DebounceManager** (CourseContext).

### Local debounce (600ms) — LessonDetailForm

The lesson detail form debounces field changes by 600ms before triggering a save to the server:

```tsx
import { debounce } from "@/lib/utils"

const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
const latestValuesRef = useRef(values)

// Keep latest values in a ref to avoid stale closures
useEffect(() => {
  latestValuesRef.current = values
}, [values])

// Debounced save: waits 600ms after last change, then saves
const debouncedSave = useCallback(
  debounce((valuesToSave: LessonValues) => {
    saveLesson(valuesToSave)
  }, 600),
  []
)

// Trigger debounced save on value change
useEffect(() => {
  if (isInitialized) {
    debouncedSave(values)
  }
}, [values, debouncedSave, isInitialized])
```

**Critical: Flush on unmount** — changes are flushed when the user navigates away so nothing is lost:

```tsx
useEffect(() => {
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      // Save the latest values immediately before unmount
      saveLesson(latestValuesRef.current)
    }
  }
}, [])
```

### Global DebounceManager (500ms) — CourseContext

The `DebounceManager` class provides a centralized debounce system used by `useCourseFieldSync`:

```tsx
class DebounceManager {
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private pendingValues: Map<string, unknown> = new Map()

  register(key: string, fn: () => void, delay: number = 500) {
    this.pendingValues.set(key, true)
    this.cancel(key)
    this.timers.set(
      key,
      setTimeout(() => {
        fn()
        this.timers.delete(key)
        this.pendingValues.delete(key)
      }, delay)
    )
  }

  cancel(key: string) {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
      this.pendingValues.delete(key)
    }
  }

  flush(key: string) {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
      this.pendingValues.delete(key)
      // Execute immediately
    }
  }

  cancelAll() {
    this.timers.forEach((timer) => clearTimeout(timer))
    this.timers.clear()
    this.pendingValues.clear()
  }
}
```

The `useCourseFieldSync` hook wraps form field changes to automatically sync with the server:

```tsx
const syncChanges = useCallback(
  (field: string, value: unknown) => {
    debounceManager.register(
      field,
      () => {
        api.patch(`/courses/${courseId}`, { [field]: value })
      },
      500
    )
  },
  [courseId]
)
```

### SaveState indicator

A `SaveState` component shows the current persistence status:

| State     | Visual                                        |
| --------- | --------------------------------------------- |
| `saved`   | Green checkmark (`Check` icon) + "Saved"      |
| `unsaved` | Yellow/orange indicator (`SaveAllIcon` icon)  |
| `saving`  | Spinning loader (`Loader2` with `animate-spin`) |
| `error`   | Red alert (`AlertCircle` icon) + "Error"      |

## Drag and drop

List reordering uses the **native HTML5 Drag and Drop API** — no third-party library is needed.

### Implementation pattern

```tsx
const handleDragStart = (e: React.DragEvent, index: number) => {
  e.dataTransfer.setData("text/plain", String(index))
  e.currentTarget.classList.add("opacity-40")
}

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault()
}

const handleDrop = (e: React.DragEvent, targetIndex: number) => {
  e.preventDefault()
  const sourceIndex = Number(e.dataTransfer.getData("text/plain"))
  if (sourceIndex !== targetIndex) {
    const reordered = reorderList(items, sourceIndex, targetIndex)
    onReorder(reordered)
  }
}

const handleDragEnd = (e: React.DragEvent) => {
  e.currentTarget.classList.remove("opacity-40")
}
```

### Visual feedback

| State        | Class              | Effect                       |
| ------------ | ------------------ | ---------------------------- |
| Idle         | `cursor-grab`      | Open-hand cursor             |
| Dragging     | `cursor-grabbing`  | Closed-hand cursor           |
| Active drag  | `opacity-40`       | Source item fades            |
| Drop target  | `border-t-2`       | Visual insertion line        |

### Grip handle

Each draggable item has a `GripVertical` icon as the drag handle:

```tsx
<div
  draggable
  onDragStart={(e) => handleDragStart(e, index)}
  onDragOver={handleDragOver}
  onDrop={(e) => handleDrop(e, index)}
  onDragEnd={handleDragEnd}
  className="cursor-grab active:cursor-grabbing"
>
  <GripVertical className="h-4 w-4 text-ui-fg-muted" />
  {/* item content */}
</div>
```

### Where drag and drop is used

| Component             | What it reorders                          |
| --------------------- | ----------------------------------------- |
| `LearningItemsList`   | Learning objectives (flat list)           |
| `TakeawayItemsList`   | Takeaways with hierarchical sub-points    |
| `ResourceItemsList`   | Resource items (with file upload support) |

## Sectioned card layout

Settings and form pages use a consistent card-based layout with multiple titled sections.

### Structure

```tsx
<div className="flex flex-col gap-y-4">
  {/* Section card */}
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
    <h3 className="txt-compact-medium-plus text-ui-fg-base uppercase tracking-wider mb-4">
      Section Title
    </h3>
    <div className="flex flex-col gap-y-4">
      {/* Form fields */}
    </div>
  </div>

  {/* Another section card */}
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
    <h3 className="txt-compact-medium-plus text-ui-fg-base uppercase tracking-wider mb-4">
      Another Section
    </h3>
    <div className="flex flex-col gap-y-4">
      {/* Form fields */}
    </div>
  </div>
</div>
```

### Token reference

| Element       | Classes                                            |
| ------------- | -------------------------------------------------- |
| Card wrapper  | `bg-white rounded-xl border border-gray-100 shadow-sm p-6` |
| Section title | `txt-compact-medium-plus text-ui-fg-base uppercase tracking-wider` |
| Inner gap     | `flex flex-col gap-y-4`                            |
| Outer gap     | `flex flex-col gap-y-4` between cards              |

This pattern is used in `EditCourseGeneral.tsx`, `EditCourseCertification.tsx`, and other settings pages.

## Search bar + toolbar

List views combine a search input with action buttons in a toolbar row.

### Layout

```tsx
<div className="flex items-center gap-x-2">
  {/* Search — left side, grows */}
  <div className="relative flex-1">
    <Input
      type="search"
      placeholder="Search…"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>

  {/* Count — subtle text */}
  <span className="txt-small text-ui-fg-muted whitespace-nowrap">
    {filteredCount} items
  </span>

  {/* Spacer pushes actions right */}
  <div className="flex-1" />

  {/* Sort toggle */}
  <IconButton variant="transparent" size="small" onClick={toggleSort}>
    <ArrowUpDown className="h-4 w-4" />
  </IconButton>

  {/* Primary action */}
  <Button variant="primary" size="small" onClick={handleAdd}>
    <Plus />
    Add
  </Button>
</div>
```

### Key elements

| Element          | Purpose                                     |
| ---------------- | ------------------------------------------- |
| Search input     | Filters list items by text                  |
| Count            | Shows filtered/total count                  |
| `flex-1` spacer  | Separates search from toolbar actions       |
| Sort toggle      | Switches between ascending / descending     |
| Action button    | Primary action (e.g., "Add", "Create")      |

Used in `EditCourseStructure.tsx` (module list), `ModuleForm.tsx` (lesson list), and similar list views.

## Sort toggle

The sort toggle cycles through ascending and descending order.

```tsx
const [sortAsc, setSortAsc] = useState(true)

const toggleSort = () => {
  setSortAsc((prev) => !prev)
}

const sortedItems = useMemo(() => {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name))
  return sortAsc ? sorted : sorted.reverse()
}, [items, sortAsc])
```

The `ArrowUpDown` icon from lucide-react is used as the toggle button:

```tsx
<IconButton variant="transparent" size="small" onClick={toggleSort}>
  <ArrowUpDown className="h-4 w-4" />
</IconButton>
```

## Loading states

### Button loading

Buttons show a spinner overlay via the `isLoading` prop (see [Button](./components/button.md#loading)).

### Inline loaders

For content areas, use a centered spinner:

```tsx
<div className="flex items-center justify-center py-12">
  <Loader2 className="h-6 w-6 animate-spin text-ui-fg-muted" />
</div>
```

### Skeleton loading

For content that takes time to load (e.g., SWR data fetching), use placeholder skeleton elements matching the final layout shape:

```tsx
{isLoading ? (
  <div className="space-y-3">
    <div className="h-8 bg-ui-bg-base-hover rounded-md animate-pulse" />
    <div className="h-8 bg-ui-bg-base-hover rounded-md animate-pulse" />
    <div className="h-8 bg-ui-bg-base-hover rounded-md w-2/3 animate-pulse" />
  </div>
) : (
  <ActualContent />
)}
```

## Error handling

### Form-level errors

Form-level errors (e.g., API submission failures) are displayed in a banner at the top of the form:

```tsx
{formError && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-center gap-x-2">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <p className="txt-small text-red-800">{formError}</p>
    </div>
  </div>
)}
```

### Field-level errors

Individual field errors are handled by `Form.ErrorMessage` (see [Input](./components/input.md#formcontrol-aschild-warning)):

```tsx
<Form.Item>
  <Form.Label>Email</Form.Label>
  <Form.Control>
    <Input aria-invalid={!!errors.email} />
  </Form.Control>
  <Form.ErrorMessage>{errors.email}</Form.ErrorMessage>
</Form.Item>
```

### Toast notifications

For transient success or error messages, `react-hot-toast` is used:

```tsx
import toast from "react-hot-toast"

// Success
toast.success("Course saved successfully")

// Error
toast.error("Failed to save course")
```

### Save state indicator

The `SaveState` component provides inline feedback for auto-save operations (see [Auto-save section](#savestate-indicator)).

## Related files

- **[Design tokens](./design-tokens.md)** — All token values referenced by these patterns
- **[Button](./components/button.md)** — Button component with loading state
- **[Input](./components/input.md)** — Input and search field component
- **[Switch](./components/switch.md)** — Toggle component for boolean settings
- **[DropdownMenu](./components/dropdown-menu.md)** — Action menu in toolbar
