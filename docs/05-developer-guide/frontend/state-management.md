# State Management

> Koodook uses a layered state management approach: SWR for server-state (data fetching, caching, and revalidation), React `useReducer` for complex client-side editor state, and Formik for form state — all coordinated by a debounced auto-save pattern with visual feedback.

---

## Overview

State in Koodook is managed at three distinct layers, each serving a specific purpose:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Server State** | SWR | Data fetching, caching, background revalidation, cache invalidation |
| **Client State** | React `useState` / `useReducer` | Editor state, UI state, unsaved changes tracking |
| **Form State** | Formik | Form field values, validation, submission |

These layers are connected through a **debounced auto-save pipeline**: form changes flow into a `useReducer`-managed context, which debounces updates before persisting to the server via SWR's `mutate`.

---

## SWR for Server State

SWR (`swr` v2.3.x) handles all server data fetching throughout the application. It provides automatic caching, deduplication, background revalidation, and optimistic updates.

### swrFetcher

All SWR requests go through a centralized fetcher in `@services/utils/ts/requests`:

```tsx
export const swrFetcher = async (url: string, token?: string) => {
  let HeadersConfig = new Headers(
    token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' }
  )
  let options: any = {
    method: 'GET',
    headers: HeadersConfig,
    redirect: 'follow',
    credentials: 'include',
  }

  const request = await fetch(url, options)
  let res = errorHandling(request)
  return res
}
```

The fetcher includes the user's access token for authenticated requests and uses `credentials: 'include'` for cookie-based auth. The `errorHandling` helper parses error responses and throws structured errors with `.status` and `.detail` properties.

### Common SWR Usage Pattern

Components and contexts use `useSWR` with the access token obtained from `useLHSession()`:

```tsx
'use client'
import useSWR from 'swr'
import { getAPIUrl } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import { useLHSession } from '@components/Contexts/LHSessionContext'

function useOrgData(orgslug: string) {
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token

  const { data, error, isValidating } = useSWR(
    // Conditionally enable — don't fetch while session is loading
    session?.status !== 'loading'
      ? `${getAPIUrl()}orgs/slug/${orgslug}`
      : null,
    (url) => swrFetcher(url, accessToken),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  )

  return { data, error, isLoading: !data && !error }
}
```

### SWR Configuration Highlights

The `OrgContext` and `CourseContext` use these SWR options consistently:

| Option | Value | Rationale |
|--------|-------|-----------|
| `revalidateOnFocus` | `false` | Prevents stale server data from overwriting in-progress edits when the user tabs back |
| `revalidateOnReconnect` | `true` | Ensures fresh data after network interruption |
| `dedupingInterval` | `5000` | Deduplicates identical requests within 5 seconds |
| `keepPreviousData` | `true` | Maintains the last successful data while revalidating (avoids layout shifts) |
| `fallbackData` | `initialOrg` / `initialCourseStructure` | Hydrates SWR with data the server already rendered, enabling instant first paint |
| `revalidateOnMount` | `!initialData` | Skips the mount fetch when fallback data is provided (avoids redundant requests) |

### fallbackData for SSR/SSG Hydration

When the server has already fetched data (e.g., in a server component that passes props to a client component), `fallbackData` avoids a redundant client fetch:

```tsx
// Server component renders initialOrg into the client component
<OrgProvider orgslug={orgslug} initialOrg={initialOrg}>
  {children}
</OrgProvider>
```

```tsx
// OrgProvider hydrates SWR with the server data
const { data: org } = useSWR(
  url,
  fetcher,
  {
    revalidateOnMount: !initialOrg,
    fallbackData: initialOrg ?? undefined,
  }
)
```

SWR revalidates in the background after the initial paint, so the user sees content immediately while fresh data loads silently.

### Error Handling

SWR errors are handled at the provider level, not in individual components:

```tsx
// In OrgProvider
if (orgError) return <ErrorUI message='An error occurred while fetching data' />
if (!org || !session) return null // Loading state
```

The `errorHandling` function in `requests.ts` attaches a `status` property to errors, allowing providers to distinguish between 403/404 (handled by parent pages) and network/500 errors (shown inline).

---

## Cache Invalidation with `mutate`

SWR's `mutate` function is used for cache invalidation and optimistic updates. Koodook uses two approaches:

### Global `mutate` (from `useSWRConfig`)

Used inside contexts to invalidate or update cached data programmatically:

```tsx
import { useSWRConfig } from 'swr'

function CourseProvider({ courseuuid }: { courseuuid: string }) {
  const { mutate } = useSWRConfig()

  // After saving, update the cache without re-fetching
  await mutate(cacheKey, updatedData, { revalidate: false })
}
```

### Direct `mutate` Import

Used in components that need to update SWR caches outside a context:

```tsx
import { mutate } from 'swr'
import { getCourseMetaCacheKey } from '@components/Contexts/CourseContext'

// Update course meta cache after saving
const cacheKey = getCourseMetaCacheKey(courseUuid, withUnpublishedActivities)
await mutate(cacheKey, { ...courseStructure, ...unsyncedChanges }, { revalidate: false })
```

### Server-Side Cache Revalidation

After saving, Koodook also calls a server-side revalidation endpoint to clear the Next.js data cache across all pods:

```tsx
export const revalidateTags = async (tags: string[], orgslug: string) => {
  const url = getUriWithOrg(orgslug, '')
  const calls = tags.flatMap((tag) => {
    const endpoint = `${url}/api/revalidate?tag=${tag}`
    return [
      fetch(endpoint, { cache: 'no-store' }),
      fetch(endpoint, { cache: 'no-store' }), // Hit multiple pods
    ]
  })
  await Promise.allSettled(calls)
}
```

---

## Local Component State with `useState` / `useReducer`

Simple UI state (toggles, open/close, selected values) uses plain `useState`:

```tsx
const [difficultyOpen, setDifficultyOpen] = useState(false);
const [error, setError] = useState('');
```

Complex state that involves multiple interrelated fields and actions uses `useReducer`, as demonstrated by the `CourseContext`.

### The CourseContext Reducer Pattern

The `CourseContext` uses a dual-context pattern — separate contexts for state and dispatch — to avoid unnecessary re-renders:

```tsx
export const CourseContext = createContext<CourseState | null>(null)
export const CourseDispatchContext = createContext<React.Dispatch<CourseAction> | null>(null)
```

#### State Shape

```tsx
interface CourseState {
  courseStructure: any         // The full course data object
  courseOrder: any             // Chapter/activity ordering
  pendingChanges: Partial<any> // Changes merged into courseStructure but not yet saved
  unsyncedChanges: Partial<any> // Immediate changes not yet debounced into pendingChanges
  isSaved: boolean             // Whether the state matches the server
  isLoading: boolean           // Initial data loading
  isSaving: boolean            // Currently saving to server
  saveError: string | null     // Last save error message
  withUnpublishedActivities: boolean
  lastSyncedAt: number | null  // Timestamp of last server sync
}
```

#### Action Types

```tsx
type CourseAction =
  | { type: 'setCourseStructure'; payload: any }
  | { type: 'setCourseOrder'; payload: any }
  | { type: 'updateField'; payload: { field: string; value: any } }
  | { type: 'mergePendingChanges'; payload: Partial<any> }
  | { type: 'setUnsyncedChanges'; payload: Partial<any> }
  | { type: 'clearUnsyncedChanges' }
  | { type: 'setIsSaved' }
  | { type: 'setIsNotSaved' }
  | { type: 'setIsLoaded' }
  | { type: 'setSaving'; payload: boolean }
  | { type: 'setSaveError'; payload: string | null }
  | { type: 'commitChanges' }
  | { type: 'rollbackChanges' }
  | { type: 'syncFromServer'; payload: { data: any; timestamp: number } }
```

#### Reducer Implementation

The reducer merges changes rather than replacing data, preserving fields not touched by the current edit:

```tsx
function courseReducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case 'mergePendingChanges':
      return {
        ...state,
        courseStructure: {
          ...state.courseStructure,
          ...state.pendingChanges,
          ...action.payload,
        },
        pendingChanges: {
          ...state.pendingChanges,
          ...action.payload,
        },
      }

    case 'commitChanges':
      return {
        ...state,
        courseStructure: {
          ...state.courseStructure,
          ...state.pendingChanges,
        },
        pendingChanges: {},
        unsyncedChanges: {},
        isSaved: true,
      }

    case 'syncFromServer':
      // Preserve pending changes on top of server data
      if (Object.keys(state.pendingChanges).length > 0) {
        return {
          ...state,
          courseStructure: {
            ...action.payload.data,
            ...state.pendingChanges,
          },
          lastSyncedAt: action.payload.timestamp,
        }
      }
      return {
        ...state,
        courseStructure: action.payload.data,
        lastSyncedAt: action.payload.timestamp,
      }

    // ... other cases
  }
}
```

#### Available Hooks

```tsx
// Read state
const course = useCourse()
// course.courseStructure, course.isSaved, course.isLoading, etc.

// Dispatch actions
const dispatch = useCourseDispatch()
dispatch({ type: 'setSaving', payload: true })
```

---

## Auto-Save Pattern

Koodook's most distinctive state management pattern is the debounced auto-save system in the course editor. It uses three layers: a global `DebounceManager`, per-component sync hooks, and a `SaveState` component for visual feedback.

### DebounceManager

The `DebounceManager` is a class that coordinates debounced operations across multiple components. A single global instance is shared across the course editor:

```tsx
class DebounceManager {
  private debounces: Map<string, { timer: NodeJS.Timeout; fn: () => void }> = new Map()
  private listeners: Set<() => void> = new Set()

  register(key: string, fn: () => void, delay: number) {
    this.cancel(key)
    const timer = setTimeout(() => {
      this.debounces.delete(key)
      fn()
    }, delay)
    this.debounces.set(key, { timer, fn })
  }

  cancel(key: string) {
    const entry = this.debounces.get(key)
    if (entry) {
      clearTimeout(entry.timer)
      this.debounces.delete(key)
    }
  }

  flush(key: string) {
    const entry = this.debounces.get(key)
    if (entry) {
      clearTimeout(entry.timer)
      this.debounces.delete(key)
      entry.fn()  // Run immediately
    }
  }

  cancelAll() {
    this.debounces.forEach(entry => clearTimeout(entry.timer))
    this.debounces.clear()
  }

  hasPending(): boolean {
    return this.debounces.size > 0
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

// Singleton instance
const debounceManager = new DebounceManager()
export const useDebounceManager = () => debounceManager
```

Key methods:
- **`register(key, fn, delay)`** — Schedules a function. Cancels any existing timer for the same key first.
- **`cancel(key)`** — Cancels a pending debounce without executing it.
- **`flush(key)`** — Executes the pending function immediately (used on unmount).
- **`cancelAll()`** — Cancels all pending debounces (used before a manual save).

### useCourseFieldSync Hook

This hook bridges form components with the `CourseContext` reducer and the `DebounceManager`:

```tsx
function useCourseFieldSync(componentId: string) {
  const dispatch = useCourseDispatch()
  const course = useCourse()
  const debounce = useDebounceManager()

  const syncChanges = useCallback((changes: Partial<any>, immediate: boolean = false) => {
    // Immediately mark unsaved so the Save button shows "unsaved" state
    dispatch({ type: 'setIsNotSaved' })
    dispatch({ type: 'setUnsyncedChanges', payload: changes })

    const doSync = () => {
      dispatch({ type: 'mergePendingChanges', payload: changes })
      dispatch({ type: 'clearUnsyncedChanges' })
    }

    if (immediate) {
      debounce.cancel(componentId)
      doSync()
    } else {
      debounce.register(componentId, doSync, 500)
    }
  }, [dispatch, componentId, debounce])

  const cancelPendingSync = useCallback(() => {
    debounce.cancel(componentId)
  }, [componentId, debounce])

  // Flush on unmount — critical for tab-based navigation
  useEffect(() => {
    return () => {
      debounce.flush(componentId)
    }
  }, [componentId, debounce])

  return {
    syncChanges,
    cancelPendingSync,
    courseStructure: course.courseStructure,
    pendingChanges: course.pendingChanges,
    unsyncedChanges: course.unsyncedChanges,
    isLoading: course.isLoading,
    isSaved: course.isSaved,
    isSaving: course.isSaving,
  }
}
```

The **flush-on-unmount** behavior (in the `useEffect` cleanup) is critical: when the user navigates between tabs in the course editor, pending debounced changes are executed immediately rather than discarded. Since the `CourseProvider` stays mounted across tab switches, the dispatched actions land safely.

### The Save Pipeline

The save flow has three distinct phases:

1. **User edits a field** → Formik tracks the value change
2. **Formik change detection** → `useCourseFieldSync.syncChanges()` marks the course as unsaved and schedules a debounced merge (500ms)
3. **Debounce fires** → Changes are merged into `courseStructure` via `mergePendingChanges`
4. **User clicks Save (or auto-save triggers)** → `SaveState.saveCourseState()` persists to server

---

## SaveState Component

The `SaveState` component (`@components/Dashboard/Misc/SaveState.tsx`) provides a visual indicator showing the current save status. It lives in the admin dashboard header.

### Visual States

| State | Icon | Label | Appearance |
|-------|------|-------|------------|
| **Saved** | `Check` (green checkmark) | "Saved" | Neutral text, not clickable |
| **Unsaved** | `SaveAllIcon` (save icon) | "Save" | Primary color button with "Unsaved" badge |
| **Saving** | `Loader2` (spinner) | "Saving..." | Dimmed, disabled |
| **Error** | `AlertCircle` (warning) | "Retry" | Red background, clickable to retry |

```tsx
<button
  className={
    (saved && !saveError
      ? 'text-neutral-500 cursor-default'
      : saveError
        ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
        : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer')
  }
  onClick={saveCourseState}
  disabled={isSaving}
>
  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" />
    : saved && !saveError ? <Check className="w-4 h-4" />
    : saveError ? <AlertCircle className="w-4 h-4" />
    : <SaveAllIcon className="w-4 h-4" />}
  <span>
    {isSaving ? 'Saving...'
      : saved && !saveError ? 'Saved'
      : saveError ? 'Retry'
      : 'Save'}
  </span>
  {!saved && !saveError && !isSaving && (
    <span className="...">Unsaved</span>
  )}
</button>
```

### Save Course State Logic

The `saveCourseState` function orchestrates the full save pipeline:

```tsx
const saveCourseState = useCallback(async () => {
  // 1. Guard: skip if already saved or saving
  if (saved || isSaving || saveInProgressRef.current) return
  saveInProgressRef.current = true  // Prevent double-save

  // 2. Cancel all pending debounces — capture the latest state
  debounceManager.cancelAll()

  // 3. Mark as saving
  dispatchCourse({ type: 'setSaving', payload: true })

  // 4. Save in order:
  //    a) Course order (chapter/activity reordering)
  await updateCourseOrderStructure(courseUuid, courseOrder, token)

  //    b) Course metadata (name, description, settings, etc.)
  const dataToSave = { ...courseStructure, ...unsyncedChangesRef.current }
  await updateCourse(courseUuid, dataToSave, token)

  //    c) Certification data (optional — failures don't block the save)
  await updateCertification(certUuid, certConfig, orgId, token)

  // 5. Update SWR cache and revalidate server tags
  await mutate(cacheKey, mergedData, { revalidate: false })
  await revalidateTags(['courses'], orgslug)

  // 6. Mark as saved
  dispatchCourse({ type: 'setIsSaved' })
  dispatchCourse({ type: 'commitChanges' })

  // 7. Refresh router for server components
  router.refresh()
}, [/* deps */])
```

Key design decisions:
- **Prevent double-save** — Uses a `useRef` flag (`saveInProgressRef`) in addition to the `isSaving` state to protect against race conditions.
- **Cancel all debounces before saving** — Ensures the latest edits are included, even if they haven't hit the debounce threshold yet.
- **Merge unsyncedChanges** — Reads from a ref (`unsyncedChangesRef`) to avoid stale closure issues, ensuring edits made milliseconds before clicking Save are not lost.
- **Sequential save with partial failure** — Order and metadata saves are critical (failures stop the pipeline), while certification save failures are logged but don't block the overall save.
- **Router refresh** — After saving, `router.refresh()` triggers server components to re-render with fresh data.

---

## Form State Management with Formik

Forms in the course editor use Formik for field value management, validation, and submission.

### Basic Pattern

```tsx
import { useFormik } from 'formik'

function EditCourseGeneral(props) {
  const formik = useFormik({
    initialValues: {
      name: courseStructure?.name || '',
      description: courseStructure?.description || '',
      learnings: initializeLearnings(courseStructure?.learnings || ''),
      thumbnail_type: courseStructure?.thumbnail_type || 'image',
      // extra_metadata fields are prefixed with meta_
      meta_difficulty: meta.difficulty || '',
      meta_duration: meta.duration || '',
    },
    validate: (values) => validate(values, t),
    onSubmit: async values => {
      // The actual save is handled by SaveState component
      // Formik's onSubmit is used only for validation
    },
    enableReinitialize: true,
  })
}
```

### enableReinitialize

`enableReinitialize: true` allows Formik to update its initial values when the course data loads from the server. This is essential because `courseStructure` starts as an empty placeholder and gets populated after SWR resolves.

### Syncing Formik to CourseContext

Form changes flow from Formik → `useCourseFieldSync` → `CourseContext` reducer via a `useEffect`:

```tsx
useEffect(() => {
  if (isLoading || isSaving) return

  // Compare current values against formik's own initialValues
  // When enableReinitialize triggers, both update together → no false diff
  const changes: any = {}
  Object.keys(formik.values).forEach(key => {
    if (formik.values[key] !== formik.initialValues[key]) {
      changes[key] = formik.values[key]
    }
  })

  // Build extra_metadata from prefixed meta_ fields
  const metadataFields = ['meta_difficulty', 'meta_duration', /* ... */]
  const anyMetaChanged = metadataFields.some(f => formik.values[f] !== formik.initialValues[f])
  if (anyMetaChanged) {
    changes.extra_metadata = {
      difficulty: formik.values.meta_difficulty,
      duration: formik.values.meta_duration,
      // ...
    }
    metadataFields.forEach(f => delete changes[f])
  }

  const hasChanges = Object.keys(changes).length > 0
  if (hasChanges) {
    syncChanges(changes)  // Debounced — merges into CourseContext after 500ms
  }
}, [formik.values, formik.initialValues, isLoading, isSaving, syncChanges])
```

Key details:
- **Compares against `formik.initialValues`** (not a separate ref) so that `enableReinitialize`-triggered resets don't produce false diffs.
- **Extra metadata fields** are prefixed with `meta_` in the form but stored as a nested `extra_metadata` object on the course. The `useEffect` reassembles them.
- **Debounced via `syncChanges`** — changes are not immediately visible to the save pipeline; they wait 500ms for the user to finish typing.

### Validation

Validation is synchronous, using a custom `validate` function (not Yup schema, though Yup is available in the project):

```tsx
const validate = (values: any, t: any) => {
  const errors = {} as any

  if (!values.name) {
    errors.name = t('dashboard.courses.general.form.name_required')
  } else if (values.name.length > 100) {
    errors.name = t('dashboard.courses.general.form.name_max_length')
  }

  if (!values.description) {
    errors.description = t('dashboard.courses.general.form.description_required')
  }

  // Learnings must be valid JSON array with non-empty items
  if (!values.learnings) {
    errors.learnings = t('dashboard.courses.general.form.learnings_required')
  } else {
    try {
      const learningItems = JSON.parse(values.learnings)
      if (!Array.isArray(learningItems)) {
        errors.learnings = 'Must be an array'
      } else if (learningItems.length === 0) {
        errors.learnings = 'At least one learning item is required'
      }
    } catch (e) {
      errors.learnings = 'Invalid JSON format'
    }
  }

  return errors
}
```

---

## Function Debouncing

For simple debouncing needs outside the `DebounceManager` / `CourseContext` system, two utilities are available:

### `debounce` Utility (`lib/utils.ts`)

A standalone debounce function for wrapping callbacks:

```tsx
import { debounce } from '@lib/utils'

const save = debounce((value: string) => {
  apiCall(value)
}, 600)
```

### `useDebounce` Hook (`hooks/useDebounce.ts`)

A dual-purpose hook that supports both value debouncing and function debouncing:

```tsx
import { useDebounce } from '@hooks/useDebounce'

// Value debouncing — the returned value updates after the delay
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useDebounce(searchTerm, 300)

// Function debouncing — the returned function is debounced
const debouncedSave = useDebounce((value: string) => {
  saveToServer(value)
}, 600)
```

---

## Putting It All Together

The complete data flow for a course edit operation:

```
User types in a form field
        │
        ▼
Formik updates formik.values
        │
        ▼
useEffect detects change (compared to formik.initialValues)
        │
        ▼
syncChanges({ field: 'new value' })
  ├── dispatch(setIsNotSaved)        → Save button shows "Unsaved"
  ├── dispatch(setUnsyncedChanges)   → Store raw change
  └── debounceManager.register()     → Schedule merge (500ms)
        │
        ▼  (500ms later, or user clicks Save)
DebounceManager flushes or SaveState triggers saveCourseState()
  ├── debounceManager.cancelAll()    → Capture latest state
  ├── dispatch(setSaving: true)      → Save button shows spinner
  ├── updateCourseOrder()            → Save order
  ├── updateCourse()                 → Save metadata
  ├── updateCertification()          → Save certification (optional)
  ├── mutate(cacheKey, data)         → Update SWR cache
  ├── revalidateTags()               → Invalidate server cache
  ├── dispatch(setIsSaved)           → Save button shows "Saved"
  └── router.refresh()               → Re-render server components
```

---

## Summary

| Pattern | Technology | Used For |
|---------|-----------|----------|
| Server data fetching & caching | SWR `useSWR` | Org data, course metadata, API resources |
| Cache mutation & invalidation | SWR `mutate` | Optimistic updates after saves |
| Server-side cache clearing | `revalidateTags()` | Next.js data cache across pods |
| Complex client state | React `useReducer` | Course editor state (structure, order, save status) |
| Simple UI state | React `useState` | Toggles, dropdowns, loading flags |
| Debounced coordination | `DebounceManager` class | Coordinating debounced saves across components |
| Form field management | Formik `useFormik` | Form values, validation, submission |
| Function debouncing | `debounce()` / `useDebounce` | Search inputs, API call throttling |
