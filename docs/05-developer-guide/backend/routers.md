# API Route Organization

> All API routes are registered centrally in `src/router.py` under a single `v1_router` with prefix `/api/v1`, organized by domain with consistent authentication and authorization dependency chains.

---

## Route Registration

Route registration happens in `apps/api/src/router.py`. A single `APIRouter(prefix="/api/v1")` is created and all domain routers are included with their respective prefixes, tags, and dependency chains.

```python
from fastapi import APIRouter

v1_router = APIRouter(prefix="/api/v1")
```

Each domain router is a standard FastAPI `APIRouter` instance defined in its own file under `src/routers/`. The central registration is the single source of truth for which routes exist and what dependencies they require.

---

## Authentication Dependencies

Two key dependency helpers are defined in `router.py`:

### `get_non_api_token_user`

Rejects API token access but still admits `AnonymousUser`. Used on routers that have at least one deliberately public endpoint (e.g., courses, chapters, activities where public courses should be readable without authentication).

```python
async def get_non_api_token_user(user=Depends(get_current_user)):
    return await require_non_api_token_user(user)
```

### `require_authenticated_user`

Requires a real authenticated session AND rejects API tokens. Used on routers where every endpoint requires authentication (admin, analytics, code execution, etc.).

```python
require_authenticated_user = get_authenticated_non_api_token_user
```

---

## Complete Route Map

### Authentication & Users

| Prefix | Tags | Dependencies |
|--------|------|-------------|
| `/api/v1/auth` | auth | None (public) |
| `/api/v1/users` | users | `get_non_api_token_user` |
| `/api/v1/usergroups` | usergroups | `require_authenticated_user`, `require_plan_for_usergroups` |

### Organizations & Roles

| Prefix | Tags | Dependencies |
|--------|------|-------------|
| `/api/v1/orgs` | orgs | `get_non_api_token_user` |
| `/api/v1/orgs` | ai-credits | `require_authenticated_user` |
| `/api/v1/roles` | roles | `require_authenticated_user` |
| `/api/v1/orgs` | api-tokens | `require_authenticated_user`, `require_plan("pro")` |
| `/api/v1/orgs` | webhooks | `require_authenticated_user`, `require_plan("pro")` |
| `/api/v1/orgs` | custom-domains | `require_authenticated_user`, `require_plan("standard")` |
| `/api/v1/internal` | custom-domains-internal | Internal key |
| `/api/v1/internal/packs` | packs-internal | Platform key |

### Courses & Content

| Prefix | Tags | Dependencies |
|--------|------|-------------|
| `/api/v1/courses` | courses | None (mixed public/auth) |
| `/api/v1/courses` | migration | `require_authenticated_user` |
| `/api/v1/chapters` | chapters | None (mixed) |
| `/api/v1/activities` | activities | None (mixed) |
| `/api/v1/collections` | collections | None (mixed) |
| `/api/v1/assignments` | assignments | `require_authenticated_user` |
| `/api/v1/blocks` | blocks | `get_non_api_token_user` |
| `/api/v1/certifications` | certifications | `require_plan_for_certifications("pro")` |

### Communities & Discussions

| Prefix | Tags | Dependencies |
|--------|------|-------------|
| `/api/v1/communities` | communities | `require_plan_for_community("standard")` |
| (none, uses path params) | discussions | `require_plan_for_community("standard")` |

### Podcasts

| Prefix | Tags | Dependencies |
|--------|------|-------------|
| `/api/v1/podcasts` | podcasts | None |
| `/api/v1/podcasts` | podcasts, episodes | None |

### Boards & Playgrounds

| Prefix | Tags | Dependencies |
|--------|------|-------------|
| `/api/v1/boards` | boards | `get_non_api_token_user`, `require_plan_for_boards("pro")` |
| `/api/v1/boards` | boards-internal | None (internal router) |
| `/api/v1/boards` | boards, boards-playground | `require_authenticated_user`, `require_plan_for_boards("pro")` |
| `/api/v1/playgrounds` | playgrounds | `require_authenticated_user`, `require_plan_for_playgrounds("pro")` |

### AI & Analytics

| Prefix | Tags | Dependencies |
|--------|------|-------------|
| `/api/v1/ai` | ai | `require_authenticated_user` |
| `/api/v1/ai` | ai, magicblocks | `require_authenticated_user` |
| `/api/v1/ai` | ai, courseplanning | `require_authenticated_user` |
| `/api/v1/ai` | ai, rag | `require_authenticated_user` |
| `/api/v1/analytics` | analytics | `require_authenticated_user` |
| `/api/v1/trail` | trail | `require_authenticated_user` |

### Utilities & System

| Prefix | Tags | Dependencies |
|--------|------|-------------|
| `/api/v1/code` | code-execution | `require_authenticated_user` |
| `/api/v1/code/submissions` | code_submissions | `require_authenticated_user` |
| `/api/v1/instance` | instance | None (public) |
| `/api/v1/plans` | plans | None (public) |
| `/api/v1/search` | search | None (mixed) |
| `/api/v1/health` | health | `get_non_api_token_user` |
| `/api/v1/dev` | dev | `isDevModeEnabledOrRaise`, `get_non_api_token_user` |
| `/api/v1/utils` | utils | `require_authenticated_user` |
| `/api/v1/stream` | stream | `get_non_api_token_user` |
| `/api/v1/admin` | admin | None |
| `/api/v1/integrations/zapier` | integrations, zapier | None |

### Enterprise Edition

```python
register_ee_routers(v1_router)
```

EE routers are registered via hook and add premium features (payments, advanced analytics) when the EE module is present.

---

## Route Handler Patterns

### Pattern 1: Thin Handler (delegates to service)

Most routes follow this pattern — the handler validates input, calls a service function, and returns the result:

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session
from src.core.events.database import get_db_session
from src.security.auth import get_current_user
from src.services.courses.chapters import create_chapter

router = APIRouter()

@router.post("/")
async def api_create_chapter(
    chapter_object: ChapterCreate,
    request: Request,
    current_user: Union[PublicUser, AnonymousUser] = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    return await create_chapter(request, chapter_object, current_user, db_session)
```

### Pattern 2: RBAC Dependency Injection

Some routes use declarative RBAC dependencies for cleaner access control:

```python
from src.security.rbac.dependencies import require_read_access, require_write_access

@router.get("/{course_uuid}")
async def get_course(
    course_uuid: str,
    access: AccessDecision = Depends(require_read_access("course_uuid")),
    db_session: Session = Depends(get_db_session),
):
    # Access already verified by dependency
    ...
```

### Pattern 3: Mixed Public/Auth Routes

Routers like `courses`, `chapters`, and `activities` have both public endpoints (for viewing published content) and authenticated endpoints (for management). The `get_non_api_token_user` dependency allows anonymous access while still extracting the user identity when available:

```python
@router.get("/{course_id}/page/{page}/limit/{limit}")
async def get_course_chapters(
    request: Request,
    current_user: Union[PublicUser, AnonymousUser] = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    # current_user may be AnonymousUser — service handles access control
    return await get_chapters_service(...)
```

---

## Router File Organization

```
src/routers/
├── __init__.py
├── auth.py                    # Login, logout, refresh, OAuth, email verification
├── users.py                   # User CRUD
├── admin.py                   # Admin operations
├── health.py                  # Health checks
├── instance.py                # Public instance info
├── plans.py                   # Public plan listing
├── search.py                  # Search across resources
├── dev.py                     # Dev-only routes
├── stream.py                  # Video streaming
├── utils.py                   # Utility endpoints
├── webhooks.py                # Webhook management
├── api_tokens.py              # API token CRUD
├── orgs/
│   ├── orgs.py                # Organization CRUD
│   ├── ai_credits.py          # AI credit management
│   ├── custom_domains.py      # Custom domain management
│   └── packs.py               # Pack management
├── courses/
│   ├── courses.py             # Course CRUD, export, import
│   ├── chapters.py            # Chapter CRUD, reordering
│   ├── collections.py         # Collection CRUD
│   ├── assignments.py         # Assignment management
│   ├── certifications.py      # Certification management
│   ├── migration.py           # Course migration
│   └── activities/
│       ├── activities.py      # Activity CRUD
│       └── blocks.py          # Content block management
├── communities/
│   ├── communities.py         # Community CRUD
│   └── discussions.py         # Discussion CRUD, comments, votes, reactions
├── podcasts/
│   ├── podcasts.py            # Podcast CRUD
│   └── episodes.py            # Episode CRUD
├── boards/
│   ├── boards.py              # Board CRUD
│   └── boards_playground.py   # Board playground integration
├── playgrounds/
│   ├── playgrounds.py         # Playground CRUD
│   └── playgrounds_generator.py  # AI playground generation
├── ai/
│   ├── ai.py                  # AI chat and completion
│   ├── magicblocks.py         # Magic block generation
│   ├── courseplanning.py      # AI course planning
│   └── rag.py                 # RAG (retrieval augmented generation)
├── analytics.py               # Analytics endpoints (Tinybird integration)
├── code_execution.py          # Code execution sandbox
├── code_submissions.py        # Code submission management
├── integrations/
│   └── zapier.py              # Zapier integration
├── content_files.py           # S3 content delivery
├── local_content.py           # Local content delivery
├── roles.py                   # Role CRUD
├── usergroups.py              # UserGroup CRUD
├── trail.py                   # Learning trail tracking
└── ... (EE routers added dynamically)
```
