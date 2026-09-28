# Test Plan Generation

This is the **meta-guide** — it teaches an agent how to decompose any new API feature into atomic test units, select the correct templates, and generate a complete test plan.

Read this when:
- The feature combines multiple concerns (e.g., CRUD + file upload + state machine)
- You are unsure which templates to combine
- You want to generate a test plan before writing any code

---

## Step 1: Decompose the Feature

Every feature can be broken down into **atomic test units**. Each unit maps to exactly one template.

### Decomposition Questions

Ask these questions about the feature:

| Question | Identifies |
|----------|-----------|
| Does it create, read, update, or delete a resource? | CRUD unit |
| Does it toggle a boolean field (publish/unpublish, enable/disable)? | Boolean toggle unit |
| Does it accept a file upload? | File upload unit |
| Does it return a paginated list with search/filter/sort? | Search/filter unit |
| Does it enforce a permission or role check? | Authz unit |
| Does it receive an incoming webhook? | Webhook unit |
| Does it call an external API (Stripe, S3, Resend)? | External API unit |
| Does it have a multi-step workflow with state transitions? | State machine unit |
| Does it call an AI/LLM? | AI/LLM unit |
| Does it load a plugin or MCP tool? | Plugin/MCP unit |
| Does it emit events that trigger downstream actions? | Async event unit |

### Example: Course Creation with Approval Workflow

```
Feature: Course creation with admin approval
├── CRUD unit (create course as draft)          → 06-template-crud.md
├── State machine unit (draft→pending→approved) → 13-template-state-machine.md
├── Authz unit (only admin can approve)         → 10-template-authz.md
└── Async event unit (notify on approval)       → 16-template-async-event.md
```

### Example: Community with Thumbnail Upload and Publishing

```
Feature: Community with thumbnail + publish/unpublish
├── CRUD unit (create/read/update/delete)       → 06-template-crud.md
├── File upload unit (thumbnail)                → 08-template-upload.md
└── Boolean toggle unit (publish/unpublish)     → 07-template-boolean.md
```

### Example: AI Content Generator with MCP Plugin

```
Feature: AI course content generator with MCP plugin
├── AI/LLM unit (generate content)              → 14-template-ai-llm.md
├── Plugin/MCP unit (load content plugin)       → 15-template-plugin.md
└── External API unit (call LLM provider)       → 12-template-external-api.md
```

---

## Step 2: Select Templates

For each atomic unit identified in Step 1, select the corresponding template:

| Unit Type | Template |
|-----------|----------|
| CRUD | [06-template-crud.md](./06-template-crud.md) |
| Boolean toggle | [07-template-boolean.md](./07-template-boolean.md) |
| File upload | [08-template-upload.md](./08-template-upload.md) |
| Search/filter | [09-template-search.md](./09-template-search.md) |
| Authz | [10-template-authz.md](./10-template-authz.md) |
| Webhook | [11-template-webhook.md](./11-template-webhook.md) |
| External API | [12-template-external-api.md](./12-template-external-api.md) |
| State machine | [13-template-state-machine.md](./13-template-state-machine.md) |
| AI/LLM | [14-template-ai-llm.md](./14-template-ai-llm.md) |
| Plugin/MCP | [15-template-plugin.md](./15-template-plugin.md) |
| Async event | [16-template-async-event.md](./16-template-async-event.md) |

---

## Step 3: Determine Test Level per Unit

Each unit can be tested at one or more levels:

| Level | Where | When to Use |
|-------|-------|-------------|
| Router | `src/tests/routers/` | Always — this is the minimum |
| Service | `src/tests/services/` | Complex business logic, DB state assertions |
| Integration | `src/tests/integration/` | Cross-layer flows without mocks |

**Rule of thumb:**
- Simple CRUD → Router level only
- CRUD with business logic → Router + Service level
- Cross-layer features → Add Integration level

---

## Step 4: Identify Shared Fixtures

List the fixtures each unit needs:

| Unit | Typical Fixtures |
|------|------------------|
| CRUD | `db`, `org`, `admin_user`, `client` |
| Boolean toggle | `db`, `org`, `admin_user`, `client`, the resource to toggle |
| File upload | `db`, `org`, `admin_user`, `client`, the target resource |
| Search/filter | `db`, `org`, `admin_user`, `client`, multiple resources |
| Authz | `db`, `org`, `other_org`, `admin_user`, `regular_user`, `anonymous_user`, `client` |
| State machine | `db`, `org`, `admin_user`, `client`, the resource in initial state |
| AI/LLM | `db`, `org`, `admin_user`, `client`, mock LLM response |
| Plugin/MCP | `db`, `org`, `admin_user`, `client`, plugin config fixture |
| Async event | `db`, `org`, `admin_user`, `client`, event spy fixture |

---

## Step 5: Generate the Test Plan

Use this template to document your test plan:

```markdown
# Test Plan: {Feature Name}

## Atomic Units

| # | Unit Type | Template | Test Level | Fixtures Needed |
|---|-----------|----------|------------|-----------------|
| 1 | {type} | {template} | {level} | {fixtures} |
| 2 | {type} | {template} | {level} | {fixtures} |

## Test Files

| File | Units Covered |
|------|---------------|
| `src/tests/routers/test_{feature}_router.py` | {units} |
| `src/tests/services/test_{feature}_service.py` | {units} |

## Execution Order

1. Router tests first (fastest feedback)
2. Service tests (business logic verification)
3. Integration tests (cross-layer verification)
4. Live validation (optional, manual)

## Checklist

Attach [19-checklist.md](./19-checklist.md) with each item checked off.
```

---

## Example: Generated Plan for "Community Thumbnail Upload"

```markdown
# Test Plan: Community Thumbnail Upload

## Atomic Units

| # | Unit Type | Template | Test Level | Fixtures Needed |
|---|-----------|----------|------------|-----------------|
| 1 | CRUD | 06-template-crud.md | Router | db, org, admin_user, client |
| 2 | File upload | 08-template-upload.md | Router | db, org, admin_user, client, community |
| 3 | Authz | 10-template-authz.md | Router | db, org, other_org, admin_user, regular_user, anonymous_user, client |

## Test Files

| File | Units Covered |
|------|---------------|
| `src/tests/routers/test_communities_router.py` | CRUD + Upload + Authz |

## Execution Order

1. Router tests
2. Live validation (optional)

## Checklist

Attach 19-checklist.md with all items checked.
```

---

## Step 6: Combine Templates into One Test File

When combining multiple templates into one test file:

1. **Order tests by dependency**: CRUD tests first (create the resource), then feature-specific tests (upload, toggle, etc.)
2. **Share fixtures across units**: One `app` fixture, one `client` fixture, etc.
3. **Use descriptive test method names**: `test_community_endpoints` (CRUD), `test_community_thumbnail_endpoint_branches` (upload)
4. **Group assertions logically**: Happy path first, then authz, then errors

### Example structure for combined test file:

```python
class TestFeatureName:
    """Tests for {feature}."""

    # --- Happy Path ---
    async def test_create_and_read(self, ...): ...
    async def test_update_and_delete(self, ...): ...

    # --- Feature-Specific ---
    async def test_upload(self, ...): ...
    async def test_toggle(self, ...): ...
    async def test_workflow(self, ...): ...

    # --- Authz ---
    async def test_cross_org_isolation(self, ...): ...
    async def test_regular_user_restricted(self, ...): ...
    async def test_anonymous_access(self, ...): ...

    # --- Errors ---
    async def test_nonexistent_resource(self, ...): ...
    async def test_invalid_payload(self, ...): ...
```

---

## Rules Summary

| Rule | Detail |
|------|--------|
| Always decompose first | Do not jump to writing tests without a plan |
| One atomic unit per template | If a feature has 3 concerns, use 3 templates |
| Router tests are mandatory | Service and integration tests are additive |
| Generate the plan before code | The plan guides both implementation and testing |
| Document the plan in the PR | Attach the generated plan to the pull request |
