# Chapters API

> Status: as-built · Last verified: 2026-11-15

All routes are mounted under `/api/v1/chapters` (not `/api/v1/courses/chapters`). Collection `POST` uses a trailing slash (`/api/v1/chapters/`).

A chapter is a container for activities inside a course. Its position is stored on the `coursechapter` link row (`order`); it is not a field on the chapter itself.

---

## List chapters for a course

```
GET /api/v1/chapters/course/{course_id}/page/{page}/limit/{limit}
```

Auth: read access to the parent course.

| Param | In | Type | Notes |
|---|---|---|---|
| `course_id` | path | integer | Course database ID (not UUID) |
| `page` | path | integer | Page number |
| `limit` | path | integer | Items per page |

Response `200`: a **bare JSON array** of `ChapterRead`, ordered by the `coursechapter.order` value.

```json
[
  {
    "id": 10,
    "chapter_uuid": "chapter_7a1b...",
    "name": "Chapter 1: Variables",
    "description": "Understanding variables and constants",
    "thumbnail_image": "",
    "lock_type": "public",
    "org_id": 1,
    "course_id": 1,
    "extra_metadata": null,
    "is_locked": false,
    "creation_date": "2026-09-20 10:00:00",
    "update_date": "2026-09-22 15:30:00",
    "activities": []
  }
]
```

Errors: `403` (no read access), `404` (course not found).

---

## Get chapter

```
GET /api/v1/chapters/{chapter_id}
```

Auth: read access to the parent course.

| Param | In | Type | Notes |
|---|---|---|---|
| `chapter_id` | path | integer | Chapter database ID |

Response `200`: `ChapterRead` with its `activities[]` and computed `is_locked`.

Errors: `404` (`"Chapter does not exist"`).

---

## Create chapter

```
POST /api/v1/chapters/
```

Auth: `create` permission on the parent course.

Request body (`ChapterCreate`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | |
| `course_id` | integer | Yes | Parent course ID |
| `org_id` | integer | Yes | Required by the model; the server overwrites it with the course's org |
| `description` | string | No | Default `""` |
| `thumbnail_image` | string | No | Default `""` |
| `lock_type` | string | No | `public` \| `authenticated` \| `restricted`; default `public` |
| `extra_metadata` | object | No | |

The chapter is appended after the current maximum `order`.

Response `200`: `ChapterRead` with `activities: []`.

Errors: `403`, `404` (course not found), `422`.

---

## Update chapter

```
PUT /api/v1/chapters/{chapter_id}
```

Auth: `update` permission on the parent course. Only non-null fields are written.

Request body (`ChapterUpdate`): `name`, `description`, `thumbnail_image`, `lock_type`, `course_id`, `org_id`, `extra_metadata` — all optional.

Response `200`: refreshed `ChapterRead` (re-read through the get path, so locks are applied).

Errors: `403`, `404` (`"Chapter does not exist"`), `422`.

---

## Delete chapter

```
DELETE /api/v1/chapters/{chapter_id}
```

Auth: `delete` permission on the parent course. Linked `chapteractivity` rows are removed; the activities themselves are detached, not deleted.

Response `200`:

```json
{ "detail": "chapter deleted" }
```

Errors: `403`, `404`.

---

## Reorder chapters and activities

```
PUT /api/v1/chapters/course/{course_uuid}/order
```

Auth: `update` permission on the course.

Request body (`ChapterUpdateOrder`):

```json
{
  "chapter_order_by_ids": [
    {
      "chapter_id": 10,
      "activities_order_by_ids": [{ "activity_id": 100 }, { "activity_id": 101 }]
    },
    {
      "chapter_id": 11,
      "activities_order_by_ids": [{ "activity_id": 102 }]
    }
  ]
}
```

The array position becomes the new `order`. Chapters/activities omitted from the payload are removed from the course link tables.

Response `200`:

```json
{ "detail": "Chapters and activities reordered successfully" }
```

Errors: `403`, `404` (course does not exist), `422`.

---

## Get chapter metadata (deprecated)

```
GET /api/v1/chapters/course/{course_uuid}/meta
```

Deprecated (`deprecated=true` in OpenAPI). Prefer `GET /api/v1/courses/{course_uuid}/meta`. Auth: course read access.

Response `200` is the legacy shape:

```json
{
  "chapters": {
    "chapter_7a1b...": {
      "uuid": "chapter_7a1b...",
      "id": 10,
      "name": "Chapter 1: Variables",
      "activityIds": ["activity_31de..."]
    }
  },
  "chapterOrder": ["chapter_7a1b..."],
  "activities": {
    "activity_31de...": {
      "uuid": "activity_31de...",
      "id": 100,
      "name": "What is a Variable?",
      "type": "TYPE_VIDEO",
      "content": {}
    }
  }
}
```

---

## User group access

User groups bound to a chapter control access when `lock_type` is `restricted`.

| Method | Path | Permission | Response |
|---|---|---|---|
| `GET` | `/api/v1/chapters/{chapter_uuid}/usergroups` | course read | `[{usergroup_id, usergroup_uuid, name, description}]` |
| `POST` | `/api/v1/chapters/{chapter_uuid}/usergroups/{usergroup_uuid}` | course update | `{ "detail": "User group added" }` (or `"User group already has access"`) |
| `DELETE` | `/api/v1/chapters/{chapter_uuid}/usergroups/{usergroup_uuid}` | course update | `{ "detail": "User group removed" }` |

List response example:

```json
[
  {
    "usergroup_id": 3,
    "usergroup_uuid": "usergroup_09ff...",
    "name": "Premium Students",
    "description": "Paying cohort"
  }
]
```

Errors: `404` (chapter, course or user group not found; `"User group not associated with resource"` on delete), `403`.

---

## Locks

`ChapterRead.is_locked` is computed per request:

- `lock_type: "public"` — visible to everyone.
- `lock_type: "authenticated"` — signed-in users only.
- `lock_type: "restricted"` — members of the user groups attached to the chapter, the parent course, or org admins/maintainers.
- A locked chapter returns its identity (`name`, `chapter_uuid`, ...) but `description` and `thumbnail_image` are cleared. Every activity inside a locked chapter is also locked.
- A user group attached at the course level unlocks all restricted chapters/activities in that course.
- Org admins/maintainers bypass locks and still see `lock_type` so they can edit it.

---

## Data model summary (`ChapterRead`)

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `chapter_uuid` | string | Public UUID (`chapter_...`) |
| `name` | string | Chapter name (not `title`) |
| `description` | string | Cleared when locked |
| `thumbnail_image` | string | Cleared when locked |
| `lock_type` | string | `public` \| `authenticated` \| `restricted` |
| `org_id`, `course_id` | integer | Parent identifiers |
| `activities` | `ActivityRead[]` | Ordered by the `chapteractivity.order` link value |
| `extra_metadata` | object | Free-form |
| `is_locked` | boolean | Computed per request; not stored |
| `creation_date`, `update_date` | string | |

Order is stored on the `coursechapter` link table and is not exposed as a chapter field.
