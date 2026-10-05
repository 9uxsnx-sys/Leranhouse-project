# General Settings

> Configuring the basic information of your course.

---

## Fields

### Course Name

The title displayed to learners. Required.

### Description

A short description of the course. Displayed on the course detail page.

### Difficulty

Three levels available:
- **Beginner** --- No prior knowledge required
- **Intermediate** --- Some prior knowledge helpful
- **Advanced** --- In-depth, expert-level content

Selected via a dropdown with clean menu styling.

### Media Section

The course media section provides two image fields inside a dedicated white card:

```
┌───────────────────────────────────────────────────────────────┐
│ [ImageIcon]  Card Cover Image                   [UploadCloud] │
│                                                     or        │
│                                              [Trash2] (delete) │
│                                                               │
│ [ImageIcon]  Banner Image (Hero)                [UploadCloud] │
│                                                     or        │
│                                              [Trash2] (delete) │
└───────────────────────────────────────────────────────────────┘
```

**Card Cover Image** (`thumbnail_image`) — The course thumbnail displayed on course cards in listing pages, search results, and trail pages. Supported formats: JPG, PNG. Max file size: 8MB.

**Banner Image** (`banner_image`) — The hero banner displayed at the top of the course detail page (spans the full content width, matching the left content column + right sidebar combined width). Supported formats: JPG, PNG. Max file size: 8MB.

**States (applies to both fields):**

- **No image:** Shows an UploadCloud icon button. Clicking it opens a file picker (JPG/PNG only, max 8MB).
- **Has image:** Shows the current image as a thumbnail preview alongside a Trash2 icon button. Clicking Trash2 deletes the image.
- **Loading:** The action icon is replaced by a small spinning circle (same 18px size), shown per field.

**Upload flow:**

1. Click the upload icon to pick a file from device
2. File is validated client-side (type + size)
3. Uploaded via `FormData` to the appropriate API endpoint
4. On success, CourseContext dispatches the updated course (via `{ type: 'updateField', payload: { field: 'thumbnail_image' or 'banner_image', value: url } }`), SWR cache revalidates via `revalidateTags` + `mutate`, and `router.refresh()` triggers server re-render
5. Click the trash icon to delete — sends `DELETE` to the appropriate endpoint, same revalidation flow
6. On error, toast shows the failure reason

**Backend endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| PUT | `/api/v1/courses/{course_uuid}/thumbnail` | Upload card cover image |
| DELETE | `/api/v1/courses/{course_uuid}/thumbnail` | Remove card cover image |
| PUT | `/api/v1/courses/{course_uuid}/banner` | Upload banner image |
| DELETE | `/api/v1/courses/{course_uuid}/banner` | Remove banner image |

**Frontend services:**

- `updateCourseThumbnail(course_uuid, file, access_token)` — Uploads card cover
- `deleteCourseThumbnail(course_uuid, access_token)` — Deletes card cover
- `updateCourseBanner(course_uuid, file, access_token)` — Uploads banner
- `deleteCourseBanner(course_uuid, access_token)` — Deletes banner

### Offers Certificate

A toggle switch to enable/disable certificate issuance for course completion.

### Categories

Optional categories for organizing courses on the platform.

---

## Action Row

Above the sectioned cards, there is an inline **action row**:

```
[👁 Preview]                    [Save] [Publish/Unpublish]
```

- **Preview** (left) — opens the course page in a new tab as a user would see it. Links to the public course URL (strips the `course_` prefix from the UUID).
- **Save** (right) — white background when saved, black background when unsaved changes exist. Clicking saves all pending changes immediately. Not clickable when already saved.
- **Publish/Unpublish** (right) — toggles the course published state with confirmation toast feedback.

## UI Pattern

The General tab uses **sectioned white cards** on a light grey background:

```
┌─────────────────────────────────────┐
│  Page background: #f8f8f8           │
│                                     │
│  ┌─── White Card ─────────────────┐ │
│  │  SECTION TITLE                 │ │
│  │                                │ │
│  │  Field label                   │ │
│  │  ┌──────────────────────────┐  │ │
│  │  │ Input field (bg-ui-bg)   │  │ │
│  │  └──────────────────────────┘  │ │
│  │                                │ │
│  │  Field label                   │ │
│  │  ┌──────────────────────────┐  │ │
│  │  │ Input field (bg-ui-bg)   │  │ │
│  │  └──────────────────────────┘  │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─── White Card ─────────────────┐ │
│  │  NEXT SECTION                  │ │
│  │  ...                           │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Field Styling

Fields use a consistent class pattern:
```css
bg-ui-bg-field !shadow-none border border-ui-border-base
focus:border-ui-border-strong focus-visible:!shadow-none transition-none
```
