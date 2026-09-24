# Coding Standards

> Consistent code makes the project easier to read, review, and maintain. This document defines the coding conventions for all code contributed to Koodook.

## Python (FastAPI)

### Type Hints

All function signatures **must** include type hints. Use the `typing` module for complex types.

```python
# Good
def get_course(course_id: UUID, db: AsyncSession) -> Course:
    ...

# Bad - no type hints
def get_course(course_id, db):
    ...

# Good - complex types
from typing import Optional
from uuid import UUID

def list_courses(
    org_id: UUID,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
) -> list[Course]:
    ...
```

### Docstrings

Use Google-style docstrings for all public functions, classes, and modules.

```python
def create_course(
    org_id: UUID,
    payload: CourseCreate,
    db: AsyncSession,
) -> Course:
    """Create a new course under an organization.

    Args:
        org_id: UUID of the organization.
        payload: Course creation data.
        db: Database session.

    Returns:
        The newly created Course instance.

    Raises:
        HTTPException: If the organization does not exist or the user
            lacks permission.
    """
    ...
```

### Async Patterns

- Use `async def` for all route handlers and database operations.
- Use `AsyncSession` from SQLAlchemy for database access.
- Await all async calls — do not call async functions without `await`.
- Use `asyncio.gather()` for parallel independent operations.
- Do **not** block the event loop with synchronous I/O.

```python
# Good
@router.get("/courses/{course_id}")
async def get_course(course_id: UUID, db: AsyncSession = Depends(get_db)):
    course = await course_service.get_by_id(db, course_id)
    return course

# Bad - sync route handler blocking the event loop
@router.get("/courses/{course_id}")
def get_course(course_id: UUID, db: AsyncSession = Depends(get_db)):
    ...
```

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Variables | `snake_case` | `course_title` |
| Functions | `snake_case` | `get_course_by_id()` |
| Classes | `PascalCase` | `CourseService` |
| Modules | `snake_case` | `course_service.py` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Private helpers | `_snake_case` | `_validate_slug()` |

### Imports

Group imports in the following order, separated by a blank line:

1. Standard library
2. Third-party libraries
3. Local application imports

```python
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.services import course_service
```

## TypeScript / React

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Variables | `camelCase` | `courseTitle` |
| Functions | `camelCase` | `fetchCourses()` |
| React components | `PascalCase` | `CourseCard` |
| Files (components) | `PascalCase` | `CourseCard.tsx` |
| Files (utilities) | `camelCase` | `formatDate.ts` |
| Interfaces | `PascalCase` | `CourseProps` |
| Types | `PascalCase` | `CourseStatus` |
| Enums | `PascalCase` | `PaymentStatus` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |

### Interfaces vs Types

- Use **interfaces** for object shapes that represent public APIs, component props, or data contracts that may be extended.
- Use **type aliases** for unions, intersections, utility types, or when the shape is unlikely to change.

```typescript
// Interface - use for component props and data models
interface CourseCardProps {
  courseId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
}

// Type - use for unions and computed types
type CourseStatus = "draft" | "published" | "archived";
type ApiResponse<T> = { data: T; error?: string };
```

### Component Structure

- Use functional components with hooks — no class components.
- Place styles and utilities in separate files, not inline in components.
- Keep components focused: one component, one responsibility.

```typescript
// Good
export function CourseCard({ courseId, title, description }: CourseCardProps) {
  const { data } = useCourse(courseId);

  return (
    <div className="rounded-lg border p-4">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
```

### Hooks

- Prefix custom hooks with `use`.
- Keep hooks reusable and composable.
- Follow the [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks).

## CSS / Tailwind

### Utility-First Approach

Use Tailwind utility classes directly in JSX. Avoid writing custom CSS unless necessary.

```tsx
// Good - utility classes
<div className="flex items-center gap-2 rounded-lg bg-white p-4 shadow-sm">
  <span className="text-sm font-medium text-gray-900">Title</span>
</div>

// Avoid - custom CSS for simple layouts
<div className="card-container">
  <span className="card-title">Title</span>
</div>
```

### Medusa Design Tokens

Koodook uses the Medusa design system. Use its design tokens for colors, spacing, typography, and shadows rather than arbitrary values.

```tsx
// Good - using design tokens
<div className="bg-medusa-bg-base text-medusa-fg-base p-4">
  <h2 className="text-medusa-fg-base text-lg font-semibold">Section Title</h2>
</div>

// Avoid - hardcoded values when tokens exist
<div className="bg-[#f5f5f5] text-[#111] p-4">
  ...
</div>
```

### Custom Classes

Write custom CSS only when:

- A pattern repeats across multiple components and Tailwind utilities become verbose.
- Animations or keyframe-based effects are needed.
- Third-party library styles must be overridden.

Use `@apply` sparingly — prefer extracting a reusable component over creating a utility class.

```css
/* Acceptable use case: complex animation */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
```

## General Principles

### DRY (Don't Repeat Yourself)

- Extract repeated logic into reusable functions, hooks, or services.
- Avoid copy-pasting code across files — create shared utilities.
- Use constants for values that appear in multiple places.

### Keep It Simple

- Write code that is easy to read and understand at a glance.
- Favor clarity over cleverness — explicit is better than implicit.
- If a function is doing too much, break it down.
- Avoid premature optimization. Measure first, optimize second.

### No Premature Abstraction

- Don't abstract a pattern until it appears at least three times (Rule of Three).
- A concrete implementation is better than a generic one that doesn't quite fit.
- YAGNI — You Aren't Gonna Need It. Don't add infrastructure for features that don't exist yet.

## Code Review Expectations

When your code is reviewed, reviewers will check for:

- Correctness — does the code do what it's supposed to do?
- Test coverage — are there tests for the new code?
- Adherence to these coding standards.
- Performance — are there obvious performance issues?
- Security — are there any security concerns (SQL injection, XSS, auth bypass)?
- Accessibility — do UI changes work with screen readers and keyboard navigation?

Reviewers are expected to be constructive and respectful. Review comments should explain *why* something should change, not just *what* to change.

## Linting and Formatting

Before submitting a PR, ensure your code passes all linting and formatting checks:

- **Python**: `ruff check .` and `ruff format .`
- **TypeScript/React**: `bun run lint` and `bun run format`
- **CSS**: `bun run lint:css` (if available)

Many of these checks run automatically in CI. A PR with failing lint checks will not be merged.
