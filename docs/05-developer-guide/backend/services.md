# Services — Business Logic Layer

> The service layer contains all business logic, separating it from HTTP concerns in routers and data access in database models. Services are called by routers and orchestrate RBAC checks, database operations, cache invalidation, webhook dispatch, and analytics tracking.

---

## Service Layer Principles

1. **Routers are thin** — They validate input, call a service function, and return the result. No business logic lives in route handlers.
2. **Services handle RBAC** — Most service functions call `check_resource_access()` to verify the user has permission for the operation.
3. **Services own transactions** — A single service function typically performs multiple database operations in one request-response cycle.
4. **Services manage side effects** — Cache invalidation, webhook dispatch, and analytics tracking are triggered from services, not routers.

---

## Directory Structure

```
src/services/
├── admin/
│   └── admin.py                 # Admin operations
├── ai/
│   ├── ai.py                    # AI chat & completions
│   ├── base.py                  # Base AI provider
│   ├── courseplanning.py        # AI course planning
│   ├── editor.py                # AI editor assistance
│   ├── magicblocks.py           # Magic block generation
│   ├── init.py                  # AI initialization
│   └── rag/                     # RAG (retrieval augmented generation)
│       ├── content_extraction.py
│       ├── embedding_service.py
│       └── query_service.py
├── analytics/
│   ├── analytics.py             # Analytics tracking
│   ├── cache.py                 # Analytics cache
│   ├── events.py                # Event definitions
│   └── queries.py               # Analytics queries
├── api_tokens/
│   └── api_tokens.py            # API token validation
├── auth/
│   └── utils.py                 # Auth utility functions
├── blocks/
│   ├── block_types/             # Audio, Image, PDF, Video block handlers
│   └── utils/upload_files.py    # File upload utilities
├── boards/
│   ├── boards.py                # Board CRUD
│   └── boards_playground.py     # Board-playground integration
├── communities/
│   ├── communities.py           # Community CRUD
│   ├── discussions.py           # Discussion CRUD
│   ├── comments.py              # Comment management
│   ├── moderation.py            # Content moderation
│   ├── reactions.py             # Reaction management
│   ├── votes.py                 # Voting system
│   └── comment_votes.py         # Comment voting
├── courses/
│   ├── courses.py               # Course CRUD
│   ├── chapters.py              # Chapter CRUD, reordering
│   ├── activities/
│   │   ├── activities.py        # Activity CRUD
│   │   ├── assignments.py       # Assignment management
│   │   ├── video.py             # Video activity handling
│   │   ├── pdf.py               # PDF activity handling
│   │   ├── versioning.py        # Activity versioning
│   │   └── utils.py             # Activity content structure utilities
│   ├── certifications.py        # Certification management
│   ├── collections.py           # Collection CRUD
│   ├── contributors.py          # Contributor management
│   ├── locks.py                 # Lock-based access checks
│   ├── lock_usergroups.py       # UserGroup lock management
│   ├── thumbnails.py            # Thumbnail management
│   ├── updates.py               # Course update notifications
│   ├── cache.py                 # Course cache management
│   └── transfer/
│       ├── export_service.py    # Course export
│       ├── import_service.py    # Course import
│       └── storage_utils.py     # Storage utilities
├── dev/
│   └── dev.py                   # Dev mode utilities
├── email/
│   ├── utils.py                 # Email sending
│   └── translations.py          # Email translations
├── health/
│   └── health.py                # Health check logic
├── orgs/
│   ├── orgs.py                  # Organization CRUD
│   ├── users.py                 # Org user management
│   ├── invites.py               # Org invitation handling
│   ├── join.py                  # Org join flows
│   ├── uploads.py               # Org upload management
│   ├── usage.py                 # Org usage tracking
│   ├── cache.py                 # Org cache management
│   └── custom_domains.py        # Custom domain management
├── packs/
│   └── packs.py                 # Pack management
├── playgrounds/
│   ├── playgrounds.py           # Playground CRUD
│   └── playgrounds_generator.py # AI playground generation
├── podcasts/
│   ├── podcasts.py              # Podcast CRUD
│   ├── episodes.py              # Episode CRUD
│   └── thumbnails.py            # Podcast thumbnail management
├── roles/
│   └── roles.py                 # Role CRUD
├── search/
│   └── search.py                # Search functionality
├── security/
│   ├── rate_limiting.py         # Rate limiting logic
│   ├── account_lockout.py       # Account lockout logic
│   └── password_validation.py   # Password policy validation
├── setup/
│   └── setup.py                 # Initial setup logic
├── trail/
│   └── trail.py                 # Learning trail tracking
├── users/
│   ├── users.py                 # User CRUD
│   ├── usergroups.py            # UserGroup CRUD
│   ├── avatars.py               # Avatar management
│   ├── emails.py                # Email management
│   ├── email_verification.py    # Email verification logic
│   └── password_reset.py        # Password reset logic
├── utils/
│   ├── link_preview.py          # Link preview generation
│   ├── ssrf_guard.py            # SSRF protection
│   ├── upload_content.py        # Content upload
│   └── video_streaming.py       # Video streaming logic
├── webhooks/
│   ├── webhooks.py              # Webhook CRUD
│   ├── dispatch.py              # Webhook dispatch
│   ├── events.py                # Webhook event definitions
│   └── crypto.py                # Webhook signature generation
└── explore/
    └── explore.py               # Explore/discovery logic
```

---

## Service Function Pattern

Service functions follow a consistent pattern:

```python
async def create_chapter(
    request: Request,
    chapter_object: ChapterCreate,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
) -> ChapterRead:
    # 1. Model validation
    chapter = Chapter.model_validate(chapter_object)

    # 2. Load related data
    statement = select(Course).where(Course.id == chapter_object.course_id)
    course = db_session.exec(statement).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 3. RBAC check
    await check_resource_access(request, db_session, current_user, 
                                course.course_uuid, AccessAction.CREATE)

    # 4. Business logic
    chapter.chapter_uuid = f"chapter_{uuid4()}"
    chapter.creation_date = str(datetime.now())
    chapter.org_id = course.org_id

    # 5. Database operations (with atomic ordering)
    max_order = db_session.exec(
        select(func.max(CourseChapter.order))
        .where(CourseChapter.course_id == chapter.course_id)
    ).first()
    chapter.order = (max_order or 0) + 1

    db_session.add(chapter)
    db_session.flush()

    # 6. Return response model
    return ChapterRead(**chapter.model_dump(), activities=[])
```

---

## RBAC Integration

Services use `check_resource_access()` from `src/security/rbac/` for authorization. This function handles all user types:

| User Type | Auth Method |
|-----------|------------|
| `PublicUser` | JWT-authenticated user — checked via roles, authorship, and UserGroup membership |
| `AnonymousUser` | Unauthenticated visitor — checked against public flags only |
| `APITokenUser` | API token — checked via token-scoped permissions and org boundary |

```python
from src.security.rbac import check_resource_access, AccessAction

await check_resource_access(
    request, 
    db_session, 
    current_user, 
    resource_uuid, 
    AccessAction.READ,
)
```

---

## Lock-Based Access Control

Chapters and activities support three lock tiers, enforced by `src/services/courses/locks.py`:

| Lock Type | Access Requirement |
|-----------|-------------------|
| `public` | Anyone (including anonymous) |
| `authenticated` | Any signed-in user |
| `restricted` | UserGroup membership or org admin |

Batch helpers avoid N+1 queries when loading tables of contents:

```python
from src.services.courses.locks import is_locked_for_user, batch_accessible_restricted_uuids

# Batch check for multiple resources
accessible = batch_accessible_restricted_uuids(user_id, resource_uuids, db_session)

# Single resource check
locked = is_locked_for_user(lock_type, resource_uuid, org_id, current_user, db_session)
```

---

## Side Effects

Services commonly trigger these side effects after successful operations:

### Cache Invalidation

The database event system (`src/core/events/database.py`) automatically invalidates Redis caches on commit for org slugs, course UUIDs, and activity/chapter changes.

### Webhook Dispatch

Webhooks are dispatched asynchronously via `src/services/webhooks/dispatch.py`. Dispatch is typically patched in tests via the `bypass_webhooks` fixture.

### Analytics Tracking

Analytics events are tracked via `src/services/analytics/analytics.py`. Tracking is patched in tests via the `bypass_analytics` fixture.

---

## Service Layer Examples

### Read Operation (with access control)

```python
async def get_course(
    request: Request,
    course_uuid: str,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    db_session: Session,
) -> CourseRead:
    course = db_session.exec(
        select(Course).where(Course.course_uuid == course_uuid)
    ).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    await check_resource_access(request, db_session, current_user, 
                                course_uuid, AccessAction.READ)

    authors = db_session.exec(
        select(ResourceAuthor).where(
            ResourceAuthor.resource_uuid == course_uuid,
            ResourceAuthor.authorship_status == ResourceAuthorshipStatusEnum.ACTIVE,
        )
    ).all()

    return CourseRead(
        **course.model_dump(),
        authors=[
            AuthorWithRole(
                user_id=a.user_id,
                authorship=a.authorship,
                user_name=a.user_name,
            ) for a in authors
        ],
    )
```

### Write Operation (with ordering)

```python
async def reorder_chapters_and_activities(
    request: Request,
    course_uuid: str,
    order_data: ChapterUpdateOrder,
    current_user: PublicUser,
    db_session: Session,
):
    # Validate course exists
    course = db_session.exec(
        select(Course).where(Course.course_uuid == course_uuid)
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # RBAC check
    await check_resource_access(request, db_session, current_user,
                                course_uuid, AccessAction.UPDATE)

    # Bulk reorder: delete existing links, recreate with new order
    for chapter_order in order_data.chapters:
        # Create/update CourseChapter and ChapterActivity links
        ...
    
    db_session.commit()
```
