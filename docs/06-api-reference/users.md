# Users

> User endpoints manage user profiles, sessions, account CRUD, password reset flows, authorization checks, and course enrollments — with Redis-cached sessions and enumeration protection on lookups.

---

## Overview

Users are the core identity entity in Koodook. Every user belongs to at least one organization and can have roles and permissions assigned per-org. The Users router at `/api/v1/users` handles profile management, while organization-specific user management (invites, role assignment, batch operations) is handled by the Orgs router.

---

## Get Current User Profile

Retrieve the authenticated user's own profile.

```
GET /api/v1/users/profile
```

### Response Body (200 OK)

```json
{
  "id": 1,
  "uuid": "a1b2c3d4-...",
  "username": "johndoe",
  "email": "john@example.com",
  "display_name": "John Doe",
  "avatar_url": "https://cdn.koodook.com/avatars/abc.jpg",
  "bio": "Lifelong learner and math enthusiast.",
  "is_active": true,
  "is_verified": true,
  "created_at": "2026-01-15T08:00:00Z",
  "updated_at": "2026-09-22T10:00:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |

---

## Get Session

Retrieve the full current session including user profile, organization memberships, and roles.

```
GET /api/v1/users/session
```

The session data is cached in Redis for 10 minutes per user for performance.

### Response Body (200 OK)

```json
{
  "user": {
    "id": 1,
    "uuid": "a1b2c3d4-...",
    "username": "johndoe",
    "email": "john@example.com",
    "display_name": "John Doe",
    "avatar_url": null,
    "is_active": true
  },
  "memberships": [
    {
      "organization": {
        "id": 1,
        "name": "Koodook Academy",
        "slug": "koodook-academy"
      },
      "role": {
        "uuid": "role-admin",
        "name": "Admin"
      },
      "permissions": ["courses:write", "users:read", "org:manage"]
    }
  ]
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |

---

## Authorization Check

Check if the current user has a specific permission on a resource.

```
GET /api/v1/users/authorize/ressource/{ressource_uuid}/action/{action}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ressource_uuid` | string | The resource UUID to check |
| `action` | string | The action to check (e.g., `edit`, `delete`, `view`) |

### Response Body (200 OK)

```json
{
  "authorized": true,
  "reason": null
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |

---

## Create User (in Organization)

Create a new user account within an organization.

```
POST /api/v1/users/{org_id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `org_id` | integer | The organization ID to create the user in |

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Unique username |
| `email` | string | Yes | Email address |
| `password` | string | Yes | Password |
| `display_name` | string | No | Display name |
| `bio` | string | No | Short biography |

### Example Request

```json
{
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "securePassword123",
  "display_name": "Jane Doe"
}
```

### Response Body (201 Created)

```json
{
  "id": 2,
  "uuid": "e5f6g7h8-...",
  "username": "janedoe",
  "email": "jane@example.com",
  "display_name": "Jane Doe",
  "is_active": true,
  "created_at": "2026-09-23T10:00:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Username or email already taken |
| `422 Unprocessable Entity` | Validation error |

---

## Create User with Invite

Create a user account using an organization invite code.

```
POST /api/v1/users/{org_id}/invite/{invite_code}
```

### Request Body (JSON)

Same fields as regular user creation.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Invalid or expired invite code |
| `429 Too Many Requests` | Rate limit exceeded (per IP + org) |

---

## Create User (without Organization)

Create a standalone user account (not yet associated with any organization).

```
POST /api/v1/users
```

### Request Body (JSON)

Same fields as organization-scoped creation.

---

## Lookup Users

Users can be looked up by ID, UUID, or username. All lookups require authentication to prevent enumeration attacks.

### Get by ID

```
GET /api/v1/users/id/{user_id}
```

### Get by UUID

```
GET /api/v1/users/uuid/{user_uuid}
```

### Get by Username

```
GET /api/v1/users/username/{username}
```

### Response Body (200 OK)

```json
{
  "id": 1,
  "uuid": "a1b2c3d4-...",
  "username": "johndoe",
  "display_name": "John Doe",
  "avatar_url": "https://cdn.koodook.com/avatars/abc.jpg",
  "bio": "Lifelong learner and math enthusiast.",
  "created_at": "2026-01-15T08:00:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `404 Not Found` | User not found |

---

## Update User

Update a user's profile fields.

```
PUT /api/v1/users/{user_id}
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `display_name` | string | No | Display name |
| `bio` | string | No | Short biography |

### Response Body (200 OK)

Returns the updated user object.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Can only update own profile |
| `404 Not Found` | User not found |

---

## Update Avatar

Update the current user's avatar image. This endpoint has IDOR protection — you can only update your own avatar.

```
PUT /api/v1/users/update_avatar/{user_id}
```

### Request Body (Multipart Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `avatar` | file | Yes | Avatar image file |

### Response Body (200 OK)

```json
{
  "avatar_url": "https://cdn.koodook.com/avatars/new-avatar.jpg"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Cannot update another user's avatar |

---

## Change Password

Change the current user's password.

```
PUT /api/v1/users/change_password/{user_id}
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `current_password` | string | Yes | Current password |
| `new_password` | string | Yes | New password |

### Response

`200 OK` on success.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Current password is incorrect |
| `401 Unauthorized` | Authentication required |

---

## Delete User

Delete a user account.

```
DELETE /api/v1/users/user_id/{user_id}
```

### Response

`204 No Content` on success.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |

---

## Get User Courses

Retrieve the courses a user is enrolled in or has access to.

```
GET /api/v1/users/{user_id}/courses
```

### Response Body (200 OK)

```json
[
  {
    "id": 1,
    "uuid": "abc123-def456",
    "name": "Introduction to Algebra",
    "progress": 75,
    "enrolled_at": "2026-09-01T10:00:00Z"
  }
]
```

---

## Password Reset

Koodook supports two password reset flows — organization-scoped and platform-level.

### Organization-Scoped Password Reset

#### Send Reset Code

```
POST /api/v1/users/reset_password/send_reset_code
```

#### Request Body (JSON)

```json
{
  "email": "john@example.com"
}
```

#### Response

`200 OK` on success. A reset code is sent to the user's email.

#### Change Password with Code

```
POST /api/v1/users/reset_password/change_password
```

#### Request Body (JSON)

```json
{
  "email": "john@example.com",
  "code": "123456",
  "new_password": "newSecurePassword123"
}
```

#### Response

`200 OK` on success.

### Platform-Level Password Reset

```
POST /api/v1/users/reset_password/platform/send_reset_code
POST /api/v1/users/reset_password/platform/change_password
```

These follow the same pattern as the org-scoped endpoints but operate at the platform level, regardless of organization membership.

### Errors (Password Reset)

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Invalid or expired reset code |
| `404 Not Found` | Email not found |

---

## Data Model Summary

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `uuid` | string | Public UUID identifier |
| `username` | string | Unique username |
| `email` | string | Email address |
| `display_name` | string | Display name |
| `avatar_url` | string | Avatar image URL |
| `bio` | text | Short biography |
| `is_active` | boolean | Whether the account is active |
| `is_verified` | boolean | Whether the email is verified |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
