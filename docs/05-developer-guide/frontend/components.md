# Component Patterns and Hierarchy

> The Koodook frontend organizes React components into a clear hierarchy based on domain (Dashboard, Objects, UI primitives) with consistent naming conventions and prop typing.

---

## Component Organization

All components live under `apps/web/components/`. The top-level directories group components by domain:

```
components/
├── Dashboard/            # Admin dashboard components
│   ├── Analytics/
│   ├── Boards/
│   ├── Home/
│   ├── Menus/
│   ├── Misc/
│   ├── Onboarding/
│   ├── Pages/            # Page-level components
│   │   ├── Community/
│   │   ├── Org/
│   │   ├── Payments/
│   │   └── Users/
│   └── Shared/
├── Objects/              # Shared domain objects
│   ├── Activities/
│   ├── Courses/
│   ├── Communities/
│   ├── Menus/
│   ├── Modals/
│   ├── Editor/
│   ├── Icons/
│   └── Loaders/
├── ui/                   # Medusa UI primitives
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── switch.tsx
│   ├── dropdown-menu.tsx
│   ├── dialog.tsx
│   ├── tabs.tsx
│   ├── table.tsx
│   ├── form.tsx
│   └── ...
├── Contexts/             # React context providers
├── Hooks/                # Custom React hooks
├── Auth/                 # Auth-related components
├── Footer/
└── Providers.tsx         # Global provider composition
```

---

## Page-Level Components

Page-level components are the top-level client components rendered by route pages. They live under `components/Dashboard/Pages/` for admin pages or as client files alongside page routes (e.g., `course.tsx`, `activity.tsx`).

### Dashboard Page Components

Each dashboard subpage has its own component in `components/Dashboard/Pages/`:

| Component | Route | Purpose |
|-----------|-------|---------|
| `EditCourseGeneral` | `/dash/courses/course/[uuid]/general` | Course name, description, metadata |
| `EditCourseStructure` | `/dash/courses/course/[uuid]/content` | Module/lesson structure editor |
| `EditCourseAccess` | `/dash/courses/course/[uuid]/access` | Access control and visibility |
| `EditCourseContributors` | `/dash/courses/course/[uuid]/contributors` | Contributor management |
| `EditCourseSEO` | `/dash/courses/course/[uuid]/seo` | SEO metadata editor |
| `EditCourseCertification` | `/dash/courses/course/[uuid]/certification` | Certificate configuration |
| `OrgEditBranding` | `/dash/org/settings/branding` | Organization branding |
| `OrgEditLanding` | `/dash/org/settings/landing` | Landing page customization |

### Props Pattern

Page-level components accept typed props via TypeScript interfaces:

```tsx
type EditCourseStructureProps = {
  orgslug: string
  course_uuid?: string
}

function EditCourseGeneral(props: EditCourseStructureProps) {
  // ...
}
```

Course overview pages combine a `CourseProvider` wrapper with tab navigation and conditionally render the appropriate page component based on the `subpage` route parameter:

```tsx
function CourseOverviewPage(props: { params: Promise<CourseOverviewParams> }) {
  const params = use(props.params)
  // Tab definitions with permissions...

  return (
    <CourseProvider courseuuid={courseuuid} withUnpublishedActivities={true}>
      {/* Tab bar */}
      {/* Main content — switches on params.subpage */}
      {params.subpage == 'general' && <EditCourseGeneral orgslug={params.orgslug} />}
      {params.subpage == 'content' && <EditCourseStructure orgslug={params.orgslug} />}
      {params.subpage == 'access' && <EditCourseAccess orgslug={params.orgslug} />}
      {/* ... */}
    </CourseProvider>
  )
}
```

---

## Reusable Sub-Components

Several reusable sub-components handle structured list editing. They follow a controlled-component pattern: they receive the current value and an `onChange` callback, and they manage internal state (drag-and-drop, add/remove items) while serializing changes back as JSON strings.

### LearningItemsList

Edits a list of learning objectives with drag-to-reorder, add, and remove:

```tsx
interface LearningItem {
  id: string
  text: string
}

interface LearningItemsListProps {
  value: string           // JSON-serialized array of LearningItem
  onChange: (value: string) => void
  error?: string
}
```

Usage in a form:

```tsx
<Form.Field name="learnings">
  <Form.Control asChild>
    <LearningItemsList
      value={formik.values.learnings}
      onChange={(value) => formik.setFieldValue('learnings', value)}
      error={formik.errors.learnings}
    />
  </Form.Control>
</Form.Field>
```

### TakeawayItemsList, ResourceItemsList, KnowledgeCheckItemsList

These follow the same pattern as `LearningItemsList` — a controlled list of items serialized as JSON, with drag-to-reorder, add, and remove functionality. They differ only in the placeholder text and iconography.

---

## Sectioned Card Layout Pattern

Admin dashboard forms use a consistent card-based layout. Each logical section of a form is wrapped in a card:

```tsx
<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
    Basic Information
  </h3>
  <div className="space-y-4">
    {/* Form fields */}
  </div>
</div>
```

This pattern (`bg-white rounded-xl border border-gray-100 shadow-sm p-6`) is used throughout the dashboard for:
- Basic Information sections
- Media sections (thumbnail upload)
- Course Details sections (difficulty, duration, certificate toggle)
- Instructor sections
- Access control sections
- SEO sections

---

## Naming Conventions

| Convention | Example | Notes |
|-----------|---------|-------|
| PascalCase for components | `EditCourseGeneral`, `LearningItemsList` | React components |
| camelCase for hooks | `useCourseFieldSync`, `useCourseRights` | Custom hooks with `use` prefix |
| camelCase for service functions | `createActivity`, `getCourseMetadata` | API service layer |
| PascalCase for files matching component name | `EditCourseGeneral.tsx` | One component per file |
| `.tsx` for React files | `page.tsx`, `layout.tsx`, `component.tsx` | JSX support needed |
| `.ts` for non-React files | `requests.ts`, `config.ts` | No JSX |
| `page.tsx` / `layout.tsx` for routes | `course/[courseuuid]/page.tsx` | Next.js App Router convention |
| `index.ts` for barrel exports | `components/Dashboard/Pages/Community/index.ts` | Re-exports |

---

## Props Pattern (TypeScript Interfaces)

Components define their props using exported TypeScript interfaces or type aliases:

```tsx
// Inline type for simple props
type EditCourseStructureProps = {
  orgslug: string
  course_uuid?: string
}

// Exported interface for reusable components
export interface LearningItemsListProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

// With generics
export interface ListItemsProps<T> {
  items: T[]
  onChange: (items: T[]) => void
  renderItem: (item: T, index: number) => React.ReactNode
}
```

Common prop patterns:
- **`orgslug: string`** — organization slug (nearly every page needs this)
- **`course_uuid?: string`** — course UUID (optional for creation flows)
- **`access_token?: string`** — authentication token
- **`value` / `onChange`** — controlled component pattern for form fields
- **`children: React.ReactNode`** — composition for wrapper/layout components

---

## Component Composition Example

A typical dashboard page composes components in layers:

```
CourseOverviewPage (page.tsx — Server Component)
└── CourseProvider (context wrapper)
    ├── CoursePageTitle (reads name from CourseContext)
    ├── TabBar (pill-style navigation with permission checks)
    └── Content Area
        ├── EditCourseGeneral (form page)
        │   ├── FormLayout (from StyledElements/Form)
        │   ├── FormField / FormLabelAndMessage
        │   ├── Input (from ui/input)
        │   ├── Textarea (from ui/textarea)
        │   ├── LearningItemsList
        │   ├── ThumbnailUpdate
        │   └── CustomSelect
        └── CourseEditSidebar (context-aware sidebar)
```

This layered approach keeps each component focused on a single responsibility while sharing state through contexts and props.
