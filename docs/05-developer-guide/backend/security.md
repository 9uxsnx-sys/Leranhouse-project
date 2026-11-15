# Security and Authentication

> Status: as-built · Last verified: 2026-11-15

The LearnHouse platform implements a multi-layered security model combining JWT authentication, API token support, role-based access control (RBAC), UserGroup-based resource locking, and password hashing with transparent legacy migration support.

---

## Authentication Flow

### 1. JWT Access Tokens

Access tokens are short-lived JWTs (8 hours by default) signed with HS256:

```python
from src.security.auth import create_access_token

# Token payload includes:
# - sub: user email
# - exp: expiration (8h from now)
# - iat: issued at timestamp
# - purpose: "session" (optional, allows non-session token types)
token = create_access_token(data={"sub": user.email})
```

### 2. JWT Refresh Tokens

Refresh tokens are longer-lived (30 days) with additional security features:

```python
from src.security.auth import create_refresh_token

# Token payload includes:
# - sub: user email
# - exp: expiration (30d from now)
# - iat: issued at timestamp
# - type: "refresh" (distinguishes from access tokens)
# - jti: random 16-byte URL-safe token (for replay detection)
token = create_refresh_token(data={"sub": user.email})
```

### 3. Token Extraction

Tokens can be provided via:
- **Authorization header**: `Authorization: Bearer <token>` (takes precedence)
- **Cookie**: `LH_access` cookie (browser fallback)

```python
def extract_jwt_from_request(request: Request) -> Optional[str]:
    # Authorization header first
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer ") and not auth_header.lower().startswith("bearer lh_"):
        return auth_header[7:].strip()
    # Cookie fallback
    return request.cookies.get("LH_access")
```

### 4. Token Validation

Every request goes through `get_current_user()` which:

1. **Checks for API tokens** (`Bearer lh_...`) — delegates to `validate_api_token()`
2. **Decodes JWT** — requires `exp` and `sub` claims, verifies HS256 signature
3. **Validates token purpose** — rejects `password_reset` and `email_verification` tokens at session endpoints
4. **Checks password change** — rejects tokens issued before a password change
5. **Checks session revocation** — rejects tokens issued before logout
6. **Returns user object** — `PublicUser`, `APITokenUser`, or `AnonymousUser`

```python
async def get_current_user(request, db_session) -> Union[PublicUser, APITokenUser, AnonymousUser]:
    # 1. API token check (Bearer lh_...)
    if auth_header.lower().startswith("bearer lh_"):
        api_token_user = await validate_api_token(token, db_session)
        await _verify_api_token_org_boundary(request, api_token_user, db_session)
        return api_token_user

    # 2. JWT validation
    payload = decode_jwt(token)
    # Validate purpose, exp, sub, password_changed_at, revocation
    ...

    return PublicUser(**user.model_dump())
```

---

## Security Architecture

### Password Hashing

Passwords are hashed using **Argon2** via `pwdlib`, with transparent migration support for legacy `pbkdf2_sha256` hashes:

```python
from src.security.security import (
    security_hash_password,
    security_verify_password,
    security_verify_and_update_password,
)

# Hash new passwords (Argon2)
hashed = security_hash_password("user_password")

# Verify (auto-detects algorithm)
is_valid = security_verify_password("user_password", stored_hash)

# Verify and upgrade legacy hash
is_valid, new_hash = security_verify_and_update_password("user_password", stored_hash)
if new_hash:
    # Save the new Argon2 hash, transparent migration
    user.password = new_hash
```

### Timing-Safe Authentication

The login endpoint uses timing-safe password verification and a dummy hash for non-existent users to prevent user enumeration:

```python
# Pre-computed Argon2 hash of an unused sentinel
_DUMMY_PASSWORD_HASH = security_hash_password("unused-sentinel-for-timing-equalization")

async def authenticate_user(email, password, db_session):
    user = await security_get_user(request, db_session, email)
    if not user:
        # Same timing as a real verification — prevents enumeration
        security_verify_password(password, _DUMMY_PASSWORD_HASH)
        return False
    if not security_verify_password(password, user.password):
        return False
    return user
```

### Session Revocation

Logout and password changes revoke all existing sessions via Redis blocklist:

```python
from src.security.auth import revoke_user_sessions_before

# On logout or password change:
revoke_user_sessions_before(user.id)

# This writes a timestamp to Redis:
#   key:   jwt_revoked_before:{user_id}
#   value: unix timestamp of revocation
#   TTL:   30 days (matches max refresh token lifetime)
```

### Refresh Token Rotation

Each refresh token includes a unique `jti` claim, and `/auth/refresh` issues a new access token plus a new refresh token on every call. It re-checks `password_changed_at` and the logout blocklist before rotating.

`security/auth.py` also defines `_mark_refresh_jti_used()` (Redis `refresh_used:{user_id}:{jti}`, NX + TTL) for one-time-use replay detection, but the `/auth/refresh` route does **not** call it today — replay protection currently rests on expiry and the revocation blocklist.

---

## API Token Authentication

API tokens provide machine-to-machine authentication:

### Token Format

- Prefix: `lh_` (identifies the token as an API token)
- Stored in database with associated rights and org scope
- Sent as: `Authorization: Bearer lh_<token_value>`

### Token Validation

```python
async def validate_api_token(token: str, db_session: Session) -> Optional[APITokenUser]:
    api_token = await validate_api_token_for_auth(token, db_session)
    if not api_token:
        return None
    
    return APITokenUser(
        id=api_token.id,
        org_id=api_token.org_id,
        rights=api_token.rights,
        token_name=api_token.name,
        created_by_user_id=api_token.created_by_user_id,
    )
```

### Organization Boundary

API tokens are scoped to a single organization. The system enforces this at multiple levels:

1. **Global check** in `_verify_api_token_org_boundary()` — verifies URL path params match token's org
2. **Resource check** in `authorization_verify_api_token_permissions()` — verifies element belongs to token's org
3. **Restricted resource types** — tokens can only access: courses, activities, coursechapters, collections, certifications, usergroups, payments, search

---

## Role-Based Access Control (RBAC)

### Architecture

RBAC lives in `src/security/rbac/` and provides a multi-layered authorization system. `ResourceAccessChecker` (`rbac/resource_access.py`) is the unified entry point used by services through `check_resource_access()`:

```
ResourceAccessChecker.check_access()
    │
    ├── get_resource_config(resource_uuid)
    │   → Resolve resource type; child resources (chapter, activity, episode)
    │     delegate to their parent (course, podcast)
    │
    ├── APITokenUser → _check_api_token_access()
    │   → Org boundary + per-resource-type rights
    │
    ├── communities → _check_community_access()
    │   → Access follows the linked course/podcast; free parents also
    │     require a claim (TrailRun)
    │
    ├── READ → _check_read_access()
    │   → anonymous / dashboard / public-view branches
    │   → free+published, authorship, admin/maintainer, access_type
    │     (public / users_only / paid), legacy role, legacy UserGroup
    │
    └── CREATE / UPDATE / DELETE → _check_write_access()
        → placeholder "course_x" create uses role rights;
          existing resources require authorship, admin/maintainer, or role
```

It does **not** delegate to `authorization_verify_if_element_is_public()` or `authorization_verify_api_token_permissions()`. The older role/authorship helpers in `rbac/rbac.py` are still used for the legacy role checks and by services that call them directly.

### Permission Model

Permissions are defined per resource type using `Permission`, `PermissionsWithOwn`, and `DashboardPermission` Pydantic models:

```python
# Simple permission (4 actions)
class Permission(BaseModel):
    action_create: bool
    action_read: bool
    action_update: bool
    action_delete: bool

# With "own" variants for user-owned resources
class PermissionsWithOwn(BaseModel):
    action_create: bool
    action_read: bool
    action_read_own: bool
    action_update: bool
    action_update_own: bool
    action_delete: bool
    action_delete_own: bool

# Dashboard access (single boolean)
class DashboardPermission(BaseModel):
    action_access: bool
```

### Access Contexts

```python
class AccessContext(Enum):
    PUBLIC_VIEW = "public_view"  # Anonymous users can read public resources
    DASHBOARD = "dashboard"      # Requires authenticated access with proper rights
```

### Authorization Chain

For a regular user, the read path evaluates in this order:

1. **Free + published** — `public=True`, `published=True`, and access type `public` (or absent) grants access
2. **Authorship** — CREATOR/MAINTAINER/CONTRIBUTOR with ACTIVE status
3. **Admin/maintainer** — org Admin or Maintainer role
4. **Access type** — a draft (`published=False`) blocks everyone; otherwise `users_only` requires a linked UserGroup, and `paid` requires an active `ResourceEntitlement` (linked UserGroups bypass)
5. **Legacy role permission** — only for resources still using the public flag
6. **Legacy UserGroup membership** — subject to the published check

Superadmins bypass these checks in `authorization_verify_based_on_org_admin_status()` and the role helpers. Write paths require authorship, admin/maintainer status, or role rights; anonymous users can never write.

### FastAPI Dependency Injection

RBAC checks can be injected as FastAPI dependencies for cleaner route code:

```python
from src.security.rbac.dependencies import (
    require_read_access,
    require_write_access,
    require_create_access,
    require_dashboard_access,
    CourseAccess,
)

# Option 1: Generic dependencies
@router.get("/{course_uuid}")
async def get_course(
    access = Depends(require_read_access("course_uuid")),
): ...

# Option 2: Pre-configured class
@router.put("/{course_uuid}")
async def update_course(
    access = Depends(CourseAccess.update()),
): ...
```

`require_dashboard_access()` (in `rbac/dependencies.py`) is the dashboard-context wrapper around `require_resource_access(..., AccessContext.DASHBOARD)`; `CourseAccess`, `PodcastAccess`, and `CommunityAccess` expose read/create/update/delete/dashboard variants.

### Resource-Level Checks

The RBAC system evaluates access at the resource level through `check_resource_access()` in `resource_access.py`. This function is called by service functions to verify whether the acting user has the required permission on a specific resource (e.g., a specific course or community).

### Read Helpers

Two helpers sit on top of `check_resource_access()`:

- **`check_catalog_read_access()`** (`rbac/catalog.py`) — lets anyone read the metadata of a **published paid** resource (a product page), while returning the decision so callers can strip paid content. `users_only` and draft resources stay denied.
- **`require_resource_read()`** (`rbac/media.py`) — guards raw media files (local filesystem and S3). API tokens from the owning org keep access; anonymous callers get 401; signed-in callers without access get 403. This prevents knowing a file path from bypassing a paywall.

### Published Field Enforcement

Resources with `has_published_field=True` in their RBAC config (courses, communities) have an additional access layer:

- **Anonymous users** -- blocked from reading unpublished resources
- **Authenticated users** -- blocked from reading unpublished resources (even if public or linked via UserGroup)
- **UserGroup members** -- blocked from accessing unpublished resources (the published check gates all access, not just public view)
- **Admins and superadmins** -- bypass the published check, can see all resources regardless of published status

This is enforced in `_is_public_and_published()`, `_check_anonymous_read_access()`, and `_check_public_view_read_access()` in `resource_access.py`. The `published` field acts as a master on/off switch that gates all non-admin access.

For communities specifically, the listing endpoint (`get_communities_by_org()`) also filters by `published` at the query level to ensure unpublished communities don't appear in search results for non-admin users.

---

## UserGroup-Based Resource Locking

Chapters and activities support three lock tiers:

| Lock Type | Access Rule |
|-----------|-------------|
| `public` | Anyone, including anonymous visitors |
| `authenticated` | Any signed-in user |
| `restricted` | UserGroup membership or org admin |

```python
from src.services.courses.locks import is_locked_for_user

is_locked = is_locked_for_user(
    lock_type="restricted",
    resource_uuid=chapter_uuid,
    org_id=org.id,
    current_user=current_user,
    db_session=db_session,
)
```

For paid content, denied access returns **HTTP 402 Payment Required** with offer metadata:

```json
{
    "detail": {
        "code": "PAYMENT_REQUIRED",
        "offer_id": 123,
        "offer_name": "Premium Course Access",
        "amount": 29.99,
        "currency": "USD"
    }
}
```

---

## Rate Limiting

Rate limiting is applied to sensitive endpoints:

`src/services/security/rate_limiting.py` exposes per-action helpers (`check_login_rate_limit`, `check_refresh_rate_limit`, `check_signup_rate_limit`, `check_verification_resend_rate_limit`, `check_password_reset_rate_limit`, `check_api_token_rate_limit`, `check_webhook_mutation_rate_limit`). They store counters under `rate_limit:{key}` in Redis.

| Endpoint | Limit |
|----------|-------|
| `/api/v1/auth/login` | Configurable per-IP |
| `/api/v1/auth/refresh` | Configurable per-IP |
| Signup | Configurable per-IP |
| Resend verification | Configurable per-IP / email |
| Password reset | Configurable per-IP / email |
| API token requests | Configurable per token |

### Account Lockout

`src/services/security/account_lockout.py` locks an account after **10 failed attempts for 5 minutes**, but only when the attempts came from **at least two distinct source IPs** within a 30-minute window (a single-IP client cannot lock an account on its own):

```python
from src.services.security.account_lockout import (
    check_account_locked,
    record_failed_login,
    reset_failed_attempts,
    update_login_info,
)

# Before login: returns (is_locked, remaining_seconds)
is_locked, remaining = check_account_locked(user)

# On login failure:
now_locked, ttl = record_failed_login(user, db_session, ip_address)

# On successful login:
reset_failed_attempts(user, db_session)
update_login_info(user, ip_address, db_session)
```

---

## Account Types

| Type | ID | Description |
|------|-----|-------------|
| `AnonymousUser` | `id=0` | Unauthenticated visitor |
| `PublicUser` | User's DB ID | Authenticated via JWT |
| `APITokenUser` | Token's DB ID | Authenticated via API token (`lh_...`) |
| `InternalUser` | `id=0` | Internal service user |

The `resolve_acting_user_id()` function resolves API tokens to their creator's user ID:

```python
def resolve_acting_user_id(current_user) -> int:
    if isinstance(current_user, APITokenUser):
        return current_user.created_by_user_id  # Real user behind the token
    return current_user.id
```

---

## CORS Configuration

CORS is tenancy-aware (`src/core/middleware/cors.py`):

- **Single tenancy**: Permissive — matches any `http(s)://` origin
- **Multi tenancy**: Strict — uses `LEARNHOUSE_ALLOWED_REGEXP` configuration

Credentials are allowed, and all HTTP methods and headers are permitted.

### CSRF Middleware (not active)

`src/security/csrf.py` defines `CSRFProtectionMiddleware`, which validates `Origin` (falling back to `Referer`) on POST/PUT/DELETE/PATCH and exempts API tokens (`Bearer lh_`), Stripe signatures, and internal service keys. It is **not registered** in `apps/api/app.py` — the only `add_middleware` calls there are `configure_cors(app)` and `GZipMiddleware`. Until it is added, CSRF protection is not active (the cookie auth path relies on the CORS policy).

---

## Enterprise Edition Hooks

`src/core/ee_hooks.py` loads `ee.hooks` when the `ee` folder exists (and `LEARNHOUSE_DISABLE_EE != "1"`). The hooks it calls are:
- `register_middlewares(app)` — via `register_ee_middlewares(app)`
- `register_routers(v1_router)` — via `register_ee_routers(v1_router)`
- `on_startup(app)` — via `run_ee_startup(app)`
- `check_activity_paid_access(request, activity_id, user, db_session)` — via `check_ee_activity_paid_access()`; returns `True` (free access) when EE is absent

All EE integrations gracefully degrade when the module is absent.
