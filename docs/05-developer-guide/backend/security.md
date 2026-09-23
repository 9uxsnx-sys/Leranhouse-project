# Security and Authentication

> The LearnHouse platform implements a multi-layered security model combining JWT authentication, API token support, role-based access control (RBAC), UserGroup-based resource locking, and password hashing with transparent legacy migration support.

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

Each refresh token includes a unique `jti` claim. The `/auth/refresh` endpoint atomically marks each `jti` as consumed — replay detection:

```python
def _mark_refresh_jti_used(user_id: int, jti: str) -> bool:
    # NX + TTL = set-if-not-exists, auto-cleanup
    ok = r.set(f"refresh_used:{user_id}:{jti}", "1", nx=True, ex=30*86400)
    return bool(ok)  # False on replay
```

If a refresh token is replayed, all of the user's sessions are revoked.

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

RBAC lives in `src/security/rbac/` and provides a multi-layered authorization system:

```
ResourceAccessChecker (unified entry point)
    │
    ├── authorization_verify_if_element_is_public()
    │   → Checks public flag on courses, collections, podcasts
    │
    ├── authorization_verify_based_on_roles_and_authorship()
    │   → Combines role + authorship + usergroup + enrollment checks
    │
    └── authorization_verify_api_token_permissions()
        → Org boundary + resource type + action granularity
```

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

When checking access for a regular user, the system evaluates:

1. **Superadmin bypass** — Superadmins have unrestricted access
2. **Public access** — If the resource is public and action is read, grant access
3. **Authorship** — If the user is CREATOR/MAINTAINER/CONTRIBUTOR with ACTIVE status
4. **Role-based** — If any of the user's roles grant the permission for that resource type
5. **UserGroup access** — If the user is a member of a linked UserGroup
6. **Paid enrollment** — If the user has purchased access (EE feature)

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

| Endpoint | Limit |
|----------|-------|
| `/api/v1/auth/login` | Configurable per-IP |
| `/api/v1/auth/refresh` | Configurable per-IP |
| `/api/v1/auth/verify-email` | Configurable per-IP |
| `/api/v1/auth/resend-verification` | Configurable per-IP |

### Account Lockout

After configurable failed login attempts, the account is temporarily locked:

```python
from src.services.security.account_lockout import check_account_lockout, record_failed_attempt

# On login failure:
record_failed_attempt(user, db_session)

# Before login:
check_account_lockout(user)  # Raises 423 Locked if locked
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

---

## Enterprise Edition Hooks

The EE module can extend security with:
- Additional middleware (`register_ee_middlewares`)
- Additional routers with auth checks (`register_ee_routers`)
- Additional lifecycle handlers (`register_ee_event_handlers`)
- Payment-based enrollment access (`check_enrollment_access`)

All EE integrations gracefully degrade when the module is absent.
