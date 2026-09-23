# Organizations

> Organization endpoints manage tenant configuration — create and update organizations, configure branding and feature flags, manage invites and user memberships, and handle SSO and domain settings.

---

## Overview

Organizations (orgs) are the multi-tenant units in Koodook. Each organization has its own courses, users, branding, domain configuration, and feature flags. The Orgs router at `/api/v1/orgs` handles all organization-level operations.

Organizations support two signup mechanisms: `open` (anyone can join) and `inviteOnly` (invite code required).

---

## Create Organization

Create a new organization.

```
POST /api/v1/orgs
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Organization name |
| `slug` | string | Yes | URL-friendly slug (unique) |
| `description` | string | No | Organization description |

### Example Request

```json
{
  "name": "Koodook Academy",
  "slug": "koodook-academy",
  "description": "Online learning platform for mathematics and science."
}
```

### Response Body (201 Created)

```json
{
  "id": 1,
  "uuid": "org-001",
  "name": "Koodook Academy",
  "slug": "koodook-academy",
  "description": "Online learning platform for mathematics and science.",
  "signup_mechanism": "open",
  "created_at": "2026-09-23T10:00:00Z",
  "updated_at": "2026-09-23T10:00:00Z"
}
```

---

## Create Organization with Configuration

Create an organization with initial configuration in a single request.

```
POST /api/v1/orgs/withconfig/
```

### Request Body (JSON)

```json
{
  "name": "Koodook Academy",
  "slug": "koodook-academy",
  "config": {
    "default_language": "en",
    "primary_color": "#4F46E5",
    "font_family": "Inter"
  }
}
```

---

## Get Organization (by UUID)

```
GET /api/v1/orgs/uuid/{org_uuid}
```

## Get Organization (by Slug)

```
GET /api/v1/orgs/slug/{org_slug}
```

### Response Body (200 OK)

```json
{
  "id": 1,
  "uuid": "org-001",
  "name": "Koodook Academy",
  "slug": "koodook-academy",
  "description": "Online learning platform for mathematics and science.",
  "signup_mechanism": "open",
  "logo_url": "https://cdn.koodook.com/logos/org-001.png",
  "favicon_url": "https://cdn.koodook.com/favicons/org-001.ico",
  "primary_color": "#4F46E5",
  "font_family": "Inter",
  "created_at": "2026-09-23T10:00:00Z",
  "updated_at": "2026-09-23T10:00:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | Organization not found |

---

## Update Organization

Update an organization's general settings.

```
PUT /api/v1/orgs/{org_id}
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Organization name |
| `description` | string | No | Organization description |

### Response Body (200 OK)

Returns the updated organization object.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Organization not found |

---

## Delete Organization

Delete an organization and all associated data.

```
DELETE /api/v1/orgs/{org_id}
```

### Response

`204 No Content` on success.

---

## List User's Organizations

List all organizations the current user belongs to.

```
GET /api/v1/orgs/user/page/{page}/limit/{limit}
```

### Response Body (200 OK)

```json
{
  "items": [
    {
      "id": 1,
      "uuid": "org-001",
      "name": "Koodook Academy",
      "slug": "koodook-academy",
      "role": "admin"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

## List User's Admin Organizations

List all organizations where the current user has admin privileges.

```
GET /api/v1/orgs/user_admin/page/{page}/limit/{limit}
```

---

## Organization Usage

Get current usage statistics and plan limits for an organization.

```
GET /api/v1/orgs/{org_id}/usage
```

### Response Body (200 OK)

```json
{
  "current_users": 45,
  "user_limit": 100,
  "current_courses": 12,
  "course_limit": 50,
  "storage_used_mb": 1024,
  "storage_limit_mb": 5000,
  "remaining_users": 55,
  "remaining_courses": 38,
  "remaining_storage_mb": 3976
}
```

---

## Signup Mechanism

Update whether the organization allows open registration or requires invites.

```
PUT /api/v1/orgs/{org_id}/signup_mechanism
```

### Request Body (JSON)

```json
{
  "mechanism": "inviteOnly"
}
```

### Response

`200 OK` on success.

---

## Branding Endpoints

### Logo

```
PUT /api/v1/orgs/{org_id}/logo
```

Multipart form data with `logo` file.

### Favicon

```
PUT /api/v1/orgs/{org_id}/favicon
```

Multipart form data with `favicon` file.

### Thumbnail

```
PUT /api/v1/orgs/{org_id}/thumbnail
```

### Preview Image

```
PUT /api/v1/orgs/{org_id}/preview
```

### Landing Page Content

Upload landing page media.

```
PUT /api/v1/orgs/{org_id}/landing
POST /api/v1/orgs/{org_id}/landing/content
```

### OG Image (Social Sharing)

```
PUT /api/v1/orgs/{org_id}/og_image
```

### Auth Background

```
PUT /api/v1/orgs/{org_id}/auth_background
```

---

## Configuration Endpoints

### Color

```
PUT /api/v1/orgs/{org_id}/config/color
```

### Font

```
PUT /api/v1/orgs/{org_id}/config/font
```

### Footer Text

```
PUT /api/v1/orgs/{org_id}/config/footer_text
```

### Default Language

```
PUT /api/v1/orgs/{org_id}/config/default_language
```

### Watermark

```
PUT /api/v1/orgs/{org_id}/config/watermark
```

### Auth Branding

```
PUT /api/v1/orgs/{org_id}/config/auth_branding
```

### SEO

```
PUT /api/v1/orgs/{org_id}/config/seo
```

---

## Feature Configuration

Enable or disable features for an organization. All feature config endpoints require admin privileges.

### Payments Feature

```
PUT /api/v1/orgs/{org_id}/config/payments
```

### Request Body

```json
{
  "payments_enabled": true
}
```

### Other Feature Configs

| Endpoint | Description |
|----------|-------------|
| `PUT /{org_id}/config/ai` | AI feature toggle |
| `PUT /{org_id}/config/communities` | Communities feature toggle |
| `PUT /{org_id}/config/payments` | Payments feature toggle |
| `PUT /{org_id}/config/courses` | Courses feature toggle |
| `PUT /{org_id}/config/collections` | Collections feature toggle |
| `PUT /{org_id}/config/podcasts` | Podcasts feature toggle |
| `PUT /{org_id}/config/boards` | Boards feature toggle |
| `PUT /{org_id}/config/playgrounds` | Playgrounds feature toggle |

All feature config endpoints accept a JSON body with a boolean flag and return `200 OK` on success.

---

## User Management

### List Organization Users

```
GET /api/v1/orgs/{org_id}/users
```

### Export Users (CSV)

```
GET /api/v1/orgs/{org_id}/users/export
```

Returns a CSV file with user data.

### Join Organization

Join an open organization.

```
POST /api/v1/orgs/join
```

### Update User Role

```
PUT /api/v1/orgs/{org_id}/users/{user_id}/role/{role_uuid}
```

### Remove User from Organization

```
DELETE /api/v1/orgs/{org_id}/users/{user_id}
```

### Batch Remove Users

```
DELETE /api/v1/orgs/{org_id}/users/batch/remove
```

---

## Invites

### Create Invite Codes

```
POST /api/v1/orgs/{org_id}/invites
```

### List Invite Codes

```
GET /api/v1/orgs/{org_id}/invites
```

### Get Invite by Code

```
GET /api/v1/orgs/{org_id}/invites/code/{invite_code}
```

### Delete Invite Code

```
DELETE /api/v1/orgs/{org_id}/invites/{org_invite_code_uuid}
```

### Batch Invite Users

Send invitations to specific email addresses.

```
POST /api/v1/orgs/{org_id}/invites/users/batch
```

### Request Body (JSON)

```json
{
  "emails": ["user1@example.com", "user2@example.com"],
  "role_uuid": "role-student"
}
```

### List Invited Users

```
GET /api/v1/orgs/{org_id}/invites/users
```

### Remove Invited User

```
DELETE /api/v1/orgs/{org_id}/invites/users/{email}
```

---

## SSO Configuration

SSO (Single Sign-On) is configured through the organization settings endpoints. SAML-based SSO configuration is managed via the org config endpoints.

---

## Domain Configuration

Custom domains for white-label deployments are configured through the organization settings. Domain ownership is verified before activation.

---

## Data Model Summary

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `uuid` | string | Public UUID identifier |
| `name` | string | Organization name |
| `slug` | string | URL-friendly unique slug |
| `description` | text | Organization description |
| `signup_mechanism` | enum | `open` or `inviteOnly` |
| `logo_url` | string | Logo image URL |
| `favicon_url` | string | Favicon URL |
| `primary_color` | string | Brand primary color (hex) |
| `font_family` | string | Brand font |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
