# Database Layer

> LearnHouse uses PostgreSQL with SQLModel (SQLAlchemy + Pydantic) for ORM, Alembic for migrations, and Redis for caching. The database layer spans models, migrations, connections, and query patterns.

---

## Technology Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| Database | PostgreSQL 16 | With pgvector extension for RAG |
| ORM | SQLModel 0.0.38 | SQLAlchemy + Pydantic integration |
| Migrations | Alembic 1.18.4 | With `alembic_postgresql_enum` extension |
| Connection | SQLAlchemy engine | Pool size 20, max overflow 10 |
| Cache | Redis | Session revocation, collab state, API caching |
| Package Manager | uv | Replaces pip/poetry |

---

## Database Engine & Sessions

Database connection management lives in `src/core/events/database.py`:

```python
# Production: PostgreSQL with connection pooling
engine = create_engine(
    connection_string,
    pool_size=20,
    max_overflow=10,
    pool_recycle=300,  # Recycle connections every 5 minutes
    pool_timeout=30,   # Wait up to 30 seconds for a connection
)

# Test mode: SQLite in-memory (with JSONB-to-JSON remapping)
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
```

The `get_db_session` FastAPI dependency provides a SQLModel Session per request:

```python
async def get_db_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
```

### Pool Monitoring

SQLAlchemy events are registered for pool monitoring:
- `connect` — Logs new connections
- `checkout` — Tracks connection checkout
- `checkin` — Tracks connection return

### Cache Invalidation on Commit

The database layer hooks into commit events to automatically bust Redis caches:
- Org slug changes → clear org caches
- Course UUID operations → clear course caches
- Activity/chapter changes → clear content caches

---

## Alembic Migrations

Migrations are configured in `migrations/env.py`:

```python
# Dynamic model import — walks src/db directory tree
from src.db import import_all_models

# PostgreSQL enum support
from alembic_postgresql_enum import ...

# Target metadata from SQLModel
target_metadata = SQLModel.metadata
```

Default connection string (from `alembic.ini`):
```
postgresql://learnhouse:learnhouse@localhost:5432/learnhouse
```

### Migration Commands

```bash
# Generate a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1

# View history
alembic history
```

---

## Key Database Models

### Organization (`src/db/organizations.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Auto-increment |
| `name` | String | Organization name |
| `slug` | String | Unique, indexed — used in URLs |
| `email` | String | Contact email |
| `description` | Text | Markdown description |
| `about` | Text | Detailed about section |
| `socials` | JSON | Social media links |
| `links` | JSON | External links |
| `scripts` | JSON | Custom scripts |
| `logo_image` | String | Logo URL |
| `thumbnail_image` | String | Thumbnail URL |
| `previews` | JSON | Preview images |
| `explore` | Boolean | Visible in explore/discovery |

### User (`src/db/users.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Auto-increment |
| `username` | String | Unique username |
| `email` | EmailStr | Unique email |
| `password` | String | Argon2 hash |
| `user_uuid` | String | Public UUID |
| `email_verified` | Boolean | Email verification status |
| `failed_login_attempts` | Integer | For account lockout |
| `locked_until` | DateTime | Lockout expiration |
| `last_login_at` | DateTime | Last successful login |
| `last_login_ip` | String | IP of last login |
| `signup_method` | String | email, google, etc. |
| `is_superadmin` | Boolean | Bypasses all RBAC |
| `password_changed_at` | DateTime | For JWT revocation |
| `avatar_image` | String | Avatar URL |
| `bio` | Text | User biography |
| `details` | JSON | Extended details |
| `profile` | JSON | Profile settings |
| `extra_metadata` | JSONB | Extensible metadata |

### Course (`src/db/courses/courses.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Auto-increment |
| `org_id` | Integer, FK → Organization | Organization owner |
| `course_uuid` | String | Indexed, public identifier |
| `name` | String | Course name |
| `description` | Text | Course description |
| `public` | Boolean | Visible to non-members |
| `published` | Boolean | Published status |
| `seo` | JSONB | SEO metadata (OG, Twitter, JSON-LD) |
| `extra_metadata` | JSONB | Extensible metadata |
| `creation_date` | String | ISO date |
| `update_date` | String | ISO date |

Composite index: `(org_id, public, published, creation_date)`

### Chapter (`src/db/courses/chapters.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Auto-increment |
| `org_id` | Integer, FK → Organization | Organization owner |
| `course_id` | Integer, FK → Course | Parent course |
| `chapter_uuid` | String | Public identifier |
| `lock_type` | Enum | public, authenticated, restricted |
| `extra_metadata` | JSONB | Extensible metadata |

### Activity (`src/db/courses/activities.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Auto-increment |
| `org_id` | Integer, FK → Organization | Organization owner |
| `course_id` | Integer, FK → Course | Parent course |
| `activity_uuid` | String | Public identifier |
| `activity_type` | Enum | TYPE_VIDEO, TYPE_DOCUMENT, TYPE_DYNAMIC, TYPE_ASSIGNMENT, TYPE_CUSTOM, TYPE_SCORM |
| `activity_sub_type` | Enum | Detailed subtype per type |
| `content` | JSON | Activity content (Prosemirror doc format) |
| `details` | JSON | Activity details |
| `published` | Boolean | Published status |
| `lock_type` | Enum | public, authenticated, restricted |
| `current_version` | Integer | Version counter |
| `extra_metadata` | JSONB | Extensible metadata |

### Role (`src/db/roles.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Auto-increment |
| `org_id` | Integer, FK → Organization | Null for global roles |
| `name` | String | Role name (e.g., "Admin", "User") |
| `role_type` | Enum | TYPE_ORGANIZATION, TYPE_ORGANIZATION_API_TOKEN, TYPE_GLOBAL |
| `rights` | JSON | Permission structure |
| `role_uuid` | String | Public identifier |

Index: `(org_id, role_type)`

### Rights Structure

The `Rights` Pydantic model defines permissions for all resource types:

```python
class Rights(BaseModel):
    courses: PermissionsWithOwn    # action_create/read/update/delete + _own variants
    users: Permission              # action_create/read/update/delete
    usergroups: Permission
    collections: Permission
    organizations: Permission
    coursechapters: Permission
    activities: Permission
    roles: Permission
    dashboard: DashboardPermission  # action_access only
    communities: Permission
    discussions: PermissionsWithOwn
    podcasts: PermissionsWithOwn
    boards: PermissionsWithOwn       # Default: read-only
    playgrounds: PermissionsWithOwn  # Default: read-only
```

---

## JSONB Columns

Several models use JSONB columns for flexible data storage:

| Model | JSONB Column | Purpose |
|-------|-------------|---------|
| Course | `seo` | OG tags, Twitter cards, JSON-LD structured data |
| Course | `extra_metadata` | Custom course metadata |
| Chapter | `extra_metadata` | Custom chapter metadata |
| Activity | `content` | Rich text content (Prosemirror doc format) |
| Activity | `details` | Activity-specific configuration |
| User | `details`, `profile` | Extended user data |
| Organization | `socials`, `links`, `scripts`, `previews` | Organization configuration |

---

## Link Tables (Many-to-Many)

| Table | Source → Target | Purpose |
|-------|----------------|---------|
| `CourseChapter` | Course → Chapter | Ordered chapter membership |
| `ChapterActivity` | Chapter → Activity | Ordered activity membership |
| `CollectionCourse` | Collection → Course | Course grouping |
| `UserOrganization` | User → Organization | Org membership with role |
| `UserGroupUser` | UserGroup → User | Group membership |
| `UserGroupResource` | UserGroup → Resource | Resource access control |
| `ResourceAuthor` | Resource → User | Authorship tracking (CREATOR, MAINTAINER, CONTRIBUTOR) |

---

## Activity Type Enum

```python
class ActivityTypeEnum(str, Enum):
    TYPE_VIDEO = "TYPE_VIDEO"
    TYPE_DOCUMENT = "TYPE_DOCUMENT"
    TYPE_DYNAMIC = "TYPE_DYNAMIC"
    TYPE_ASSIGNMENT = "TYPE_ASSIGNMENT"
    TYPE_CUSTOM = "TYPE_CUSTOM"
    TYPE_SCORM = "TYPE_SCORM"
```

Each type has corresponding `ActivitySubTypeEnum` values for finer granularity.

---

## Lock Types

Chapters and activities use a three-tier locking system:

```python
class ActivityLockType(str, Enum):
    PUBLIC = "public"           # Anyone can view
    AUTHENTICATED = "authenticated"  # Any logged-in user
    RESTRICTED = "restricted"   # Must be in an assigned UserGroup
```

Lock access is computed in `src/services/courses/locks.py` and the `is_locked` field on `ActivityRead` and `ChapterRead` is calculated dynamically based on the current user.

---

## UserGroup-Based Access Control

UserGroups enable pay-to-access patterns:

1. A course/chapter/activity is set to `restricted` lock type
2. One or more UserGroups are linked via `UserGroupResource`
3. Users must be members of a linked UserGroup to access the resource
4. When a UserGroup is tied to a `PaymentsOffer`, denied access returns **HTTP 402 Payment Required** with offer metadata

```python
async def check_usergroup_access(
    resource_uuid: str,
    user_id: int,
    db_session: Session,
) -> bool:
    # Returns True if no UserGroups linked, or user is a member
    # Raises HTTP 402 if resource is behind a paid offer's UserGroup
```

---

## Testing Database Configuration

Tests use an in-memory SQLite database with automatic JSONB-to-JSON remapping:

```python
# In conftest.py
@pytest.fixture
def engine():
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Remap JSONB columns to JSON for SQLite compatibility
    for table in SQLModel.metadata.tables.values():
        for col in table.columns:
            if isinstance(col.type, JSONB):
                col.type = JSON()
    SQLModel.metadata.create_all(eng)
    yield eng
    eng.dispose()
```

---

## Redis Usage

| Purpose | Key Pattern | TTL |
|---------|------------|-----|
| Session revocation | `jwt_revoked_before:{user_id}` | 30 days |
| Refresh token replay | `refresh_used:{user_id}:{jti}` | 30 days |
| Collab ydoc cache | `collab:ydoc:{board_uuid}` | 1 hour |
| Org caching | `org:{slug}:*` | Configurable |
| Course caching | `course:{uuid}:*` | Configurable |
| Rate limiting | `ratelimit:{endpoint}:{ip}` | Configurable |
