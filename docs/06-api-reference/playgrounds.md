# Playgrounds API

> Status: as-built · Last verified: 2026-11-15

Standalone HTML/CSS/JS playgrounds and their AI generator. Mounted at `/api/v1/playgrounds`. Both the CRUD router and the generator router are mounted with `require_authenticated_user` and a **`pro` plan gate** (`require_plan_for_playgrounds("pro", "Playgrounds")`); each router also checks the `playgrounds` feature flag via `require_playgrounds_feature`.

> Despite the handler type hints accepting `AnonymousUser` (e.g. reactions), the mount rejects anonymous callers and API tokens — every playground route needs a real authenticated session.

`PlaygroundRead`:

| Field | Notes |
|---|---|
| `id`, `org_id`, `playground_uuid`, `created_by` | |
| `org_uuid`, `org_slug` | Filled from the organization on read/list |
| `name`, `description` | |
| `thumbnail_image` | Filename or `null` |
| `access_type` | `public` \| `authenticated` (default) \| `restricted` |
| `published` | New playgrounds are always created unpublished |
| `course_uuid`, `course_id` | Optional course link (used for RAG) |
| `html_content` | Stored document |
| `author_username`, `author_first_name`, `author_last_name`, `author_user_uuid`, `author_avatar_image` | Joined from the creator |
| `creation_date`, `update_date` | |

### Access and rights model (easy to miss)

- **Read:** `public` → anyone; `authenticated` → any signed-in user; `restricted` → org admins/maintainers, the creator, or a member of a user group linked to the playground. The mount's auth requirement applies first.
- **List visibility:** filters out `authenticated`/`restricted` rows for callers who cannot read them, and hides unpublished rows unless the caller is an org admin/maintainer or the creator.
- **Mutate:** `create` / `duplicate` require `action_create` in the org role's `playgrounds` rights. Update / thumbnail / user-group management require `action_update`, or `action_update_own` when the caller is the creator. Delete requires `action_delete`, or `action_delete_own` for the creator.
- The org role rights blob is read from the user's first `UserOrganization` role (`rights.playgrounds`).

---

## Playgrounds (CRUD)

### Create a playground

```
POST /api/v1/playgrounds/?org_id={org_id}
```

Auth: `action_create` in the target org.

| Field | Type | Required | Notes |
|---|---|---|---|
| `org_id` | query | yes | |
| `name` | string | yes | |
| `description` | string | no | |
| `thumbnail_image` | string | no | |
| `access_type` | enum | no | Default `authenticated` |
| `course_uuid` | string | no | `course_id` is resolved only when the course belongs to the same org |
| `html_content` | string | no | |

`published` is forced to `false` regardless of any input. Response `200`: `PlaygroundRead`.

```json
{
  "id": 14,
  "org_id": 1,
  "org_uuid": "org_...",
  "org_slug": "my-school",
  "playground_uuid": "3f7c9e0a-...",
  "name": "Fractions visualizer",
  "description": "Interactive fraction bars",
  "thumbnail_image": null,
  "access_type": "authenticated",
  "published": false,
  "course_uuid": "course_91be...",
  "course_id": 7,
  "html_content": "<!doctype html>…",
  "created_by": 5,
  "author_username": "teacher",
  "author_first_name": "Sara",
  "author_last_name": "B",
  "author_user_uuid": "user_...",
  "author_avatar_image": "",
  "creation_date": "2026-11-15T09:00:00",
  "update_date": "2026-11-15T09:00:00"
}
```

Errors: `403 "Insufficient permissions to create playgrounds"`, `404 "Organization not found"`.

### List playgrounds for an organization

```
GET /api/v1/playgrounds/org/{org_id}
```

Auth: authenticated; the handler applies the visibility rules above.

Returns a **bare array** of `PlaygroundRead` with org and author enrichment. No pagination.

### Get a playground

```
GET /api/v1/playgrounds/{playground_uuid}
```

Auth: read access (see model). Returns `PlaygroundRead`.

Errors: `403 "Access denied to this playground"`, `404 "Playground not found"`, `401` for anonymous.

### Update a playground

```
PUT /api/v1/playgrounds/{playground_uuid}
```

Auth: update rights (see model).

Body (`PlaygroundUpdate`, all optional): `name`, `description`, `thumbnail_image`, `access_type`, `published`, `course_uuid`, `html_content`. Only provided fields are applied. Changing `course_uuid` re-resolves `course_id` (and clears it when the course is unknown or in another org).

Returns `PlaygroundRead`. Errors: `403 "Insufficient permissions to update playground"`, `404`.

### Duplicate a playground

```
POST /api/v1/playgrounds/{playground_uuid}/duplicate
```

Auth: `action_create`.

Copies name as `"<name> (Copy)"`, `description`, `access_type`, `course_uuid`, `course_id` and `html_content`. The thumbnail is cleared, `published=false`, and the caller becomes the creator. Returns `PlaygroundRead`.

### Delete a playground

```
DELETE /api/v1/playgrounds/{playground_uuid}
```

Auth: delete rights. Also removes every `UserGroupResource` association for the playground.

```json
{ "detail": "Playground deleted" }
```

### Upload a thumbnail

```
POST /api/v1/playgrounds/{playground_uuid}/thumbnail
Content-Type: multipart/form-data
```

Auth: update rights. Form field `thumbnail` is required (image types only). Files land under `orgs/{org_uuid}/playgrounds/{playground_uuid}/thumbnails/`.

Returns `PlaygroundRead`. Errors: `400 "No thumbnail file provided"`, `403`, `404`.

---

## User group access

| Method | Path | Auth | Response |
|---|---|---|---|
| `POST` | `/api/v1/playgrounds/{playground_uuid}/usergroups/{usergroup_uuid}` | update rights | `{ "detail": "User group added to playground" }` (or `"User group already has access"`) |
| `DELETE` | `/api/v1/playgrounds/{playground_uuid}/usergroups/{usergroup_uuid}` | update rights | `{ "detail": "User group removed from playground" }` |
| `GET` | `/api/v1/playgrounds/{playground_uuid}/usergroups` | authenticated; the handler only checks that the playground exists | Bare array |

List response:

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

Errors: `404` (playground / user group not found, or `"User group not associated with playground"` on delete), `403`.

---

## Reactions

### List reactions

```
GET /api/v1/playgrounds/{playground_uuid}/reactions
```

Auth: read access. Returns reactions grouped by emoji, sorted by count descending:

```json
[
  {
    "emoji": "👏",
    "count": 4,
    "users": [
      {
        "id": 5,
        "user_uuid": "user_...",
        "username": "learner",
        "first_name": "Amine",
        "last_name": "K",
        "avatar_image": ""
      }
    ],
    "has_reacted": true
  }
]
```

### Toggle a reaction

```
POST /api/v1/playgrounds/{playground_uuid}/reactions
```

Auth: authenticated (the handler rejects `AnonymousUser` with `401`, though the mount already does) + read access. Body: `{ "emoji": "👏" }`.

```json
{ "action": "added", "emoji": "👏" }
```

Removing an existing reaction returns `{ "action": "removed", "emoji": "👏" }`. Errors: `401`, `403`, `404`.

---

## AI generation

Generation sessions live in Redis (`playground_session:{session_uuid}`, 25-day TTL). Without Redis configured, iterate/session lookups return `404`.

Both generation routes require edit rights (`action_update`, or `action_update_own` for the creator), apply an AI rate limit, and reserve **3 AI credits** per call. The model is `gemini-3-flash-preview` for Pro+ orgs and `gemini-2.5-flash-lite` otherwise.

> The plan/feature dependencies look for `org_id` / `playground_uuid` in path or query params. `/generate/start` and `/generate/iterate` carry `playground_uuid` in the body, so that path lookup falls through; the mount's authenticated-user requirement and the handler's rights check still apply.

### Start a session

```
POST /api/v1/playgrounds/generate/start
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `playground_uuid` | string | yes | Must exist |
| `prompt` | string | yes | |
| `context.playground_name` | string | yes | |
| `context.playground_description` | string | yes | |
| `context.course_uuid` | string | no | When it belongs to the org, course RAG context is retrieved |
| `context.course_name` | string | no | |

Uses the playground's existing `html_content` as the starting document. Response is `text/event-stream`:

```
data: {"type": "chunk", "content": "<html fragment>"}

data: {"type": "done", "session_uuid": "pg_..."}

```

A failure mid-stream emits `data: {"type": "error", "message": "An internal error occurred."}`.

Errors: `403 "Insufficient permissions to generate content"`, `404` (playground/org).

### Iterate a session

```
POST /api/v1/playgrounds/generate/iterate
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `session_uuid` | string | yes | |
| `playground_uuid` | string | yes | Must match the session |
| `message` | string | yes | |
| `current_html` | string | no | Falls back to the session's current HTML |

Max **10 iterations** (`MAX_ITERATIONS`); beyond that `400 "Maximum iterations (10) reached"`. A playground UUID mismatch returns `400`. Same rights/credit/rate-limit rules and SSE format as `/start`.

### Get session state

```
GET /api/v1/playgrounds/generate/session/{session_uuid}
```

Returns:

```json
{
  "session_uuid": "pg_2f9a...",
  "iteration_count": 3,
  "max_iterations": 10,
  "html_content": "<!doctype html>…",
  "message_history": [
    { "role": "user", "content": "Add a reset button" },
    { "role": "model", "content": "<!doctype html>…" }
  ]
}
```

Errors: `404 "Session not found"`. The handler does not verify session ownership — any authenticated caller holding the `session_uuid` can read its state.
