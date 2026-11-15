# Roles API

> Status: as-built · Last verified: 2026-11-15

This router owns organization roles and their `rights` permission matrix. Mounted at `/api/v1/roles`.

Every route is mounted with `require_authenticated_user`: anonymous callers get `401`, API tokens get `403`. Only `POST /org/{org_id}` carries a plan gate (**Pro**, feature name `Create Role`); the read/update/delete routes are permission-checked only.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/roles/org/{org_id}` | Create an organization role |
| `GET` | `/api/v1/roles/org/{org_id}` | List global + organization roles |
| `GET` | `/api/v1/roles/{role_id}` | Get one role |
| `PUT` | `/api/v1/roles/{role_id}` | Update a role |
| `DELETE` | `/api/v1/roles/{role_id}` | Delete a role |

`RoleCreate` = `{ name, description?, rights? }`; `RoleUpdate` = `{ name?, description?, rights? }` (`role_id` is taken from the path). `RoleRead` = `{ id, name, description, rights, org_id, role_type, role_uuid, creation_date, update_date }`.

### `rights` shape

`RoleCreate.rights` / `RoleUpdate.rights` is a JSON object. When supplied, the service requires these top-level keys: `courses`, `users`, `usergroups`, `collections`, `organizations`, `coursechapters`, `activities`, `roles`, `dashboard`. `courses` uses the `*_own` variant (`action_create`, `action_read`, `action_read_own`, `action_update`, `action_update_own`, `action_delete`, `action_delete_own`); the other resources use `action_create/read/update/delete`; `dashboard` uses `action_access`. A missing key or non-boolean value returns `400`.

---

## POST /api/v1/roles/org/{org_id}

Creates a role for the org in the path; the path `org_id` overwrites any `org_id` in the body. The role type is forced to `TYPE_ORGANIZATION`.

Plan gate: **Pro+** (`Create Role`). In SaaS this returns `403` with `"Create Role requires a Pro plan or higher. Your organization is currently on the <Plan> plan."`; EE/OSS bypass it.

| Status | When |
|---|---|
| `200` | Role created (`RoleRead`) |
| `403` | Missing `roles.action_create` in the org, or caller tries to grant a permission they do not hold themselves |
| `404` | Organization not found |
| `409` | A role with the same name already exists in this org |
| `400` | Empty name, name > 100 chars, or malformed `rights` |

Body:

```json
{
  "name": "Instructor",
  "description": "Can author courses",
  "rights": {
    "courses": {
      "action_create": true,
      "action_read": true,
      "action_read_own": true,
      "action_update": true,
      "action_update_own": true,
      "action_delete": false,
      "action_delete_own": false
    },
    "users": { "action_create": false, "action_read": true, "action_update": false, "action_delete": false },
    "usergroups": { "action_create": false, "action_read": true, "action_update": false, "action_delete": false },
    "collections": { "action_create": false, "action_read": true, "action_update": false, "action_delete": false },
    "organizations": { "action_create": false, "action_read": true, "action_update": false, "action_delete": false },
    "coursechapters": { "action_create": true, "action_read": true, "action_update": true, "action_delete": false },
    "activities": { "action_create": true, "action_read": true, "action_update": true, "action_delete": false },
    "roles": { "action_create": false, "action_read": true, "action_update": false, "action_delete": false },
    "dashboard": { "action_access": true }
  }
}
```

Response `200`:

```json
{
  "name": "Instructor",
  "description": "Can author courses",
  "rights": { "courses": { "action_create": true, "action_read": true, "action_read_own": true, "action_update": true, "action_update_own": true, "action_delete": false, "action_delete_own": false } },
  "id": 14,
  "org_id": 1,
  "role_type": "TYPE_ORGANIZATION",
  "role_uuid": "role_2f7d…",
  "creation_date": "2026-11-15 10:02:11.442001",
  "update_date": "2026-11-15 10:02:11.442001"
}
```

The service also repairs a stale `role_id_seq` on `role_pkey` conflicts, then returns the new row.

---

## GET /api/v1/roles/org/{org_id}

Returns a bare array: **global roles first (`TYPE_GLOBAL`), then the org's `TYPE_ORGANIZATION` roles**, each ordered by `id`. Requires `roles.action_read` in that org.

- `403` — caller is not a member, or the role rights deny `roles.action_read`.
- `404` — `"Organization not found"`.

Global roles are serialized with `org_id: 0` in this list (the model stores `NULL`, the service normalizes it), while real org roles carry their numeric `org_id`.

---

## GET /api/v1/roles/{role_id}

`role_id` is parsed as an integer.

| Status | When |
|---|---|
| `200` | `RoleRead` |
| `400` | `"Invalid role ID format. Role ID must be a number."` |
| `403` | Org role and caller lacks `roles.action_read` in that org |
| `404` | `"Role not found"` |

Global roles (`org_id = NULL`) are readable by **any authenticated user**; no org permission check is performed for them.

---

## PUT /api/v1/roles/{role_id}

Updates only the fields present in the body (`model_dump(exclude_unset=True)`), refreshes `update_date`, validates `rights` like create, and invalidates the session cache of every user holding the role.

| Status | When |
|---|---|
| `200` | Updated `RoleRead` |
| `400` | Non-numeric `role_id`, or malformed `rights` |
| `403` | Role is `TYPE_GLOBAL` (`"Global roles cannot be updated…"`), or caller lacks `roles.action_update` in the role's org |
| `404` | Role not found |

There is **no** check preventing a caller from granting permissions they lack on update (that guard exists only on create).

---

## DELETE /api/v1/roles/{role_id}

Hard-deletes the role and invalidates the session cache of affected users.

| Status | When |
|---|---|
| `200` | Body is the plain string `"Role deleted"` |
| `400` | Non-numeric `role_id` |
| `403` | `TYPE_GLOBAL` role (`"Global roles cannot be deleted…"`), or missing `roles.action_delete` |
| `404` | Role not found |

---

## Notes that are easy to miss

- Only `POST` is plan-gated; a Free org can still list, read, update and delete its existing organization roles.
- `RoleRead.org_id` is `Optional[int]`. The **list** endpoint normalizes global roles' `NULL` to `0`; `GET /{role_id}` returns `null` for a global role — treat `0`/`null` as "global", not a real org.
- Deleting a role does not reassign members: `UserOrganization.role_id` is a plain foreign key (no `ON DELETE`), so deleting a role that is still assigned fails at the database level (surfaces as `500`). Reassign members first.
