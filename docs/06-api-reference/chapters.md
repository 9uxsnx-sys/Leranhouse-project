# Chapters

> Chapter endpoints manage the structural grouping of activities within a course — create, read, update, delete, reorder chapters and their nested activities, and control user group access per chapter.

---

## Overview

Chapters (also called modules) are containers that group activities (lessons) within a course. Each chapter belongs to a single course, has a sort order for sequencing, and can be restricted to specific user groups.

All chapter endpoints are under the Chapters router at `/api/v1/courses/chapters`.

---

## List Chapters (by Course)

Retrieve a paginated list of chapters for a given course.

```
GET /api/v1/courses/chapters/course/{course_id}/page/{page}/limit/{limit}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `course_id` | integer | The course database ID |
| `page` | integer | Page number (1-indexed) |
| `limit` | integer | Items per page (capped server-side) |

### Response Body (200 OK)

```json
{
  "items": [
    {
      "id": 10,
      "uuid": "chap-001",
      "title": "Chapter 1: Variables",
      "description": "Understanding variables and constants",
      "sort_order": 1,
      "course_id": 1,
      "created_at": "2026-09-20T10:00:00Z",
      "updated_at": "2026-09-22T15:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

---

## Get Chapter

Retrieve a single chapter by its numeric ID.

```
GET /api/v1/courses/chapters/{chapter_id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `chapter_id` | integer | The chapter database ID |

### Response Body (200 OK)

```json
{
  "id": 10,
  "uuid": "chap-001",
  "title": "Chapter 1: Variables",
  "description": "Understanding variables and constants",
  "sort_order": 1,
  "course_id": 1,
  "created_at": "2026-09-20T10:00:00Z",
  "updated_at": "2026-09-22T15:30:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | Chapter not found |

---

## Create Chapter

Create a new chapter within a course.

```
POST /api/v1/courses/chapters
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Chapter title |
| `description` | string | No | Chapter description |
| `course_id` | integer | Yes | The parent course ID |
| `sort_order` | integer | No | Position in the course (auto-assigned if omitted) |

### Example Request

```json
{
  "title": "Chapter 1: Variables",
  "description": "Understanding variables and constants",
  "course_id": 1,
  "sort_order": 1
}
```

### Response Body (201 Created)

```json
{
  "id": 10,
  "uuid": "chap-001",
  "title": "Chapter 1: Variables",
  "description": "Understanding variables and constants",
  "sort_order": 1,
  "course_id": 1,
  "created_at": "2026-09-23T10:00:00Z",
  "updated_at": "2026-09-23T10:00:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `422 Unprocessable Entity` | Validation error (e.g., missing title) |

---

## Update Chapter

Update an existing chapter's fields.

```
PUT /api/v1/courses/chapters/{chapter_id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `chapter_id` | integer | The chapter database ID |

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Chapter title |
| `description` | string | No | Chapter description |
| `sort_order` | integer | No | Position in the course |

### Example Request

```json
{
  "title": "Chapter 1: Variables and Expressions",
  "sort_order": 2
}
```

### Response Body (200 OK)

Returns the updated chapter object.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Chapter not found |

---

## Delete Chapter

Delete a chapter and its contained activities.

```
DELETE /api/v1/courses/chapters/{chapter_id}
```

### Response

`204 No Content` on success.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Chapter not found |

---

## Reorder Chapters and Activities

Reorder chapters and their nested activities within a course in a single request.

```
PUT /api/v1/courses/chapters/course/{course_uuid}/order
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `course_uuid` | string | The course UUID |

### Request Body (JSON)

```json
{
  "chapters": [
    {
      "id": 10,
      "sort_order": 1,
      "activities": [
        { "id": 100, "sort_order": 1 },
        { "id": 101, "sort_order": 2 }
      ]
    },
    {
      "id": 11,
      "sort_order": 2,
      "activities": [
        { "id": 102, "sort_order": 1 }
      ]
    }
  ]
}
```

### Response Body (200 OK)

```json
{
  "message": "Order updated successfully"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Course not found |

---

## User Group Access

### List User Groups with Access

List all user groups that have access to a specific chapter.

```
GET /api/v1/courses/chapters/{chapter_uuid}/usergroups
```

### Response Body (200 OK)

```json
[
  {
    "uuid": "group-001",
    "name": "Premium Students",
    "access_level": "view"
  }
]
```

### Grant Access to User Group

Grant a user group access to a chapter.

```
POST /api/v1/courses/chapters/{chapter_uuid}/usergroups/{usergroup_uuid}
```

### Response

`200 OK` on success.

### Revoke Access from User Group

Remove a user group's access to a chapter.

```
DELETE /api/v1/courses/chapters/{chapter_uuid}/usergroups/{usergroup_uuid}
```

### Response

`200 OK` on success.

### Errors (User Group endpoints)

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Chapter or user group not found |

---

## Data Model Summary

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `uuid` | string | Public UUID identifier |
| `course_id` | integer | Foreign key to the parent course |
| `title` | string | Chapter title |
| `description` | text | Chapter description |
| `sort_order` | integer | Ordering position within the course |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
