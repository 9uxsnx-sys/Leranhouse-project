# Activities

> Activity endpoints manage the individual lessons and learning objects within a chapter — supporting multiple activity types (video, document, dynamic, assignment, SCORM), versioning with restore, editor bootstrap, and user group access control.

---

## Overview

Activities (also called lessons) are the core learning units within chapters. Each activity belongs to a single chapter and has a specific type that determines how it is rendered and interacted with.

All activity endpoints are under the Activities router at `/api/v1/courses/activities`.

### Activity Types

| Type | Constant | Description |
|------|----------|-------------|
| Video | `TYPE_VIDEO` | Video-based lesson (hosted or external) |
| Document | `TYPE_DOCUMENT` | Rich text / document lesson |
| Dynamic | `TYPE_DYNAMIC` | Interactive dynamic content |
| Assignment | `TYPE_ASSIGNMENT` | Student assignment / submission |
| Custom | `TYPE_CUSTOM` | Custom content type |
| SCORM | `TYPE_SCORM` | SCORM-compliant package |

---

## List Activities (by Chapter)

Retrieve all activities for a given chapter.

```
GET /api/v1/courses/activities/chapter/{chapter_id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `chapter_id` | integer | The chapter database ID |

### Response Body (200 OK)

```json
[
  {
    "id": 100,
    "uuid": "act-001",
    "title": "What is a Variable?",
    "activity_type": "TYPE_VIDEO",
    "sort_order": 1,
    "duration": 600,
    "chapter_id": 10,
    "content": {},
    "extra_metadata": {},
    "created_at": "2026-09-20T10:00:00Z",
    "updated_at": "2026-09-22T15:30:00Z"
  }
]
```

---

## Get Activity (by UUID)

Retrieve a single activity by its UUID.

```
GET /api/v1/courses/activities/{activity_uuid}
```

### Response Body (200 OK)

```json
{
  "id": 100,
  "uuid": "act-001",
  "title": "What is a Variable?",
  "activity_type": "TYPE_VIDEO",
  "sort_order": 1,
  "duration": 600,
  "chapter_id": 10,
  "content": {
    "video_url": "https://cdn.koodook.com/videos/lesson1.mp4",
    "transcript": "Full transcript text..."
  },
  "extra_metadata": {
    "difficulty": "beginner",
    "estimated_time_minutes": 10
  },
  "created_at": "2026-09-20T10:00:00Z",
  "updated_at": "2026-09-22T15:30:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | Activity not found |

---

## Get Activity (by ID)

Retrieve a single activity by its numeric ID.

```
GET /api/v1/courses/activities/id/{activity_id}
```

Response is identical to the UUID-based get endpoint.

---

## Create Activity

Create a new activity within a chapter.

```
POST /api/v1/courses/activities
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Activity title |
| `activity_type` | string | Yes | One of the activity type constants |
| `chapter_id` | integer | Yes | The parent chapter ID |
| `content` | object | No | Activity content (structure varies by type) |
| `sort_order` | integer | No | Position within the chapter |
| `duration` | integer | No | Duration in seconds |
| `extra_metadata` | object | No | Arbitrary JSON metadata |

### Example Request

```json
{
  "title": "What is a Variable?",
  "activity_type": "TYPE_VIDEO",
  "chapter_id": 10,
  "sort_order": 1,
  "duration": 600,
  "extra_metadata": {
    "difficulty": "beginner"
  }
}
```

### Response Body (201 Created)

```json
{
  "id": 100,
  "uuid": "act-001",
  "title": "What is a Variable?",
  "activity_type": "TYPE_VIDEO",
  "sort_order": 1,
  "duration": 600,
  "chapter_id": 10,
  "content": {},
  "extra_metadata": {
    "difficulty": "beginner"
  },
  "created_at": "2026-09-23T10:00:00Z",
  "updated_at": "2026-09-23T10:00:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `422 Unprocessable Entity` | Validation error |

---

## Create Video Activity

Create a video activity (with optional external video support).

```
POST /api/v1/courses/activities/video
```

For external (embedded) videos:

```
POST /api/v1/courses/activities/external_video
```

### Request Body (Multipart Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Activity title |
| `chapter_id` | integer | Yes | Parent chapter ID |
| `video_file` | file | No | Video file (for hosted videos) |
| `video_url` | string | No | External video URL (for external videos) |
| `extra_metadata` | string (JSON) | No | JSON string of metadata |

### Response Body (201 Created)

Returns the created activity with video-specific content.

---

## Create PDF Activity

Create a PDF document activity.

```
POST /api/v1/courses/activities/documentpdf
```

### Request Body (Multipart Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Activity title |
| `chapter_id` | integer | Yes | Parent chapter ID |
| `pdf_file` | file | Yes | PDF file |
| `extra_metadata` | string (JSON) | No | JSON string of metadata |

### Response Body (201 Created)

Returns the created activity with PDF content.

---

## Update Activity

Update an existing activity's fields.

```
PUT /api/v1/courses/activities/{activity_uuid}
```

### Request Body (JSON)

All fields are optional (only provided fields are updated).

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Activity title |
| `content` | object | Activity content |
| `sort_order` | integer | Position within the chapter |
| `duration` | integer | Duration in seconds |
| `extra_metadata` | object | Arbitrary JSON metadata |

### Response Body (200 OK)

Returns the updated activity object.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Activity not found |

---

## Delete Activity

Delete an activity.

```
DELETE /api/v1/courses/activities/{activity_uuid}
```

### Response

`204 No Content` on success.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Activity not found |

---

## Activity Versioning

Activities support versioning — each update creates a new version that can be viewed and restored.

### List Versions

Get the version history for an activity.

```
GET /api/v1/courses/activities/{activity_uuid}/versions
```

### Response Body (200 OK)

```json
[
  {
    "version_number": 3,
    "created_at": "2026-09-22T15:30:00Z",
    "created_by": 1,
    "change_summary": "Updated video URL"
  },
  {
    "version_number": 2,
    "created_at": "2026-09-21T12:00:00Z",
    "created_by": 1,
    "change_summary": "Fixed typo in transcript"
  },
  {
    "version_number": 1,
    "created_at": "2026-09-20T10:00:00Z",
    "created_by": 1,
    "change_summary": "Initial creation"
  }
]
```

### Get Specific Version

Retrieve the content of a specific version.

```
GET /api/v1/courses/activities/{activity_uuid}/versions/{version_number}
```

### Response Body (200 OK)

Returns the activity content as it existed at that version.

### Restore Version

Restore the activity to a previous version.

```
POST /api/v1/courses/activities/{activity_uuid}/versions/{version_number}/restore
```

### Response Body (200 OK)

Returns the restored activity object. A new version is created reflecting the restore.

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | Activity or version not found |

---

## Activity State (Conflict Detection)

Get the current state of an activity for conflict detection in collaborative editing.

```
GET /api/v1/courses/activities/{activity_uuid}/state
```

### Response Body (200 OK)

```json
{
  "update_date": "2026-09-22T15:30:00Z",
  "current_version": 3,
  "last_modified_by": 1
}
```

This lightweight endpoint allows editors to detect if the activity has been modified by someone else since they last loaded it.

---

## Editor Bootstrap

Get all data needed to load the activity editor in a single round trip — including the activity, minimal course data, and the resolved organization with feature flags.

```
GET /api/v1/courses/activities/{activity_uuid}/editor-bootstrap
```

### Response Body (200 OK)

```json
{
  "activity": { "...activity data..." },
  "course": { "id": 1, "uuid": "...", "name": "..." },
  "organization": {
    "id": 1,
    "name": "My Org",
    "features": {
      "courses": true,
      "payments": false,
      "ai": true
    }
  }
}
```

---

## User Group Access

### List User Groups with Access

```
GET /api/v1/courses/activities/{activity_uuid}/usergroups
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

```
POST /api/v1/courses/activities/{activity_uuid}/usergroups/{usergroup_uuid}
```

### Revoke Access from User Group

```
DELETE /api/v1/courses/activities/{activity_uuid}/usergroups/{usergroup_uuid}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Activity or user group not found |

---

## Data Model Summary

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `uuid` | string | Public UUID identifier |
| `chapter_id` | integer | Foreign key to the parent chapter |
| `title` | string | Activity title |
| `activity_type` | string | Type constant (`TYPE_VIDEO`, `TYPE_DOCUMENT`, etc.) |
| `content` | JSON | Activity content (structure varies by type) |
| `sort_order` | integer | Ordering position within the chapter |
| `duration` | integer | Duration in seconds |
| `extra_metadata` | JSON | Arbitrary metadata |
| `current_version` | integer | Latest version number |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
