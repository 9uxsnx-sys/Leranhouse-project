# API Reference

> Status: as-built · Last verified: 2026-11-15

The Koodook REST API is built with FastAPI (Python) and exposes all platform functionality under the `/api/v1/` base path using Bearer JWT authentication, mixed response shapes (bare arrays and envelopes), and consistent JSON error responses. The FastAPI code under `apps/api/src/routers` is the source of truth for paths and payloads.

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

Most endpoints require authentication via a JWT access token. The token is set as an httpOnly cookie (`LH_access`) and is also accepted via the `Authorization: Bearer <token>` header.

| Method | Header / Cookie | Format |
|--------|----------------|--------|
| Cookie | `LH_access` | httpOnly, Secure (HTTPS), SameSite=Lax; 8-hour expiry |
| Cookie | `LH_refresh` | httpOnly, Secure (HTTPS), SameSite=Lax; 30-day expiry |
| Header | `Authorization: Bearer <jwt>` | For headless/browserless access |

Login and refresh set both cookies. Refresh rotates the pair. Logout clears both.

### API Tokens (Headless / Admin Access)

For server-to-server or admin API access, use `lh_`-prefixed API tokens:

```
Authorization: Bearer lh_abc123def456...
```

API tokens are managed per-organization via the API Tokens management endpoints. They are scoped to a specific organization and have their own rate limits. Several routers deliberately reject API tokens (for example notifications, payments configuration and most admin-only routes).

### Anonymous visitors

Read endpoints that use the plain `get_current_user` dependency admit anonymous visitors as `AnonymousUser`. They can read published `public` catalog content; draft, `users_only` and `paid` content still applies its RBAC rules. Routers mounted with `require_authenticated_user` reject anonymous callers with `401`.

---

## Response Format

### Success Responses

Successful responses use standard HTTP status codes with a JSON body. **Response shapes are not uniform** — check the endpoint page.

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

**Resource list — bare array (200 OK):**

```json
[
  { "id": 1, "name": "Course A" },
  { "id": 2, "name": "Course B" }
]
```

**Envelope list (200 OK):**

```json
{
  "items": [
    { "id": 1, "name": "Course A" },
    { "id": 2, "name": "Course B" }
  ],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

### Response envelopes by endpoint family

| Endpoint family | Shape |
|---|---|
| Resource lists — courses, podcasts, collections, collection members (`/{uuid}/courses`), chapters, activities, orgs, roles, usergroups, boards, playgrounds, communities, discussions, certifications, webhooks | **Bare JSON array**; pagination via `page`/`limit` (path or query) |
| Dashboard members table — `GET /collections/{uuid}/members` | `{ "items": [...], "total": N }` |
| Access rosters — `GET /collections/{uuid}/access/users`, `GET /payments/{org_id}/entitlements`, `/entitlements/candidates`, `/orders` | `{ "items": [...], "total": N, "page": N, "limit": N }` — **no `pages` key** |
| Notifications — `GET /notifications`, `GET /notifications/announcements` | `{ "notifications" \| "announcements": [...], "total": N, "page": N, "pages": N }` |
| Payments overview — `GET /payments/{org_id}/overview` | `{ "range", "currency", "revenue", "series": [{ "label", "revenue" }] }` |
| Payout report — `GET /payments/{org_id}/payouts` | Object: `month`, `currency`, `gross_revenue`, `gateway_fees`, `manual_costs`, `total_costs`, `net_profit`, `teacher_share_percent`, `teacher_pool`, `platform_pool`, `attributed_revenue`, `unattributed_revenue`, `order_count`, `teachers[]` |
| Mutations | `200` (a few integration endpoints use `201`) with the created/updated resource or a result object |
| Deletes | Usually `200` with a JSON body such as `{ "detail": "… deleted" }`; the API does not use `204 No Content` |

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
| `200 OK` | Request succeeded (including most creates, updates and deletes) |
| `201 Created` | Used by a small number of integration endpoints |
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
| `limit` | integer | Varies (typically 10–50) | Number of items per page |

There is no global pagination envelope or global cap:

- Most resource lists return a **bare array** and apply `page`/`limit` in the path or query string.
- Query-based list endpoints that declare `le=100` (collection members, collection access rosters, payments entitlements/candidates/orders) return **422** for `limit > 100`; they do **not** silently cap it.
- Some path-based list routes (`/org/{org_id}/page/{page}/limit/{limit}`) do not enforce an upper bound.
- Envelope endpoints that do return `total` may or may not include `page`/`limit` — see [Response envelopes](#response-envelopes-by-endpoint-family).

---

## Common Headers

| Header | Description |
|--------|-------------|
| `Content-Type: application/json` | Request body format (JSON endpoints) |
| `Content-Type: multipart/form-data` | Request body format (file upload endpoints) |
| `Authorization: Bearer <token>` | JWT or API token authentication |
| `Cookie: LH_access=<jwt>` | JWT access token (set by auth endpoints) |
| `Cookie: LH_refresh=<jwt>` | JWT refresh token (set by auth endpoints) |
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
- `GET /api/v1/collections/org/{org_id}/page/{page}/limit/{limit}` — List collections by org ID

---

## Related Resources

| Document | Description |
|----------|-------------|
| [Authentication](./authentication.md) | Login, register, token refresh, OAuth/SSO |
| [Courses](./courses.md) | Course CRUD, listing, search, import/export |
| [Collections](./collections.md) | Course bundles: CRUD, membership, media, access rules, purchase fan-out, localization |
| [Podcasts](./podcasts.md) | Podcast and episode CRUD, media uploads, ordering, localization |
| [Chapters](./chapters.md) | Chapter/module CRUD, reordering, user group access |
| [Activities](./activities.md) | Activity/lesson CRUD, versioning, types |
| [Users](./users.md) | User management, profiles, password reset |
| [Organizations](./orgs.md) | Org management, branding, invites, feature config |
| [UserGroups](./usergroups.md) | User groups, membership and resource access |
| [Roles](./roles.md) | Roles and permissions |
| [Trail](./trail.md) | Learner progress, runs and enrollment |
| [Assignments](./assignments.md) | Assignment submissions and grading |
| [Certifications](./certifications.md) | Certification issuance and verification |
| [Analytics](./analytics.md) | Organization analytics endpoints |
| [Communities](./communities.md) | Communities and membership |
| [Discussions](./discussions.md) | Community discussions, comments and votes |
| [Boards](./boards.md) | Boards and collaborators |
| [Playgrounds](./playgrounds.md) | Playgrounds and generated content |
| [AI](./ai.md) | AI assistants, RAG and generation endpoints |
| [Code](./code.md) | Code execution and submissions |
| [Search](./search.md) | Cross-resource search |
| [Media](./media.md) | Blocks, stream and content file endpoints |
| [Payments](./payments.md) | Chargily checkout, webhooks, entitlements, orders, payouts |
| [Webhooks](./webhooks.md) | Webhook endpoint management, delivery logs |
| [Notifications](./notifications.md) | In-app feed, unread count, read state, event catalog, template overrides, announcements |
| [Admin API](./admin.md) | Headless admin endpoints (API tokens required) |
