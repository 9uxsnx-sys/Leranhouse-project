# Authentication

> Status: as-built · Last verified: 2026-11-15

---

## Overview

The Auth router is mounted at `/api/v1/auth`. It issues JWT access and refresh tokens, sets them as httpOnly cookies, and supports username/password login, Google OAuth, email verification, and logout.

| Item | Value |
|------|-------|
| Access cookie | `LH_access` (8-hour JWT) |
| Refresh cookie | `LH_refresh` (30-day JWT) |
| Cookie flags | `httpOnly`, `SameSite=Lax`, `Secure` when the request is HTTPS (or any non-dev request) |
| Access token header | `Authorization: Bearer <jwt>` also accepted |
| API tokens | `Authorization: Bearer lh_...` — only accepted on routers that allow API-token auth |
| Token subject | `sub` = user email |
| `expiry` field | Epoch **milliseconds** of access-token expiry, or `null` in dev mode |

JWT revocation is enforced through a Redis blocklist keyed `jwt_revoked_before:{user_id}`, plus a `password_changed_at` cutover check in `get_current_user`.

---

## Login

```
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded
```

### Form fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Email address (used as the JWT subject) |
| `password` | string | Yes | Password |

### Example request

```
username=john@example.com&password=securepassword123
```

### Response (200 OK)

```json
{
  "user": {
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
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expiry": 1794756000000
  }
}
```

**Cookies set:** `LH_access`, `LH_refresh`.

### Errors

| Status | Body `detail` |
|--------|---------------|
| `401` | `{"code": "INVALID_CREDENTIALS", "message": "Incorrect Email or password"}` |
| `403` | `{"code": "EMAIL_NOT_VERIFIED", "message": "...", "email": "john@example.com"}` — SaaS deployment only |
| `423` | `{"code": "ACCOUNT_LOCKED", "message": "...", "retry_after": 300}` |
| `429` | `{"code": "RATE_LIMITED", "message": "...", "retry_after": <seconds>}` |

Login is rate-limited to **30 attempts per 5 minutes per IP**.

---

## Refresh

```
GET /api/v1/auth/refresh
```

Reads `LH_refresh` from cookies. No body.

### Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expiry": 1794756000000
}
```

Both cookies are replaced with freshly minted tokens.

> **Rotation caveat:** the endpoint mints a new refresh token and overwrites the cookie, but it does **not** call `_mark_refresh_jti_used()`. The previous refresh token is therefore not marked consumed and there is no replay detection on this route; only `exp` and the logout/password-change revocation checks bound its life.

### Errors

| Status | Description |
|--------|-------------|
| `401` | Refresh token missing, invalid, expired, revoked, or minted before `password_changed_at` (detail: `"Invalid credentials"`) |
| `429` | More than 60 refresh attempts per minute from this IP |

---

## Logout

```
DELETE /api/v1/auth/logout
```

Clears `LH_access` / `LH_refresh` and writes a Redis revocation cutoff for the user, invalidating every JWT issued before the call (access and refresh).

### Response (200 OK)

```json
{ "msg": "Successfully logout" }
```

### Errors

| Status | Description |
|--------|-------------|
| `401` | No access token/cookie present (detail: `"Not authenticated"`) |

---

## Register

Registration is not on the Auth router. It lives under Users:

- `POST /api/v1/users/{org_id}` — open signup; returns `403` if the org is invite-only.
- `POST /api/v1/users/{org_id}/invite/{invite_code}` — invite-only signup.
- `POST /api/v1/users/` — account with no organization.

See [Users](./users.md).

---

## OAuth (Google)

```
POST /api/v1/auth/oauth
```

### Query parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `org_id` | integer | No | Attach the account to this organization |

`org_id` is rejected with `400` if the organization does not exist. If it exists but no pending Redis invite (`invited_user:{email}:org:{org_uuid}`) is found for the email, the value is ignored and the user is created without an organization.

### Request body

```json
{
  "email": "john@example.com",
  "provider": "google",
  "access_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

`provider` is a literal and currently accepts only `"google"`.

### Response (200 OK)

Same shape as login: `{"user": <UserRead>, "tokens": {"access_token", "refresh_token", "expiry"}}`.

**Cookies set:** `LH_access`, `LH_refresh`.

### Errors

| Status | Description |
|--------|-------------|
| `400` | Invalid `org_id` |
| `401` | Third-party authentication failed (detail: `"Incorrect Email or password"`) |

---

## Verify Email

```
POST /api/v1/auth/verify-email
```

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Verification token |
| `user_uuid` | string | Yes | UUID of the user |
| `org_uuid` | string | Yes | UUID of the organization |
| `email` | string (email) | No | When supplied, used as the rate-limit key instead of `user_uuid` |

### Example request

```json
{
  "token": "verify_abc123def456",
  "user_uuid": "user_a1b2c3d4-...",
  "org_uuid": "org_e5f6g7h8-..."
}
```

### Response (200 OK)

```json
{ "message": "Email verified successfully" }
```

If the address was already verified the message is `"Email already verified"`.

### Errors

| Status | Description |
|--------|-------------|
| `400` | `"Invalid or expired verification token"`, `"Verification token has expired"`, `"Invalid verification token"`, or `"User not found"` |
| `429` | More than 5 attempts per 5 minutes for the same email/`user_uuid` |

---

## Resend Verification Email

```
POST /api/v1/auth/resend-verification
```

### Request body

```json
{ "email": "john@example.com", "org_id": 1 }
```

`org_id` is optional. The response is generic whether or not the account exists.

### Response (200 OK)

```json
{ "message": "If an account with this email exists, a verification email has been sent" }
```

### Errors

| Status | Description |
|--------|-------------|
| `429` | Resend rate limit exceeded (5 per 5 minutes per email) |

---

## API Tokens

API tokens (`lh_` prefix) are organization-scoped and mounted under `/api/v1/orgs/{org_id}/api-tokens`. The router requires a real user session (API-token auth is rejected) and a **Pro plan** (`API Access` feature).

### Create API Token

```
POST /api/v1/orgs/{org_id}/api-tokens
```

#### Request body (`APITokenCreate`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Token label (max 100) |
| `description` | string | No | Max 500 |
| `rights` | object | No | Rights document; mirrors role rights |
| `expires_at` | string | No | ISO-8601 expiry; `null` = never expires |

```json
{
  "name": "My Integration Token",
  "description": "Nightly course sync",
  "rights": {
    "courses": { "action_read": true },
    "users": { "action_read": true }
  },
  "expires_at": "2027-01-01T00:00:00Z"
}
```

#### Response (200 OK)

```json
{
  "token": "lh_abc12345def67890...",
  "token_uuid": "apitoken_7d1c...",
  "name": "My Integration Token",
  "description": "Nightly course sync",
  "token_prefix": "lh_abc12345",
  "org_id": 1,
  "rights": { "courses": { "action_read": true } },
  "created_by_user_id": 1,
  "creation_date": "2026-11-15 09:00:00.000000",
  "expires_at": "2027-01-01T00:00:00Z"
}
```

`token` is the only time the full secret is returned.

### List / Get / Update / Delete / Regenerate

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/{org_id}/api-tokens` | Array of `APITokenRead` |
| `GET` | `/{org_id}/api-tokens/{token_uuid}` | `APITokenRead` |
| `PUT` | `/{org_id}/api-tokens/{token_uuid}` | `APITokenRead` |
| `POST` | `/{org_id}/api-tokens/{token_uuid}/regenerate` | `APITokenCreatedResponse` (new `token`) |
| `DELETE` | `/{org_id}/api-tokens/{token_uuid}` | `{"message": "API token revoked successfully"}` |

`APITokenRead`:

```json
{
  "id": 3,
  "token_uuid": "apitoken_7d1c...",
  "name": "My Integration Token",
  "description": "Nightly course sync",
  "token_prefix": "lh_abc12345",
  "org_id": 1,
  "rights": { "courses": { "action_read": true } },
  "created_by_user_id": 1,
  "creation_date": "2026-11-15 09:00:00.000000",
  "update_date": "2026-11-15 09:00:00.000000",
  "last_used_at": null,
  "expires_at": "2027-01-01T00:00:00Z",
  "is_active": true
}
```

Update body (`APITokenUpdate`) accepts optional `name`, `description`, `rights`, `expires_at`.

### Errors

| Status | Description |
|--------|-------------|
| `401` | Authentication required |
| `403` | Caller lacks the required org permission, is not on a Pro plan, or is authenticated with an API token |
| `429` | More than 10 create/regenerate requests per hour from this IP |

---

## Token Security Model

### Revocation

- Logout writes `jwt_revoked_before:{user_id}` to Redis with a TTL equal to the refresh-token lifetime (30 days).
- `get_current_user` rejects any token whose `iat` is older than that cutoff.
- Tokens minted before the user's `password_changed_at` are rejected.

### Account lockout

| Parameter | Value |
|-----------|-------|
| Failed attempts before lockout | 10 |
| Lockout duration | 5 minutes |
| Multi-IP requirement | Lock only when failures come from at least 2 distinct IPs within 30 minutes |
| Reset | On successful login |

A single-IP attacker is handled by the per-IP login rate limit (30 / 5 min) instead of locking the account.

### Rate limits

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `POST /auth/login` | 30 / 5 min | IP |
| `GET /auth/refresh` | 60 / min | IP |
| `POST /auth/verify-email` | 5 / 5 min | Email or `user_uuid` |
| `POST /auth/resend-verification` | 5 / 5 min | Email |
| `POST /orgs/{org_id}/api-tokens` | 10 / hour | IP |
| `POST /orgs/{org_id}/api-tokens/{uuid}/regenerate` | 10 / hour | IP |

---

## Recommended Client Flow

```
1. POST /auth/login          → cookies + { user, tokens }
2. Authenticated requests    → cookie or Authorization: Bearer <access_token>
3. GET /auth/refresh         → new cookies + new tokens
4. DELETE /auth/logout       → cookies cleared, all JWTs revoked
```

Use API tokens only for server-to-server calls on routers that explicitly support them (Admin API, Orgs, Courses, etc.); the Users router rejects API-token authentication.
