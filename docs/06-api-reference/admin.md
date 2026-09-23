# Admin API

> The Admin API provides headless, server-to-server access to organization-scoped operations using `lh_`-prefixed API tokens — covering auth token issuance, enrollment management, progress tracking, user provisioning, certifications, user groups, analytics, and GDPR data operations.

---

## Overview

The Admin API is designed for server-to-server integration and automation. Unlike the standard API which uses JWT-based user authentication, the Admin API uses **API tokens** (`lh_`-prefixed) for authentication and operates at the organization level.

All Admin API endpoints are prefixed with `/api/v1/admin/{org_slug}` and require an API token in the `Authorization` header.

### Authentication

```
Authorization: Bearer lh_abc123def456...
```

API tokens are created and managed via the [API Tokens management endpoints](./authentication.md#api-tokens). Each token is scoped to a specific organization.

### Rate Limiting

Admin API endpoints have per-token rate limiting, particularly for provisioning and user lookup operations.

---

## Auth: Issue User JWT

Issue a JWT for a specific user, allowing them to act as that user in the frontend.

```
POST /api/v1/admin/{org_slug}/auth/token
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `org_slug` | string | The organization's URL slug |

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | integer | Yes | The user ID to issue a token for |

### Example Request

```json
{
  "user_id": 1
}
```

### Response Body (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expiry": 3600,
  "user": {
    "id": 1,
    "uuid": "a1b2c3d4-...",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Invalid or missing API token |
| `404 Not Found` | User or organization not found |

---

## Auth: Create Magic Link

Generate a one-time magic link for a user to log in without a password.

```
POST /api/v1/admin/{org_slug}/auth/magic-link
```

### Request Body (JSON)

```json
{
  "email": "john@example.com",
  "redirect_url": "/courses"
}
```

### Response Body (200 OK)

```json
{
  "magic_link": "https://koodook.com/auth/magic?token=ml_abc123..."
}
```

### Auth: Consume Magic Link

The browser-facing endpoint that validates and consumes a magic link token. This is typically accessed via redirect, not called programmatically.

```
GET /api/v1/admin/{org_slug}/auth/magic-consume?token=ml_abc123...
```

---

## Enrollments

### Enroll User in Course

```
POST /api/v1/admin/{org_slug}/enrollments/{user_id}/{course_uuid}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `org_slug` | string | Organization slug |
| `user_id` | integer | User ID |
| `course_uuid` | string | Course UUID |

### Response Body (200 OK)

```json
{
  "enrollment_id": "enr-001",
  "user_id": 1,
  "course_uuid": "abc123-def456",
  "enrolled_at": "2026-09-23T10:00:00Z",
  "status": "active"
}
```

### Unenroll User from Course

```
DELETE /api/v1/admin/{org_slug}/enrollments/{user_id}/{course_uuid}
```

### List User's Enrollments

```
GET /api/v1/admin/{org_slug}/enrollments/{user_id}
```

### Response Body (200 OK)

```json
[
  {
    "course_uuid": "abc123-def456",
    "course_name": "Introduction to Algebra",
    "enrolled_at": "2026-09-23T10:00:00Z",
    "status": "active",
    "progress_percentage": 45
  }
]
```

### Bulk Enroll

Enroll multiple users in multiple courses at once.

```
POST /api/v1/admin/{org_slug}/enrollments/bulk
```

### Request Body (JSON)

```json
{
  "user_ids": [1, 2, 3],
  "course_uuids": ["abc-123", "def-456"]
}
```

### Response Body (200 OK)

```json
{
  "enrolled": 5,
  "skipped": 1,
  "errors": []
}
```

### Bulk Unenroll

```
POST /api/v1/admin/{org_slug}/enrollments/bulk/unenroll
```

### List Course Enrollments

```
GET /api/v1/admin/{org_slug}/courses/{course_uuid}/enrollments
```

---

## Progress Tracking

### Get User's Course Progress

```
GET /api/v1/admin/{org_slug}/progress/{user_id}/{course_uuid}
```

### Response Body (200 OK)

```json
{
  "user_id": 1,
  "course_uuid": "abc123-def456",
  "progress_percentage": 75,
  "completed_activities": 3,
  "total_activities": 4,
  "last_activity_uuid": "act-004",
  "last_activity_at": "2026-09-22T15:30:00Z"
}
```

### Get User's Overall Progress

```
GET /api/v1/admin/{org_slug}/progress/{user_id}
```

### Mark Activity Complete

```
POST /api/v1/admin/{org_slug}/progress/{user_id}/activities/{activity_uuid}/complete
```

### Unmark Activity Complete

```
DELETE /api/v1/admin/{org_slug}/progress/{user_id}/activities/{activity_uuid}/complete
```

### Mark Course Complete

```
POST /api/v1/admin/{org_slug}/progress/{user_id}/{course_uuid}/complete
```

### Reset Course Progress

```
POST /api/v1/admin/{org_slug}/progress/{user_id}/{course_uuid}/reset
```

---

## Trail Breakdown

Retrieve a user's learning trail — the sequence of activities they've completed.

### Get User's Trail

```
GET /api/v1/admin/{org_slug}/trails/{user_id}
```

### Get User's Trail for Specific Course

```
GET /api/v1/admin/{org_slug}/trails/{user_id}/courses/{course_uuid}
```

### Response Body (200 OK)

```json
[
  {
    "activity_uuid": "act-001",
    "activity_title": "What is a Variable?",
    "chapter_uuid": "chap-001",
    "completed_at": "2026-09-20T10:30:00Z",
    "duration_seconds": 540
  }
]
```

---

## User Provisioning

### Create User

```
POST /api/v1/admin/{org_slug}/users
```

### Request Body (JSON)

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "temporaryPassword123",
  "display_name": "New User",
  "role_uuid": "role-student"
}
```

### Response Body (201 Created)

```json
{
  "id": 10,
  "uuid": "user-uuid-here",
  "username": "newuser",
  "email": "newuser@example.com",
  "display_name": "New User",
  "is_active": true
}
```

### Delete User

```
DELETE /api/v1/admin/{org_slug}/users/{user_id}
```

### Lookup User by Email

```
GET /api/v1/admin/{org_slug}/users/by-email/{email}
```

### Update User

```
PATCH /api/v1/admin/{org_slug}/users/{user_id}
```

### Update User Role

```
PATCH /api/v1/admin/{org_slug}/users/{user_id}/role
```

### Request Body (JSON)

```json
{
  "role_uuid": "role-instructor"
}
```

---

## Certifications

### List User's Certifications

```
GET /api/v1/admin/{org_slug}/certifications/{user_id}
```

### Award Certification

Award a course certification to a user upon completion.

```
POST /api/v1/admin/{org_slug}/certifications/{user_id}/{course_uuid}/award
```

### Response Body (201 Created)

```json
{
  "certification_uuid": "cert-001",
  "user_id": 1,
  "course_uuid": "abc123-def456",
  "awarded_at": "2026-09-23T10:00:00Z",
  "expires_at": null
}
```

### Revoke Certification

```
DELETE /api/v1/admin/{org_slug}/certifications/{user_id}/{user_certification_uuid}
```

---

## User Groups

### Create User Group

```
POST /api/v1/admin/{org_slug}/usergroups
```

### Delete User Group

```
DELETE /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}
```

### List Group Members

```
GET /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}/members
```

### List User's Groups

```
GET /api/v1/admin/{org_slug}/users/{user_id}/groups
```

### Add Member to Group

```
POST /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}/members/{user_id}
```

### Remove Member from Group

```
DELETE /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}/members/{user_id}
```

### Grant Course Access to Group

```
POST /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}/courses/{course_uuid}
```

### Revoke Course Access from Group

```
DELETE /api/v1/admin/{org_slug}/usergroups/{usergroup_uuid}/courses/{course_uuid}
```

---

## Course Access Check

Check whether a specific user has access to a course (via enrollment, purchase, or user group membership).

```
GET /api/v1/admin/{org_slug}/courses/{course_uuid}/access/{user_id}
```

### Response Body (200 OK)

```json
{
  "has_access": true,
  "access_method": "enrollment",
  "enrolled_at": "2026-09-01T10:00:00Z"
}
```

---

## Analytics

Retrieve analytics data for a course.

```
GET /api/v1/admin/{org_slug}/courses/{course_uuid}/analytics
```

### Response Body (200 OK)

```json
{
  "course_uuid": "abc123-def456",
  "total_enrollments": 150,
  "active_learners": 85,
  "completion_rate": 62.5,
  "average_score": 78.3,
  "total_time_spent_hours": 340,
  "activity_breakdown": [
    {
      "activity_uuid": "act-001",
      "title": "What is a Variable?",
      "completions": 120,
      "average_time_seconds": 540
    }
  ]
}
```

---

## GDPR Operations

### Export User Data

Export all data associated with a user (for data portability requests).

```
GET /api/v1/admin/{org_slug}/users/{user_id}/export
```

### Response

Returns a JSON file containing all user data: profile, enrollments, progress, certifications, trail, and payment history.

### Anonymize User

Anonymize a user's personal data (for right-to-erasure / GDPR deletion requests). The user's account is retained but all personally identifiable information is removed.

```
POST /api/v1/admin/{org_slug}/users/{user_id}/anonymize
```

### Response

`200 OK` on success. The user's profile is anonymized but their enrollment and progress records are preserved for analytics integrity.

---

## Rate Limiting

| Endpoint Category | Limit | Scope |
|-------------------|-------|-------|
| User provisioning | Per-token, configurable | API token |
| User lookup by email | Per-token, configurable | API token |
| Bulk enrollments | Per-token, configurable | API token |
| Analytics queries | Per-token, configurable | API token |

---

## Authentication Summary

| Feature | Standard API | Admin API |
|---------|-------------|-----------|
| Authentication | JWT (cookies + body) | API Token (`lh_`-prefixed Bearer) |
| User context | Current authenticated user | Impersonates or operates on any user |
| Scope | User's own resources | Organization-wide operations |
| Rate limiting | IP-based | Token-based |
| Use case | Frontend user interactions | Backend integrations, automation |
