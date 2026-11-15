# User Groups API

> Status: as-built · Last verified: 2026-11-15

This router owns User Groups (named groups of org members) and their links to users and org-scoped resources (courses, podcasts, communities, collections, boards). Mounted at `/api/v1/usergroups`.

Router-level requirements: an authenticated session — anonymous callers get `401`, API tokens get `403` — and the **Standard+** plan (`User Groups`). The plan dependency resolves the org from `org_id` in the path/query, or by looking up the `usergroup_id` path parameter; routes where no org can be resolved skip it (see the notes at the end).

---

## Permission model

| Route kind | Check |
|---|---|
| Create (`POST /`) | Generic RBAC on `usergroups.create`. Not org-scoped (the org arrives in the body). |
| Any `/{usergroup_id}` route | `usergroups.action_<read/update/delete/create>` via the caller's role **in that usergroup's org** (`require_org_role_permission`). |
| `GET /org/{org_id}`, `GET /resource/{resource_uuid}` | Generic RBAC on `usergroups.read` (`usergroup_X` placeholder) — not org-scoped. |

The object is loaded first, so a missing usergroup returns `404` before the permission check; an existing one the caller cannot access returns `403`.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/usergroups/` | Create a usergroup |
| `GET` | `/api/v1/usergroups/{usergroup_id}` | Read one usergroup |
| `GET` | `/api/v1/usergroups/{usergroup_id}/users` | List member users |
| `GET` | `/api/v1/usergroups/{usergroup_id}/resources` | List linked resource UUIDs |
| `GET` | `/api/v1/usergroups/org/{org_id}` | List usergroups in an org |
| `GET` | `/api/v1/usergroups/resource/{resource_uuid}` | List usergroups linked to a resource |
| `PUT` | `/api/v1/usergroups/{usergroup_id}` | Update name/description |
| `DELETE` | `/api/v1/usergroups/{usergroup_id}` | Delete a usergroup |
| `POST` | `/api/v1/usergroups/{usergroup_id}/add_users?user_ids=…` | Add members |
| `DELETE` | `/api/v1/usergroups/{usergroup_id}/remove_users?user_ids=…` | Remove members |
| `POST` | `/api/v1/usergroups/{usergroup_id}/add_resources?resource_uuids=…` | Link resources |
| `DELETE` | `/api/v1/usergroups/{usergroup_id}/remove_resources?resource_uuids=…` | Unlink resources |

`UserGroupCreate` = `{ name, description, org_id }`; `UserGroupUpdate` = `{ name?, description? }`.

---

## POST /api/v1/usergroups/

Creates a usergroup in the org given in the body. `usergroups.create` permission required.

Body: `{ "name": "Cohort A", "description": "Fall intake", "org_id": 1 }`

| Status | When |
|---|---|
| `200` | `UserGroupRead` returned |
| `400` | Organization does not exist (`"Organization does not exist"`) — note the route advertises `404`, the service raises `400` |
| `403` | RBAC denial, the org's `courses` feature is disabled, or its usage limit is exhausted (`check_limits_with_usage("courses", …)` is called) |
| `404` | The org has no organization config (raised by the usage check) |

Response `200`:

```json
{
  "name": "Cohort A",
  "description": "Fall intake",
  "id": 12,
  "org_id": 1,
  "usergroup_uuid": "usergroup_4b1e…",
  "creation_date": "2026-11-15 09:14:22.103211",
  "update_date": "2026-11-15 09:14:22.103211",
  "members_count": 0,
  "linked_at": null
}
```

Side effects: `usergroup_created` webhook + notification; usergroup feature usage is incremented.

---

## GET /api/v1/usergroups/{usergroup_id}

Returns `UserGroupRead`. `members_count` is **not** computed on this route (model default `0`); use the org list or resource list for real counts.

| Status | When |
|---|---|
| `200` | Found and readable |
| `403` | Caller lacks `usergroups.action_read` in the group's org |
| `404` | `"UserGroup not found"` |

---

## GET /api/v1/usergroups/{usergroup_id}/users

Returns a bare array of full `UserRead` objects for members (`user` joined through `usergroupuser`). Same `403`/`404` rules as above; requires `usergroups.action_read`.

```json
[
  { "id": 7, "user_uuid": "user_1c9a…", "username": "jdoe", "email": "jdoe@example.com", "first_name": "John", "last_name": "Doe", "avatar_image": "" }
]
```

---

## GET /api/v1/usergroups/{usergroup_id}/resources

Returns a bare array of resource UUID strings, e.g. `["course_9f2c…", "podcast_11ab…"]`. Requires `usergroups.action_read`; `404` for an unknown group.

---

## GET /api/v1/usergroups/org/{org_id}

Returns a bare array of `UserGroupRead`, newest `creation_date` first, with real `members_count` (single grouped query). `linked_at` stays `null` here.

The permission check is the generic `usergroups.read` check (`usergroup_X`), **not** scoped to `org_id`. An unknown org simply returns `[]`.

```json
[
  { "name": "Cohort A", "description": "", "id": 12, "org_id": 1, "usergroup_uuid": "usergroup_4b1e…", "creation_date": "2026-11-15 09:14:22.103211", "update_date": "2026-11-15 09:14:22.103211", "members_count": 8, "linked_at": null }
]
```

---

## GET /api/v1/usergroups/resource/{resource_uuid}

Returns the usergroups linked to a resource, with `members_count` and `linked_at` (the link's `creation_date`). Same generic `usergroups.read` check. An unlinked/unknown UUID returns `[]` (the resource itself is not validated).

---

## PUT /api/v1/usergroups/{usergroup_id}

Body: `{ "name"?: string, "description"?: string }`. Only non-`null` fields are written; `update_date` is refreshed. Returns the updated `UserGroupRead`.

| Status | When |
|---|---|
| `200` | Updated |
| `403` | Missing `usergroups.action_update` in the group's org |
| `404` | Usergroup not found |

---

## DELETE /api/v1/usergroups/{usergroup_id}

Hard-deletes the usergroup (FK cascades remove its user/resource links). Requires `usergroups.action_delete` in the group's org. Emits the `usergroup_deleted` webhook + notification.

Response `200` is a **plain JSON string**, not an object:

```json
"UserGroup deleted successfully"
```

---

## Add / remove users

```
POST   /api/v1/usergroups/{usergroup_id}/add_users?user_ids=1,2,3
DELETE /api/v1/usergroups/{usergroup_id}/remove_users?user_ids=1,2,3
```

`user_ids` is a **comma-separated query parameter**, not a JSON body. Add checks `usergroups.action_create`, remove checks `usergroups.action_delete` (both in the group's org).

- Add skips IDs that are already linked or that do not exist (logged, not an error). The route advertises `404` for unknown users, but the service only `404`s when the **usergroup** is missing.
- Remove silently skips IDs not present.
- Responses are plain strings: `"Users added to UserGroup successfully"` / `"Users removed from UserGroup successfully"`.

---

## Add / remove resources

```
POST   /api/v1/usergroups/{usergroup_id}/add_resources?resource_uuids=course_9f2c…,podcast_11ab…
DELETE /api/v1/usergroups/{usergroup_id}/remove_resources?resource_uuids=course_9f2c…,podcast_11ab…
```

`resource_uuids` is a comma-separated query parameter. Add checks `usergroups.action_create`; remove checks `usergroups.action_delete`.

Add validates each new link via the UUID prefix (`get_resource_config`):

| Status | When |
|---|---|
| `400` | Unknown prefix / unsupported type (`"Unknown resource type for UUID: …"`) |
| `403` | Resource belongs to a different org (`"Resource … does not belong to this organization"`) |
| `404` | Resource does not exist |

Supported resource types: `courses`, `podcasts`, `communities`, `collections`, `boards`. Existing links are skipped. Responses are plain strings: `"Resources added to UserGroup successfully"` / `"Resources removed from UserGroup successfully"`.

---

## Notes that are easy to miss

- The plan gate cannot resolve an org for `POST /` (org only in the body) or `GET /resource/{resource_uuid}` (no org/usergroup discriminator) unless the caller adds `?org_id=…`; without it those two fall through to the handler.
- Creation's permission check is the global placeholder check: a role granting `usergroups.create` in **any** org satisfies it, and the body `org_id` is not cross-checked against the org where that role was granted.
- Deleting a usergroup also calls `increase_feature_usage("usergroups", …)` — the usage counter is bumped on delete, not decremented.
- Group creation consumes the org's **courses** usage limit (`check_limits_with_usage("courses", …)`), while the `usergroups` counter is incremented separately.
