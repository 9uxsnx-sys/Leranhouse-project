# Activities API

> Status: as-built · Last verified: 2026-11-15

All routes are mounted under `/api/v1/activities` (not `/api/v1/courses/activities`). Collection `POST` uses a trailing slash (`/api/v1/activities/`).

An activity belongs to one chapter (via the `chapteractivity` link table) and one course (denormalized `course_id`). Its position inside a chapter is stored on the link row (`order`).

---

## Access rules (locked content)

`lock_type` on each activity (and its parent chapter) is one of:

| `lock_type` | Who can read |
|---|---|
| `public` | Anyone, including anonymous visitors |
| `authenticated` | Signed-in users only |
| `restricted` | Members of the user groups attached to the activity, its chapter or the parent course, plus org admins/maintainers |

- A locked chapter cascades: all its activities are locked regardless of their own `lock_type`.
- A user group attached at the **course** level unlocks every restricted chapter/activity in that course.
- Org admins/maintainers bypass locks and still see `lock_type` so they can edit it.
- Locked reads return `content: {}`, `details: null` and `is_locked: true`; `is_locked` is computed per request and never stored.
- Paid courses: `GET /activities/{activity_uuid}` and the editor bootstrap first enforce the normal course read check, then run the paid-entitlement hook. When the hook denies (for example a user-group member who has not purchased), `content` becomes `{"paid_access": false}`. Builds without the EE hook treat paid access as granted.
- `GET /activities/id/{activity_id}` (numeric) and `GET /activities/chapter/{chapter_id}` do **not** apply lock or paid stripping; they only enforce read access to the course.

---

## Activity types

`activity_type`: `TYPE_VIDEO` | `TYPE_DOCUMENT` | `TYPE_DYNAMIC` | `TYPE_ASSIGNMENT` | `TYPE_CUSTOM` | `TYPE_SCORM`

`activity_sub_type`: `SUBTYPE_DYNAMIC_PAGE` | `SUBTYPE_DYNAMIC_MARKDOWN` | `SUBTYPE_DYNAMIC_EMBED` | `SUBTYPE_VIDEO_YOUTUBE` | `SUBTYPE_VIDEO_HOSTED` | `SUBTYPE_DOCUMENT_PDF` | `SUBTYPE_DOCUMENT_DOC` | `SUBTYPE_ASSIGNMENT_ANY` | `SUBTYPE_CUSTOM` | `SUBTYPE_SCORM_12` | `SUBTYPE_SCORM_2004`

---

## List activities for a chapter

```
GET /api/v1/activities/chapter/{chapter_id}
```

Auth: read access to the parent course.

| Param | In | Type | Notes |
|---|---|---|---|
| `chapter_id` | path | integer | Chapter database ID |
| `locale` | query | string | Overlays translated name/content |

Only **published** activities are returned, in `chapteractivity.order`. Response `200`: bare JSON array of `ActivityRead`.

```json
[
  {
    "id": 100,
    "org_id": 1,
    "course_id": 1,
    "activity_uuid": "activity_31de...",
    "name": "What is a Variable?",
    "activity_type": "TYPE_VIDEO",
    "activity_sub_type": "SUBTYPE_VIDEO_HOSTED",
    "content": { "filename": "lesson1.mp4", "activity_uuid": "activity_31de..." },
    "details": {},
    "published": true,
    "lock_type": "public",
    "is_locked": false,
    "extra_metadata": null,
    "current_version": 1,
    "last_modified_by_id": null,
    "last_modified_by_username": null,
    "creation_date": "2026-09-20 10:00:00",
    "update_date": "2026-09-22 15:30:00"
  }
]
```

Errors: `403`, `404` (`"No published activities found"` when the chapter has none).

---

## Get activity by UUID

```
GET /api/v1/activities/{activity_uuid}
```

Auth: read access to the parent course.

| Param | In | Type | Notes |
|---|---|---|---|
| `activity_uuid` | path | string | Activity UUID |
| `locale` | query | string | Optional content locale |

Response `200`: `ActivityRead`, including `last_modified_by_username`. Paid-entitlement and lock stripping apply (see Access rules).

Errors: `403`, `404`.

---

## Get activity by numeric ID

```
GET /api/v1/activities/id/{activity_id}
```

Auth: read access to the parent course. Query `locale` is supported.

Response `200`: `ActivityRead`. This route does **not** run the lock or paid-access stripping.

Errors: `403`, `404`.

---

## Create activity

```
POST /api/v1/activities/
```

Auth: `create` permission on the parent course.

Request body (`ActivityCreate`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Not `title` |
| `chapter_id` | integer | Yes | Parent chapter ID |
| `activity_type` | string | No | Default `TYPE_CUSTOM` |
| `activity_sub_type` | string | No | Default `SUBTYPE_CUSTOM` |
| `content` | object | No | Default `{}` |
| `details` | object | No | Default `{}` |
| `published` | boolean | No | Default `false` |
| `lock_type` | string | No | `public` \| `authenticated` \| `restricted`; default `public` |
| `extra_metadata` | object | No | |

The activity is appended at the end of the chapter. `org_id` and `course_id` are derived from the chapter.

Response `200`: created `ActivityRead`.

Errors: `403`, `404` (chapter or course not found), `422`.

---

## Create video activity (upload)

```
POST /api/v1/activities/video
```

Auth: `create` permission on the parent course. Request: `multipart/form-data`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | |
| `chapter_id` | string | Yes | Chapter ID as a form string |
| `details` | string (JSON) | No | Default `"{}"` |
| `extra_metadata` | string (JSON object) | No | |
| `video_file` | file | Yes in practice | `video/mp4` or `video/webm` |

Stored with `activity_type=TYPE_VIDEO`, `activity_sub_type=SUBTYPE_VIDEO_HOSTED`, `content={filename, activity_uuid}`.

Response `200`: `ActivityRead`. Errors: `403`, `404`, `409` (missing file or wrong format).

---

## Create external video activity

```
POST /api/v1/activities/external_video
```

Auth: `create` permission on the parent course. Request body (`ExternalVideo`, JSON):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | |
| `uri` | string | Yes | External video URL |
| `type` | string | Yes | `youtube` \| `vimeo` |
| `chapter_id` | string | Yes | Chapter ID encoded as a string |
| `details` | string (JSON) | No | Default `"{}"` |
| `extra_metadata` | object | No | |

Stored with `activity_type=TYPE_VIDEO`, `activity_sub_type=SUBTYPE_VIDEO_YOUTUBE`, `content={uri, type, activity_uuid}`.

Response `200`: `ActivityRead`. Errors: `403`, `404`, `422`.

---

## Create PDF activity

```
POST /api/v1/activities/documentpdf
```

Auth: `create` permission on the parent course. Request: `multipart/form-data`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | |
| `chapter_id` | string | Yes | Chapter ID as a form string |
| `pdf_file` | file | Yes in practice | `application/pdf` |
| `extra_metadata` | string (JSON object) | No | |

Stored with `activity_type=TYPE_DOCUMENT`, `activity_sub_type=SUBTYPE_DOCUMENT_PDF`, `content={filename, activity_uuid}`.

Response `200`: `ActivityRead`. Errors: `403`, `404`, `409` (missing file or wrong format).

---

## Update activity

```
PUT /api/v1/activities/{activity_uuid}
```

Auth: `update` permission on the parent course. Only explicitly provided fields are written.

| Field | Type |
|---|---|
| `name` | string |
| `content` | object |
| `activity_type` | string |
| `activity_sub_type` | string |
| `details` | object |
| `published` | boolean |
| `published_version` | integer |
| `version` | integer |
| `lock_type` | `public` \| `authenticated` \| `restricted` |
| `extra_metadata` | object |

When `content` is present and the activity already has content, the previous content is snapshotted as a version and `current_version` is incremented.

Response `200`: updated `ActivityRead` (no lock stripping on the write path). Errors: `403`, `404`.

---

## Delete activity

```
DELETE /api/v1/activities/{activity_uuid}
```

Auth: `delete` permission on the parent course. Removes the activity and its chapter link; stored activity files are deleted.

Response `200`:

```json
{ "detail": "Activity deleted" }
```

Errors: `403`, `404`.

---

## Versioning

Requires the `versioning` feature on the organization (standard plan or OSS). Every route needs read access to the parent course (`restore` needs `update`).

### List versions

```
GET /api/v1/activities/{activity_uuid}/versions?limit=20&offset=0
```

| Param | In | Type | Default | Notes |
|---|---|---|---|---|
| `limit` | query | integer | `20` | Max 100 |
| `offset` | query | integer | `0` | |

Response `200`: `ActivityVersionRead[]`, newest first.

```json
[
  {
    "id": 7,
    "activity_id": 100,
    "org_id": 1,
    "version_number": 3,
    "content": {},
    "created_by_id": 1,
    "created_at": "2026-09-22T15:30:00",
    "created_by_username": "johndoe",
    "created_by_avatar": ""
  }
]
```

### Get one version

```
GET /api/v1/activities/{activity_uuid}/versions/{version_number}
```

Response `200`: `ActivityVersionRead`. Errors: `404` (activity or version not found).

### Get current state (conflict detection)

```
GET /api/v1/activities/{activity_uuid}/state
```

Response `200` (`ActivityStateRead`):

```json
{
  "activity_uuid": "activity_31de...",
  "update_date": "2026-09-22 15:30:00",
  "current_version": 3,
  "last_modified_by_id": 1,
  "last_modified_by_username": "johndoe"
}
```

### Restore a version

```
POST /api/v1/activities/{activity_uuid}/versions/{version_number}/restore
```

Snapshots the current content, restores the requested version, and increments `current_version`. Response `200`: updated `ActivityRead`. Errors: `403`, `404`.

---

## Editor bootstrap

```
GET /api/v1/activities/{activity_uuid}/editor-bootstrap
```

Auth: read access to the parent course. Single-roundtrip payload for the editor.

Response `200`:

```json
{
  "activity": { "id": 100, "activity_uuid": "activity_31de...", "name": "What is a Variable?" },
  "course": {
    "course_uuid": "course_9f2c...",
    "name": "Introduction to Algebra",
    "description": "A beginner-friendly course.",
    "thumbnail_image": "",
    "org_uuid": "org_4c1e...",
    "org_id": 1
  },
  "org": {
    "id": 1,
    "org_uuid": "org_4c1e...",
    "name": "My Org",
    "slug": "my-org",
    "email": "hello@example.com"
  }
}
```

`activity` is a full `ActivityRead` (paid + lock rules applied); `org` is an `OrganizationRead` with resolved features.

Errors: `403`, `404`.

---

## User group access

| Method | Path | Permission | Response |
|---|---|---|---|
| `GET` | `/api/v1/activities/{activity_uuid}/usergroups` | course read | `[{usergroup_id, usergroup_uuid, name, description}]` |
| `POST` | `/api/v1/activities/{activity_uuid}/usergroups/{usergroup_uuid}` | course update | `{ "detail": "User group added" }` (or `"User group already has access"`) |
| `DELETE` | `/api/v1/activities/{activity_uuid}/usergroups/{usergroup_uuid}` | course update | `{ "detail": "User group removed" }` |

Errors: `403`, `404` (activity, course or user group not found; `"User group not associated with resource"` on delete).

---

## Data model summary (`ActivityRead`)

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `org_id`, `course_id` | integer | Parent identifiers |
| `activity_uuid` | string | Public UUID (`activity_...`) |
| `name` | string | Activity name (not `title`) |
| `activity_type` | string | `TYPE_*` constant |
| `activity_sub_type` | string | `SUBTYPE_*` constant |
| `content` | object | Shape varies by type; `{}` when locked |
| `details` | object \| null | `null` when locked |
| `published` | boolean | |
| `lock_type` | string | `public` \| `authenticated` \| `restricted` |
| `is_locked` | boolean | Computed per request; not stored |
| `extra_metadata` | object | Free-form |
| `current_version` | integer | Latest version number |
| `last_modified_by_id`, `last_modified_by_username` | integer / string | |
| `creation_date`, `update_date` | string | |

Order and chapter membership live on the `chapteractivity` link table; there is no `sort_order`, `duration`, or `title` field on the activity.
