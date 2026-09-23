# Authentication

> The Koodook authentication system uses dual JWT tokens (access + refresh) set as httpOnly cookies and returned in response bodies, with support for OAuth/SSO, email verification, IP-based rate limiting, and account lockout after repeated failed attempts.

---

## Overview

Authentication is handled by the Auth router at `/api/v1/auth`. The system uses:

- **Access Token** — Short-lived JWT (typically 15–60 minutes) for API access
- **Refresh Token** — Longer-lived JWT (typically 7–30 days) for obtaining new access tokens
- **httpOnly Cookies** — Both tokens are set as secure, httpOnly cookies with configurable domain scoping for multi-tenancy
- **Response Body** — Tokens are also returned in the response body for clients that need them (e.g., mobile apps, headless clients)
- **Token Revocation** — Revoked tokens are tracked via Redis for immediate invalidation
- **Email Verification** — Required in SaaS mode before full access is granted

---

## Login

Authenticate with username/email and password to receive JWT tokens.

```
POST /api/v1/auth/login
```

### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Username or email address |
| `password` | string | Yes | User password |

### Example Request

```
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=johndoe&password=securepassword123
```

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
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expiry": 3600
  }
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Invalid username or password |
| `401 Unauthorized` | Account locked due to too many failed attempts |
| `401 Unauthorized` | Email not verified (SaaS mode only) |
| `429 Too Many Requests` | Too many login attempts from this IP |

**Cookies set:** `access_token_cookie`, `refresh_token_cookie`

---

## Token Refresh

Obtain a new access token using the refresh token cookie.

```
GET /api/v1/auth/refresh
```

This endpoint reads the `refresh_token_cookie` from the request. No request body is needed.

### Response Body (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expiry": 3600
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Refresh token missing, expired, or revoked |
| `429 Too Many Requests` | Too many refresh attempts from this IP |

**Cookies set:** `access_token_cookie`, `refresh_token_cookie` (rotated)

---

## Logout

Revoke the current session's tokens.

```
DELETE /api/v1/auth/logout
```

### Response

`204 No Content` on success. Tokens are revoked in Redis and cookies are cleared.

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Not authenticated |

**Cookies cleared:** `access_token_cookie`, `refresh_token_cookie`

---

## Register

Create a new user account (organization-level registration).

```
POST /api/v1/users
```

> **Note:** The registration endpoint is under the Users router, not the Auth router. See [Users API](./users.md) for details.

Depending on the organization's signup mechanism (`open` vs `inviteOnly`), registration may require an invite code.

---

## OAuth / SSO

Authenticate using an external OAuth provider or SAML-based SSO.

```
POST /api/v1/auth/oauth
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | Yes | OAuth provider identifier (e.g., `google`, `github`) |
| `code` | string | Yes | Authorization code from the provider |
| `redirect_uri` | string | Yes | The redirect URI used in the OAuth flow |

### Example Request

```json
{
  "provider": "google",
  "code": "4/0AX4XfWi...",
  "redirect_uri": "https://koodook.com/auth/callback"
}
```

### Response Body (200 OK)

```json
{
  "user": {
    "id": 1,
    "uuid": "a1b2c3d4-...",
    "username": "johndoe",
    "email": "john@example.com",
    "display_name": "John Doe",
    "avatar_url": "https://lh3.googleusercontent.com/...",
    "is_active": true
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expiry": 3600
  }
}
```

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Invalid or expired authorization code |
| `401 Unauthorized` | OAuth provider rejected the authentication |
| `401 Unauthorized` | Email not verified (SaaS mode only) |

**Cookies set:** `access_token_cookie`, `refresh_token_cookie`

---

## Email Verification

Verify a user's email address using a verification token.

```
POST /api/v1/auth/verify-email
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Email verification token |

### Example Request

```json
{
  "token": "verify_abc123def456"
}
```

### Response

`200 OK` on success. The user's email is marked as verified.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Invalid or expired verification token |

---

## Resend Verification Email

Request a new verification email to be sent.

```
POST /api/v1/auth/resend-verification
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address to send verification to |

### Example Request

```json
{
  "email": "john@example.com"
}
```

### Response

`200 OK` on success. A new verification email is sent.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Email already verified |
| `404 Not Found` | Email not associated with any account |

---

## API Tokens

Manage `lh_`-prefixed API tokens for headless and admin API access.

### Create API Token

```
POST /api/v1/api-tokens/{org_id}/api-tokens
```

### Request Body (JSON)

```json
{
  "name": "My Integration Token",
  "permissions": ["courses:read", "users:read"]
}
```

### Response Body (200 OK)

```json
{
  "uuid": "token-uuid-here",
  "name": "My Integration Token",
  "prefix": "lh_abc12",
  "full_token": "lh_abc12def34...",
  "created_at": "2026-09-23T10:00:00Z"
}
```

> **Important:** The `full_token` value is only returned once upon creation. Store it securely.

### List API Tokens

```
GET /api/v1/api-tokens/{org_id}/api-tokens
```

Returns token metadata (prefix, name, created date) but never the full token secret.

### Get API Token

```
GET /api/v1/api-tokens/{org_id}/api-tokens/{token_uuid}
```

### Update API Token

```
PUT /api/v1/api-tokens/{org_id}/api-tokens/{token_uuid}
```

### Regenerate API Token

```
POST /api/v1/api-tokens/{org_id}/api-tokens/{token_uuid}/regenerate
```

### Revoke (Delete) API Token

```
DELETE /api/v1/api-tokens/{org_id}/api-tokens/{token_uuid}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions to manage tokens |
| `429 Too Many Requests` | Rate limit exceeded for token creation |

---

## Token Security Model

### Token Storage

- **Access tokens** and **refresh tokens** are set as httpOnly cookies
- Cookies use `Secure` flag (HTTPS only), `SameSite=Lax`, and configurable domain
- In multi-tenant mode, cookie domain is scoped to the organization's domain
- Tokens can be revoked immediately via Redis-based blocklist

### Account Lockout

| Parameter | Default |
|-----------|---------|
| Failed attempts before lockout | 5 (configurable) |
| Lockout duration | 15 minutes (configurable) |
| Scope | Per-user, regardless of IP |

After a successful login, failed attempt counters are reset.

### Rate Limiting

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `POST /login` | Per-IP configurable | IP address |
| `GET /refresh` | Per-IP configurable | IP address |
| `POST /api-tokens` | Per-IP configurable | IP address |

---

## Auth Flow Diagram

```
Client                          Server
  │                                │
  │  POST /auth/login              │
  │  (username + password)         │
  │ ──────────────────────────────►│
  │                                │── Validate credentials
  │                                │── Check rate limit & lockout
  │                                │── Check email verification
  │                                │── Create JWT pair
  │                                │── Set httpOnly cookies
  │  ◄─────────────────────────────│
  │  { user, tokens } + cookies    │
  │                                │
  │  GET /auth/refresh             │
  │  (refresh_token_cookie)        │
  │ ──────────────────────────────►│
  │                                │── Validate refresh token
  │                                │── Rotate token pair
  │  ◄─────────────────────────────│
  │  { tokens } + new cookies      │
  │                                │
  │  DELETE /auth/logout           │
  │ ──────────────────────────────►│
  │                                │── Revoke tokens in Redis
  │                                │── Clear cookies
  │  ◄─────────────────────────────│
  │  204 No Content                │
```

---

## Security Best Practices

- Always use HTTPS in production to protect token transmission
- Store tokens securely client-side (httpOnly cookies are preferred over localStorage)
- Rotate refresh tokens on each use to limit replay window
- Revoke compromised tokens immediately via the API token management endpoints
- Use API tokens (`lh_`-prefixed) for server-to-server communication instead of user JWTs
