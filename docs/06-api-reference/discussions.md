# Discussions API

> Status: as-built · Last verified: 2026-11-15

Community discussions, comments, votes and emoji reactions. **This router is mounted with no prefix** (`src/router.py` includes `discussions.router` without `prefix=`), so its real paths are `/api/v1/discussions/...`, `/api/v1/communities/{community_uuid}/discussions` and `/api/v1/comments/...`.

The router is mounted with the `standard` "Communities" plan dependency. That check resolves the org from `org_id` or `community_uuid` path params; `/discussions/...` and `/comments/...` routes carry neither and therefore fall through the plan check while still running their own inherited-access RBAC.

---

## Auth and access

- All routes use `get_current_user` except the public label catalog (`GET /discussions/labels`) and the comment counter (`GET /discussions/{discussion_uuid}/comments/count`), which have no auth dependency. The remaining reads run the community's **inherited** access check (a free public community still requires the learner to have claimed the course / followed the podcast).
- Writes call `authorization_verify_if_user_is_anon`, which raises `403 "You should be logged in to perform this action"` for anonymous callers.
- Moderation (`block_links`, length caps, slow mode, daily caps, account age, email verification) runs on discussion/comment creation and edits. A locked discussion rejects new comments (`403`).
- `resolve_acting_user_id` maps API tokens to their creator for author/admin checks.

`DiscussionReadWithVoteStatus`:

| Field | Notes |
|---|---|
| `id`, `discussion_uuid`, `community_id`, `org_id`, `author_id` | |
| `title`, `content`, `label`, `emoji` | `label` defaults to `general` |
| `upvote_count`, `edit_count` | Author auto-upvote sets `upvote_count=1` at creation |
| `is_pinned`, `is_locked` | |
| `author` | `UserRead` or `null` |
| `has_voted` | Whether the caller upvoted this discussion |
| `creation_date`, `update_date` | |

`DiscussionCommentReadWithVoteStatus` adds the same `author` / `has_voted` wrapper around: `id`, `comment_uuid`, `discussion_id`, `author_id`, `content`, `upvote_count`, `creation_date`, `update_date`.

---

## Labels

### List discussion labels

```
GET /api/v1/discussions/labels
```

Auth: none. Declared before `/discussions/{discussion_uuid}`, so the literal `labels` segment is not shadowed.

```json
[
  { "id": "general", "name": "General", "color": "#6B7280", "icon": "MessageSquare" },
  { "id": "question", "name": "Q&A", "color": "#EAB308", "icon": "HelpCircle" },
  { "id": "idea", "name": "Ideas", "color": "#8B5CF6", "icon": "Lightbulb" },
  { "id": "announcement", "name": "Announcements", "color": "#3B82F6", "icon": "Megaphone" },
  { "id": "showcase", "name": "Show and Tell", "color": "#10B981", "icon": "Star" }
]
```

An unknown label submitted on create/update silently falls back to `general`.

---

## Discussions

### Create a discussion

```
POST /api/v1/communities/{community_uuid}/discussions
```

Auth: non-anonymous + inherited community read.

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | |
| `content` | string | no | `null` is stored as `""` |
| `label` | string | no | Default `general`; invalid values fall back to `general` |
| `emoji` | string | no | Optional thread emoji |

The author is auto-upvoted: `upvote_count=1`, `has_voted=true`. Posting limits and content moderation run before insert.

Response `200`: `DiscussionReadWithVoteStatus`.

```json
{
  "id": 30,
  "title": "How do I factor x² − 9?",
  "content": "I get stuck after the first step.",
  "label": "question",
  "emoji": "🧮",
  "community_id": 4,
  "org_id": 1,
  "author_id": 5,
  "discussion_uuid": "discussion_5d1e...",
  "upvote_count": 1,
  "edit_count": 0,
  "is_pinned": false,
  "is_locked": false,
  "author": {
    "id": 5,
    "user_uuid": "user_...",
    "username": "learner",
    "first_name": "Amine",
    "last_name": "K",
    "email": "learner@example.com",
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
    "creation_date": "2026-09-01 08:00:00"
  },
  "has_voted": true,
  "creation_date": "2026-11-15 09:00:00.000000",
  "update_date": "2026-11-15 09:00:00.000000"
}
```

Errors: `403` (anonymous, no access, or moderation limits), `404`.

### List discussions in a community

```
GET /api/v1/communities/{community_uuid}/discussions?sort_by=recent&page=1&limit=10&label=question
```

Auth: inherited community read.

| Param | In | Type | Notes |
|---|---|---|---|
| `community_uuid` | path | string | |
| `sort_by` | query | enum | `recent` (default), `upvotes`, `hot` |
| `page` | query | integer | Default `1`, minimum `1` |
| `limit` | query | integer | Default `10`, `1–100` |
| `label` | query | string | Optional filter |

Returns a **bare array**. On page 1, pinned threads come first and reduce the number of non-pinned slots in `limit` (if there are more pinned threads than `limit`, all pinned rows are still returned). Later pages contain non-pinned threads only. `hot` uses `(upvotes - 1) / (hours + 2)^1.8`.

Errors: `403`, `404`.

### Get a discussion

```
GET /api/v1/discussions/{discussion_uuid}
```

Auth: inherited read of the parent community. Returns `DiscussionReadWithVoteStatus`.

### Update a discussion

```
PUT /api/v1/discussions/{discussion_uuid}
```

Auth: the discussion author **or** an org admin/maintainer (`update` on the community). Authors are limited to **2 edits** (`edit_count < 2`); admins are unlimited.

Body (`DiscussionUpdate`): `title`, `content`, `label`, `emoji`. Empty `emoji` clears it. Content moderation runs on the resulting title/content.

```json
{ "title": "How do I factor x² − 9? (solved)", "label": "question" }
```

Response `200`: updated `DiscussionReadWithVoteStatus`.

Errors: `403 "You don't have permission to update this discussion"`; `403` with detail `{ "code": "EDIT_LIMIT_REACHED", "message": "...", "edit_count": 2, "max_edits": 2 }` for authors; `404`.

### Pin / unpin a discussion

```
PUT /api/v1/discussions/{discussion_uuid}/pin
```

Auth: org admin/maintainer only (authors cannot pin). Body: `{ "is_pinned": true }`. Returns the updated discussion.

Errors: `403 "Only community moderators can pin discussions"`, `404`.

### Lock / unlock a discussion

```
PUT /api/v1/discussions/{discussion_uuid}/lock
```

Auth: org admin/maintainer only. Body: `{ "is_locked": true }`. A locked discussion rejects new comments. Returns the updated discussion.

Errors: `403 "Only community moderators can lock discussions"`, `404`.

### Delete a discussion

```
DELETE /api/v1/discussions/{discussion_uuid}
```

Auth: the author or an org admin/maintainer with `delete`. Comments are removed by cascade.

```json
{ "detail": "Discussion deleted" }
```

---

## Votes

### Upvote a discussion

```
POST /api/v1/discussions/{discussion_uuid}/vote
```

Auth: non-anonymous + inherited read. One vote per user.

```json
{
  "id": 71,
  "discussion_id": 30,
  "user_id": 5,
  "vote_uuid": "vote_8a7c...",
  "creation_date": "2026-11-15 09:05:00.000000"
}
```

Errors: `400 "You have already upvoted this discussion"`, `403`, `404`.

### Remove a discussion upvote

```
DELETE /api/v1/discussions/{discussion_uuid}/vote
```

Auth: non-anonymous; the caller must have voted.

```json
{ "detail": "Upvote removed" }
```

Errors: `400 "You have not upvoted this discussion"`.

### Batch vote status

```
POST /api/v1/discussions/votes/batch
```

Auth: any caller (anonymous returns all `false`). Body is a **bare JSON array** of discussion UUIDs.

```json
["discussion_5d1e...", "discussion_9f2a..."]
```

```json
{
  "discussion_5d1e...": true,
  "discussion_9f2a...": false
}
```

---

## Comments

### Create a comment

```
POST /api/v1/discussions/{discussion_uuid}/comments
```

Auth: non-anonymous + inherited read; the discussion must not be locked (an `auto_lock_days` setting can lock it lazily on this call).

Body: `{ "content": "..." }` (required).

Response `200`: `DiscussionCommentReadWithVoteStatus` with `has_voted=false`.

Errors: `403 "This discussion is locked and cannot receive new comments"`, `403` (anonymous or moderation), `404`.

### List comments

```
GET /api/v1/discussions/{discussion_uuid}/comments?page=1&limit=50
```

Auth: inherited read.

| Param | In | Type | Notes |
|---|---|---|---|
| `page` | query | integer | Default `1`, minimum `1` |
| `limit` | query | integer | Default `50`, `1–100` |

Returns a **bare array** ordered by `creation_date` ascending, each with `author` and `has_voted`.

### Comment count

```
GET /api/v1/discussions/{discussion_uuid}/comments/count
```

Auth: **none** — the handler has no current-user dependency (safe for counters). A missing discussion returns `200 { "count": 0 }`, not `404`.

```json
{ "count": 12 }
```

### Update a comment

```
PUT /api/v1/comments/{comment_uuid}
```

Auth: the comment author only (`403 "You can only edit your own comments"`). Body: `{ "content": "..." }`. Moderation runs on the new content. Returns `DiscussionCommentReadWithVoteStatus`.

### Delete a comment

```
DELETE /api/v1/comments/{comment_uuid}
```

Auth: the author **or** a caller with inherited `delete` on the community. Returns `{ "detail": "Comment deleted" }`.

### Upvote / remove a comment upvote

```
POST   /api/v1/comments/{comment_uuid}/vote
DELETE /api/v1/comments/{comment_uuid}/vote
```

Auth: non-anonymous + inherited read; one vote per user.

`POST` returns `DiscussionCommentVoteRead`:

```json
{
  "id": 18,
  "comment_id": 44,
  "user_id": 5,
  "vote_uuid": "commentvote_3b9e...",
  "creation_date": "2026-11-15 09:10:00.000000"
}
```

`DELETE` returns `{ "detail": "Upvote removed" }`. Errors: `400` when already/not voted, `403`, `404`.

---

## Reactions

### List reactions

```
GET /api/v1/discussions/{discussion_uuid}/reactions
```

Auth: inherited read.

```json
[
  {
    "emoji": "🔥",
    "count": 3,
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

Grouped per emoji, sorted by count descending.

### Toggle a reaction

```
POST /api/v1/discussions/{discussion_uuid}/reactions
```

Auth: non-anonymous + inherited read. Body: `{ "emoji": "🔥" }`. Adds if missing, removes if present.

```json
{ "action": "added", "emoji": "🔥" }
```

Errors: `403` with detail `{ "message": "Reactions are disabled in this community.", "code": "MODERATION_REACTIONS_DISABLED" }` when the moderation setting is on; `403` for anonymous; `404`.
