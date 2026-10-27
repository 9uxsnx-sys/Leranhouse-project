# Courses

> Course endpoints manage the full lifecycle of learning content — create, read, update, delete, clone, export, import, and search courses — with paginated listing, nested chapter/activity metadata, and granular access rights.

---

## Overview

Courses are the top-level content unit in Koodook. Each course belongs to an organization and can contain multiple chapters, which in turn contain activities (lessons). Courses have configurable access levels (`public`, `users_only`, `paid`), pricing, tags, and rich metadata.

All course endpoints are under the Courses router at `/api/v1/courses`. Some endpoints require the `courses` feature to be enabled for the organization (enforced by a router-level dependency).

---

## List Courses (by Org Slug)

Retrieve a paginated list of courses for a given organization.

```
GET /api/v1/courses/org_slug/{org_slug}/page/{page}/limit/{limit}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `org_slug` | string | The organization's URL slug |
| `page` | integer | Page number (1-indexed) |
| `limit` | integer | Items per page (capped server-side) |

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `visibility` | string | Filter by visibility: `public`, `private`, or omit for all |
| `sort` | string | Sort order (e.g., `newest`, `oldest`, `title`) |
| `include_unpublished` | boolean | Include drafts (dashboard list); defaults to `false` |
| `locale` | string | Content locale (e.g. `ar`, `fr`). Falls back to the course's source locale |

### Example Request

```
GET /api/v1/courses/org_slug/my-org/page/1/limit/10?visibility=public
```

### Response Body (200 OK)

```json
{
  "items": [
    {
      "id": 1,
      "uuid": "abc123-def456",
      "name": "Introduction to Algebra",
      "description": "A beginner-friendly course on algebraic concepts.",
      "public": true,
      "access": "public",
      "price": null,
      "thumbnail_image": "https://cdn.koodook.com/thumbnails/abc123.jpg",
      "banner_image": "",
      "tags": ["math", "algebra", "beginner"],
      "created_at": "2026-09-20T10:00:00Z",
      "updated_at": "2026-09-22T15:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

### Localized responses

Course read models carry three localization fields:

| Field | Description |
|---|---|
| `source_locale` | Locale the base `course` row is written in |
| `content_locale` | Locale actually served for this request |
| `is_fallback` | `true` when `locale` had no translation, so the source content was returned |

Translated fields are overlaid at read time (`name`, `description`, `about`, `learnings`, `tags`, `seo`) together with the display-text keys of `extra_metadata` (`difficulty`, `duration`, `requirements`). Counts, booleans, and the `instructor` block always come from the base row. List and search endpoints localize with one translation query per page.

---

## Get Course (by UUID)

Retrieve a single course by its UUID.

```
GET /api/v1/courses/{course_uuid}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `course_uuid` | string | The course UUID |

### Response Body (200 OK)

```json
{
  "id": 1,
  "uuid": "abc123-def456",
  "name": "Introduction to Algebra",
  "description": "A beginner-friendly course on algebraic concepts.",
  "public": true,
  "access": "public",
  "price": null,
  "learnings": "By the end of this course, students will understand basic algebraic concepts.",
  "about": "This course covers variables, equations, and functions.",
  "tags": ["math", "algebra", "beginner"],
  "thumbnail_image": "https://cdn.koodook.com/thumbnails/abc123.jpg",
  "thumbnail_video": "",
  "thumbnail_type": "IMAGE",
  "banner_image": "",
  "extra_metadata": {
    "difficulty": "Beginner",
    "duration": "8 weeks",
    "requirements": "Basic Python knowledge",
    "video_hours": 12,
    "resources_count": 8,
    "has_certificate": true,
    "instructor": { "name": "John Doe", "bio": "..." },
    "target_audience": {
      "for": ["Python beginners who want to build real projects", "Self-taught developers"],
      "not_for": ["Experienced backend engineers", "Complete programming beginners"]
    }
  },
  "org_id": 1,
  "created_at": "2026-09-20T10:00:00Z",
  "updated_at": "2026-09-22T15:30:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | Course not found |

---

## Get Course (by ID)

Retrieve a single course by its numeric ID.

```
GET /api/v1/courses/id/{course_id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `course_id` | integer | The course database ID |

Response is identical to the UUID-based get endpoint.

---

## Get Full Course Metadata

Retrieve a course with all nested chapters and activities.

```
GET /api/v1/courses/{course_uuid}/meta
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `slim` | boolean | `false` | If `true`, excludes heavy activity content (blocks) for faster loading |
| `locale` | string | source locale | Locale used to overlay the course's translated content |

### Response Body (200 OK)

```json
{
  "id": 1,
  "uuid": "abc123-def456",
  "name": "Introduction to Algebra",
  "description": "A beginner-friendly course on algebraic concepts.",
  "chapters": [
    {
      "id": 10,
      "uuid": "chap-001",
      "title": "Chapter 1: Variables",
      "sort_order": 1,
      "activities": [
        {
          "id": 100,
          "uuid": "act-001",
          "title": "What is a Variable?",
          "activity_type": "TYPE_VIDEO",
          "sort_order": 1,
          "duration": 600,
          "content_summary": null
        }
      ]
    }
  ],
  "created_at": "2026-09-20T10:00:00Z",
  "updated_at": "2026-09-22T15:30:00Z"
}
```

When `slim=true`, activity `content` fields (e.g., rich text blocks, video URLs) are omitted.

---

## Create Course

Create a new course within an organization.

```
POST /api/v1/courses/{org_id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `org_id` | integer | The organization ID |

### Request Body (Multipart Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Course name |
| `description` | string | No | Short description |
| `public` | boolean | No | Whether the course is publicly visible |
| `learnings` | string | No | Learning objectives |
| `tags` | string | No | Comma-separated tags |
| `about` | string | No | Detailed course description |
| `thumbnail_type` | string | No | `"IMAGE"`, `"VIDEO"`, or `"BOTH"` |
| `thumbnail_image` | string | No | Card cover image URL |
| `banner_image` | string | No | Banner image URL |
| `extra_metadata` | string (JSON) | No | Arbitrary JSON metadata string. Supports `difficulty`, `duration`, `requirements`, `video_hours`, `resources_count`, `has_certificate`, `instructor`, and `target_audience` (`{ for: string[], not_for: string[] }`) |

### Example Request

```
POST /api/v1/courses/1
Content-Type: multipart/form-data

name: Introduction to Algebra
description: A beginner-friendly course on algebraic concepts.
public: true
learnings: Understand variables, equations, and functions
tags: math,algebra,beginner
about: This course covers the fundamentals of algebra.
```

### Response Body (201 Created)

```json
{
  "id": 1,
  "uuid": "abc123-def456",
  "name": "Introduction to Algebra",
  "description": "A beginner-friendly course on algebraic concepts.",
  "public": true,
  "access": "public",
  "org_id": 1,
  "created_at": "2026-09-23T10:00:00Z",
  "updated_at": "2026-09-23T10:00:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions to create courses |
| `422 Unprocessable Entity` | Validation error (e.g., missing name) |

---

## Update Course

Update an existing course's fields.

```
PUT /api/v1/courses/{course_uuid}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `course_uuid` | string | The course UUID |

### Request Body (Multipart Form Data)

Same fields as Create Course, but all are optional (only provided fields are updated).

### Response Body (200 OK)

Returns the updated course object.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Course not found |

---

## Delete Course

Delete a course and its contents.

```
DELETE /api/v1/courses/{course_uuid}
```

### Response

`204 No Content` on success.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Course not found |

---

## Clone Course

Create a copy of an existing course. The cloned course is private by default and has "(Copy)" appended to its name.

```
POST /api/v1/courses/{course_uuid}/clone
```

### Response Body (201 Created)

Returns the cloned course object.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Course not found |

---

## Export Course

Export a course to a JSON file for backup or transfer.

```
GET /api/v1/courses/{course_uuid}/export
```

### Response (200 OK)

Returns a JSON file download with the complete course structure including chapters, activities, and content blocks.

---

## Batch Export

Export up to 20 courses at once.

```
POST /api/v1/courses/export/batch
```

### Request Body (JSON)

```json
{
  "course_uuids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### Response

Returns a JSON array of exported course objects.

---

## Import Course (Analyze)

Analyze an export file to preview what will be imported.

```
POST /api/v1/courses/import/analyze
```

### Request Body (Multipart Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Previously exported course JSON file |

### Response Body (200 OK)

Returns an analysis of the import including course names, chapter counts, and activity counts.

---

## Import Course

Import a previously exported course into an organization.

```
POST /api/v1/courses/import
```

### Request Body (Multipart Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Previously exported course JSON file |
| `org_id` | integer | Yes | Target organization ID |

### Response Body (201 Created)

Returns the imported course object.

---

## Search Courses

Search for courses within an organization by name or description.

```
GET /api/v1/courses/org_slug/{org_slug}/search
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query string |
| `limit` | integer | No | Max results (default `10`) |
| `locale` | string | No | Locale used to localize the returned course names |

> Search itself matches the **source-locale** text only; `locale` affects the result payload, not the matching.

### Response Body (200 OK)

```json
[
  {
    "id": 1,
    "uuid": "abc123-def456",
    "name": "Introduction to Algebra",
    "description": "A beginner-friendly course on algebraic concepts."
  }
]
```

---

## Count Courses

Get the total number of courses in an organization.

```
GET /api/v1/courses/org_slug/{org_slug}/count
```

### Response Body (200 OK)

```json
{
  "count": 42
}
```

---

## Update Course Thumbnail

Upload a card cover image for the course.

```
PUT /api/v1/courses/{course_uuid}/thumbnail
```

### Request Body (Multipart Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Image file (JPG/PNG, max 8MB) |

### Response Body (200 OK)

```json
{
  "thumbnail_image": "https://cdn.koodook.com/media/course_abc123/thumbnail.jpg"
}
```

---

## Delete Course Thumbnail

Remove the card cover image from a course.

```
DELETE /api/v1/courses/{course_uuid}/thumbnail
```

### Response

`204 No Content` on success.

---

## Update Course Banner

Upload a hero banner image for the course detail page.

```
PUT /api/v1/courses/{course_uuid}/banner
```

### Request Body (Multipart Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Image file (JPG/PNG, max 8MB) |

### Response Body (200 OK)

```json
{
  "banner_image": "https://cdn.koodook.com/media/course_abc123/banner.jpg"
}
```

---

## Delete Course Banner

Remove the banner image from a course.

```
DELETE /api/v1/courses/{course_uuid}/banner
```

### Response

`204 No Content` on success.

---

## Get Course Rights

Retrieve granular access rights for a course, including ownership, roles, and permissions.

```
GET /api/v1/courses/{course_uuid}/rights
```

### Response Body (200 OK)

```json
{
  "is_owner": true,
  "can_edit": true,
  "can_delete": true,
  "can_manage_access": true,
  "roles": ["admin", "instructor"],
  "permissions": ["courses:write", "courses:delete"]
}
```

---

## Get Course Contributors

List all contributors (users who have edited or contributed to) a course.

```
GET /api/v1/courses/{course_uuid}/contributors
```

### Response Body (200 OK)

```json
[
  {
    "user_id": 1,
    "username": "johndoe",
    "display_name": "John Doe",
    "role": "author",
    "contributed_at": "2026-09-22T10:00:00Z"
  }
]
```

---

## Get Course Updates

Get the update/change history for a course.

```
GET /api/v1/courses/{course_uuid}/updates
```

### Response Body (200 OK)

```json
[
  {
    "id": 1,
    "action": "update",
    "field": "name",
    "old_value": "Algebra 101",
    "new_value": "Introduction to Algebra",
    "changed_by": 1,
    "changed_at": "2026-09-22T15:30:00Z"
  }
]
```

---

## Course Translations

A course stores its source language on the base `course` row (`source_locale`). Every other language lives in `course_translation`, one row per locale. Reads overlay those rows on top of the base course (`locale` query parameter); writes go through these endpoints and require update access.

### List Translations

```
GET /api/v1/courses/{course_uuid}/translations
```

Returns `CourseTranslationRead[]` — every stored locale for the course, including `state`, `source_updated_at` and `translated_by`.

### Upsert Translation

```
PUT /api/v1/courses/{course_uuid}/translations/{locale}
```

| Body field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Translated course title |
| `description` | string | No | Cards and course header |
| `about` | string | No | "About this course" paragraphs (`\n\n` separated) |
| `learnings` | string | No | JSON array of `{ id, text, emoji }` |
| `tags` | string | No | Comma-separated (no editor in v1) |
| `seo` | object | No | Same shape as the course `seo` object |
| `extra_metadata` | object | No | Display-text keys only: `difficulty`, `duration`, `requirements` |
| `state` | string | No | `draft` \| `machine` \| `reviewed` \| `published` (v1 serves every state) |

`extra_metadata` is **merged** over the base row at read time, so counts (`video_hours`, `resources_count`), flags (`has_certificate`) and `instructor` are never lost by a translation.

Writing the course's own `source_locale` here returns `422` — edit the course instead.

### Delete Translation

```
DELETE /api/v1/courses/{course_uuid}/translations/{locale}
```

Removes the locale row; subsequent reads fall back to the source locale with `is_fallback: true`.

---

## Data Model Summary

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `uuid` | string | Public UUID identifier |
| `org_id` | integer | Foreign key to organization |
| `name` | string | Course name |
| `description` | text | Short description |
| `public` | boolean | Derived from `access_type` — `true` only for Free; kept for catalog indexes |
| `access_type` | enum | `public` (Free), `users_only` (Restricted), or `paid` |
| `price_amount` | integer | Price in DZD (null unless `paid`) |
| `price_currency` | string | Always `DZD` |
| `learnings` | text | Learning objectives |
| `about` | text | Detailed description |
| `tags` | array | Categorization tags |
| `thumbnail_image` | string | Card cover image URL (course card thumbnail) |
| `thumbnail_video` | string | Video thumbnail URL |
| `thumbnail_type` | string | `IMAGE`, `VIDEO`, or `BOTH` |
| `banner_image` | string | Hero banner image URL (course detail page) |
| `extra_metadata` | JSON | Flexible metadata including `difficulty`, `duration`, `requirements` (display text), `video_hours`, `resources_count`, `has_certificate`, `instructor` (object), and `target_audience` (`{ for: string[], not_for: string[] }` — drives the "Who This Is For" section) |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
