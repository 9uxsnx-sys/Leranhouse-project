# Security

> Authentication, authorization, and permission model.

---

## Authentication

### JWT Tokens

The platform uses JWT (JSON Web Tokens) for API authentication:

- Tokens are issued on login via `POST /api/v1/auth/login`
- The token pair is set as **httpOnly cookies** — `LH_access` (short-lived) and `LH_refresh` (long-lived) — and also returned in the response body
- Clients may alternatively send an access token as an `Authorization: Bearer <token>` header
- Refresh tokens are rotated on each use; the old token's `jti` is marked consumed in Redis so replay is rejected
- Revoked tokens are tracked via a Redis blocklist for immediate invalidation

### OAuth / SSO

- Google OAuth is the provider wired into `POST /api/v1/auth/oauth` (the `provider` field currently accepts `google` only)
- Enterprise SSO (SAML / OIDC) is configured per organization in Org Settings > SSO and brokered through WorkOS

### API Tokens

- Long-lived tokens for programmatic access
- Managed in Org Settings > API Access
- Can be scoped to specific permissions

---

## Authorization (RBAC)

### Roles

| Role | Scope | Capabilities |
|------|-------|--------------|
| Super Admin | Platform-wide | Full access across all organizations |
| Admin (`role_id = 1`) | Organization | Full control: settings, courses, users, billing |
| Maintainer (`role_id = 2`) | Organization | Manage content and most org resources, short of full admin |
| Member (`role_id = 3+`) | Organization | Standard learner access; also the baseline for custom roles |
| Custom roles | Organization | Configurable permission sets built on the Member baseline |

### Permission Model

- Roles are assigned at the **organization level**
- Course-level roles (Instructor) can be assigned per course
- Custom roles can be created in Org Settings > Roles
- Permissions are checked via FastAPI dependencies in `apps/api/src/security/rbac/`

---

## Access Control

### Course Access Types

| Type | Who Can Access | When to Use |
|------|---------------|-------------|
| **Free** (`public`) | Every logged-in user | Free courses, open catalog |
| **Restricted** (`users_only`) | Only members of the linked user groups | Private courses, internal training, cohorts |
| **Paid** (`paid`) | Users with an active purchase entitlement | Paid courses (Chargily) |

`published = false` (draft) overrides every type: author / admin / maintainer only. The platform is login-only, so there is no anonymous browsing tier.

### User Groups

- Groups are managed per organization
- Users can belong to multiple groups
- A course can be linked to multiple groups
- Granting group access does not require individual user assignment

---

## Key Security Practices

- Passwords hashed with **argon2id** (via `pwdlib`)
- SQL injection prevented via SQLModel parameterized queries
- CORS configured in FastAPI middleware
- CSRF protection on state-changing requests
- IP-based rate limiting on auth endpoints (login, refresh, password reset, email verification)
- Per-user **account lockout** after repeated failed login attempts
- Email verification for new accounts
- JWT revocation via a Redis blocklist (logout invalidates all of a user's tokens)
- API tokens (`lh_`-prefixed) for server-to-server access
- Environment variables for secrets (never hardcoded)
