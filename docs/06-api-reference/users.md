# Users

> Status: as-built · Last verified: 2026-11-15

---

## Overview

The Users router is mounted at `/api/v1/users`. It covers the current user's profile and session, account creation and lookup, profile/avatar/banner/password updates, courses/podcasts authored by a user, communities the user can access, and password-reset flows.

The router-level dependency rejects API-token authentication (`get_non_api_token_user`) but admits anonymous requests; each endpoint then declares its own dependency.

| Endpoint group | Dependency | Anonymous behaviour |
|----------------|-----------|---------------------|
| `GET /profile` | `get_current_user` | Returns the `AnonymousUser` object |
| `GET /session`, `GET /authorize/...`, `GET /check-username/...`, create/update/avatar/banner/password, reset flows, `DELETE`, profile listings | `get_current_user` | Service layer decides (usually `400`/`403`) |
| `GET /id/{user_id}`, `GET /uuid/{user_uuid}`, `GET /username/{username}` | `get_authenticated_user` | `401 Unauthorized` |

The authorization route spells the resource `ressource` (double *s*).

---

## Response Objects

### `UserRead` (profile, create, update, avatar/banner/password responses)

```json
{
  "id": 1,
  "user_uuid": "user_a1b2c3d4-...",
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
  "last_login_at": "2026-11-15 08:12:40.123456",
  "signup_method": "email",
  "is_superadmin": false,
  "creation_date": "2026-01-15 08:00:00.000000"
}
```

`password`, `failed_login_attempts`, `locked_until`, `last_login_ip`, `password_changed_at` and `update_date` are not returned.

### `UserReadPublic` (lookups by id/uuid/username)

Inherits all `UserBase` fields (`username`, `first_name`, `last_name`, `email`, `avatar_image`, `banner_image`, `bio`, `details`, `profile`, `extra_metadata`) plus:

| Field | Type |
|-------|------|
| `id` | integer |
| `user_uuid` | string |
| `email_verified` | boolean |

It omits `last_login_at`, `signup_method`, `is_superadmin` and `creation_date`.

### `AnonymousUser` (profile when unauthenticated)

```json
{ "id": 0, "user_uuid": "user_anonymous", "username": "anonymous" }
```

### `UserSession`

```json
{
  "user": { "id": 1, "user_uuid": "user_a1b2c3d4-...", "username": "johndoe", "email_verified": true, "...": "..." },
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

Returns `UserRead` (model dump) or `AnonymousUser` when unauthenticated. No `response_model` is declared.

---

## Get Session

```
GET /api/v1/users/session
```

Returns `UserSession`. Cached in Redis under `session:{user_id}` for 10 minutes; profile/avatar/banner updates and deletes invalidate the cache.

### Errors

| Status | Description |
|--------|-------------|
| `400` | Authenticated user no longer exists |

---

## Authorization Check

```
GET /api/v1/users/authorize/ressource/{ressource_uuid}/action/{action}
```

| Path parameter | Values |
|----------------|--------|
| `ressource_uuid` | Resource UUID |
| `action` | `create`, `read`, `update`, `delete` |

### Response (200 OK)

```json
true
```

### Errors

| Status | Description |
|--------|-------------|
| `400` | Current user does not exist |
| `403` | Not authorized for this action |

---

## Create User (in Organization)

```
POST /api/v1/users/{org_id}
```

### Request body (`UserCreate`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `username` | string | Yes | Unique |
| `first_name` | string | No | Defaults to `""` |
| `last_name` | string | No | Defaults to `""` |
| `email` | string (email) | Yes | Unique |
| `password` | string | Yes | Complexity validated |
| `avatar_image` | string | No | |
| `banner_image` | string | No | |
| `bio` | string | No | |
| `details` | object | No | |
| `profile` | object | No | |
| `extra_metadata` | object | No | |

### Response (200 OK)

`UserRead`.

### Errors

| Status | Description |
|--------|-------------|
| `400` | Weak password, organization does not exist, or email/username already in use |
| `403` | Organization is invite-only (an invite code is required) |

---

## Create User with Invite

```
POST /api/v1/users/{org_id}/invite/{invite_code}
```

Same body as above. Only valid when the organization is invite-only.

### Errors

| Status | Description |
|--------|-------------|
| `400` | Weak password or email/username already in use |
| `403` | Organization does not require an invite code, or caller lacks permission to read the code |
| `404` | Invite code not found |
| `429` | More than 20 invite-code attempts per 15 minutes per IP + org |

---

## Create User (without Organization)

```
POST /api/v1/users/
```

Same body. Response: `UserRead`. The user is not attached to any organization.

### Errors

| Status | Description |
|--------|-------------|
| `400` | Weak password, or email/username already in use |

---

## Lookup Users

Requires authentication and returns `UserReadPublic`.

```
GET /api/v1/users/id/{user_id}
GET /api/v1/users/uuid/{user_uuid}
GET /api/v1/users/username/{username}
```

### Errors

| Status | Description |
|--------|-------------|
| `401` | Authentication required |
| `404` | Not found (detail: `"Resource not found"`) |

---

## Check Username Availability

```
GET /api/v1/users/check-username/{username}
```

Excludes the current user from the check.

### Response (200 OK)

```json
{ "available": true }
```

`{"available": false}` means another user already owns the username.

---

## Update User

```
PUT /api/v1/users/{user_id}
```

### Request body (`UserUpdate`)

| Field | Type | Required |
|-------|------|----------|
| `username` | string | Yes |
| `email` | string (email) | Yes |
| `first_name` / `last_name` | string | No |
| `avatar_image` / `banner_image` / `bio` | string | No |
| `details` / `profile` | object | No |
| `extra_metadata` | object | No |

Response: `UserRead`. The session cache is invalidated. Changing the email resets `email_verified` to `false`.

### Errors

| Status | Description |
|--------|-------------|
| `400` | `"Email or username is already in use"` or `"User does not exist"` |
| `403` | Caller lacks permission to update this user |

---

## Update Avatar

```
PUT /api/v1/users/update_avatar/{user_id}
```

Multipart form field: `avatar_file` (optional in the signature; if omitted the user is returned unchanged).

Response: `UserRead`. `user_id` must match the authenticated user. Session cache invalidated.

### Errors

| Status | Description |
|--------|-------------|
| `403` | `"You can only update your own avatar"` |
| `400` | Upload failed |

---

## Delete Avatar

```
DELETE /api/v1/users/delete_avatar/{user_id}
```

Sets `avatar_image` to `null`. Response: `UserRead`. Session cache invalidated.

### Errors

| Status | Description |
|--------|-------------|
| `403` | `"You can only delete your own avatar"` |

---

## Update Banner

```
PUT /api/v1/users/update_banner/{user_id}
```

Multipart form field: `banner_file` (optional; if omitted the user is returned unchanged).

Response: `UserRead`. Session cache invalidated.

### Errors

| Status | Description |
|--------|-------------|
| `403` | `"You can only update your own banner"` |
| `400` | `"Banner upload failed: ..."` |

---

## Delete Banner

```
DELETE /api/v1/users/delete_banner/{user_id}
```

Sets `banner_image` to `null`. Response: `UserRead`. Session cache invalidated.

### Errors

| Status | Description |
|--------|-------------|
| `403` | `"You can only delete your own banner"` |

---

## Change Password

```
PUT /api/v1/users/change_password/{user_id}
```

### Request body (`UserUpdatePassword`)

```json
{ "old_password": "currentPassword123", "new_password": "newSecurePassword123" }
```

Response: `UserRead`.

### Errors

| Status | Description |
|--------|-------------|
| `400` | Weak new password (`{"code": "WEAK_PASSWORD", ...}`) |
| `401` | `"Wrong password"` |
| `403` | `"You can only change your own password"` |

---

## Delete User

```
DELETE /api/v1/users/user_id/{user_id}
```

Returns `200 OK` and invalidates the cached session.

### Errors

| Status | Description |
|--------|-------------|
| `400` | `"User does not exist"` |
| `403` | Caller cannot delete this user |

---

## List User Courses

```
GET /api/v1/users/{user_id}/courses?page=1&limit=10&locale=en
```

### Query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (≥ 1) |
| `limit` | integer | 10 | 1–50; the 50 cap prevents bulk extraction |
| `locale` | string | null | Locale code for course translation overlay |

Response model: `List[CourseRead]`.

```json
[
  {
    "id": 12,
    "org_id": 1,
    "course_uuid": "course_abc123",
    "name": "Introduction to Algebra",
    "description": "A beginner-friendly course.",
    "public": true,
    "published": true,
    "authors": [],
    "creation_date": "2026-09-20 10:00:00.000000",
    "update_date": "2026-09-22 15:30:00.000000",
    "thumbnail_image": "",
    "banner_image": "",
    "content_locale": "en",
    "is_fallback": false
  }
]
```

### Errors

| Status | Description |
|--------|-------------|
| `403` | Unauthenticated caller (`"You should be logged in to perform this action"`) |

Users with no authored courses return an empty array, not a `404`.

---

## List User Podcasts

```
GET /api/v1/users/{user_id}/podcasts?page=1&limit=10
```

Query parameters: `page` (default 1, ≥ 1), `limit` (default 10, 1–50). No `locale` parameter on this route.

Response: `List[PodcastReadWithEpisodeCount]` — `PodcastRead` plus `episode_count` and `total_duration_seconds`, aggregated in one grouped query so the profile cards can render their meta row without a per-card request.

```json
[
  {
    "id": 4,
    "org_id": 1,
    "podcast_uuid": "podcast_abc123",
    "name": "The Learning Loop",
    "description": "Weekly conversations.",
    "public": true,
    "published": true,
    "authors": [],
    "creation_date": "2026-10-01 09:00:00.000000",
    "update_date": "2026-10-02 09:00:00.000000",
    "thumbnail_image": "",
    "banner_image": "",
    "source_locale": "en",
    "content_locale": "en",
    "is_fallback": false,
    "episode_count": 2,
    "total_duration_seconds": 4514
  }
]
```

### Errors

| Status | Description |
|--------|-------------|
| `403` | Unauthenticated caller (`"You should be logged in to perform this action"`) |

Users with no authored podcasts return an empty array, not a `404`.

---

## List User Communities

```
GET /api/v1/users/{user_id}/communities?page=1&limit=10&locale=en
```

Communities the user can access; each community follows the access rules of its linked course or podcast.

Query parameters: `page` (default 1), `limit` (default 10, 1–50), `locale` (optional content locale, falls back to the source locale).

Response: `List[CommunityRead]`.

```json
[
  {
    "id": 2,
    "org_id": 1,
    "community_uuid": "community_abc123",
    "name": "Algebra Study Group",
    "description": "Ask questions and share notes.",
    "public": true,
    "published": true,
    "thumbnail_image": "",
    "banner_image": "",
    "source_locale": "en",
    "content_locale": "en",
    "is_fallback": false,
    "moderation_words": [],
    "moderation_settings": null
  }
]
```

### Errors

| Status | Description |
|--------|-------------|
| `403` | Unauthenticated caller (`"You should be logged in to perform this action"`) |

A user with no accessible communities receives an empty array, not a `404`.

---

## Password Reset

Two flows exist: **organization-scoped** (an `org_id`-bound code) and **platform-level** (no org). Each has a send-code endpoint and a change-password endpoint. Every endpoint also has a deprecated legacy variant that takes the email as a path parameter; prefer the body form.

### Organization-scoped

```
POST /api/v1/users/reset_password/send_reset_code
POST /api/v1/users/reset_password/change_password
```

**Send reset code** body:

```json
{ "email": "john@example.com", "org_id": 1 }
```

**Change password** body:

```json
{
  "email": "john@example.com",
  "new_password": "newSecurePassword123",
  "org_id": 1,
  "reset_code": "123456"
}
```

`email` is optional in the model only so the legacy path variant can reuse it; the v2 handler rejects a missing email with `422` and `"email is required"`.

### Platform-level

```
POST /api/v1/users/reset_password/platform/send_reset_code
POST /api/v1/users/reset_password/platform/change_password
```

**Send reset code** body:

```json
{ "email": "john@example.com" }
```

**Change password** body:

```json
{ "email": "john@example.com", "new_password": "newSecurePassword123", "reset_code": "123456" }
```

### Responses

Both send-code endpoints return a bare JSON string:

```json
"If an account with that email exists, a reset code has been sent"
```

Both change-password endpoints return:

```json
"Password changed"
```

### Deprecated legacy variants

```
POST /api/v1/users/reset_password/change_password/{email}
POST /api/v1/users/reset_password/send_reset_code/{email}
POST /api/v1/users/reset_password/platform/send_reset_code/{email}
POST /api/v1/users/reset_password/platform/change_password/{email}
```

These are marked `deprecated=True` and place the email in the URL path.

### Errors (password reset)

| Status | Description |
|--------|-------------|
| `400` | Organization not found (send-code), weak password, or invalid/expired reset code |
| `422` | `email` missing from a v2 change-password body |
| `429` | More than 5 password-reset attempts per 5 minutes per email |

---

## Data Model Summary

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `user_uuid` | string | Public UUID identifier |
| `username` | string | Unique username |
| `first_name` / `last_name` | string | Name parts |
| `email` | string | Email address |
| `avatar_image` | string \| null | Avatar image |
| `banner_image` | string \| null | Profile banner image |
| `bio` | string | Short biography |
| `details` / `profile` | object | Free-form JSON |
| `extra_metadata` | object \| null | Free-form JSONB |
| `email_verified` | boolean | Email verification state |
| `last_login_at` | string \| null | Timestamp string |
| `signup_method` | string \| null | Signup provider |
| `is_superadmin` | boolean | Platform admin |
| `creation_date` | string | Timestamp string |

Not returned by these endpoints: `password`, `failed_login_attempts`, `locked_until`, `last_login_ip`, `password_changed_at`, `update_date`.

---

## Related Resources

| Document | Description |
|----------|-------------|
| [Authentication](./authentication.md) | Login, refresh, OAuth, API tokens |
| [Organizations](./orgs.md) | Org management, invites, org users |
| [Courses](./courses.md) | `CourseRead` shape |
| [Podcasts](./podcasts.md) | `PodcastRead` shape |
