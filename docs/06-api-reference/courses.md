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
      "thumbnail": "https://cdn.koodook.com/thumbnails/abc123.jpg",
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
  "thumbnail": "https://cdn.koodook.com/thumbnails/abc123.jpg",
  "thumbnail_type": "upload",
  "extra_metadata": {},
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
| `thumbnail_type` | string | No | `"upload"` or `"url"` |
| `extra_metadata` | string (JSON) | No | Arbitrary JSON metadata string |
| `thumbnail` | file | No | Course thumbnail image file |

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

## Data Model Summary

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `uuid` | string | Public UUID identifier |
| `org_id` | integer | Foreign key to organization |
| `name` | string | Course name |
| `description` | text | Short description |
| `public` | boolean | Visibility flag |
| `access` | enum | `public`, `users_only`, or `paid` |
| `price` | decimal | Course price in DZD (null if free) |
| `learnings` | text | Learning objectives |
| `about` | text | Detailed description |
| `tags` | array | Categorization tags |
| `thumbnail` | string | Thumbnail URL |
| `thumbnail_type` | string | `upload` or `url` |
| `extra_metadata` | JSON | Arbitrary metadata |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
