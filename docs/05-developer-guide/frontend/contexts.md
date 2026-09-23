# React Contexts

> Koodook uses React Context for cross-cutting concerns like authentication, organization configuration, course state, and internationalization, with a clear provider hierarchy and typed hooks.

---

## Provider Hierarchy

Contexts are nested in a specific order. Each provider may depend on contexts above it in the tree.

```
Providers (app/layout.tsx)
├── SessionProvider          (AuthContext — token/session management)
│   └── LHSessionProvider    (LHSessionContext — LearnHouse session wrapper)
│       └── I18nProvider     (I18nContext — internationalization)
│
├── OrgProvider              (OrgContext — at /orgs/[orgslug]/layout.tsx)
│   └── OrgLanguageSync
│
├── (withmenu)/layout.tsx    (User-facing pages)
│   ├── SessionGate
│   ├── OrgJoinBannerProvider
│   └── PodcastPlayerProvider
│
├── dash/layout.tsx          (Admin pages)
│   ├── SessionGate
│   ├── AdminAuthorization
│   └── CommandPaletteProvider
│
└── CourseProvider           (CourseContext — per-course pages)
```

---

## AuthContext (`@components/Contexts/AuthContext`)

The `AuthContext` manages authentication state, session data, and token lifecycle. It is the lowest-level auth provider and wraps the entire application.

### Provider: `SessionProvider`

```tsx
<SessionProvider refetchInterval={600000}>
  {children}
</SessionProvider>
```

Props:
- `refetchInterval?: number` — How often (in ms) to re-fetch the session (default: 60000)

### Context Value

```tsx
interface AuthContextValue {
  session: Session | null
  status: SessionStatus       // 'loading' | 'authenticated' | 'unauthenticated'
  accessToken: string | null
  refreshSession: (force?: boolean) => Promise<void>
  signIn: (provider: string, options?: SignInOptions) => Promise<SignInResult | void>
  signOut: (options?: SignOutOptions) => Promise<void>
}
```

### Session Type

```tsx
interface Session {
  user: any | undefined
  roles?: string[] | undefined
  tokens?: {
    access_token?: string | undefined
    refresh_token?: string | undefined
    expiry?: number | undefined
  } | undefined
}
```

### Available Hooks

**`useSession()`** — Returns a NextAuth-compatible session object:

```tsx
const { data, status, update } = useSession()
// data: Session | null
// status: 'loading' | 'authenticated' | 'unauthenticated'
// update: (force?: boolean) => Promise<void>
```

**`useAuth()`** — Returns full auth control:

```tsx
const { session, status, accessToken, signIn, signOut, refreshSession, getAccessToken } = useAuth()
```

Key features:
- Token refresh with deduplication (prevents parallel refresh requests)
- Session caching (10-minute TTL)
- Cross-tab synchronization via `BroadcastChannel`
- CSRF-protected OAuth flow
- Custom domain support for cookie scoping
- `getAccessToken()` convenience method that auto-refreshes if the token is expiring soon

---

## CourseContext (`@components/Contexts/CourseContext`)

The `CourseContext` provides course state management to the course editor pages. It uses `useReducer` + SWR for state management.

### Provider: `CourseProvider`

```tsx
<CourseProvider
  courseuuid="course_uuid_here"
  withUnpublishedActivities={true}
  initialCourseStructure={optionalFallbackData}
>
  {children}
</CourseProvider>
```

Props:
- `courseuuid: string` — The course UUID (prefixed with `course_`)
- `withUnpublishedActivities?: boolean` — Whether to include unpublished activities
- `initialCourseStructure?: any` — Optional fallback data for initial render

### Context Value (Dual Context Pattern)

Uses separate contexts for state and dispatch:

```tsx
export const CourseContext = createContext<CourseState | null>(null)
export const CourseDispatchContext = createContext<React.Dispatch<CourseAction> | null>(null)
```

```tsx
interface CourseState {
  courseStructure: any
  courseOrder: any
  pendingChanges: Partial<any>
  unsyncedChanges: Partial<any>
  isSaved: boolean
  isLoading: boolean
  isSaving: boolean
  saveError: string | null
  withUnpublishedActivities: boolean
  lastSyncedAt: number | null
}
```

### Available Hooks

**`useCourse()`** — Returns course state:

```tsx
const course = useCourse()
// course.courseStructure, course.isSaved, course.isLoading, etc.
```

**`useCourseDispatch()`** — Returns the dispatch function:

```tsx
const dispatch = useCourseDispatch()
dispatch({ type: 'updateField', payload: { field: 'name', value: 'New Name' } })
```

**`useCourseFieldSync(componentId)`** — Hook for form components to sync changes with debounce:

```tsx
const {
  syncChanges,        // (changes, immediate?) => void
  cancelPendingSync,  // () => void
  courseStructure,    // current course data
  pendingChanges,     // pending (debounced) changes
  unsyncedChanges,    // immediate changes not yet merged
  isLoading,
  isSaved,
  isSaving,
} = useCourseFieldSync('editCourseGeneral')
```

The `CourseProvider` also manages a global `DebounceManager` that coordinates debounced saves across components, with flush-on-unmount behavior.

---

## OrgContext (`@components/Contexts/OrgContext`)

The `OrgContext` provides organization configuration and membership status. It is provided at the `[orgslug]` layout level.

### Provider: `OrgProvider`

```tsx
<OrgProvider orgslug={orgslug} initialOrg={optionalFallbackData}>
  {children}
</OrgProvider>
```

### Context Value

```tsx
interface OrgContextValue {
  org: any
  isUserPartOfTheOrg: boolean
  orgslug: string
}
```

### Available Hooks

**`useOrg()`** — Returns the org object (or `null`):

```tsx
const org = useOrg()
// org?.name, org?.config, org?.org_uuid, etc.
```

**`useOrgMembership()`** — Returns org data plus membership status:

```tsx
const { org, isUserPartOfTheOrg, orgslug } = useOrgMembership()
```

The membership check is done client-side from session roles (no extra API call). Superadmins are always considered part of every org.

---

## LHSessionContext (`@components/Contexts/LHSessionContext`)

A thin wrapper around `AuthContext` that provides session data in a simplified form. It is used as the standard session access point throughout the application.

### Provider: `LHSessionProvider`

```tsx
<LHSessionProvider>
  {children}
</LHSessionProvider>
```

### Hook: `useLHSession()`

```tsx
const session = useLHSession() as any
const access_token = session?.data?.tokens?.access_token
```

### SessionGate

A component that blocks rendering with a loading spinner until the session is ready:

```tsx
<SessionGate fallback={<CustomSkeleton />}>
  <AuthenticatedContent />
</SessionGate>
```

Used in both the `(withmenu)` and `dash` layouts to ensure session data is available before rendering.

---

## I18nContext (`@components/Contexts/I18nContext`)

Provides internationalization support via `react-i18next`.

### Provider: `I18nProvider`

```tsx
<I18nProvider>{children}</I18nProvider>
```

It listens for `languageChanged` events from i18next and forces a re-render of the entire tree when the language changes. Non-English locale bundles load lazily with `useSuspense: false`.

### Usage

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('dashboard.courses.general.form.name_label')}</h1>
}
```

---

## Other Contexts

| Context | File | Purpose |
|---------|------|---------|
| `CommunityContext` | `Contexts/CommunityContext.tsx` | Community state and membership |
| `PodcastContext` | `Contexts/PodcastContext.tsx` | Podcast data |
| `PodcastPlayerContext` | `Contexts/PodcastPlayerContext.tsx` | Podcast player state (provides `PodcastPlayerProvider`) |
| `AIChatBotContext` | `Contexts/AI/AIChatBotContext.tsx` | AI chatbot conversation state |
| `AIEditorContext` | `Contexts/AI/AIEditorContext.tsx` | AI-powered editor features |
| `EditorContext` | `Contexts/Editor/EditorContext.tsx` | Rich text editor state |
| `AssignmentContext` | `Contexts/Assignments/AssignmentContext.tsx` | Assignment management |
| `AssignmentsTaskContext` | `Contexts/Assignments/AssignmentsTaskContext.tsx` | Individual task state |
| `AssignmentSubmissionContext` | `Contexts/Assignments/AssignmentSubmissionContext.tsx` | Submission workflow |
| `CommandPaletteContext` | `Dashboard/CommandPalette/CommandPaletteContext.tsx` | Command palette state |
| `BoardSelectionContext` | `Dashboard/Boards/BoardSelectionContext.tsx` | Board element selection |
| `BoardYjsContext` | `Dashboard/Boards/BoardYjsContext.tsx` | Yjs real-time collaboration |

---

## Using Contexts in Practice

### Recommended Pattern

1. **Wrap the relevant subtree** with the provider at the appropriate layout level
2. **Access context** via the exported custom hook in child components
3. **Handle loading/unauthenticated states** in the component, not in the context

```tsx
'use client'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'

function MyPage() {
  const org = useOrg()
  const session = useLHSession()

  if (!org) return <Loading />
  // session.status can be 'loading' | 'authenticated' | 'unauthenticated'

  return <div>{org.name}</div>
}
```

### Error Handling

- `useOrg()` returns `null` if used outside `OrgProvider` (safe fallback)
- `useCourse()` and `useCourseDispatch()` throw if used outside `CourseProvider`
- `useAuth()` throws if used outside `SessionProvider`
- `useLHSession()` returns `null` if used outside `LHSessionProvider`
