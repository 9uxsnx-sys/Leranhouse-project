# Medusa UI Redesign — LearnHouse Platform

## Overview

Redesigning the LearnHouse learning platform to adopt **Medusa UI** design language — clean, calm, professional, educational, premium, minimal. Moving away from the current look toward a modern admin/learning interface inspired by Medusa's design system.

---

## Completed Work

### Landing Page Cleanup
- Removed "View all" buttons from courses & collections sections
- Removed "Add" buttons (moved to dashboard/admin)
- Removed count badges `(x number)` from section titles
- Increased section titles to **22px** with edge-to-edge dividers
- Cleaned up outer spacing between sidebar and container edges
- Hidden scrollbar with `scrollbar-hide` class for cleaner look

### Course Creation
- Removed `visibility` field from CreateCourse modal
- Fixed API boolean error (`?? true` fallback for public visibility)

### React Fixes
- Fixed React keys warning (added index fallback for undefined IDs)

### Proxy Middleware
- Added pass-through rule for `/test-dev` route (was returning 404)

---

## CourseCard Component

### Design Spec

| Element | Detail |
|---|---|
| **Card Container** | White `#FFFFFF`, border `#E7E7E7`, `border-radius: 12px`, no shadow |
| **Cover Image** | 4:3 aspect ratio, clean (no overlay, no badges, no zoom) |
| **Title** | 15px, 600 weight, 2-line clamp |
| **Description** | 13px, 400 weight, 2-line clamp, muted gray `#6B7280` |
| **Divider** | `#EAEAEA` between description and metadata |
| **Metadata Row** | Lessons (left) — Duration (center) — Difficulty (right) |
| **Icons** | Lucide: `BookOpen`, `Clock`, `Signal` |
| **Hover** | `translateY(-1px)`, border `#DADADA`, subtle shadow `0 2px 8px rgba(0,0,0,0.04)` |
| **Excluded** | No instructor, price, rating, progress bar, CTA, badges |
| **Behavior** | Fixed 360px width, locked proportions, scales uniformly like an image |

### Component File
- [CourseCard.tsx](file:///c%3A/Projects/learnhouse-dev/learnhouse-dev/apps/web/components/Objects/Thumbnails/CourseCard.tsx) — Reusable component with typed props

### Props Interface
```tsx
interface CourseCardProps {
  id: string
  title: string
  description: string
  image: string
  lessons: number
  duration: string
  difficulty: string
}
```

---

## Test Page

A comparison page is available at `/test-dev` showing 5 card variations side by side:

| Variation | Description |
|---|---|
| **A** | White card + Medusa shadow (current style) |
| **B** | Gray shell + white inner card |
| **C** | White card + footer metadata |
| **D** | Border only, no shadow |
| **E** | **New spec-compliant design** (white + border + clean metadata) |

---

## Design Principles

1. **Medusa-first** — Follow Medusa UI tokens, colors, spacing, typography
2. **Clean & minimal** — No unnecessary elements, calm visual hierarchy
3. **Content-forward** — Let course content speak, avoid e-commerce patterns
4. **Consistent** — Unified card language across courses & collections
5. **Scalable** — Components designed as locked/self-contained units

---

## Next Steps

- [ ] Finalize CourseCard design and apply to real course listing pages
- [ ] Extend same design language to Collection cards
- [ ] Replace existing CourseThumbnail component with new CourseCard
- [ ] Apply Medusa UI tokens system-wide (colors, shadows, typography)
- [ ] Audit all pages for consistency with the new design language
