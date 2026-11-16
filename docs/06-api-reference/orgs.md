# Organizations

> Status: as-built · Last verified: 2026-11-15

---

## Overview

The Orgs router is mounted at `/api/v1/orgs`. It manages tenant configuration, branding, feature toggles, member/invite administration, packs, AI credits, and custom domains.

- Router-level guard: rejects API-token auth but admits anonymous callers (`get_non_api_token_user`); each handler then does RBAC.
- Signup is `open` or `inviteOnly`, stored as `config.admin_toggles.members.signup_mode` (v2) or `config.features.members.signup_mode` (v1).
- Most configuration and media routes require organization admin rights (`require_org_admin` / RBAC `update`), even where the decorator only declares `get_current_user`.
- Feature-toggle routes under `/config/{feature}` are mounted on an admin-only sub-router and take their flag as a **query parameter**, not a JSON body.

### Organization object (`OrganizationRead`)

`GET /orgs/uuid/{org_uuid}` and `GET /orgs/slug/{org_slug}` also inject a `resolved_features` map inside `config.config`.

```json
{
  "id": 1,
  "org_uuid": "org_a1b2c3d4-...",
  "name": "Koodook Academy",
  "description": "Online learning platform.",
  "about": "We teach math and science.",
  "socials": {},
  "links": {},
  "scripts": {},
  "logo_image": "org_a1b2c3d4/logo.png",
  "logo_icon": "org_a1b2c3d4/logo_icon.png",
  "thumbnail_image": "org_a1b2c3d4/thumbnail.png",
  "previews": {},
  "explore": false,
  "label": "Koodook",
  "slug": "koodook-academy",
  "email": "hello@example.com",
  "config": {
    "id": 1,
    "org_id": 1,
    "config": {
      "config_version": "2.0",
      "plan": "free",
      "admin_toggles": { "members": { "signup_mode": "open" } },
      "resolved_features": {}
    },
    "creation_date": "2026-09-23 10:00:00.000000",
    "update_date": "2026-09-23 10:00:00.000000"
  },
  "creation_date": "2026-09-23 10:00:00.000000",
  "update_date": "2026-09-23 10:00:00.000000"
}
```

---

## Core CRUD

### Create Organization

```
POST /api/v1/orgs/
```

#### Request body (`OrganizationCreate`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | |
| `slug` | string | Yes | Unique; `409` if taken |
| `email` | string | Yes | |
| `description` | string | No | |
| `about` | string | No | |
| `socials` / `links` / `scripts` | object | No | |
| `logo_image` / `logo_icon` / `thumbnail_image` | string | No | |
| `previews` | object | No | |
| `explore` | boolean | No | Default `false` |
| `label` | string | No | |

Response `200 OK` with `OrganizationRead`. The caller becomes an admin (`role_id=1`) of the new org and a default `free` v2 config is created.

#### Errors

| Status | Description |
|--------|-------------|
| `403` | Multi-org creation attempted without Enterprise Edition |
| `409` | Slug already taken, or caller is anonymous |

### Create Organization with Configuration

```
POST /api/v1/orgs/withconfig/
```

Body has two embedded keys (`org_object` and `config_object`) because FastAPI embeds multiple Pydantic body parameters:

```json
{
  "org_object": { "name": "Koodook Academy", "slug": "koodook-academy", "email": "hello@example.com" },
  "config_object": { "config_version": "1.4", "general": {}, "features": {}, "cloud": {}, "landing": {}, "seo": {} }
}
```

Response `OrganizationRead` (pre-alpha).

### Get Organization

```
GET /api/v1/orgs/uuid/{org_uuid}
GET /api/v1/orgs/slug/{org_slug}
```

Both return `OrganizationRead`. The by-slug lookup is Redis-cached and treated as public; the by-uuid lookup runs a `read` RBAC check. `404` when not found.

### Update Organization

```
PUT /api/v1/orgs/{org_id}
```

Body `OrganizationUpdate`: all `OrganizationRead` fields are optional (`name`, `slug`, `description`, `about`, `socials`, `links`, `scripts`, `logo_image`, `logo_icon`, `thumbnail_image`, `previews`, `label`, `email`, `explore`). Response `OrganizationRead`.

#### Errors

| Status | Description |
|--------|-------------|
| `403` | Caller is not an org admin |
| `404` | Organization not found |
| `409` | New slug already exists |

### Delete Organization

```
DELETE /api/v1/orgs/{org_id}
```

Responds `200 OK` (not `204`):

```json
{
  "detail": "Organization deleted",
  "org_id": 1,
  "org_name": "Koodook Academy"
}
```

Related rows are removed by database cascades.

#### Errors

| Status | Description |
|--------|-------------|
| `403` | Caller is not an admin of this organization |
| `404` | Organization not found |

### List User's Organizations

```
GET /api/v1/orgs/user/page/{page}/limit/{limit}
```

Returns a **bare array** of `OrganizationRead` (no pagination envelope).

### List User's Admin Organizations

```
GET /api/v1/orgs/user_admin/page/{page}/limit/{limit}
```

Bare array of `OrganizationRead` for organizations where the user's role is Admin (`role_id=1`).

### Organization Usage

```
GET /api/v1/orgs/{org_id}/usage
```

```json
{
  "org_id": 1,
  "plan": "free",
  "mode": "oss",
  "features": {
    "courses": { "usage": 12, "limit": 10, "remaining": 0, "limit_reached": true },
    "members": { "usage": 45, "limit": "unlimited", "plan_limit": "unlimited", "purchased": 0, "remaining": "unlimited", "limit_reached": false },
    "admin_seats": { "usage": 2, "limit": "unlimited", "remaining": "unlimited", "limit_reached": false }
  }
}
```

`limit`/`remaining` are `"unlimited"` when the resolved limit is 0. Cached in Redis for 2 minutes.

Errors: `403` unauthenticated; `404` organization config not found.

### Home Trending

```
GET /api/v1/orgs/{org_id}/home-trending?limit=8&locale=en
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 8 | Items per category |
| `locale` | string | null | Translation overlay locale |

Caller must be an org member (`403` otherwise).

```json
{
  "trending_courses": [
    {
      "course_uuid": "course_abc123",
      "name": "Introduction to Algebra",
      "description": "A beginner-friendly course.",
      "thumbnail_image": "",
      "extra_metadata": null,
      "enrollment_count": 42,
      "content_locale": "en",
      "is_fallback": false
    }
  ],
  "trending_podcasts": [
    {
      "podcast_uuid": "podcast_abc123",
      "name": "The Learning Loop",
      "description": "Weekly conversations.",
      "thumbnail_image": "",
      "extra_metadata": null,
      "episode_count": 12,
      "total_duration_seconds": 21600,
      "creation_date": "2026-10-01 09:00:00.000000",
      "listener_count": 17,
      "content_locale": "en",
      "is_fallback": false
    }
  ]
}
```

---

## Join Organization

```
POST /api/v1/orgs/join
```

### Request body (`JoinOrg`)

| Field | Type | Required |
|-------|------|----------|
| `org_id` | integer | Yes |
| `user_id` | string or integer | Yes |
| `invite_code` | string | No (required for invite-only orgs) |

### Response (200 OK)

```json
"Great, You're part of the Organization"
```

### Errors

| Status | Description |
|--------|-------------|
| `400` | User is already part of the organization |
| `403` | Email not verified, or invite-only org without a usable invite |
| `404` | Organization, user, or invite code not found |

---

## Signup Mechanism

```
PUT /api/v1/orgs/{org_id}/signup_mechanism?signup_mechanism=inviteOnly
```

`signup_mechanism` is a **required query parameter** with values `open` or `inviteOnly`.

Response:

```json
{ "detail": "Signup mechanism updated" }
```

Errors: `403` non-admin; `404` org or org config not found.

---

## Feature Configuration

All routes below require organization admin. Flags are **query parameters**.

| Method | Path | Query parameters |
|--------|------|------------------|
| `PUT` | `/api/v1/orgs/{org_id}/config/ai` | `ai_enabled` (optional bool), `copilot_enabled` (optional bool) |
| `PUT` | `/api/v1/orgs/{org_id}/config/communities` | `communities_enabled` (bool, required) |
| `PUT` | `/api/v1/orgs/{org_id}/config/payments` | `payments_enabled` (bool, required) |
| `PUT` | `/api/v1/orgs/{org_id}/config/courses` | `courses_enabled` (bool, required) |
| `PUT` | `/api/v1/orgs/{org_id}/config/collections` | `collections_enabled` (bool, required) |
| `PUT` | `/api/v1/orgs/{org_id}/config/podcasts` | `podcasts_enabled` (bool, required) |
| `PUT` | `/api/v1/orgs/{org_id}/config/boards` | `boards_enabled` (bool, required) |
| `PUT` | `/api/v1/orgs/{org_id}/config/playgrounds` | `playgrounds_enabled` (bool, required) |

Example:

```
PUT /api/v1/orgs/1/config/ai?ai_enabled=true&copilot_enabled=false
```

```json
{ "detail": "AI configuration updated" }
```

Other features return `{"detail": "<Feature> configuration updated"}`.

### Appearance and localization

| Method | Path | Query parameter | Response |
|--------|------|-----------------|----------|
| `PUT` | `/{org_id}/config/color` | `color` (default `""`), `brand_fg` (default `""` = auto), `brand_sidebar` (default `false`), `brand_hover` (default `""` = auto-darkened) | `{"detail": "Color configuration updated"}` |
| `PUT` | `/{org_id}/config/font` | `font` (default `""`) | `{"detail": "Font configuration updated"}` |
| `PUT` | `/{org_id}/config/footer_text` | `footer_text` (default `""`) | `{"detail": "Footer text configuration updated"}` |
| `PUT` | `/{org_id}/config/default_language` | `default_language` (required) | `{"detail": "Default language updated"}` (`400` unsupported language) |
| `PUT` | `/{org_id}/config/watermark` | `watermark_enabled` (default `true`) | `{"detail": "Watermark configuration updated"}` (`403` if a free-plan org tries to disable it) |

### Structured config bodies

```
PUT /api/v1/orgs/{org_id}/config/auth_branding
PUT /api/v1/orgs/{org_id}/config/seo
```

`auth_branding` body (`AuthBrandingConfig`): `welcome_message`, `background_type` (`gradient` \| `custom` \| `unsplash`), `background_image`, `text_color` (`light` \| `dark`), `unsplash_photographer_name`, `unsplash_photographer_url`, `unsplash_photo_url`.

`seo` body (`SeoOrgConfig`): `default_meta_title_suffix`, `default_meta_description`, `default_og_image`, `google_site_verification`, `twitter_handle`, `noindex_communities`.

Responses: `{"detail": "Auth branding configuration updated"}` and `{"detail": "SEO configuration updated"}`.

---

## Branding and Media

| Method | Path | Multipart field | Response |
|--------|------|-----------------|----------|
| `PUT` | `/{org_id}/logo` | `logo_file` | `{"detail": "Logo updated"}` |
| `PUT` | `/{org_id}/logo_icon` | `logo_icon_file` | `{"detail": "Logo icon updated"}` |
| `PUT` | `/{org_id}/favicon` | `favicon_file` | `{"detail": "Favicon updated"}` |
| `PUT` | `/{org_id}/thumbnail` | `thumbnail_file` | `{"detail": "Thumbnail updated"}` |
| `PUT` | `/{org_id}/preview` | `preview_file` | `{"name_in_disk": "org_.../preview.png"}` |
| `PUT` | `/{org_id}/auth_background` | `background_file` | `{"detail": "Auth background uploaded successfully", "filename": "..."}`. Also writes `background_type: "custom"` and the filename into `auth_branding`, so the upload is live without a second call |
| `PUT` | `/{org_id}/og_image` | `og_image_file` | `{"detail": "OG image uploaded successfully", "filename": "..."}` |
| `PUT` | `/{org_id}/landing` | JSON body (raw dict) | `{"detail": "Landing object updated"}` |
| `POST` | `/{org_id}/landing/content` | `content_file` | `{"detail": "Landing content uploaded successfully", "filename": "..."}` |

All require org admin rights; `404` when the organization does not exist.

---

## Organization Users

### List users

```
GET /api/v1/orgs/{org_id}/users?page=1&limit=20&search=&sort_order=desc&role_id=&status=&usergroup_id=&usergroup_filter=
```

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `page` | integer | 1 | ≥ 1 |
| `limit` | integer | 20 | 1–100 (capped) |
| `search` | string | `""` | Matches first/last name, username, email |
| `usergroup_id` | integer | null | Filter by group |
| `usergroup_filter` | `in_group` \| `not_in_group` | null | Requires `usergroup_id` |
| `sort_order` | `asc` \| `desc` | `desc` | Join order |
| `role_id` | integer | null | Filter by role |
| `status` | `verified` \| `unverified` | null | Email verification filter |

```json
{
  "items": [
    {
      "user": { "id": 10, "user_uuid": "user_...", "username": "jane", "email": "jane@example.com", "...": "..." },
      "role": { "id": 4, "name": "Student", "role_uuid": "role_student", "...": "..." },
      "usergroups": [],
      "joined_at": "2026-10-01 09:00:00.000000"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

When `usergroup_id` is supplied the response also includes `in_group_total` and `all_total`.

Requires authentication, org membership, and admin/maintainer (or superadmin) rights.

### Export users as CSV

```
GET /api/v1/orgs/{org_id}/users/export
```

Same filters as the list endpoint (no pagination). Returns a CSV file response. Requires admin/maintainer; `401` anonymous, `403` non-member.

### Update user role

```
PUT /api/v1/orgs/{org_id}/users/{user_id}/role/{role_uuid}
```

Response: `{"detail": "User role updated"}`.

### Remove one user

```
DELETE /api/v1/orgs/{org_id}/users/{user_id}
```

Response: `{"detail": "User removed from org"}`.

### Batch remove users

```
DELETE /api/v1/orgs/{org_id}/users/batch/remove?user_ids=1&user_ids=2
```

`user_ids` is a required repeated query parameter (`List[int]`).

Response: `{"detail": "2 user(s) removed from org"}`.

---

## Invites

### Create invite code

```
POST /api/v1/orgs/{org_id}/invites?usergroup_id=3
```

`usergroup_id` is optional. Response:

```json
{
  "invite_code": "Ab3dE9xZ",
  "invite_code_uuid": "org_invite_code_9f2c...",
  "invite_code_expires": 31536000,
  "invite_code_type": "signup",
  "created_at": "2026-11-15T09:00:00.000000",
  "created_by": "user_a1b2c3d4-...",
  "usergroup_id": 3
}
```

Codes expire after 365 days; at most 6 concurrent codes per org (`400` when exceeded).

### List / get / delete invite codes

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/{org_id}/invites` | Array of invite objects, with `usergroup_name` added when linked |
| `GET` | `/{org_id}/invites/code/{invite_code}` | One invite object |
| `DELETE` | `/{org_id}/invites/{org_invite_code_uuid}` | Array of deleted Redis key strings |

### Batch invite by email

```
POST /api/v1/orgs/{org_id}/invites/users/batch?emails=a@example.com,b@example.com&invite_code_uuid=org_invite_code_...
```

`emails` is a required comma-separated string; `invite_code_uuid` is optional.

```json
{
  "detail": "Users invited",
  "results": [
    { "email": "a@example.com", "status": "sent" },
    { "email": "b@example.com", "status": "already_invited" }
  ],
  "summary": { "total": 2, "sent": 1, "failed": 0, "already_invited": 1 }
}
```

### List / revoke invited users

```
GET    /api/v1/orgs/{org_id}/invites/users
DELETE /api/v1/orgs/{org_id}/invites/users/{email}
```

List returns an array of pending invite objects from Redis. Revoke returns `{"detail": "User removed"}` or `404` when the invite is absent.

---

## Packs

Org-facing endpoints (user session, org admin only):

### List active and available packs

```
GET /api/v1/orgs/{org_id}/packs
```

```json
{
  "active_packs": [
    {
      "id": 5,
      "org_id": 1,
      "pack_type": "ai_credits",
      "pack_id": "ai_500",
      "quantity": 500,
      "status": "active",
      "activated_at": "2026-11-01T10:00:00",
      "cancelled_at": null,
      "cancel_at_period_end": false,
      "platform_subscription_id": "sub_abc123"
    }
  ],
  "available_packs": [
    { "pack_id": "ai_500", "type": "ai_credits", "quantity": 500, "label": "500 AI Credits" }
  ]
}
```

Errors: `403` non-admin, `404` org not found.

### Pack summary

```
GET /api/v1/orgs/{org_id}/packs/summary
```

```json
{ "ai_credits": 500, "member_seats": 0, "active_pack_count": 1 }
```

### Internal pack endpoints

Prefix: `/api/v1/internal/packs`. Required header: `X-Platform-Key` matching `LEARNHOUSE_PLATFORM_API_KEY` (`403` invalid, `500` server key not configured).

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/{org_id}/activate` | `{"pack_id": "ai_500", "platform_subscription_id": "sub_abc123"}` | `OrgPackRead` |
| `PATCH` | `/{org_id}/mark-canceling` | `{"platform_subscription_id": "sub_abc123"}` | `OrgPackRead` |
| `DELETE` | `/{org_id}/deactivate` | `{"platform_subscription_id": "sub_abc123"}` | `OrgPackRead` |
| `DELETE` | `/{org_id}/deactivate-all` | — | `{"deactivated": 3}` |

---

## AI Credits

Prefix `/api/v1/orgs`, mounted with `require_authenticated_user`.

### Get AI credits summary

```
GET /api/v1/orgs/{org_id}/ai-credits
```

```json
{
  "plan": "free",
  "base_credits": 100,
  "purchased_credits": 500,
  "total_credits": 600,
  "used_credits": 120,
  "remaining_credits": 480,
  "mode": null
}
```

In non-SaaS mode `base_credits`, `total_credits` and `remaining_credits` are `"unlimited"` and `mode` carries the deployment mode.

Errors: `403` non-member, `404` org or config missing.

### Add purchased credits

```
POST /api/v1/orgs/{org_id}/ai-credits/add
```

Body: `{ "amount": 500 }`

```json
{
  "success": true,
  "new_purchased_total": 500,
  "message": "Successfully added 500 AI credits. New purchased total: 500"
}
```

Errors: `400` non-positive amount, `403` non-admin, `404` org not found.

### Reset credits usage

```
POST /api/v1/orgs/{org_id}/ai-credits/reset
```

```json
{ "success": true, "message": "AI credits usage has been reset to 0" }
```

Errors: `403` non-admin, `404` org not found.

---

## Custom Domains

Org-scoped routes require a user session and the `standard` plan. Reads require org membership; create/verify/delete require org admin.

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/{org_id}/domains` | `{"domain": "learn.example.com"}` | `CustomDomainRead` |
| `GET` | `/{org_id}/domains` | — | Array of `CustomDomainRead` |
| `GET` | `/{org_id}/domains/{domain_uuid}` | — | `CustomDomainRead` |
| `GET` | `/{org_id}/domains/{domain_uuid}/verification-info` | — | `CustomDomainVerificationInfo` |
| `POST` | `/{org_id}/domains/{domain_uuid}/verify` | — | `{"success": true, "message": "...", "status": "verified"}` |
| `GET` | `/{org_id}/domains/{domain_uuid}/ssl-status` | — | SSL status object |
| `DELETE` | `/{org_id}/domains/{domain_uuid}` | — | `{"message": "Custom domain deleted successfully"}` |

Create errors: `400` invalid or reserved domain, `409` domain already registered, `403` non-admin. Verify failures raise `400` with the DNS error message.

`CustomDomainRead`:

```json
{
  "id": 1,
  "domain_uuid": "domain_9f2c...",
  "domain": "learn.example.com",
  "org_id": 1,
  "status": "pending",
  "primary": false,
  "verification_token": "lh-verify-abc123",
  "creation_date": "2026-11-15 09:00:00.000000",
  "update_date": "2026-11-15 09:00:00.000000",
  "verified_at": null,
  "last_check_at": null,
  "check_error": null
}
```

`CustomDomainVerificationInfo`:

```json
{
  "domain": "learn.example.com",
  "status": "pending",
  "txt_record_host": "_learnhouse-learn-example-com",
  "txt_record_value": "lh-verify-abc123",
  "cname_record_host": "learn.example.com",
  "cname_record_value": "ingress.example.com",
  "instructions": "..."
}
```

Verify failures raise `400` with the DNS error message. `ssl-status` returns one of:

```json
{ "has_ssl": true, "status": "active", "message": "SSL certificate is active.", "expires": "...", "issuer": "..." }
{ "has_ssl": false, "status": "pending_verification", "message": "..." }
{ "has_ssl": false, "status": "provisioning", "message": "..." }
```

### Public domain resolution

```
GET /api/v1/orgs/resolve/domain/{domain}
```

No authentication. Returns `404` when the domain is unregistered or unverified.

```json
{ "org_id": 1, "org_slug": "koodook-academy", "org_uuid": "org_a1b2c3d4-..." }
```

### Internal verified-domain listing

```
GET /api/v1/internal/domains/verified
```

Header: `X-Internal-Key` matching `CLOUD_INTERNAL_KEY` (`403` otherwise).

```json
[ { "domain": "learn.example.com", "org_id": 1, "domain_uuid": "domain_9f2c..." } ]
```

---

## Data Model Summary

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `org_uuid` | string | Public UUID identifier |
| `name` | string | Organization name |
| `slug` | string | Unique URL slug |
| `email` | string | Contact email |
| `description` / `about` | string \| null | Descriptions |
| `socials` / `links` / `scripts` | object | Free-form JSON |
| `logo_image` / `logo_icon` / `thumbnail_image` | string \| null | Media file paths |
| `previews` | object | Preview metadata |
| `explore` | boolean | Listed in explore |
| `label` | string \| null | Display label |
| `config` | object | `OrganizationConfig` row, with the actual settings under `.config` |
| `creation_date` / `update_date` | string | Timestamp strings |
