# Security

> Status: as-built · Last verified: 2026-11-15

Authentication, authorization, and permission model.

---

## Authentication

### JWT Tokens

The platform uses JWT (JSON Web Tokens) for API authentication:

- Tokens are issued on login via `POST /api/v1/auth/login`
- The token pair is set as **httpOnly cookies** — `LH_access` (8 hours) and `LH_refresh` (30 days) — and also returned in the response body
- Clients may alternatively send an access token as an `Authorization: Bearer <token>` header
- Refresh tokens are rotated on each use (`/auth/refresh` issues a new access + refresh pair); the `jti` replay-detection helper exists but is not wired into that route yet
- Revoked tokens are tracked via a Redis blocklist for immediate invalidation (logout revokes all sessions)

### OAuth / SSO

- Google OAuth is the provider wired into `POST /api/v1/auth/oauth` (the `provider` field currently accepts `google` only)
- Enterprise SSO (SAML / OIDC) is configured per organization in Org Settings > SSO and brokered through WorkOS

### API Tokens

- Long-lived tokens for programmatic access
- Managed in Org Settings > API Access
- Scoped to one organization and to per-resource-type rights
- Prefix `lh_`; the full token is shown only once and stored hashed

---

## Authorization (RBAC)

### Roles

The seeded global roles are:

| Role | `role_id` | Capabilities |
|------|-----------|--------------|
| Super Admin | — | Platform-wide (`is_superadmin` on the user), bypasses org checks |
| Admin | `1` | Full control of the organization: settings, courses, users, roles |
| Maintainer | `2` | Manages content and most org resources; cannot delete users or manage roles |
| Instructor | `3` | Can create courses/chapters/activities and update or delete their own courses |
| User | `4` | Read-only learner |
| Custom roles | auto-assigned | Configurable permission sets created per organization |

`src/security/rbac/constants.py` treats role IDs `1` and `2` as elevated (`ADMIN_OR_MAINTAINER_ROLE_IDS`).

### Permission Model

- Roles are assigned at the **organization level** through `UserOrganization.role_id`; the same user can hold different roles in different orgs
- Authorship on a specific resource is tracked separately in `resourceauthor` (CREATOR / MAINTAINER / CONTRIBUTOR / REPORTER, with ACTIVE / PENDING / INACTIVE status)
- Custom roles can be created in Org Settings > Roles
- Permissions are checked through `src/security/rbac/` (the unified `ResourceAccessChecker` and its FastAPI dependencies)

---

## Access Control

### Resource Access Types

Courses, podcasts, and collections share a three-mode access model (`access_type`):

| Type | Who Can Access | When to Use |
|------|---------------|-------------|
| **Public** (`public`) | Anyone, including anonymous visitors, once the resource is published | Free courses, open catalog |
| **Users only** (`users_only`) | Only members of the linked UserGroups | Private courses, internal training, cohorts |
| **Paid** (`paid`) | Users with an active `ResourceEntitlement`; linked UserGroups also bypass | Paid courses (Chargily) |

`published = false` (draft) overrides every type: author / admin / maintainer only. Within that model, anonymous reads are allowed for resources that are **public and published and free** — enforced in `_check_anonymous_read_access()`.

### User Groups

- Groups are managed per organization
- Users can belong to multiple groups
- A resource can be linked to multiple groups via `UserGroupResource.resource_uuid`
- Granting group access does not require individual user assignment

---

## Key Security Practices

- Passwords hashed with **argon2id** (via `pwdlib`)
- SQL injection prevented via SQLModel parameterized queries
- CORS configured in FastAPI middleware
- `CSRFProtectionMiddleware` exists in `src/security/csrf.py` but is **not registered** in `apps/api/app.py`, so CSRF validation is not currently active
- IP-based rate limiting on auth endpoints (login, refresh, signup, verification resend, password reset) and on API-token requests
- Per-user **account lockout** after 10 failed login attempts, only when attempts span multiple IPs (5-minute lock)
- Email verification for new accounts
- JWT revocation via a Redis blocklist (logout invalidates all of a user's tokens)
- API tokens (`lh_`-prefixed) for server-to-server access
- Environment variables for secrets (never hardcoded)
