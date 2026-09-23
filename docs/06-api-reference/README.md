# API Reference

> The Koodook REST API is built with FastAPI (Python) and exposes all platform functionality under the `/api/v1/` base path using Bearer JWT authentication, paginated list endpoints, and consistent JSON error responses.

---

## Base URL

```
https://<your-domain>/api/v1
```

All API endpoints are prefixed with `/api/v1`. For example, the courses list endpoint is at `GET /api/v1/courses/org_slug/{org_slug}/page/{page}/limit/{limit}`.

In development, the base URL is typically `http://localhost:8000/api/v1`.

---

## Authentication

### Bearer JWT (Standard API Access)

Most endpoints require authentication via a JWT access token. The token is set as an httpOnly cookie (`access_token_cookie`) and is also returned in the response body of login and refresh endpoints.

| Method | Header / Cookie | Format |
|--------|----------------|--------|
| Cookie | `access_token_cookie` | httpOnly, Secure, SameSite=Lax |
| Cookie | `refresh_token_cookie` | httpOnly, Secure, SameSite=Lax |
| Header | `Authorization: Bearer <token>` | For headless/admin API access only |

### API Tokens (Headless / Admin Access)

For server-to-server or admin API access, use `lh_`-prefixed API tokens:

```
Authorization: Bearer lh_abc123def456...
```

API tokens are managed per-organization via the API Tokens management endpoints. They are scoped to a specific organization and have their own rate limits.

---

## Response Format

### Success Responses

All successful responses follow standard HTTP status codes with a JSON body. List endpoints return paginated structures.

**Single resource (200 OK):**

```json
{
  "id": 1,
  "name": "Introduction to Algebra",
  "description": "A beginner-friendly course on algebraic concepts.",
  "public": true,
  "created_at": "2026-09-20T10:00:00Z",
  "updated_at": "2026-09-22T15:30:00Z"
}
```

**Paginated list (200 OK):**

```json
{
  "items": [
    { "id": 1, "name": "Course A" },
    { "id": 2, "name": "Course B" }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

The pagination response structure may vary slightly by endpoint (some use `page`/`limit`/`total`/`pages`, others use the FastAPI `page`/`limit` query parameters and return a list directly).

### Error Responses

Errors return a JSON body with a `detail` field:

```json
{
  "detail": "Course not found"
}
```

Validation errors (422 Unprocessable Entity) return a list of field-level errors:

```json
{
  "detail": [
    {
      "loc": ["body", "name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| `200 OK` | Request succeeded |
| `201 Created` | Resource created successfully |
| `204 No Content` | Request succeeded, no response body (used for deletes) |
| `400 Bad Request` | Invalid request (missing or malformed parameters) |
| `401 Unauthorized` | Authentication required or invalid credentials |
| `403 Forbidden` | Authenticated but insufficient permissions |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Resource conflict (e.g., duplicate) |
| `422 Unprocessable Entity` | Validation error (field-level errors in detail) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server error |

---

## Rate Limiting

Rate limits are applied to sensitive and high-traffic endpoints:

| Endpoint Category | Limit | Scope |
|-------------------|-------|-------|
| Authentication (login, refresh) | Per-IP, configurable | IP address |
| Token creation | Per-IP, configurable | IP address |
| User lookup endpoints | Per-token, configurable | API token |
| Invite code acceptance | Per-IP + Per-Org | IP + Organization |
| Webhook mutations (create, test) | Per-Org | Organization |

When rate limited, the API returns `429 Too Many Requests` with a `Retry-After` header indicating seconds until the limit resets.

**Account Lockout:** After repeated failed login attempts, the account is temporarily locked. The lockout period and threshold are configurable.

---

## Pagination

List endpoints use page/limit pagination:

| Query Parameter | Type | Default | Description |
|----------------|------|---------|-------------|
| `page` | integer | 1 | The page number (1-indexed) |
| `limit` | integer | Varies (typically 10–50) | Number of items per page (capped for security) |

The `limit` parameter is capped server-side to prevent abuse. Exceeding the cap silently uses the maximum allowed value.

---

## Common Headers

| Header | Description |
|--------|-------------|
| `Content-Type: application/json` | Request body format (JSON endpoints) |
| `Content-Type: multipart/form-data` | Request body format (file upload endpoints) |
| `Authorization: Bearer <token>` | JWT or API token authentication |
| `Cookie: access_token_cookie=<jwt>` | JWT access token (set by auth endpoints) |
| `Cookie: refresh_token_cookie=<jwt>` | JWT refresh token (set by auth endpoints) |
| `Retry-After` | Included in 429 responses (seconds until retry) |

---

## Cross-Origin Resource Sharing (CORS)

CORS is configured server-side. The API supports credentialed requests (cookies) with specific allowed origins. Custom CORS origins can be configured per organization for white-label deployments.

---

## Organization Scoping

Most resources are scoped to an organization. Endpoints accept either:

- **`org_id`** (integer) — The database ID of the organization
- **`org_slug`** (string) — The URL-friendly slug of the organization

For example:
- `GET /api/v1/courses/org_slug/{org_slug}/page/{page}/limit/{limit}` — List courses by org slug
- `POST /api/v1/courses/{org_id}` — Create course by org ID

---

## Related Resources

| Document | Description |
|----------|-------------|
| [Authentication](./authentication.md) | Login, register, token refresh, OAuth/SSO |
| [Courses](./courses.md) | Course CRUD, listing, search, import/export |
| [Chapters](./chapters.md) | Chapter/module CRUD, reordering, user group access |
| [Activities](./activities.md) | Activity/lesson CRUD, versioning, types |
| [Users](./users.md) | User management, profiles, password reset |
| [Organizations](./orgs.md) | Org management, branding, invites, feature config |
| [Payments](./payments.md) | Chargily checkout, webhooks, purchase history |
| [Webhooks](./webhooks.md) | Webhook endpoint management, delivery logs |
| [Admin API](./admin.md) | Headless admin endpoints (API tokens required) |
