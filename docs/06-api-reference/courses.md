# Courses API

> Status: as-built · Last verified: 2026-11-15

All routes are mounted under `/api/v1/courses`. Every route on this router requires the organization's `courses` feature to be enabled. Collection `POST` routes use a trailing slash (`/api/v1/courses/`).

---

## Access rules

| `access_type` | Who can read | Listed publicly |
|---|---|---|
| `public` | Anyone, including anonymous visitors | Yes, when `published` |
| `users_only` | Members of user groups linked to the course, org admins/maintainers, and active course authors | No |
| `paid` | Published paid courses are product pages: metadata and curriculum are readable by anyone; lesson bodies are stripped until the viewer has an active entitlement (EE hook) | Yes, when `published` |

- Drafts (`published=false`) are hidden from anonymous and regular-user listings. `include_unpublished=true` only takes effect for org admins/maintainers (or superadmins).
- Anonymous catalog listing includes only published `public` and `paid` courses.
- Read/write permissions are enforced per course (`read` / `create` / `update` / `delete`); only course owners (`CREATOR`, `MAINTAINER`), admins and maintainers may change access settings.

---

## List courses (by org slug)

```
GET /api/v1/courses/org_slug/{org_slug}/page/{page}/limit/{limit}
```

Auth: optional session/API token. Anonymous callers see published public + paid courses only.

| Param | In | Type | Default | Notes |
|---|---|---|---|---|
| `org_slug` | path | string | — | Organization slug |
| `page` | path | integer | — | 1-indexed |
| `limit` | path | integer | — | Server caps at 100 |
| `include_unpublished` | query | boolean | `false` | Only honored for org admins/maintainers |
| `locale` | query | string | source locale | Overlays translated course fields |

Response `200`: a **bare JSON array** of `CourseRead` (no `items`/`total` wrapper). An unknown organization returns `[]`.

```json
[
  {
    "id": 1,
    "org_id": 1,
    "course_uuid": "course_9f2c...",
    "name": "Introduction to Algebra",
    "description": "A beginner-friendly course.",
    "about": "Variables, equations and functions.",
    "learnings": "Understand variables",
    "tags": "math,algebra",
    "thumbnail_type": "image",
    "thumbnail_image": "course_9f2c.../thumbnail.png",
    "thumbnail_video": "",
    "banner_image": "",
    "public": true,
    "published": true,
    "open_to_contributors": false,
    "access_type": "public",
    "price_amount": null,
    "price_currency": "DZD",
    "seo": null,
    "extra_metadata": { "instructors": [{ "name": "Yacine Benali", "title": "Instructor", "avatar": "..." }] },
    "source_locale": "en",
    "content_locale": "en",
    "is_fallback": false,
    "creation_date": "2026-09-20 10:00:00",
    "update_date": "2026-09-22 15:30:00",
    "authors": [
      {
        "user": { "id": 1, "username": "johndoe", "first_name": "John", "last_name": "Doe", "avatar_image": "" },
        "authorship": "CREATOR",
        "authorship_status": "ACTIVE",
        "creation_date": "2026-09-20 10:00:00",
        "update_date": "2026-09-20 10:00:00"
      }
    ]
  }
]
```

Errors: `422` only for invalid query/pagination values (an unknown organization returns an empty list).

---

## Count courses

```
GET /api/v1/courses/org_slug/{org_slug}/count
```

Auth: optional. Counts respect the same visibility rules as the list endpoint.

| Param | In | Type | Default | Notes |
|---|---|---|---|---|
| `org_slug` | path | string | — | Organization slug |
| `published` | query | boolean | unset | Narrow to only published (`true`) or draft (`false`) |

Response `200`: a **bare integer**.

```json
42
```

An unknown organization returns `0`.

---

## Search courses

```
GET /api/v1/courses/org_slug/{org_slug}/search
```

Auth: optional. Matches `name`, `description`, `about`, `learnings`, `tags` on the source row **and** every translation row.

| Param | In | Type | Default | Notes |
|---|---|---|---|---|
| `org_slug` | path | string | — | Organization slug |
| `query` | query | string | — | Required, 1–200 chars (not `q`) |
| `page` | query | integer | `1` | ≥ 1 |
| `limit` | query | integer | `10` | 1–50 |
| `locale` | query | string | source locale | Overlays translated fields |

Response `200`: bare JSON array of `CourseRead`.

Errors: `422` for an empty/oversized query or invalid pagination.

---

## Get course by UUID

```
GET /api/v1/courses/{course_uuid}
```

Auth: course read access (anonymous allowed for public/paid).

| Param | In | Type | Notes |
|---|---|---|---|
| `course_uuid` | path | string | Course UUID |
| `locale` | query | string | Optional content locale |

Response `200`: `CourseRead` (same shape as the list item; no chapters).

Errors: `403` (no read access), `404`.

---

## Get course by numeric ID

```
GET /api/v1/courses/id/{course_id}
```

Auth: course read access. Response `200`: `CourseRead`. Query `locale` is supported. Errors: `403`, `404`.

---

## Get course metadata (curriculum)

```
GET /api/v1/courses/{course_uuid}/meta
```

Auth: course read access.

| Param | In | Type | Default | Notes |
|---|---|---|---|---|
| `course_uuid` | path | string | — | Course UUID |
| `with_unpublished_activities` | query | boolean | `false` | Include draft activities in chapters |
| `slim` | query | boolean | `false` | Skip activity `content`/`details` in the query; they come back as `{}` / `null` |
| `locale` | query | string | source locale | Overlays course + chapter/activity translations |

Response `200`: `FullCourseRead` — course fields plus `org_uuid`, `authors[]`, and `chapters[]`.

```json
{
  "id": 1,
  "org_id": 1,
  "org_uuid": "org_4c1e...",
  "course_uuid": "course_9f2c...",
  "name": "Introduction to Algebra",
  "published": true,
  "access_type": "public",
  "price_amount": null,
  "price_currency": "DZD",
  "source_locale": "en",
  "content_locale": "en",
  "is_fallback": false,
  "authors": [],
  "chapters": [
    {
      "id": 10,
      "chapter_uuid": "chapter_7a1b...",
      "name": "Chapter 1: Variables",
      "description": "",
      "thumbnail_image": "",
      "lock_type": "public",
      "org_id": 1,
      "course_id": 1,
      "extra_metadata": null,
      "is_locked": false,
      "creation_date": "2026-09-20 10:00:00",
      "update_date": "2026-09-20 10:00:00",
      "activities": [
        {
          "id": 100,
          "activity_uuid": "activity_31de...",
          "name": "What is a Variable?",
          "activity_type": "TYPE_VIDEO",
          "activity_sub_type": "SUBTYPE_VIDEO_HOSTED",
          "content": { "filename": "lesson1.mp4", "activity_uuid": "activity_31de..." },
          "details": {},
          "published": true,
          "lock_type": "public",
          "is_locked": false,
          "current_version": 1,
          "last_modified_by_id": null,
          "last_modified_by_username": null,
          "extra_metadata": null,
          "org_id": 1,
          "course_id": 1,
          "creation_date": "2026-09-20 10:00:00",
          "update_date": "2026-09-20 10:00:00"
        }
      ]
    }
  ]
}
```

Paid preview rule: for a **published `paid`** course viewed without an entitlement, every chapter still appears but with `is_locked: true`, `description` and `thumbnail_image` cleared, and every activity with `content: {}`, `details: null`. The structure stays browsable; lesson bodies do not.

---

## Create course

```
POST /api/v1/courses/?org_id={org_id}
```

Auth: `create` permission for courses in the organization.

`org_id` is a **query parameter**, not a path parameter.

Request: `multipart/form-data`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | |
| `description` | string | Yes | |
| `public` | boolean | Yes | `true` → `access_type=public`, `false` → `users_only` |
| `about` | string | Yes | |
| `learnings` | string | No | |
| `tags` | string | No | |
| `thumbnail_type` | string | No | `image` \| `video` \| `both`; default `image` |
| `extra_metadata` | string (JSON object) | No | Invalid JSON → `422` |
| `thumbnail` | file | No | Image/video file |

Response `200`: created `CourseRead`.

Errors: `403`, `404` (org not found), `422` (invalid form data / metadata).

---

## Update course

```
PUT /api/v1/courses/{course_uuid}
```

Auth: course `update` permission. Changing access settings additionally requires `CREATOR`/`MAINTAINER` ownership or admin rights.

Request: **JSON body** (`CourseUpdate`) — every field optional; only provided fields are written. `price_amount: null` explicitly clears the price; `null` on other fields means "not provided".

| Field | Type |
|---|---|
| `name`, `description`, `about`, `learnings`, `tags` | string |
| `thumbnail_type` | `image` \| `video` \| `both` |
| `thumbnail_image`, `thumbnail_video`, `banner_image` | string |
| `public` | boolean |
| `published` | boolean |
| `open_to_contributors` | boolean |
| `access_type` | `public` \| `users_only` \| `paid` |
| `price_amount` | integer |
| `price_currency` | string |
| `seo` | object |
| `extra_metadata` | object |

Response `200`: updated `CourseRead`.

Errors: `403` (not an owner for access fields), `404`, `409` (course is in a collection and cannot be made `users_only` or unpublished), `422` (`paid` without a positive `price_amount`).

---

## Delete course

```
DELETE /api/v1/courses/{course_uuid}
```

Auth: course `delete` permission. Response `200`:

```json
{ "detail": "Course deleted" }
```

Errors: `403`, `404`.

---

## Clone course

```
POST /api/v1/courses/{course_uuid}/clone
```

Auth: read access to the source course + `create` permission in the org. The copy gets a new UUID, `(Copy)` appended to the name, and starts private and unpublished.

Response `200`: cloned `CourseRead`. Errors: `403`, `404`.

---

## Thumbnail and banner

| Method | Path | Body | Response |
|---|---|---|---|
| `PUT` | `/api/v1/courses/{course_uuid}/thumbnail` | multipart: `thumbnail` (file, optional), `thumbnail_type` (`image`\|`video`\|`both`, default `image`) | `CourseRead` |
| `DELETE` | `/api/v1/courses/{course_uuid}/thumbnail` | — | `CourseRead` |
| `PUT` | `/api/v1/courses/{course_uuid}/banner` | multipart: `banner` (file, optional) | `CourseRead` |
| `DELETE` | `/api/v1/courses/{course_uuid}/banner` | — | `CourseRead` |

All four require course `update` permission and return `200`. Errors: `403`, `404`, `422` (invalid file).

---

## Get course user rights

```
GET /api/v1/courses/{course_uuid}/rights
```

Auth: none required; anonymous callers only get `read` for `public` courses.

Response `200`: nested `permissions` / `ownership` / `roles` objects.

```json
{
  "course_uuid": "course_9f2c...",
  "user_id": 1,
  "is_anonymous": false,
  "permissions": {
    "read": true,
    "create": true,
    "update": true,
    "delete": true,
    "create_content": true,
    "update_content": true,
    "delete_content": true,
    "manage_contributors": true,
    "manage_access": true,
    "grade_assignments": true,
    "mark_activities_done": true,
    "create_certifications": true
  },
  "ownership": {
    "is_owner": true,
    "is_creator": true,
    "is_maintainer": false,
    "is_contributor": false,
    "authorship_status": "ACTIVE"
  },
  "roles": {
    "is_admin": false,
    "is_maintainer_role": false,
    "is_instructor": true,
    "is_user": true
  }
}
```

Errors: `404`.

---

## Contributors

### List contributors

```
GET /api/v1/courses/{course_uuid}/contributors
```

Auth: course read access. Response `200`: bare array of `ResourceAuthor` rows.

```json
[
  {
    "user_id": 1,
    "authorship": "CREATOR",
    "authorship_status": "ACTIVE",
    "creation_date": "2026-09-20 10:00:00",
    "update_date": "2026-09-20 10:00:00",
    "user": {
      "id": 1,
      "user_uuid": "user_8ab2...",
      "username": "johndoe",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "avatar_image": "",
      "banner_image": "",
      "bio": "",
      "details": {},
      "profile": {},
      "extra_metadata": null,
      "email_verified": true,
      "last_login_at": null,
      "signup_method": "email",
      "is_superadmin": false,
      "creation_date": "2026-01-01 09:00:00"
    }
  }
]
```

Errors: `403`, `404`.

### Update contributor

```
PUT /api/v1/courses/{course_uuid}/contributors/{contributor_user_id}?authorship={authorship}&authorship_status={status}
```

Auth: course `update` permission. `authorship` (`CREATOR`\|`CONTRIBUTOR`\|`MAINTAINER`\|`REPORTER`) and `authorship_status` (`ACTIVE`\|`PENDING`\|`INACTIVE`) are **query parameters**.

Response `200`:

```json
{ "detail": "Contributor updated successfully", "status": "success" }
```

Errors: `400` (cannot modify the creator), `403`, `404` (course or contributor not found).

### Bulk add / remove contributors

| Method | Path | Body |
|---|---|---|
| `POST` | `/api/v1/courses/{course_uuid}/bulk-add-contributors` | JSON array of usernames, e.g. `["alice","bob"]` |
| `PUT` | `/api/v1/courses/{course_uuid}/bulk-remove-contributors` | JSON array of usernames |

Auth: course `update` permission. Response `200`:

```json
{
  "successful": [{ "username": "alice", "user_id": 2 }],
  "failed": [{ "username": "bob", "reason": "User not found or invalid" }]
}
```

### Apply as contributor

```
POST /api/v1/courses/{course_uuid}/apply-contributor
```

Auth: authenticated user (anonymous callers get `403`). The course's `open_to_contributors` flag is not checked by this handler. Response `200`:

```json
{ "detail": "Contributor application submitted successfully", "status": "pending" }
```

Errors: `400` (already has an authorship role), `403`, `404`.

---

## Course updates

Rows are `CourseUpdateRead`: `{id, title, content, course_id, courseupdate_uuid, linked_activity_uuids, org_id, creation_date, update_date}`. `linked_activity_uuids` is a string or `null`.

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/api/v1/courses/{course_uuid}/updates` | — | `CourseUpdateRead[]` (newest first) |
| `POST` | `/api/v1/courses/{course_uuid}/updates` | `{title, content, org_id, linked_activity_uuids?}` | `CourseUpdateRead` (`200`) |
| `PUT` | `/api/v1/courses/{course_uuid}/update/{courseupdate_uuid}` | `{title?, content?, linked_activity_uuids?}` | `CourseUpdateRead` (`200`) |
| `DELETE` | `/api/v1/courses/{course_uuid}/update/{courseupdate_uuid}` | — | `{ "message": "Update deleted successfully" }` (`200`) |

Auth: `GET` only verifies that the course exists (no RBAC check is performed). `PUT`/`DELETE` pass the `courseupdate_...` UUID to the resource RBAC checker; that prefix has no registered resource config, so these two routes currently deny with `403`. Errors: `403`, `409` (course/update does not exist).

---

## Translations

The base course row holds the source locale (`source_locale`). Each other locale is one `course_translation` row. Reads overlay the requested `locale` over the base row.

| Method | Path | Permission | Response |
|---|---|---|---|
| `GET` | `/api/v1/courses/{course_uuid}/translations` | course `update` | `CourseTranslationRead[]` |
| `PUT` | `/api/v1/courses/{course_uuid}/translations/{locale}` | course `update` | `CourseTranslationRead` (`200`) |
| `DELETE` | `/api/v1/courses/{course_uuid}/translations/{locale}` | course `update` | `{ "detail": "Translation deleted" }` (`200`) |

`CourseTranslationUpsert` body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | |
| `description`, `about`, `learnings`, `tags` | string | No | |
| `seo` | object | No | |
| `extra_metadata` | object | No | Display-text keys only (see below) |
| `state` | string | No | `draft` \| `machine` \| `reviewed` \| `published`; default `draft` (v1 serves every state) |

`CourseTranslationRead` fields: `id`, `course_id`, `locale`, `name`, `description`, `about`, `learnings`, `tags`, `seo`, `extra_metadata`, `state`, `source_updated_at`, `translated_by`, `creation_date`, `update_date`.

People metadata rule: `extra_metadata` on a translation may contain `instructors` as an **index-aligned list of `{name, title}` objects**. At read time the list is merged entry-by-entry onto the base row's `instructors`, so names/titles translate while avatars (and any other fields) always come from the base row (`apps/api/src/services/people_locale.py`). Counts and booleans on the base metadata are preserved.

Errors: `403`, `404` (course or translation not found), `422` (writing the source locale, invalid locale).

---

## Course access users (learner inventory)

| Method | Path | Params | Response |
|---|---|---|---|
| `GET` | `/api/v1/courses/{course_uuid}/access/users` | `filter` (`enrolled`\|`available`, default `enrolled`), `search`, `page` (default 1), `limit` (1–100, default 10) | see below |
| `POST` | `/api/v1/courses/{course_uuid}/access/users` | `user_ids` query, comma-separated | `{enrolled, already_enrolled, skipped}` |
| `DELETE` | `/api/v1/courses/{course_uuid}/access/users` | `user_ids` query, comma-separated | `{removed, not_enrolled}` |

Auth: course `update` permission. `enrolled` lists users with a trail run for the course; `available` lists org members not yet linked.

`GET` response `200`:

```json
{
  "items": [
    {
      "user": { "id": 2, "username": "alice", "first_name": "Alice", "last_name": "A", "avatar_image": "" },
      "role": { "id": 4, "name": "User" },
      "joined_at": "2026-02-01 10:00:00",
      "enrolled_at": "2026-09-20 10:00:00",
      "status": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

Errors: `403`, `404`.

---

## Export

Both export endpoints return a **ZIP archive** (`application/zip`), not JSON.

### Export one course

```
GET /api/v1/courses/{course_uuid}/export
```

Auth: course read access. Response `200`: ZIP download named `learnhouse-export-{course_uuid}-{timestamp}.zip`. Errors: `403`, `404`.

### Batch export

```
POST /api/v1/courses/export/batch
```

Auth: read access to every course; all courses must belong to the same organization.

Request body:

```json
{ "course_uuids": ["course_9f2c...", "course_1a2b..."] }
```

Between 1 and 20 UUIDs. Response `200`: ZIP download named `learnhouse-export-batch-{timestamp}.zip`. Errors: `403`, `404`, `422` (empty list or more than 20).

---

## Import

### Analyze a package

```
POST /api/v1/courses/import/analyze?org_id={org_id}
```

Auth: `create` permission in the organization. `org_id` is a **query parameter**.

Request: `multipart/form-data` with `zip_file` (file).

Response `200` (`ImportAnalysisResponse`):

```json
{
  "temp_id": "3f1a4c9e-...",
  "version": "1.0.0",
  "courses": [
    {
      "course_uuid": "course_9f2c...",
      "name": "Introduction to Algebra",
      "description": "A beginner-friendly course.",
      "chapters_count": 3,
      "activities_count": 12,
      "has_thumbnail": true
    }
  ]
}
```

`temp_id` is valid for 30 minutes. Errors: `400` (invalid package), `403`, `404` (org not found).

### Import courses

```
POST /api/v1/courses/import?org_id={org_id}
```

Auth: `create` permission in the organization.

Request body:

```json
{
  "temp_id": "3f1a4c9e-...",
  "course_uuids": ["course_9f2c..."],
  "name_prefix": "Imported",
  "set_private": true,
  "set_unpublished": true
}
```

`course_uuids` holds 1–20 entries. `name_prefix` defaults to `null`; `set_private` and `set_unpublished` default to `true`.

Response `200` (`ImportResult`):

```json
{
  "total_courses": 1,
  "successful": 1,
  "failed": 0,
  "courses": [
    {
      "original_uuid": "course_9f2c...",
      "new_uuid": "course_88ac...",
      "name": "Introduction to Algebra",
      "success": true,
      "error": null
    }
  ]
}
```

Errors: `400` (invalid `temp_id`/UUIDs), `403`, `404`, `422` (list size).

---

## Migration (other LMS)

All three routes require an authenticated session (API tokens rejected); `org_id` is a query parameter.

| Method | Path | Request | Response |
|---|---|---|---|
| `POST` | `/api/v1/courses/migrate/upload?org_id={org_id}&temp_id={temp_id}` | multipart `files` (list), optional `temp_id` to append | `{temp_id, files: [{file_id, filename, file_type, size, extension}], skipped: []}` |
| `POST` | `/api/v1/courses/migrate/suggest?org_id={org_id}` | `{temp_id, course_name, description?}` | `MigrationTreeStructure` |
| `POST` | `/api/v1/courses/migrate/create?org_id={org_id}` | `{temp_id, structure}` | `{course_uuid, course_name, chapters_created, activities_created, success, error}` |

`MigrationTreeStructure`: `{course_name, course_description?, chapters: [{name, activities: [{name, activity_type, activity_sub_type, file_ids}]}]}`.

Errors: `400` (invalid upload/structure), `403`, `404` (temp id or resources not found).

---

## Data model summary (`CourseRead`)

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `org_id` | integer | Organization ID |
| `course_uuid` | string | Public UUID (`course_...`) |
| `name`, `description`, `about`, `learnings`, `tags` | string | Localized when `locale` is supplied |
| `thumbnail_type` | string | `image` \| `video` \| `both` |
| `thumbnail_image`, `thumbnail_video`, `banner_image` | string | Stored file paths |
| `public` | boolean | Legacy mirror of `access_type == public` |
| `published` | boolean | Drafts are hidden from public listings |
| `open_to_contributors` | boolean | |
| `access_type` | string | `public` \| `users_only` \| `paid` |
| `price_amount` | integer | Required (> 0) for `paid` |
| `price_currency` | string | Default `DZD` |
| `seo`, `extra_metadata` | object | Free-form; `extra_metadata.instructors` is a list of `{name, title, avatar}` |
| `source_locale` | string | Locale of the base row |
| `content_locale` | string | Locale served for this request |
| `is_fallback` | boolean | `true` when the requested locale had no translation |
| `authors` | `AuthorWithRole[]` | `{user, authorship, authorship_status, creation_date, update_date}` |
| `creation_date`, `update_date` | string | |

`FullCourseRead` adds `org_uuid` and `chapters[]`.
