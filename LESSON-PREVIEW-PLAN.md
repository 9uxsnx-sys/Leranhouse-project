# Full Implementation Plan — Main Course Page & Lesson Preview Page

## Goal
Transform **both** the main course page (`course.tsx`) and the lesson preview page (`lesson-preview/page.tsx`) from static mockups into fully dynamic, backend-connected pages with a unified design across all courses.

---

## Progress Tracking System

### Status Markers
- `[ ]` = Not started
- `[~]` = In progress
- `[X]` = Done
- `[!]` = Blocked (note why in the status line)

### Rules
1. **Every step must be independently testable** — never skip steps
2. After every step, run `npx next build` from `apps/web` — build must pass before moving on
3. If another developer/AI takes over, start from the first `[ ]` step
4. Read the relevant files listed in each step before making changes
5. Update the status to `[X]` only after the step is verified

---

## Background: What Already Exists vs What's Mock

### Backend DB Fields (Course table) — Already Exist

| DB Column | General Tab Has UI? | Course Page Uses It? | Lesson Page Uses It? |
|-----------|---------------------|---------------------|---------------------|
| `name` | ✅ Yes | ✅ Yes | ✅ Connected (Step 3) |
| `description` | ✅ Yes (single line) | ❌ Not used | N/A |
| `about` | ✅ Yes (textarea) | ❌ 6 mock paragraphs | N/A |
| `learnings` | ✅ Yes (LearningItemsList) | ⚠️ Mock fallback | N/A |
| `tags` | ✅ Yes (TagInput) | ❌ Not used | N/A |
| `thumbnail_image` | ✅ Yes | ✅ Yes | N/A |
| `thumbnail_video` | ✅ Yes | ❌ Not used | N/A |
| `public`/`published` | ❌ Not in General tab | ❌ Not used | N/A |
| `chapters[]` + `activities[]` | ✅ (Structure tab) | ✅ Yes (CourseCurriculum) | ✅ Connected (Steps 2-5) |
| `course_updates` table | ❌ No UI | ❌ Mock timeline | N/A |
| `authors`/`contributors` | ✅ (Contributors tab) | ❌ Mock instructor | N/A |

### Fields That Need `extra_metadata` (JSONB — no migration needed)

The `extra_metadata` column is a JSONB field that can store any arbitrary JSON. No database migration is required.

| Field | Used Where | Current Status |
|-------|-----------|---------------|
| Difficulty (Beginner/Intermediate/Advanced) | Course page stats row | Mock only |
| Duration (e.g. "6 hours") | Course page stats row | Mock only |
| Video hours count | Course page sidebar | Mock only |
| Resources count | Course page sidebar | Mock only |
| Has certificate | Course page sidebar | Mock only |
| Requirements list | Course page | Mock only |
| Instructor name/title/bio/avatar | Course page | Mock only |

### Fields That Need New Backend Tables

| Section | Used On | Current Status |
|---------|---------|---------------|
| Learning Objectives (per activity) | Lesson page "What You'll Learn" | 4 hardcoded bullets |
| Key Takeaways / Summary (per activity) | Lesson page "Key Takeaways" | Hardcoded nested lists |
| Resources / Downloads (per activity) | Lesson page "Resources" | 3 hardcoded files |
| Knowledge Checks Q&A (per activity) | Lesson page "Quick Check" | 3 hardcoded Q&A cards |

---

## Phase A — Connect Main Course Page (`course.tsx`) to Real Data

**Files involved**: `course.tsx`, `EditCourseGeneral.tsx`, potentially new form components

**Strategy**: Connect existing backend fields first (no new DB work), then add missing fields via `extra_metadata` (JSONB — no migration).

### Step A1 — Connect `course.about` to the "About This Course" section
- [X] Status: `[X]`
- **File**: `course.tsx`
- **What**: Replace the 6 hardcoded description paragraphs with real data from `course.about`
- **How**:
  - In `course.tsx`, find the "About This Course" section (around line 220-243)
  - Replace all hardcoded `<Text>` paragraphs with `course.about` content
  - If `course.about` has multiple paragraphs (split by `\n\n`), render each as a separate `<Text>` element
  - If `course.about` is empty/null, show nothing (section hides automatically later in polish)
- **Verify**: The About section shows the real course description from the General tab
- **Build check**: `npx next build` passes — **DONE**

### Step A2 — Connect `course.description` to the stats/subtitle area
- [X] Status: `[X]`
- **File**: `course.tsx`
- **What**: Show `course.description` as a subtitle below the course title
- **How**:
  - After the hero image and course title, add a short description paragraph using `course.description`
  - Place it between the title and the stats row
- **Verify**: A short description appears below the course title
- **Build check**: `npx next build` passes — **DONE**

### Step A3 — Connect `course.learnings` properly
- [X] Status: `[X]`
- **File**: `course.tsx`, `CourseLearnings.tsx`
- **What**: Fix the learning items so they use real backend data instead of falling back to mock
- **How**:
  - In `course.tsx`, the `getLearningTags()` function already tries to parse `course.learnings` — but it falls back to `MOCK_COURSE_META.learnings`
  - Ensure the parsing handles both JSON array format (new) and comma-separated format (legacy)
  - Remove the mock fallback — if no learnings, the section should simply be empty
- **Verify**: "What You'll Learn" section shows real learning items from the General tab
- **Build check**: `npx next build` passes — **DONE**

### Step A4 — Add `extra_metadata` fields to the General Tab
- [X] Status: `[X]`
- **Files**: `EditCourseGeneral.tsx`, `course.tsx`
- **What**: Add form fields for Difficulty, Duration, Video Hours, Resources Count, Has Certificate, Requirements, Instructor Info — all stored in `course.extra_metadata` JSONB
- **How**:
  - In `EditCourseGeneral.tsx`:
    - Add a section "Course Metadata" after the existing fields
    - Add inputs for:
      - Difficulty: dropdown (`Beginner` / `Intermediate` / `Advanced`)
      - Duration: text input (e.g. "6 hours")
      - Video Hours: number input
      - Resources Count: number input
      - Has Certificate: toggle/switch
      - Requirements: tag-style list input (like learnings but simpler)
      - Instructor Name: text input
      - Instructor Title: text input
      - Instructor Bio: textarea
  - Store all values in `course.extra_metadata` as a JSON object
  - The `extra_metadata` field already exists in `CourseUpdate` model in the backend — no API changes needed
  - In `course.tsx`:
    - Read these values from `course.extra_metadata` instead of `MOCK_COURSE_META`
- **Verify**: Enter values in General tab, save, refresh course page — they display correctly
- **Build check**: `npx next build` passes — **DONE**

### Step A5 — Remove `MOCK_COURSE_META` entirely
- [X] Status: `[X]`
- **File**: `course.tsx`
- **What**: Delete the `MOCK_COURSE_META` object and all its references
- **How**:
  - Remove the `MOCK_COURSE_META` constant
  - Replace all remaining mock references with real data:
    - Stats row (lessons, duration, difficulty) → from `course.extra_metadata`
    - "Course Includes" sidebar → from `course.extra_metadata`
    - Requirements → from `course.extra_metadata`
    - Instructor card → from `course.extra_metadata`
  - If a field is null/empty, the section should gracefully show nothing (or a placeholder)
- **Verify**: Page loads without mock data — all sections show real data or are hidden
- **Build check**: `npx next build` passes — **DONE**

### Step A6 — Connect real course updates (optional stretch)
- [ ] Status: `[ ]`
- **File**: `course.tsx`
- **What**: Replace the mock updates timeline with real data from the `course_updates` API
- **How**:
  - Fetch course updates using the existing API endpoint
  - Display them in the same timeline format
- **Verify**: Updates sidebar shows real course updates
- **Build check**: `npx next build` passes

---

## Phase B — Connect Lesson Preview Page (`lesson-preview/page.tsx`)

**Note**: Steps 1-5 are already done. The remaining sections use hardcoded mock data.

### Steps Already Completed
- [X] **Step 1** — Wire up real route params (`courseuuid`, `activityid`)
- [X] **Step 2** — Connect `CourseOutlineSidebar` to real chapters from `CourseProvider`
- [X] **Step 3** — Connect page title, prev/next navigation, and "Mark as Complete" button
- [X] **Step 4** — Connect main content area to real activity component (Video, Markdown, Document, Assignment, SCORM)
- [X] **Step 5** — Connect "Up Next" section to real next activity data

### Step B1 — Create Learning Objectives (backend model + API + frontend)
- [ ] Status: `[ ]`
- **What**: Create the `activity_learning_objectives` model so instructors can add objectives per activity
- **Backend**: 
  - New file `apps/api/src/db/courses/activity_learning_objectives.py`
  - Model fields: `id`, `activity_uuid` (FK), `text` (text), `order` (int), `created_at`, `updated_at`
  - New router at `apps/api/src/routers/courses/activity_learning_objectives.py`
  - API endpoints:
    - `GET /courses/activities/{activity_uuid}/objectives` — list objectives
    - `POST /courses/activities/{activity_uuid}/objectives` — create
    - `PUT /courses/activities/{activity_uuid}/objectives/{objective_id}` — update
    - `DELETE /courses/activities/{activity_uuid}/objectives/{objective_id}` — delete
- **Frontend display**: Replace hardcoded bullets in "What You'll Learn" section with SWR fetch + dynamic list
- **Editing UI**: Add "Learning Objectives" section to the activity editor (or Content tab per-activity)
- **Verify**: Add objectives via dashboard, see them appear on lesson page
- **Build check**: `npx next build` passes

### Step B2 — Create Key Takeaways / Summary (backend model + API + frontend)
- [ ] Status: `[ ]`
- **What**: Create the `activity_summaries` model
- **Backend**:
  - New file `apps/api/src/db/courses/activity_summaries.py`
  - Model fields: `id`, `activity_uuid` (FK), `content` (rich text / JSON), `created_at`, `updated_at`
  - API endpoints: `GET / PUT / DELETE /courses/activities/{uuid}/summary`
- **Frontend display**: Replace hardcoded "Key Takeaways" section with dynamic content
- **Build check**: `npx next build` passes

### Step B3 — Create Resources / Attachments (backend model + API + frontend)
- [ ] Status: `[ ]`
- **What**: Create the `activity_resources` model
- **Backend**:
  - New file `apps/api/src/db/courses/activity_resources.py`
  - Model fields: `id`, `activity_uuid` (FK), `name`, `file_url`, `file_type`, `order`, `created_at`, `updated_at`
  - API endpoints: `GET / POST / DELETE /courses/activities/{uuid}/resources`
- **Frontend display**: Replace hardcoded "Resources" section with dynamic file list + download buttons
- **Build check**: `npx next build` passes

### Step B4 — Create Knowledge Checks (backend model + API + frontend)
- [ ] Status: `[ ]`
- **What**: Create the `activity_knowledge_checks` model
- **Backend**:
  - New file `apps/api/src/db/courses/activity_knowledge_checks.py`
  - Model fields: `id`, `activity_uuid` (FK), `question` (text), `answer` (text), `order` (int), `created_at`, `updated_at`
  - API endpoints: `GET / POST / PUT / DELETE /courses/activities/{uuid}/knowledge-checks`
- **Frontend display**: Replace hardcoded "Quick Check" Q&A cards with dynamic accordion list
- **Build check**: `npx next build` passes

### Step B5 — Clean up remaining mock data from lesson page
- [ ] Status: `[ ]`
- **What**: Remove `MOCK_CHAPTERS`, `MOCK_SECTIONS`, and any remaining hardcoded data from the lesson page file
- **How**:
  - `MOCK_CHAPTERS` — no longer referenced (already replaced by real chapters)
  - `MOCK_SECTIONS` — still used by the IntersectionObserver for "On This Page" sidebar; replace with dynamic sections based on what data actually exists
- **Verify**: No mock data constants remain in the lesson page file
- **Build check**: `npx next build` passes

---

## Phase C — Polish and Edge Cases

### Step C1 — Conditional section visibility
- [ ] Status: `[ ]`
- **What**: Sections should only appear if they have data
- **Example**: If an activity has no learning objectives, hide "What You'll Learn" section entirely and remove it from "On This Page" sidebar nav
- **Applies to**: Both course page and lesson page
- **Build check**: `npx next build` passes

### Step C2 — Loading and error states
- [ ] Status: `[ ]`
- **What**: Add proper loading skeletons and error handling for all data-dependent sections
- **Applies to**: Both pages
- **Build check**: `npx next build` passes

### Step C3 — Mobile responsiveness
- [ ] Status: `[ ]`
- **What**: Test and fix the layout on mobile/small screens
- **Applies to**: Both pages
- **Build check**: `npx next build` passes

### Step C4 — Final UI alignment
- [ ] Status: `[ ]`
- **What**: After all data is real and working, polish the visual design to match the "Medusa style" (clean, muted grays, subtle borders, no heavy shadows)
- **Build check**: `npx next build` passes

---

## Quick Reference: File Paths

| File | Purpose |
|------|---------|
| `apps/web/app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/course.tsx` | Main course page |
| `apps/web/app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/lesson-preview/page.tsx` | Lesson preview page |
| `apps/web/components/Dashboard/Pages/Course/EditCourseGeneral/EditCourseGeneral.tsx` | General tab in dashboard |
| `apps/web/components/Contexts/CourseContext.tsx` | CourseProvider + useCourse hook |
| `apps/web/components/Objects/Courses/CourseLearnings/CourseLearnings.tsx` | "What You'll Learn" component |
| `apps/web/components/Objects/Courses/CourseRequirements/CourseRequirements.tsx` | Requirements component |
| `apps/web/components/Objects/Courses/CourseCurriculum/CourseCurriculum.tsx` | Curriculum accordion component |
| `apps/web/services/courses/activity.ts` | Activity API (markAsComplete, etc.) |
| `apps/api/src/db/courses/courses.py` | Course DB model |
| `apps/api/src/db/courses/activities.py` | Activity DB model |
| `apps/api/src/db/courses/course_updates.py` | Course updates DB model |
| `apps/api/src/routers/courses/courses.py` | Course API router |

---

## Safety Rules

1. **Never** modify `activity/[activityid]/activity.tsx` — the old lesson viewer stays untouched until Phase C
2. **Never** modify existing API endpoints in ways that break existing consumers — new models get new endpoints
3. After every step, `npx next build` must pass before moving on
4. If a step breaks the build, roll back and fix before proceeding
5. Each step should be independently testable — if you can't test it, it's too big, split it

## Build Verification

```bash
cd apps/web
npx next build
```

The only allowed failure is the pre-existing podcast TypeScript error (`Property 'created_at' does not exist on type 'PodcastEpisode'` in `podcast.tsx:83`). Any other errors must be fixed before marking a step complete.
