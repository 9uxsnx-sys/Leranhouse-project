# Lesson Preview Page — Implementation Plan

## Goal
Transform the lesson-preview page from a static mockup into a fully dynamic, backend-connected lesson viewer that serves as the unified design for all course lessons.

## Progress Tracking
- Each step has a status: `[ ]` = not started, `[~]` = in progress, `[X]` = done
- After completing each step, run `npx next build` from `apps/web` to verify nothing is broken
- If another developer or AI agent takes over, they start from the first `[ ]` step
- Each step is independently testable — do not skip steps

---

## Phase 1 — Frontend: Replace Mock Data With Real Backend Data

These steps require **zero backend changes**. All data already exists in the API/CourseContext.

### Step 1 — Wire up real route params
- [ ] Status: `[ ]`
- **File**: `lesson-preview/page.tsx`
- **What**: Make the page accept `courseuuid` and `activityid` from route params instead of being a static page
- **How**:
  - Add `params: Promise<{ courseuuid: string; activityid: string }>` to the page component
  - Use `use(params)` to extract `courseuuid` and `activityid`
  - Pass `activityid` as prop to child components that currently use hardcoded `"act_1"`
- **Verify**: Page loads with route params instead of crashing
- **Build check**: `npx next build` passes

### Step 2 — Connect CourseOutlineSidebar to real data
- [ ] Status: `[ ]`
- **File**: `lesson-preview/page.tsx`
- **What**: Replace `MOCK_CHAPTERS` with real chapters from `useCourse()`
- **How**:
  - Wrap the page in `CourseProvider` (already exists in the dashboard, reuse it)
  - Use `useCourse()` hook to get `courseStructure.chapters`
  - Replace all `MOCK_CHAPTERS` references with real chapter/activity data
  - Keep the same rendering logic (accordion, current activity highlight, etc.)
- **Verify**: Sidebar shows real course chapters and activities instead of mock data
- **Build check**: `npx next build` passes

### Step 3 — Connect page title and navigation buttons
- [ ] Status: `[ ]`
- **File**: `lesson-preview/page.tsx`
- **What**: Replace hardcoded title and prev/next/mark-complete buttons with real data
- **How**:
  - Page title: use `activity.name` from the current activity (looked up from chapters via `activityid`)
  - Previous/Next: use logic similar to `useActivityPosition()` from `activity.tsx` to find prev/next activity
  - Mark as Complete: call `markActivityAsComplete()` API from `services/courses/activity.ts`
  - Import `ArrowLeft`, `ArrowRight` from lucide-react (already imported)
- **Verify**: Title shows real activity name, buttons navigate to real prev/next activities
- **Build check**: `npx next build` passes

### Step 4 — Connect main content area to real activity component
- [ ] Status: `[ ]`
- **File**: `lesson-preview/page.tsx`
- **What**: Replace the video placeholder with the actual activity rendering component
- **How**:
  - Import the activity type components (or reuse the switch logic from `activity.tsx` lines 234-299)
  - Switch on `activity.activity_type` and `activity.activity_sub_type`:
    - `TYPE_VIDEO` → `VideoActivity`
    - `TYPE_DYNAMIC` + `SUBTYPE_DYNAMIC_MARKDOWN` → `MarkdownActivity`
    - `TYPE_DYNAMIC` + `SUBTYPE_DYNAMIC_EMBED` → `EmbedActivity`
    - `TYPE_DOCUMENT` → `DocumentPdfActivity`
    - `TYPE_ASSIGNMENT` → `AssignmentStudentActivity`
    - `TYPE_SCORM` → `ScormActivity`
  - Wrap in `Suspense` with loading fallback (same pattern as activity.tsx)
  - Remove the hardcoded video placeholder div
- **Verify**: Each activity type renders correctly in the lesson content section
- **Build check**: `npx next build` passes

### Step 5 — Connect "Up Next" section
- [ ] Status: `[ ]`
- **File**: `lesson-preview/page.tsx`
- **What**: Replace hardcoded "Up Next" content with the real next activity
- **How**:
  - Use the next activity from Step 3's position logic
  - Show `nextActivity.name` as the title
  - Show `nextActivity.description` or a summary as the description
  - Make the card clickable to navigate to the next activity
- **Verify**: "Up Next" shows the correct next lesson from the course structure
- **Build check**: `npx next build` passes

---

## Phase 2 — Backend: New Models and APIs

Each step in this phase requires: (1) database model, (2) CRUD API endpoints, (3) frontend component to display, (4) editing UI in dashboard.

### Step 6 — Learning Objectives
- [ ] Status: `[ ]`
- **Backend model**: `activity_learning_objectives`
  - `id` (UUID, primary key)
  - `activity_uuid` (UUID, foreign key to activities)
  - `text` (text, the objective content)
  - `order` (integer, display order)
  - `created_at`, `updated_at` (timestamps)
- **API endpoints**: `/api/v1/activities/{uuid}/objectives`
  - `GET` — list objectives for an activity
  - `POST` — create a new objective
  - `PUT /{objective_id}` — update an objective
  - `DELETE /{objective_id}` — delete an objective
- **Frontend display**: Replace hardcoded bullet points in "What You'll Learn" section with dynamic list
- **Editing UI**: Add "Learning Objectives" section to the activity editor in the dashboard
- **Build check**: `npx next build` passes

### Step 7 — Key Takeaways / Summary
- [ ] Status: `[ ]`
- **Backend model**: `activity_summaries`
  - `id` (UUID, primary key)
  - `activity_uuid` (UUID, foreign key to activities)
  - `content` (rich text / JSON structured content)
  - `created_at`, `updated_at` (timestamps)
- **API endpoints**: `/api/v1/activities/{uuid}/summary`
  - `GET` — get summary for an activity
  - `PUT` — create or update summary
  - `DELETE` — delete summary
- **Frontend display**: Replace hardcoded "Key Takeaways" section with dynamic rich text content
- **Editing UI**: Add "Summary" rich text editor to the activity editor
- **Build check**: `npx next build` passes

### Step 8 — Resources / Attachments
- [ ] Status: `[ ]`
- **Backend model**: `activity_resources`
  - `id` (UUID, primary key)
  - `activity_uuid` (UUID, foreign key to activities)
  - `name` (varchar, display name)
  - `file_url` (text, URL to uploaded file)
  - `file_type` (varchar, MIME type or file extension)
  - `order` (integer, display order)
  - `created_at`, `updated_at` (timestamps)
- **API endpoints**: `/api/v1/activities/{uuid}/resources`
  - `GET` — list resources for an activity
  - `POST` — upload a resource (multipart file upload)
  - `DELETE /{resource_id}` — delete a resource
- **Frontend display**: Replace hardcoded "Resources" section with dynamic file list with download buttons
- **Editing UI**: Add file upload section to the activity editor
- **Build check**: `npx next build` passes

### Step 9 — Knowledge Checks
- [ ] Status: `[ ]`
- **Backend model**: `activity_knowledge_checks`
  - `id` (UUID, primary key)
  - `activity_uuid` (UUID, foreign key to activities)
  - `question` (text)
  - `answer` (text)
  - `order` (integer, display order)
  - `created_at`, `updated_at` (timestamps)
- **API endpoints**: `/api/v1/activities/{uuid}/knowledge-checks`
  - `GET` — list knowledge checks for an activity
  - `POST` — create a new knowledge check
  - `PUT /{check_id}` — update a knowledge check
  - `DELETE /{check_id}` — delete a knowledge check
- **Frontend display**: Replace hardcoded "Knowledge Check" Q&A cards with dynamic accordion list
- **Editing UI**: Add "Knowledge Check" section to the activity editor
- **Build check**: `npx next build` passes

---

## Phase 3 — Polish and Edge Cases

### Step 10 — Conditional section visibility
- [ ] Status: `[ ]`
- **What**: The "On This Page" sidebar and page sections should only show if data exists
- **Example**: If an activity has no learning objectives, hide "What You'll Learn" section and remove it from the sidebar nav
- **Build check**: `npx next build` passes

### Step 11 — Loading and error states
- [ ] Status: `[ ]`
- **What**: Add proper loading skeletons and error handling for all data-dependent sections
- **Build check**: `npx next build` passes

### Step 12 — Mobile responsiveness
- [ ] Status: `[ ]`
- **What**: Test and fix the layout on mobile/small screens
- **Build check**: `npx next build` passes

---

## How to Use This Document

### For a developer taking over:
1. Read this document fully
2. Look at the status markers — start at the first `[ ]` step
3. Read the lesson-preview page code at `lesson-preview/page.tsx`
4. Read the existing activity page at `activity/[activityid]/activity.tsx` for reference implementations
5. Complete the step, run `npx next build`, update the status to `[X]`
6. Move to the next `[ ]` step

### For an AI coding agent:
1. Read this entire document
2. Identify which step is next (first `[ ]`)
3. Read the relevant files mentioned in the step
4. Implement the changes described
5. Run `npx next build` from `apps/web` to verify
6. Update the status in this file to `[X]`
7. Report which step was completed

### Safety rules:
- **Never** modify `activity.tsx` — the old lesson viewer stays untouched until Phase 3
- **Never** modify existing API endpoints — new models get new endpoints
- After every step, the build must pass before moving on
- If a step breaks the build, roll back and fix before proceeding
