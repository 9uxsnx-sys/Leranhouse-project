# Boards API

> Status: as-built · Last verified: 2026-11-15

Collaborative boards (Yjs/Hocuspocus documents), board membership, and the Boards Playground AI generator. Mounted at `/api/v1/boards`; the main router enforces the `boards` feature flag, and the main + playground routers require a `pro` plan.

Three routers share the prefix:

| Router | Auth | Plan | Paths |
|---|---|---|---|
| `boards.router` | router-level `get_non_api_token_user` (API tokens rejected; anonymous allowed for public reads) + per-handler RBAC | `require_plan_for_boards("pro", "Boards")` + `require_boards_feature` | CRUD, members, thumbnail |
| `boards.internal_router` | **`X-Internal-Key` only** | none | `GET/PUT /{board_uuid}/ydoc` |
| `boards_playground.router` | `require_authenticated_user` (anonymous + API tokens rejected) | `require_plan_for_boards("pro", "Boards")` | `/playground/*` |

`BoardRead`: `id`, `org_id`, `board_uuid`, `name`, `description`, `thumbnail_image`, `public`, `created_by`, `creation_date`, `update_date`, `member_count`. `BoardMemberRead` adds `id`, `board_id`, `user_id`, `role`, `creation_date`, `username`, `email`, `avatar_image`, `user_uuid`.

Member roles: `owner`, `editor` (default), `viewer`.

---

## Boards (CRUD)

### Create a board

```
POST /api/v1/boards/?org_id={org_id}
```

Auth: caller with `create` permission (checked against the generic `board_x` resource). The creator becomes the `owner` board member and the `CREATOR` resource author.

| Field | Type | Required | Notes |
|---|---|---|---|
| `org_id` | query | yes | Target organization |
| `name` | body | yes | |
| `description` | body | no | |
| `thumbnail_image` | body | no | Default `""` |

There is no `public` field on create — the model default `public=true` applies.

Response `200`: `BoardRead` with `member_count: 1`.

```json
{
  "id": 9,
  "org_id": 1,
  "board_uuid": "board_7c1d...",
  "name": "Lesson planning",
  "description": "Weekly whiteboard",
  "thumbnail_image": "",
  "public": true,
  "created_by": 5,
  "creation_date": "2026-11-15 09:00:00.000000",
  "update_date": "2026-11-15 09:00:00.000000",
  "member_count": 1
}
```

Errors: `403`, `404` (org not found).

### List boards for an organization

```
GET /api/v1/boards/org/{org_id}
```

Auth: **org membership required** (`require_org_membership`), regardless of individual board membership.

Returns every board in the org (newest first) as a bare array of `BoardRead` with `member_count`; it is not limited to boards the caller belongs to. `ydoc_state` is excluded from the payload.

Errors: `403` (not an org member).

### Get a board

```
GET /api/v1/boards/{board_uuid}
```

Auth: RBAC `read` on the board (public boards, linked user groups, authors, org admins). Returns `BoardRead`.

Errors: `403`, `404 "Board not found"`.

### Update a board

```
PUT /api/v1/boards/{board_uuid}
```

Auth: RBAC `update` on the board.

Body (`BoardUpdate`): `name`, `description`, `thumbnail_image`, `public` — all optional; only non-null fields are written. Returns `BoardRead`.

### Duplicate a board

```
POST /api/v1/boards/{board_uuid}/duplicate
```

Auth: RBAC `read` on the source **and** `create` on `board_x`.

Creates `"<name> (copy)"`, copies `description`, `thumbnail_image` and `public`, sets the caller as the new `owner`. **Members and the Yjs document are not copied.** Returns `BoardRead`.

### Delete a board

```
DELETE /api/v1/boards/{board_uuid}
```

Auth: RBAC `delete`.

```json
{ "detail": "Board deleted" }
```

### Upload a thumbnail

```
POST /api/v1/boards/{board_uuid}/thumbnail
Content-Type: multipart/form-data
```

Auth: RBAC `update`. Form field `thumbnail` is required.

Returns the updated `BoardRead`. Errors: `400 "No thumbnail file provided"`, `403`, `404`.

---

## Members

### List members

```
GET /api/v1/boards/{board_uuid}/members
```

Auth: RBAC `read`. Returns a bare array of `BoardMemberRead` with joined username/email/avatar/user UUID.

### Add one member

```
POST /api/v1/boards/{board_uuid}/members
```

Auth: RBAC `update`. Body: `{ "user_id": 7, "role": "editor" }` (`role` optional, default `editor`).

Limits: **max 10 members per board** (`403 "Board member limit reached (max 10)"`); an existing member returns `409 "User is already a board member"`.

Response `200`: `BoardMemberRead`.

### Add members in bulk

```
POST /api/v1/boards/{board_uuid}/members/batch
```

Auth: RBAC `update`. Body:

```json
{
  "members": [
    { "user_id": 7, "role": "editor" },
    { "user_id": 8, "role": "viewer" }
  ]
}
```

Adds until the 10-member limit is reached; duplicates are skipped silently and later entries are dropped once the cap is hit (no error). Returns the bare array of members actually added.

### Remove a member

```
DELETE /api/v1/boards/{board_uuid}/members/{user_id}
```

Auth: RBAC `update`. The `owner` cannot be removed (`400 "Cannot remove the board owner"`).

```json
{ "detail": "Member removed" }
```

Errors: `404 "Board member not found"`.

### Check the caller's membership

```
GET /api/v1/boards/{board_uuid}/membership
```

Auth: board read access. Returns the caller's direct `BoardMemberRead` row when one exists.

If the caller is not a direct member but passes RBAC `read` (public board, user-group link, author or org admin), it returns a **synthetic viewer record** so the collab session can still load:

```json
{
  "id": 0,
  "board_id": 9,
  "user_id": 5,
  "role": "viewer",
  "creation_date": "",
  "username": "learner",
  "email": "learner@example.com",
  "avatar_image": "",
  "user_uuid": "user_..."
}
```

If neither a membership row nor RBAC read succeeds, the request fails with `403`/`404`. Clients use this before opening the realtime document.

> Board membership rows are **not** consulted by the RBAC read check. A direct member on a non-public board can still read their membership through this route, but `GET /boards/{board_uuid}` and `GET /boards/{board_uuid}/members` still require public/user-group/author/admin read access.

---

## Collab document state (internal)

These two routes live on `internal_router`, mounted **without** the user-auth and plan dependencies. They are called by the Hocuspocus collab server.

```
GET /api/v1/boards/{board_uuid}/ydoc
PUT /api/v1/boards/{board_uuid}/ydoc
```

Auth: required header `X-Internal-Key` must equal the `COLLAB_INTERNAL_KEY` environment variable (constant-time compare). If the env var is empty **every** call is rejected with `403 "Invalid internal key"`.

| Method | Request | Response |
|---|---|---|
| `GET` | — | `application/octet-stream` — raw persisted Yjs state; empty body when no state exists; `404` if the board does not exist |
| `PUT` | Raw binary body (the Yjs update) | `{ "detail": "Ydoc state stored" }`; `404` if the board does not exist |

`PUT` locks the board row (`SELECT … FOR UPDATE`) before writing.

---

## Boards Playground (AI generation)

Mounted at `/api/v1/boards/playground/*` (tags `boards` / `boards-playground`). `require_authenticated_user` rejects anonymous callers and API tokens. The plan dependency resolves `org_id`/`board_uuid` from path params; `/playground/start` and `/playground/iterate` carry them in the **body**, so the plan lookup falls through and org membership inside the handler is the tenant guard.

Sessions live in Redis (`boards_playground_session:{session_uuid}`, 25-day TTL). Without Redis configured, session lookups return `None` and iterate/session routes return `404`.

### Start a session

```
POST /api/v1/boards/playground/start
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `board_uuid` | string | yes | Board must exist |
| `block_uuid` | string | yes | Block the generated content targets |
| `prompt` | string | yes | |
| `context.board_name` | string | yes | |
| `context.board_description` | string | yes | |

Behaviour: board `404`, org `404`, caller must be an org member (`403 "You are not a member of this organization"`), AI rate limit applied, **3 AI credits** reserved. Model: `gemini-3-flash-preview` on Pro+, otherwise `gemini-2.5-flash-lite`.

Response: `text/event-stream`:

```
data: {"type": "chunk", "content": "<html fragment>"}

data: {"type": "done", "session_uuid": "pg_..."}

```

On failure the stream emits `data: {"type": "error", "message": "An internal error occurred."}`.

### Iterate a session

```
POST /api/v1/boards/playground/iterate
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `session_uuid` | string | yes | |
| `board_uuid` | string | yes | Must match the session |
| `block_uuid` | string | yes | Must match the session |
| `message` | string | yes | |
| `current_html` | string | no | Falls back to the session's current HTML |

Max **6 iterations** (`MAX_ITERATIONS`); exceeding it returns `400 "Maximum iterations (6) reached"`. Board/block mismatches return `400`. Board/org lookups `404`, non-member `403`. Reserves **3 AI credits** and streams SSE like `/start`.

### Get session state

```
GET /api/v1/boards/playground/session/{session_uuid}
```

Auth: authenticated. Returns:

```json
{
  "session_uuid": "pg_2f9a...",
  "iteration_count": 2,
  "max_iterations": 6,
  "html_content": "<section>…</section>",
  "message_history": [
    { "role": "user", "content": "Make the hero section blue" },
    { "role": "model", "content": "<section>…</section>" }
  ]
}
```

Errors: `404 "Session not found"`. The handler does not verify session ownership — any authenticated caller holding the `session_uuid` can read its state.
