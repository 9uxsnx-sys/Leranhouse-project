# API Route Organization

> Status: as-built · Last verified: 2026-11-15

> All API routes are mounted from one place: `apps/api/src/router.py`. Do not keep a hand-written route table in the docs — read that file.

---

## How Routers Are Mounted

There is a single `APIRouter` and every domain router is a plain `APIRouter` in its own file under `apps/api/src/routers/`:

```python
v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_non_api_token_user)],
)
```

Rules that `router.py` relies on:

- **Prefix** — `v1_router` owns `/api/v1`; each `include_router` adds its domain prefix (e.g. `/courses`, `/orgs`, `/payments`). Some routers already declare their own path internally and are mounted without a prefix (`discussions`, `notifications`).
- **Order matters** — the payments webhook router is included before the authenticated payments router so `/payments/webhook/...` wins over `/{org_id}` routes.
- **Plan gates** — feature routers add `Depends(require_plan(...))` / `require_plan_for_*` from `src/security/features_utils/plan_check.py` (API tokens, webhooks, custom domains, communities, boards, playgrounds, certifications, user groups).
- **Internal routers** — `custom_domains.internal_router` (`/internal`) and `packs.internal_router` (`/internal/packs`) are protected by internal/platform keys rather than user auth.
- **EE routers** — `register_ee_routers(v1_router)` is called from `router.py`; EE adds its own routers when `apps/api/ee` is present.

---

## Authentication Dependency Split

`router.py` defines two helpers on top of `src/security/api_token_utils.py`:

| Dependency | Behavior | Used for |
|------------|----------|----------|
| `get_non_api_token_user` | Rejects API-token principals but still admits `AnonymousUser` | Routers with at least one deliberately public endpoint: `users`, `orgs`, blocks, boards, health, stream, dev |
| `require_authenticated_user` | Alias of `get_authenticated_non_api_token_user`; requires a real session **and** rejects API tokens | Routers with no public endpoints: usergroups, roles, ai-credits, api-tokens, webhooks, migrations, assignments, trail, payments, AI, analytics, code execution, utils, notifications |

Routers that mix public and authenticated handlers (`courses`, course `access`, `chapters`, `activities`, `collections`, podcasts, search, admin, auth, instance, plans) mount with **no router-level auth dependency**; each handler applies its own checks.

Use these two helpers instead of hand-rolling the “no API tokens” rule per route.

---

## Tag Conventions

- Tags are lowercase and match the domain: `auth`, `users`, `courses`, `chapters`, `activities`, `collections`, `orgs`, `roles`, `boards`, `playgrounds`, `podcasts`, `communities`, `discussions`, `payments`, `notifications`, `analytics`, `trail`, `search`, `health`, `instance`, `plans`, `stream`, `utils`, `admin`, `dev`, `certifications`, `assignments`, `migration`, `api-tokens`, `webhooks`, `ai-credits`, `packs`, `custom-domains`, `code-execution`, `code_submissions`.
- Routers split across several files under one prefix reuse the domain tag and add a **secondary** tag: `["podcasts", "episodes"]`, `["ai", "magicblocks"]`, `["ai", "rag"]`, `["ai", "courseplanning"]`, `["boards", "boards-playground"]`, `["playgrounds", "playgrounds-generator"]`, `["integrations", "zapier"]`.
- Internal endpoints get an `*-internal` tag: `custom-domains-internal`, `packs-internal`, `boards-internal`.
- A prefix can be shared by multiple routers with different tags and dependencies — for example `/orgs` carries `orgs`, `ai-credits`, `api-tokens`, `webhooks`, `custom-domains` and `packs`, and `/courses` carries `courses` and `migration`.

Use the tag list in `router.py` as the source of truth when grouping endpoints in the API reference.
