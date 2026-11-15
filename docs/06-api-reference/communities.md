# Communities API

> Status: as-built · Last verified: 2026-11-15

Communities: discussion spaces that are always attached to exactly one course **or** podcast. Mounted at `/api/v1/communities` with a router-level `standard` plan gate ("Communities"). `POST /` takes `org_id` as a query parameter.

---

## What this router owns

Community CRUD, resource linking, rights/member stats, thumbnail/banner media and locale overlays. Discussions, comments, votes and reactions live in the [Discussions API](./discussions.md).

### Access model (easy to miss)

- A community is an add-on, never standalone. `resource_uuid` + `resource_type` (`course` | `podcast`) are required at creation; the linked resource must belong to the same org. The DB enforces one community per resource (`unique` index on `resource_uuid`) and the service also rejects a second link with `400 "This resource already has a community"`.
- **Access is inherited from the linked resource** (`src/security/rbac/resource_access.py::_check_community_access`). There is no separate community ACL: reading follows the course/podcast's published state, access type, entitlement, user groups, authorship and org-admin status. Managing follows the parent's authors and org admins.
- `community.published` is an extra draft switch on top of the parent: an unpublished community is hidden from non-admins even when the parent is readable.
- A community attached to a **free/public** parent additionally requires the caller to have claimed that parent (a `TrailRun` for the course/podcast) unless they are an admin, author or have a role that grants read. Anonymous visitors therefore cannot read a free public community; they must sign in and claim/follow the resource.
- An orphan community (unlinked) is readable by nobody. Org admins can still manage it so they can attach it again.

`CommunityRead`:

| Field | Notes |
|---|---|
| `id`, `community_uuid`, `org_id` | |
| `name`, `description` | Source-locale content |
| `public`, `published` | `public` defaults `true`, `published` defaults `false` in the model; creation forces both to `true` |
| `thumbnail_image`, `banner_image` | Filenames, empty string when unset |
| `resource_uuid`, `resource_type` | `course` or `podcast`; `null` for orphans |
| `source_locale`, `content_locale`, `is_fallback` | Locale overlay state |
| `moderation_words`, `moderation_settings` | JSON settings (see defaults below) |
| `creation_date`, `update_date` | |

`moderation_settings` defaults: `block_links`, `min_post_length`, `max_post_length`, `max_comment_length`, `slow_mode_seconds`, `max_posts_per_day`, `min_account_age_days`, `require_email_verified`, `disable_reactions`, `auto_lock_days`.

---

## CRUD

### Create a community

```
POST /api/v1/communities/?org_id={org_id}
```

Auth: authenticated user (anonymous rejected) with the `create` permission for communities in their org role.

| Param | In | Type | Notes |
|---|---|---|---|
| `org_id` | query | integer | Target organization |
| `name` | body | string | Required |
| `description` | body | string | Optional |
| `resource_uuid` | body | string | Required; course or podcast UUID |
| `resource_type` | body | string | Required; `course` or `podcast` |

Response `200`: created `CommunityRead` with `public=true`, `published=true`, and the link already set.

```json
{
  "id": 4,
  "org_id": 1,
  "community_uuid": "community_2f9a...",
  "name": "Algebra Study Group",
  "description": "Ask questions and share solutions.",
  "public": true,
  "published": true,
  "thumbnail_image": "",
  "banner_image": "",
  "resource_uuid": "course_91be...",
  "resource_type": "course",
  "source_locale": "en",
  "content_locale": "en",
  "is_fallback": false,
  "moderation_words": [],
  "moderation_settings": null,
  "creation_date": "2026-11-15 09:00:00.000000",
  "update_date": "2026-11-15 09:00:00.000000"
}
```

Errors: `403` (no create permission), `404` (org or linked resource not found), `422` (missing/invalid link), `400` (resource in another org or already has a community).

### Get a community

```
GET /api/v1/communities/{community_uuid}?locale={locale}
```

Auth: inherited read access (see model above). `locale` overlays `name` / `description`; omitting it returns the source row.

Response `200`: `CommunityRead` with `content_locale` / `is_fallback` reflecting the overlay.

Errors: `404 "Community not found"`, `403`.

### List communities for an organization

```
GET /api/v1/communities/org/{org_id}/page/{page}/limit/{limit}?locale={locale}
```

Auth: inherited read access per row.

| Param | In | Type | Notes |
|---|---|---|---|
| `org_id` | path | integer | |
| `page` | path | integer | Default `1` |
| `limit` | path | integer | Default `10`; **capped at `50`** by the service |
| `locale` | query | string | Optional overlay for the whole page |

Returns a **bare array** of `CommunityRead`, newest first. Callers with org-admin status, community-update rights or superadmin see every row (including orphans); everyone else gets only rows they can read (`[]` when none are readable). The route does not verify that the org exists.

### Get the community for a course or podcast

```
GET /api/v1/communities/course/{course_uuid}?locale={locale}
GET /api/v1/communities/podcast/{podcast_uuid}?locale={locale}
```

Auth: inherited read access to the linked resource.

Returns the linked `CommunityRead`, or **`null`** when the resource has no community. Parent lookup errors: `404 "Course not found"` / `"Podcast not found"`; access errors: `403`.

### Update a community

```
PUT /api/v1/communities/{community_uuid}
```

Auth: inherited `update` (parent authors / org admins).

Body (`CommunityUpdate`): `name`, `description`, `public`, `published`, `moderation_words`, `moderation_settings`. Only non-null fields are written.

> `thumbnail_image` and `banner_image` are part of the model but are **ignored** by this handler — use the media routes below.

Response `200`: updated `CommunityRead`.

### Delete a community

```
DELETE /api/v1/communities/{community_uuid}
```

Auth: inherited `delete` (parent authors / org admins).

```json
{ "detail": "Community deleted" }
```

---

## Linking

| Method | Path | Auth | Notes |
|---|---|---|---|
| `PUT` | `/api/v1/communities/{community_uuid}/link/{resource_type}/{resource_uuid}` | inherited `update` | Attach/replace the link. `resource_type` must be `course` or `podcast` (`422`), same org (`400`), resource not already claimed (`400`). Returns `CommunityRead` |
| `DELETE` | `/api/v1/communities/{community_uuid}/link` | inherited `update` | Clear `resource_uuid` / `resource_type`; community becomes invisible to learners. Returns `CommunityRead` |
| `PUT` | `/api/v1/communities/{community_uuid}/link-course/{course_uuid}` | inherited `update` | Back-compat alias for `link/course/{course_uuid}` |
| `DELETE` | `/api/v1/communities/{community_uuid}/unlink-course` | inherited `update` | Alias for `DELETE /{community_uuid}/link` |

There is no `link-podcast` route — use the generic link route with `resource_type=podcast`.

---

## Rights and stats

### Get the caller's rights

```
GET /api/v1/communities/{community_uuid}/rights
```

Auth: any caller; anonymous is reported as `is_anonymous=true` with all permissions false. `404` only when the community does not exist.

```json
{
  "community_uuid": "community_2f9a...",
  "user_id": 5,
  "is_anonymous": false,
  "permissions": {
    "read": true,
    "create": false,
    "update": false,
    "delete": false,
    "create_discussion": true
  },
  "ownership": {
    "is_admin": false,
    "is_maintainer_role": false
  },
  "access": {
    "via_public": false,
    "via_usergroups": [],
    "has_usergroup_restriction": false,
    "via_resource": true,
    "resource_uuid": "course_91be...",
    "resource_type": "course",
    "is_linked": true
  }
}
```

`read` / `create_discussion` mirror inherited read; `create` / `update` / `delete` mirror inherited update.

### Member count

```
GET /api/v1/communities/{community_uuid}/member-count
```

Auth: any caller (the handler performs no access check). Counts unique users who authored a discussion, authored a comment, voted on a discussion or reacted to a discussion in that community.

```json
{ "member_count": 27 }
```

An unknown community returns `200 { "member_count": 0 }` (the service does not raise `404` here).

---

## Media

| Method | Path | Form field | Auth | Response |
|---|---|---|---|---|
| `PUT` | `/api/v1/communities/{community_uuid}/thumbnail` | `thumbnail` | inherited `update` | Updated `CommunityRead` |
| `DELETE` | `/api/v1/communities/{community_uuid}/thumbnail` | — | inherited `update` | Updated `CommunityRead` (`thumbnail_image=""`) |
| `PUT` | `/api/v1/communities/{community_uuid}/banner` | `banner` | inherited `update` | Updated `CommunityRead` |
| `DELETE` | `/api/v1/communities/{community_uuid}/banner` | — | inherited `update` | Updated `CommunityRead` (`banner_image=""`) |

All four run the inherited `update` check and store files under the community's org folder. A missing file simply leaves the field unchanged (`PUT` without a file is not an error). Errors: `404` (community or organization not found), `403`.

---

## Localization

```
GET    /api/v1/communities/{community_uuid}/translations
PUT    /api/v1/communities/{community_uuid}/translations/{locale}
DELETE /api/v1/communities/{community_uuid}/translations/{locale}
```

Auth: inherited `update` on the community.

- `GET` returns `CommunityTranslationRead[]` ordered by locale: `id`, `community_id`, `locale`, `name`, `description`, `state`, `source_updated_at`, `translated_by`, `creation_date`, `update_date`.
- `PUT` body (`CommunityTranslationUpsert`): `name` (required), `description`, `state` (`draft` default / `machine` / `reviewed` / `published`; v1 serves every state). Writing the community's `source_locale` is rejected with `422` — update the community itself. Unknown/invalid locale → `422`.
- `DELETE` returns `{ "detail": "Translation deleted" }`; a missing row → `404 "Translation not found"`.

Only admin-authored `name` / `description` are translated. Discussions, comments and reactions are user-generated and are never localized.
