# Admin API

> Status: as-built · Last verified: 2026-11-15

---

## Overview

The Admin API provides headless, organization-scoped operations for server-to-server integrations. Every route is mounted under:

```
/api/v1/admin/{org_slug}
```

### Authentication

```
Authorization: Bearer lh_abc123def456...
```

The token must be an API token (`APITokenUser`) whose `org_id` matches the `org_slug`. A normal user JWT or an anonymous request is rejected, and the organization must be on a **Pro plan** or higher. The only exception is the browser-facing `GET /auth/magic-consume` route, which is public.

### Common errors

| Status | Cause |
|--------|-------|
| `401` | Invalid/expired API token |
| `403` | Authenticated with a user session or anonymously (not an API token) |
| `403` | Token's org does not match `org_slug` |
| `403` | Organization plan is below Pro |
| `403` | Target user does not belong to the token's organization |
| `404` | Organization, user, course, or role not found |

### Response models used below

- `TrailRead`: `{id, trail_uuid, org_id, user_id, creation_date, update_date, runs: [TrailRunRead]}`
- `UserRead`: the standard user object from the Users API.

---

## Auth

### Issue a user JWT

```
POST /api/v1/admin/{org_slug}/auth/token
```

Body:

```json
{ "user_id": 1 }
```

Response (200):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_id": 1,
  "user_uuid": "user_a1b2c3d4-..."
}
```

The token is an access JWT only (1-hour lifetime); it is not returned as a cookie.

### Issue a magic sign-in link

```
POST /api/v1/admin/{org_slug}/auth/magic-link
```

Body (`MagicLinkRequest`):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `user_id` | integer | Yes | |
| `redirect_to` | string | No | Must be a same-origin path starting with `/` |
| `ttl_seconds` | integer | No | Default 300; clamped to 60–900 |

```json
{ "user_id": 1, "redirect_to": "/courses", "ttl_seconds": 300 }
```

Response (200):

```json
{
  "url": "https://academy.example.com/api/v1/admin/koodook-academy/auth/magic-consume?token=eyJhbGciOiJIUzI1NiIs...",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2026-11-15T09:05:00.000000"
}
```

Errors: `400` non-same-origin `redirect_to`; `403` user not in org; `404` user not found.

### Consume a magic sign-in link (browser)

```
GET /api/v1/admin/{org_slug}/auth/magic-consume?token=...
```

Public endpoint. On success it sets `LH_access` / `LH_refresh` cookies and returns `302` to `redirect_to` (or `/`). Invalid, expired, already-used, or no-longer-a-member tokens return an HTML error page with status `410`.

---

## Course Access and Enrollment

### Check course access

```
GET /api/v1/admin/{org_slug}/courses/{course_uuid}/access/{user_id}
```

```json
{
  "has_access": true,
  "is_enrolled": true,
  "is_public": false,
  "is_published": true
}
```

`has_access` is true when the course is public or the user has a trail run.

### Enroll a user

```
POST /api/v1/admin/{org_slug}/enrollments/{user_id}/{course_uuid}
```

Response: `TrailRead` with all runs for that user.

```json
{
  "id": 7,
  "trail_uuid": "trail_9f2c...",
  "org_id": 1,
  "user_id": 1,
  "creation_date": "2026-11-15 09:00:00.000000",
  "update_date": "2026-11-15 09:00:00.000000",
  "runs": [
    {
      "id": 11,
      "data": {},
      "status": "STATUS_IN_PROGRESS",
      "run_type": "RUN_TYPE_COURSE",
      "trail_id": 7,
      "course_id": 3,
      "course": { "id": 3, "course_uuid": "course_abc123", "name": "Introduction to Algebra", "...": "..." },
      "podcast_id": null,
      "org_id": 1,
      "user_id": 1,
      "creation_date": "2026-11-15 09:00:00.000000",
      "update_date": "2026-11-15 09:00:00.000000"
    }
  ]
}
```

Errors: `400` `"User is already enrolled in this course"`; `404` user/course not found; `403` user not in org.

### Unenroll a user

```
DELETE /api/v1/admin/{org_slug}/enrollments/{user_id}/{course_uuid}
```

Deletes the trail run and the user's trail steps for the course.

```json
{ "detail": "User unenrolled successfully" }
```

Errors: `404` enrollment or course not found.

### Get user enrollments

```
GET /api/v1/admin/{org_slug}/enrollments/{user_id}
```

Response: `TrailRead`. If the user has no trail, returns `{"id": null, "trail_uuid": null, "org_id": <org>, "user_id": <user>, "creation_date": null, "update_date": null, "runs": []}`.

### Bulk enroll

```
POST /api/v1/admin/{org_slug}/enrollments/bulk
```

Body:

```json
{ "course_uuid": "course_abc123", "user_ids": [1, 2, 3] }
```

`user_ids` is capped at 500.

```json
{
  "enrolled": [1, 2],
  "already_enrolled": [3],
  "skipped": [99]
}
```

`skipped` lists users who are not members of the organization. Errors: `404` course not found.

### Bulk unenroll

```
POST /api/v1/admin/{org_slug}/enrollments/bulk/unenroll
```

Body:

```json
{ "course_uuid": "course_abc123", "user_ids": [1, 2, 3] }
```

```json
{ "unenrolled": [1, 2], "not_enrolled": [3] }
```

Errors: `404` course not found.

### List users enrolled in a course

```
GET /api/v1/admin/{org_slug}/courses/{course_uuid}/enrollments?page=1&limit=25
```

`page` ≥ 1, `limit` 1–100 (default 25).

```json
[
  {
    "user": { "id": 1, "user_uuid": "user_...", "username": "johndoe", "email": "john@example.com", "...": "..." },
    "enrolled_at": "2026-11-01 10:00:00.000000",
    "status": "STATUS_IN_PROGRESS"
  }
]
```

---

## Progress

### Get progress in one course

```
GET /api/v1/admin/{org_slug}/progress/{user_id}/{course_uuid}
```

```json
{
  "course_uuid": "course_abc123",
  "user_id": 1,
  "total_activities": 4,
  "completed_activities": 3,
  "completion_percentage": 75.0,
  "completed_activity_ids": [10, 11, 12]
}
```

Errors: `404` course not found; `403` user not in org.

### Get progress across all enrollments

```
GET /api/v1/admin/{org_slug}/progress/{user_id}
```

```json
[
  {
    "course_uuid": "course_abc123",
    "course_name": "Introduction to Algebra",
    "status": "STATUS_IN_PROGRESS",
    "total_activities": 4,
    "completed_activities": 3,
    "completion_percentage": 75.0,
    "enrolled_at": "2026-11-01 10:00:00.000000"
  }
]
```

### Complete an activity

```
POST /api/v1/admin/{org_slug}/progress/{user_id}/activities/{activity_uuid}/complete
```

Creates the trail and enrollment if missing.

```json
{
  "activity_uuid": "activity_abc123",
  "user_id": 1,
  "completed": true,
  "is_new_completion": true,
  "course_completed": false
}
```

`course_completed` is true when this completion finished the whole course (a certificate may be issued if configured).

Errors: `404` activity not found (or outside the token's org).

### Undo an activity completion

```
DELETE /api/v1/admin/{org_slug}/progress/{user_id}/activities/{activity_uuid}/complete
```

```json
{ "activity_uuid": "activity_abc123", "user_id": 1, "completed": false }
```

Does not revoke certificates. Errors: `404` activity not found.

### Complete an entire course

```
POST /api/v1/admin/{org_slug}/progress/{user_id}/{course_uuid}/complete
```

```json
{
  "course_uuid": "course_abc123",
  "user_id": 1,
  "completed_count": 1,
  "already_completed_count": 3,
  "total_activities": 4,
  "course_completed": true,
  "certificate_awarded": true
}
```

Errors: `404` course not found.

### Reset progress in a course

```
POST /api/v1/admin/{org_slug}/progress/{user_id}/{course_uuid}/reset
```

Deletes trail steps but keeps the enrollment and sets its status back to `STATUS_IN_PROGRESS`.

```json
{ "course_uuid": "course_abc123", "user_id": 1, "steps_deleted": 3 }
```

---

## Trail Breakdown

### Get a user's full trail

```
GET /api/v1/admin/{org_slug}/trails/{user_id}
```

### Get a user's trail for one course

```
GET /api/v1/admin/{org_slug}/trails/{user_id}/courses/{course_uuid}
```

Both return `UserTrailDetail`:

```json
{
  "trail_uuid": "trail_9f2c...",
  "user_id": 1,
  "org_id": 1,
  "creation_date": "2026-11-01 10:00:00.000000",
  "update_date": "2026-11-15 08:00:00.000000",
  "courses": [
    {
      "course_uuid": "course_abc123",
      "course_id": 3,
      "course_name": "Introduction to Algebra",
      "status": "STATUS_IN_PROGRESS",
      "enrolled_at": "2026-11-01 10:00:00.000000",
      "total_activities": 4,
      "completed_activities": 1,
      "completion_percentage": 25.0,
      "chapters": [
        {
          "chapter_uuid": "chapter_abc123",
          "chapter_id": 2,
          "name": "Variables",
          "order": 1,
          "total_activities": 1,
          "completed_activities": 1,
          "activities": [
            {
              "activity_uuid": "activity_abc123",
              "activity_id": 10,
              "name": "What is a Variable?",
              "activity_type": "TYPE_DYNAMIC",
              "activity_sub_type": "SUBTYPE_DYNAMIC_PAGE",
              "order": 1,
              "published": true,
              "completed": true,
              "teacher_verified": false,
              "grade": "",
              "completed_at": "2026-11-15 08:00:00.000000"
            }
          ]
        }
      ]
    }
  ]
}
```

When the user has no enrollment row, `status` and `enrolled_at` are `null` but the chapter/activity breakdown is still returned.

Errors: `404` course/user not found; `403` user not in org.

---

## Certifications

### List a user's certificates

```
GET /api/v1/admin/{org_slug}/certifications/{user_id}
```

```json
[
  {
    "certificate_user": {
      "id": 4,
      "user_id": 1,
      "certification_id": 2,
      "user_certification_uuid": "usercert_abc123",
      "created_at": "2026-11-15 09:00:00.000000",
      "updated_at": "2026-11-15 09:00:00.000000"
    },
    "certification": {
      "id": 2,
      "certification_uuid": "certification_abc123",
      "course_id": 3,
      "config": {},
      "creation_date": "2026-10-01 09:00:00.000000",
      "update_date": "2026-10-01 09:00:00.000000"
    },
    "course": {
      "id": 3,
      "course_uuid": "course_abc123",
      "name": "Introduction to Algebra",
      "description": "A beginner-friendly course.",
      "thumbnail_image": ""
    }
  }
]
```

### Award a certificate

```
POST /api/v1/admin/{org_slug}/certifications/{user_id}/{course_uuid}/award
```

```json
{
  "user_certification_uuid": "usercert_abc123",
  "user_id": 1,
  "course_uuid": "course_abc123"
}
```

Errors: `400` user already has a certificate for this course; `404` course or certification not configured.

### Revoke a certificate

```
DELETE /api/v1/admin/{org_slug}/certifications/{user_id}/{user_certification_uuid}
```

```json
{
  "detail": "Certificate revoked",
  "user_certification_uuid": "usercert_abc123"
}
```

Errors: `404` certificate not found.

---

## Users

### Provision a user

```
POST /api/v1/admin/{org_slug}/users
```

Body (`ProvisionUserRequest`):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string (email) | Yes | Max 320 |
| `username` | string | Yes | 1–150; unique |
| `first_name` | string | No | Default `""` |
| `last_name` | string | No | Default `""` |
| `password` | string | No | If omitted, the user is treated as an SSO user with an empty password |
| `role_id` | integer | No | Default `4` (student); Admin/Maintainer roles are rejected |
| `extra_metadata` | object | No | Arbitrary JSON metadata |

Response `200 OK`: `UserRead`. New users are created with `email_verified=true` and `signup_method="admin_api"`. If the email already exists in another org, the existing account is attached to this org (request name/password fields are ignored).

Errors: `400` email already in this org, duplicate username, weak password, invalid role; `403` member limit reached, feature disabled, cross-org role, elevated role, or token creator lacks privilege; `429` more than 30 provisioning requests per minute per token.

### Remove a user from the org

```
DELETE /api/v1/admin/{org_slug}/users/{user_id}
```

Removes membership only; the user account is preserved.

```json
{ "detail": "User removed from org" }
```

Errors: `400` cannot remove the last admin; `404` user not in org.

### Look up a user by email

```
GET /api/v1/admin/{org_slug}/users/by-email/{email}
```

URL-encode the email. Response: `UserRead`. `404` when the user does not exist or is not a member of this org. Rate-limited to 60 lookups/minute per token.

### Update a user's profile

```
PATCH /api/v1/admin/{org_slug}/users/{user_id}
```

Body fields (all optional; only supplied fields change): `username`, `first_name`, `last_name`, `email`, `avatar_image`, `bio`, `details`, `profile`.

Response: `UserRead`. Errors: `400` duplicate email/username; `404` user not in org.

### Change a user's role

```
PATCH /api/v1/admin/{org_slug}/users/{user_id}/role
```

Body:

```json
{ "role_id": 3 }
```

```json
{ "user_id": 1, "role_id": 3 }
```

Errors: `400` cannot demote the last admin; `403` role belongs to another org; `404` user or role not found.

### List a user's groups

```
GET /api/v1/admin/{org_slug}/users/{user_id}/groups
```

```json
[
  {
    "usergroup": {
      "id": 3,
      "org_id": 1,
      "usergroup_uuid": "usergroup_abc123",
      "name": "Cohort A",
      "description": "Spring intake",
      "creation_date": "2026-10-01 09:00:00.000000",
      "update_date": "2026-10-01 09:00:00.000000",
      "members_count": 0,
      "linked_at": null
    },
    "added_at": "2026-10-02 09:00:00.000000"
  }
]
```

---

## User Groups

### Create

```
POST /api/v1/admin/{org_slug}/usergroups
```

Body:

```json
{ "name": "Cohort A", "description": "Spring intake" }
```

```json
{
  "id": 3,
  "org_id": 1,
  "usergroup_uuid": "usergroup_abc123",
  "name": "Cohort A",
  "description": "Spring intake",
  "creation_date": "2026-11-15 09:00:00.000000",
  "update_date": "2026-11-15 09:00:00.000000"
}
```

### Delete

```
DELETE /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}
```

```json
{ "detail": "UserGroup deleted", "usergroup_uuid": "usergroup_abc123" }
```

Errors: `404` group not found.

### List members

```
GET /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}/members?page=1&limit=25
```

```json
[
  {
    "user": { "id": 1, "user_uuid": "user_...", "username": "johndoe", "...": "..." },
    "added_at": "2026-10-02 09:00:00.000000"
  }
]
```

### Add / remove a member

```
POST   /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}/members/{user_id}
DELETE /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}/members/{user_id}
```

```json
{
  "detail": "User added to group",
  "usergroup_uuid": "usergroup_abc123",
  "user_id": 1
}
```

Remove returns `"detail": "User removed from group"`.

Errors: `400` already a member; `404` user, group, or membership not found.

### Grant / revoke course access

```
POST   /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}/courses/{course_uuid}
DELETE /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}/courses/{course_uuid}
```

```json
{
  "detail": "Course linked to group",
  "usergroup_uuid": "usergroup_abc123",
  "course_uuid": "course_abc123"
}
```

Remove returns `"detail": "Course unlinked from group"`.

Errors: `400` course already linked; `404` group/course or link not found.

---

## Analytics

```
GET /api/v1/admin/{org_slug}/courses/{course_uuid}/analytics
```

```json
{
  "course_uuid": "course_abc123",
  "enrollment_count": 150,
  "completed_count": 60,
  "in_progress_count": 85,
  "total_activities": 4,
  "average_completion_percentage": 62.5,
  "certificate_count": 60
}
```

Errors: `404` course not found.

---

## GDPR

### Export user data

```
GET /api/v1/admin/{org_slug}/users/{user_id}/export
```

Returns a **JSON bundle in the response body** (not a file download):

```json
{
  "profile": { "id": 1, "user_uuid": "user_...", "username": "johndoe", "email": "john@example.com", "...": "..." },
  "memberships": [ { "id": 1, "user_id": 1, "org_id": 1, "role_id": 4, "creation_date": "...", "update_date": "..." } ],
  "trails": [ { "id": 7, "trail_uuid": "trail_...", "org_id": 1, "user_id": 1, "creation_date": "...", "update_date": "..." } ],
  "trail_runs": [ { "id": 11, "data": {}, "status": "STATUS_IN_PROGRESS", "run_type": "RUN_TYPE_COURSE", "trail_id": 7, "course_id": 3, "podcast_id": null, "org_id": 1, "user_id": 1, "creation_date": "...", "update_date": "..." } ],
  "trail_steps": [ { "id": 21, "trailrun_id": 11, "activity_id": 10, "course_id": 3, "trail_id": 7, "org_id": 1, "complete": true, "teacher_verified": false, "grade": "", "user_id": 1, "creation_date": "...", "update_date": "..." } ],
  "certificates": [ { "id": 4, "user_id": 1, "certification_id": 2, "user_certification_uuid": "usercert_...", "created_at": "...", "updated_at": "..." } ],
  "user_groups": [ { "id": 3, "org_id": 1, "usergroup_uuid": "usergroup_...", "name": "Cohort A", "description": "...", "creation_date": "...", "update_date": "..." } ],
  "exported_at": "2026-11-15T09:10:00.000000"
}
```

All sub-collections are scoped to the caller's org. Errors: `404` user not in org.

### Anonymize a user

```
POST /api/v1/admin/{org_slug}/users/{user_id}/anonymize
```

```json
{
  "detail": "User anonymized",
  "user_id": 1,
  "anonymized_email": "deleted-user-1@anonymized.local",
  "api_tokens_revoked": 2
}
```

Scrubs email, name, avatar, bio, details, profile and password, sets `signup_method="anonymized"`, and deletes API tokens the user created in this org. Trails/certificates are preserved. Errors: `404` user not in org.

---

## Rate Limits

| Operation | Limit | Scope |
|-----------|-------|-------|
| User provisioning | 30 / minute | API token |
| User lookup by email | 60 / minute | API token |

Other Admin API routes have no Admin-specific rate limiter beyond the global API-token validation path.
