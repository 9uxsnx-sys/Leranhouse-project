# Users

> The Users router at `/api/v1/users` manages the current user's profile and session, account creation and lookup, profile/avatar/password updates, and password-reset flows. Sessions are cached in Redis and lookups require authentication to prevent enumeration.

---

## Overview

The `user` row is the platform-wide identity (username, email, name, avatar, bio). A user becomes a member of an organization through a `userorganization` row that also carries the per-org `role`. The Users router handles the identity itself; per-organization user administration (invites, role assignment, batch operations, the org roster) lives in the Orgs router — see [Organizations](./orgs.md).

Two things are worth stating up front because earlier drafts of this page got them wrong:

- **Tokens are not issued here.** Access/refresh tokens come from the Auth router — see [Authentication](./authentication.md). `GET /session` returns the user plus their org roles, **not** tokens.
- **There is no `is_active` flag.** Account state on the row is `email_verified` (returned) plus `failed_login_attempts` / `locked_until` (not returned).

---

## Authentication

Every endpoint is mounted with a router-level guard (`get_non_api_token_user`) that **rejects API tokens** but admits anonymous requests. Each endpoint then declares its own dependency:

| Endpoint group | Dependency | Anonymous behaviour |
|----------------|-----------|---------------------|
| `GET /profile` | `get_current_user` | Returns an **anonymous** user object (see below) |
| `GET /session`, `GET /authorize/...`, create/update/avatar/password, reset flows, `DELETE`, `GET /{user_id}/courses` | `get_current_user` | Anonymous caller is handled by the service layer (typically `400`/`403`) |
| `GET /id/{user_id}`, `GET /uuid/{user_uuid}`, `GET /username/{username}` | `get_authenticated_user` | `401 Unauthorized` |

**Note on naming:** the profile route spells the resource `ressource` (double *s*) — `GET /api/v1/users/authorize/ressource/{ressource_uuid}/action/{action}`.

---

## Response Objects

### `UserRead` (profile, create, update, avatar, password)

Inherits the base user fields (`username`, `first_name`, `last_name`, `email`, `avatar_image`, `bio`, `details`, `profile`, `extra_metadata`) and adds:

| Field | Type | Notes |
|-------|------|-------|
| `id` | integer | Primary key |
| `user_uuid` | string | Public UUID identifier |
| `email_verified` | boolean | Whether the email is verified |
| `last_login_at` | string \| null | ISO-8601 |
| `signup_method` | string \| null | e.g. the provider used at signup |
| `is_superadmin` | boolean | Platform-level admin flag |
| `creation_date` | string | ISO-8601 |

`password`, `failed_login_attempts`, `locked_until`, `last_login_ip` and `update_date` are **not** part of this response.

### `UserReadPublic` (lookups by id/uuid/username)

Same base fields plus `id`, `user_uuid`, `email_verified` — a restricted view that omits `last_login_at`, `signup_method`, `is_superadmin` and `creation_date`.

### `AnonymousUser` (profile when unauthenticated)

```json
{
  "id": 0,
  "user_uuid": "user_anonymous",
  "username": "anonymous"
}
```

### `UserSession` (session)

```json
{
  "user": { "id": 1, "user_uuid": "a1b2c3d4-...", "username": "johndoe", "first_name": "John", "last_name": "Doe", "email": "john@example.com", "email_verified": true, "creation_date": "2026-01-15T08:00:00+00:00" },
  "roles": [
    {
      "role": { "id": 1, "name": "Admin", "role_uuid": "role_admin", "role_type": "TYPE_ORGANIZATION", "rights": { "...": "..." } },
      "org":  { "id": 1, "name": "Koodook Academy", "slug": "koodook-academy", "org_uuid": "org_abc123" }
    }
  ]
}
```

`roles` is capped at 100 memberships.

---

## Get Current User Profile

```
GET /api/v1/users/profile
```

Returns the authenticated user as `UserRead`, or the `AnonymousUser` object when there is no session. No `response_model` is declared — the body is the model dump.

### Errors

| Status | Description |
|--------|-------------|
| `200 OK` | Profile returned (or anonymous object when unauthenticated) |

---

## Get Session

Retrieve the current user with their organization memberships and roles.

```
GET /api/v1/users/session
```

Response model: `UserSession` (see above). The result is cached in Redis under `session:{user_id}` for **10 minutes**; profile updates, avatar updates and deletes invalidate it.

### Errors

| Status | Description |
|--------|-------------|
| `200 OK` | Session returned |

---

## Authorization Check

Check whether the current user may perform an action on a resource.

```
GET /api/v1/users/authorize/ressource/{ressource_uuid}/action/{action}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ressource_uuid` | string | The resource UUID to check |
| `action` | string | One of `create`, `read`, `update`, `delete` |

### Response Body (200 OK)

```json
true
```

On denial the endpoint raises `403` rather than returning a falsey object.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | The authenticated user no longer exists |
| `403 Forbidden` | The user is not authorized for the action |

---

## Create User (in Organization)

Create a user and attach them to an organization. Rejected when the organization is invite-only.

```
POST /api/v1/users/{org_id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `org_id` | integer | Organization to attach the user to |

### Request Body (`UserCreate`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `username` | string | Yes | Unique |
| `first_name` | string | No | Defaults to `""` |
| `last_name` | string | No | Defaults to `""` |
| `email` | string (email) | Yes | Unique |
| `password` | string | Yes | |
| `avatar_image` | string | No | |
| `bio` | string | No | |
| `details` / `profile` | object | No | Free-form JSON |
| `extra_metadata` | object | No | Free-form JSONB |

### Response Body (200 OK)

`UserRead`.

### Errors

| Status | Description |
|--------|-------------|
| `403 Forbidden` | Organization is invite-only — an invite code is required |
| `422 Unprocessable Entity` | Validation error |

---

## Create User with Invite

```
POST /api/v1/users/{org_id}/invite/{invite_code}
```

Same body as above. For invite-only organizations.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Invalid or expired invite code |
| `429 Too Many Requests` | Rate limit exceeded (per IP + org) |

---

## Create User (without Organization)

Create a standalone account not yet attached to any organization.

```
POST /api/v1/users
```

Same body as organization-scoped creation. Response: `UserRead`.

---

## Lookup Users

Lookups require authentication (`get_authenticated_user`) to prevent enumeration and return the restricted `UserReadPublic` view.

```
GET /api/v1/users/id/{user_id}
GET /api/v1/users/uuid/{user_uuid}
GET /api/v1/users/username/{username}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `404 Not Found` | User not found |

---

## Update User

```
PUT /api/v1/users/{user_id}
```

### Request Body (`UserUpdate`)

| Field | Type | Required |
|-------|------|----------|
| `username` | string | Yes |
| `email` | string (email) | Yes |
| `first_name` / `last_name` | string | No |
| `avatar_image` / `bio` | string | No |
| `details` / `profile` | object | No |
| `extra_metadata` | object | No |

Response: `UserRead`. Invalidates the user's cached session.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Validation failed (duplicate email/username, invalid fields) |
| `403 Forbidden` | Caller lacks permission to update this user |
| `404 Not Found` | User not found |

---

## Update Avatar

```
PUT /api/v1/users/update_avatar/{user_id}
```

### Request Body (Multipart Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `avatar_file` | file | Yes | Avatar image (the form field is named `avatar_file`) |

Response: `UserRead`. The `user_id` in the URL **must** match the authenticated user (IDOR protection), and the cached session is invalidated.

### Errors

| Status | Description |
|--------|-------------|
| `403 Forbidden` | Attempted to update another user's avatar |

---

## Change Password

```
PUT /api/v1/users/change_password/{user_id}
```

### Request Body (`UserUpdatePassword`)

| Field | Type | Required |
|-------|------|----------|
| `old_password` | string | Yes |
| `new_password` | string | Yes |

Response: `UserRead`.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | New password fails validation |
| `401 Unauthorized` | Wrong current password |
| `403 Forbidden` | Caller cannot change this user's password |

---

## Delete User

```
DELETE /api/v1/users/user_id/{user_id}
```

Returns `200 OK` on success (there is no `204` variant) and invalidates the user's cached session.

### Errors

| Status | Description |
|--------|-------------|
| `403 Forbidden` | Caller cannot delete this user |
| `404 Not Found` | User not found |

---

## Get User Courses

List the courses a user authored or contributed to.

```
GET /api/v1/users/{user_id}/courses?page=1&limit=10
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (≥ 1) |
| `limit` | integer | 10 | Items per page (1–50; the 50 cap prevents bulk extraction) |

Response model: `List[CourseRead]` — see [Courses](./courses.md) for the course shape.

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | User not found |

---

## Password Reset

Two flows exist — **organization-scoped** (a code tied to an org) and **platform-level** (a code not tied to any org). Each flow has a "send code" endpoint and a "change password" endpoint. Every endpoint also has a **deprecated legacy variant** that takes the email as a path parameter instead of in the body; prefer the body form.

### Organization-Scoped

```
POST /api/v1/users/reset_password/send_reset_code
POST /api/v1/users/reset_password/change_password
```

**Send reset code** — request body:

| Field | Type | Required |
|-------|------|----------|
| `email` | string (email) | Yes |
| `org_id` | integer | Yes |

**Change password** — request body:

| Field | Type | Required |
|-------|------|----------|
| `email` | string (email) | No (required by the service; optional in the model so the legacy path variant can reuse it) |
| `new_password` | string | Yes |
| `org_id` | integer | Yes |
| `reset_code` | string | Yes |

### Platform-Level

```
POST /api/v1/users/reset_password/platform/send_reset_code
POST /api/v1/users/reset_password/platform/change_password
```

Same shape as the org-scoped flow but `org_id` is not sent.

**Send reset code** body: `{ "email": "john@example.com" }`.

**Change password** body:

```json
{ "email": "john@example.com", "new_password": "newSecurePassword123", "reset_code": "123456" }
```

### Errors (Password Reset)

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Invalid or expired reset code |
| `404 Not Found` | Email not found |

---

## Data Model Summary

Fields on the `user` row that the API exposes (via `UserRead` / `UserReadPublic`):

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `user_uuid` | string | Public UUID identifier |
| `username` | string | Unique username |
| `first_name` / `last_name` | string | Name parts (no single `display_name` field exists) |
| `email` | string | Email address |
| `avatar_image` | string | Avatar image (no `avatar_url`) |
| `bio` | string | Short biography |
| `details` / `profile` | object | Free-form JSON |
| `extra_metadata` | object | Free-form JSONB |
| `email_verified` | boolean | Email verification state (no `is_verified`) |
| `last_login_at` | string \| null | ISO-8601 |
| `signup_method` | string \| null | Signup provider |
| `is_superadmin` | boolean | Platform admin |
| `creation_date` | string | ISO-8601 (no `created_at`) |

Fields that exist on the row but are **not** returned by these endpoints: `password`, `failed_login_attempts`, `locked_until`, `last_login_ip`, `password_changed_at`, `update_date`.

---

## Related Resources

| Document | Description |
|----------|-------------|
| [Authentication](./authentication.md) | Login, register, token refresh, OAuth/SSO |
| [Organizations](./orgs.md) | Org management, branding, invites, org users |
| [Courses](./courses.md) | Course shape returned by `GET /{user_id}/courses` |
