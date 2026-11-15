# Database Layer

> Status: as-built · Last verified: 2026-11-15

LearnHouse uses PostgreSQL with SQLModel (SQLAlchemy + Pydantic) for the ORM, Alembic for migrations, and Redis for caching.

---

## Technology Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| Database | PostgreSQL | With pgvector extension for RAG |
| ORM | SQLModel 0.0.38 | SQLAlchemy + Pydantic integration |
| Migrations | Alembic 1.18.4 | With `alembic_postgresql_enum` |
| Connection | SQLAlchemy engine | Pool size 20, max overflow 10 |
| Cache | Redis | Session revocation, public course lists, org cache |
| Package Manager | uv | `uv sync` / `uv run`, replaces pip/poetry |

---

## Database Engine & Sessions

Database connection management lives in `src/core/events/database.py`. The production/dev engine uses the configured connection string:

```python
engine = create_engine(
    learnhouse_config.database_config.sql_connection_string,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
    pool_recycle=300,  # 5 minutes
    pool_timeout=30,
)
```

When `TESTING=true`, this module creates an in-memory SQLite engine (`sqlite:///:memory:`). Test modules normally use their own engine from `conftest.py` instead (see `docs/05-developer-guide/testing/api/01-infrastructure.md`).

The `get_db_session` FastAPI dependency provides a SQLModel Session per request:

```python
def get_db_session():
    with Session(engine) as session:
        yield session
```

### Pool Monitoring

SQLAlchemy events are registered for pool monitoring in non-test mode:
- `connect` — Logs new connections
- `checkout` — Tracks connection checkout
- `checkin` — Tracks connection return

### Key Models

Table names follow SQLModel's default (lowercased class name) unless a model sets `__tablename__`.

| Model | Table | Purpose |
|-------|-------|---------|
| `Organization` | `organization` | Tenant orgs with custom domains and config |
| `Course` | `course` | Courses with published, public, access_type, pricing fields |
| `Chapter` | `chapter` | Course module (name, description, thumbnail, lock_type) |
| `CourseChapter` | `coursechapter` | Ordered course → chapter membership |
| `Activity` | `activity` | Individual lesson |
| `ChapterActivity` | `chapteractivity` | Ordered chapter → activity membership |
| `Collection` | `collection` | Course/podcast bundles |
| `CollectionCourse` | `collectioncourse` | Polymorphic bundle membership (`resource_type` + `resource_uuid`) |
| `CollectionUser` | `collectionuser` | User's collected bundles |
| `Community` | `community` | Course/podcast-linked social space (`resource_type` + `resource_uuid`) |
| `CommunityTranslation` | `community_translation` | One locale of a community |
| `CourseTranslation` | `course_translation` | One locale of a course |
| `CollectionTranslation` | `collection_translation` | One locale of a collection |
| `PodcastTranslation` | `podcast_translation` | One locale of a podcast |
| `PodcastEpisodeTranslation` | `podcast_episode_translation` | One locale of an episode |
| `User` | `user` | Platform users |
| `UserGroup` | `usergroup` | Access groups for resource gating |
| `Certifications` | `certifications` | Per-course certificate config |
| `CertificateUser` | `certificateuser` | Issued certificate for a user |
| `Trail` | `trail` | Learner's trail per org |
| `TrailRun` | `trailrun` | One course/podcast run inside a trail |
| `TrailStep` | `trailstep` | Per-step progress inside a run |
| `Notification` | `notification` | Notification content row |
| `NotificationRecipient` | `notification_recipient` | Per-user read/muted state |
| `NotificationTemplate` | `notification_template` | Per-org template overrides |
| `WebhookEndpoint` | `webhook_endpoint` | Org webhook subscriptions |
| `WebhookDeliveryLog` | `webhook_delivery_log` | Delivery attempts |
| `OrgPack` | `orgpack` | AI-credit / member-seat packs |
| `Playground` | `playground` | Standalone HTML playgrounds |
| `APIToken` | `apitoken` | Hashed `lh_` API tokens |
| `CustomDomain` | `customdomain` | Org custom domains and verification state |
| `AnalyticsEvent` | `analytics_events` | Behavioral analytics events (timestamptz) |
| `PaymentOrder` | `paymentorder` | Chargily checkout lifecycle |
| `ResourceEntitlement` | `resourceentitlement` | Paid-resource access grant |
| `PaymentConfig` | `paymentconfig` | Per-org payment provider credentials |
| `PaymentWebhookEvent` | `paymentwebhookevent` | Chargily webhook idempotency log |
| `PayoutCost` | `payoutcost` | Manually entered monthly operating costs |

### Cache Invalidation on Commit

`_register_cache_invalidation_hooks()` tracks changes during the flush and invalidates after a successful commit:
- `Organization` insert/update/delete → clear org cache for the old and new slug
- `OrganizationConfig` changes → clear the parent org's cache
- `Course` changes → clear course list and course meta caches for that org/course
- `Activity`, `Chapter`, `ChapterActivity` changes → clear the parent course's meta cache

---

## Alembic Migrations

Migrations are configured in `migrations/env.py`. It loads the LearnHouse config, then **walks `src/db` itself** and imports every non-`__init__` Python module with `importlib.import_module` before assigning `target_metadata = SQLModel.metadata`. It does not call `import_all_models` (that helper lives in `src/core/events/database.py` and also scans `ee/db`).

```python
base_dir = 'src/db'
base_module_path = 'src.db'

for root, dirs, files in os.walk(base_dir):
    # ... build module path from the directory tree ...
    for file_name in module_files:
        importlib.import_module(f"{current_module_base}.{file_name[:-3]}")

target_metadata = SQLModel.metadata
```

Default connection string (from `alembic.ini`):

```
postgresql://learnhouse:learnhouse@localhost:5434/learnhouse
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
| `org_uuid` | String | Unique public identifier |
| `name` | String | Organization name |
| `slug` | String | Unique, indexed — used in URLs |
| `email` | String | Contact email |
| `description` | Text | Markdown description |
| `about` | Text | Detailed about section |
| `socials` | JSON | Social media links |
| `links` | JSON | External links |
| `scripts` | JSON | Custom scripts |
| `logo_image` / `logo_icon` | String | Branding images |
| `thumbnail_image` | String | Thumbnail URL |
| `previews` | JSON | Preview images |
| `explore` | Boolean | Visible in explore/discovery, indexed |
| `label` | String | Optional display label |

### User (`src/db/users.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Auto-increment |
| `username` | String | Unique username |
| `first_name` / `last_name` | String | Display name |
| `email` | EmailStr | Indexed email |
| `password` | String | Argon2 hash |
| `user_uuid` | String | Public UUID |
| `email_verified` / `email_verified_at` | Boolean / String | Email verification |
| `failed_login_attempts` | Integer | For account lockout |
| `locked_until` | String | Lockout expiration (ISO timestamp) |
| `last_login_at` / `last_login_ip` | String | Last successful login |
| `signup_method` | String | email, google, etc. |
| `is_superadmin` | Boolean | Bypasses all RBAC |
| `password_changed_at` | DateTime | For JWT revocation |
| `avatar_image` / `banner_image` | String | Profile images |
| `bio` | String | User biography |
| `details` / `profile` | JSON | Extended details |
| `extra_metadata` | JSONB | Extensible metadata |

### Course (`src/db/courses/courses.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Auto-increment |
| `org_id` | Integer, FK → Organization | Organization owner |
| `course_uuid` | String | Indexed, public identifier |
| `name` | String | Course name |
| `description` | Text | Course description |
| `about` / `learnings` / `tags` | Text | Editorial fields |
| `public` | Boolean | Legacy visibility flag, kept in sync with `access_type` |
| `published` | Boolean | Published status |
| `access_type` | Enum | `public`, `users_only`, `paid` |
| `price_amount` / `price_currency` | Integer / String | Paid pricing |
| `open_to_contributors` | Boolean | Contributor applications |
| `thumbnail_type` | Enum | `image`, `video`, `both` |
| `thumbnail_image` | String | Card cover image URL |
| `thumbnail_video` | String | Video thumbnail URL |
| `banner_image` | String | Hero banner image URL |
| `source_locale` | String | Locale of the base row |
| `seo` | JSONB | SEO metadata (OG, Twitter, JSON-LD) |
| `extra_metadata` | JSONB | Extensible metadata |
| `creation_date` / `update_date` | String | ISO dates |

Index: `(org_id, public, published, creation_date)`

### Chapter (`src/db/courses/chapters.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Auto-increment |
| `org_id` | Integer, FK → Organization | Organization owner |
| `course_id` | Integer, FK → Course | Parent course |
| `name` | String | Chapter name |
| `description` | String | Chapter description |
| `thumbnail_image` | String | Chapter thumbnail |
| `chapter_uuid` | String | Public identifier (indexed) |
| `lock_type` | Enum | `public`, `authenticated`, `restricted` |
| `extra_metadata` | JSONB | Extensible metadata |

Order is **not** on `Chapter`; it lives on `CourseChapter.order`.

### Activity (`src/db/courses/activities.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Auto-increment |
| `org_id` | Integer, FK → Organization | Organization owner |
| `course_id` | Integer, FK → Course | Parent course |
| `name` | String | Activity name |
| `activity_uuid` | String | Public identifier (indexed) |
| `activity_type` | Enum | TYPE_VIDEO, TYPE_DOCUMENT, TYPE_DYNAMIC, TYPE_ASSIGNMENT, TYPE_CUSTOM, TYPE_SCORM |
| `activity_sub_type` | Enum | Detailed subtype per type |
| `content` | JSON | Activity content (Prosemirror doc format) |
| `details` | JSON | Activity details |
| `published` | Boolean | Published status |
| `lock_type` | Enum | `public`, `authenticated`, `restricted` |
| `current_version` | Integer | Version counter |
| `last_modified_by_id` | Integer, FK → User | Last editor |
| `extra_metadata` | JSONB | Extensible metadata |

Order is **not** on `Activity`; it lives on `ChapterActivity.order`.

### Role (`src/db/roles.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer, PK | Seeded: Admin 1, Maintainer 2, Instructor 3, User 4 |
| `org_id` | Integer, FK → Organization | Null for global roles |
| `name` | String | Role name |
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

| Model | JSONB Column | Purpose |
|-------|-------------|---------|
| Course | `seo` | OG tags, Twitter cards, JSON-LD structured data |
| Course | `extra_metadata` | Custom course metadata |
| Chapter | `extra_metadata` | Custom chapter metadata |
| Activity | `extra_metadata` | Custom activity metadata |
| `Activity.content` / `details` | `content`, `details` | Rich text and activity-specific configuration (stored as JSON, not JSONB) |
| User | `extra_metadata` | Extended user data (`details`/`profile` are JSON) |
| Organization | `socials`, `links`, `scripts`, `previews` | Organization configuration (JSON) |

---

## Link Tables (Many-to-Many)

| Table | Source → Target | Purpose |
|-------|----------------|---------|
| `coursechapter` | Course → Chapter | Ordered chapter membership (`order`) |
| `chapteractivity` | Chapter → Activity | Ordered activity membership (`order`, unique per chapter+activity) |
| `collectioncourse` | Collection → resource | Polymorphic membership: `resource_type` (`course` / `podcast`) + `resource_uuid`; legacy nullable `course_id` stays in sync for course members |
| `userorganization` | User → Organization | Org membership with `role_id` |
| `usergroupuser` | UserGroup → User | Group membership |
| `usergroupresource` | UserGroup → resource | Resource access control by `resource_uuid` |
| `resourceauthor` | Resource → User | Authorship tracking (CREATOR, CONTRIBUTOR, MAINTAINER, REPORTER) with ACTIVE/PENDING/INACTIVE status |

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

Chapters (`LockType`) and activities (`ActivityLockType`) use the same three-tier locking system:

```python
class LockType(str, Enum):       # ActivityLockType has the same values
    PUBLIC = "public"                # Anyone, including anonymous
    AUTHENTICATED = "authenticated"  # Any signed-in user
    RESTRICTED = "restricted"        # Must be in an assigned UserGroup
```

Lock access is computed by `is_locked_for_user()` in `src/services/courses/locks.py`, and the `is_locked` field on `ActivityRead` and `ChapterRead` is calculated per request.

---

## UserGroup-Based Access Control

UserGroupResource links a group to a chapter, activity, course, or other resource by UUID:

1. A chapter/activity is set to `restricted`, or a course/podcast uses `users_only`
2. One or more UserGroups are linked via `UserGroupResource`
3. Users must be members of a linked UserGroup (org admins/maintainers bypass)
4. For course/podcast reads, the unified `ResourceAccessChecker` applies the access type: `public` (free), `users_only` (whitelist groups), or `paid` (active `ResourceEntitlement`, with linked groups as a bypass)

When a legacy blocking UserGroup is tied to an EE `PaymentsOffer`, `authorization_verify_based_on_roles_and_authorship()` raises **HTTP 402 Payment Required** with offer metadata. The database layer itself does not raise 402.

---

## Testing Database Configuration

Tests use an in-memory SQLite database with automatic JSONB-to-JSON remapping. The remap runs once at conftest import and again inside the `engine` fixture (so late-registered model modules are covered):

```python
# apps/api/src/tests/conftest.py
@pytest.fixture
def engine():
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    _make_schema_sqlite_compatible()
    SQLModel.metadata.create_all(eng)
    yield eng
    eng.dispose()
```

`_make_schema_sqlite_compatible()` swaps `JSONB` columns to `JSON` and drops Postgres cast defaults such as `'{}'::jsonb`.

---

## Redis Usage

| Purpose | Key Pattern | TTL |
|---------|------------|-----|
| Session revocation | `jwt_revoked_before:{user_id}` | Refresh-token lifetime (30 days) |
| Refresh token replay (helper defined, not called by `/auth/refresh`) | `refresh_used:{user_id}:{jti}` | Refresh-token lifetime (30 days) |
| Org by slug | `org_cache:slug:{slug}` | 2 minutes |
| Instance info | `org_cache:instance_info` | 10 minutes |
| Public course list | `courses_cache:*` | 1 minute |
| Course meta | `courses_cache:*` | 1 minute |
| Rate limiting | `rate_limit:{key}` | Configurable window |
| Failed-login IP tracking | `failed_login_ips:{user_id}` (HyperLogLog) | 30 minutes |
