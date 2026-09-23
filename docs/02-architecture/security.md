# Security

> Authentication, authorization, and permission model.

---

## Authentication

### JWT Tokens

The platform uses JWT (JSON Web Tokens) for API authentication:

- Tokens are issued on login via `POST /api/v1/auth/login`
- Sent as `Authorization: Bearer <token>` header
- Configurable expiry via `LEARNHOUSE_JWT_EXPIRATION` env var
- Refresh tokens supported for session extension

### OAuth / SSO

- OAuth2 providers can be configured per organization
- Supported: Google, GitHub, and generic OpenID Connect
- SSO configuration per org in Org Settings

### API Tokens

- Long-lived tokens for programmatic access
- Managed in Org Settings > API Access
- Can be scoped to specific permissions

---

## Authorization (RBAC)

### Roles

| Role | Scope | Capabilities |
|------|-------|--------------|
| Super Admin | Platform-wide | Everything |
| Org Admin | Organization | Manage org settings, courses, users |
| Course Creator | Organization | Create and edit courses |
| Instructor | Course | Manage course content, grade assignments |
| Learner | Platform | View and take courses |

### Permission Model

- Roles are assigned at the **organization level**
- Course-level roles (Instructor) can be assigned per course
- Custom roles can be created in Org Settings > Roles
- Permissions are checked via middleware in `apps/api/src/middleware/`

---

## Access Control

### Course Access Types

| Type | Who Can Access | When to Use |
|------|---------------|-------------|
| **Public** | Anyone (free) | Free courses, marketing content |
| **Users Only** | Logged-in users in linked groups | Private courses, internal training |
| **Paid** | Users who purchased | Paid courses (future Chargily integration) |

### User Groups

- Groups are managed per organization
- Users can belong to multiple groups
- A course can be linked to multiple groups
- Granting group access does not require individual user assignment

---

## Key Security Practices

- Passwords hashed with bcrypt
- SQL injection prevented via SQLModel parameterized queries
- CORS configured in FastAPI middleware
- Rate limiting on auth endpoints
- Webhook signatures verified for payment callbacks (future)
- Environment variables for secrets (never hardcoded)
