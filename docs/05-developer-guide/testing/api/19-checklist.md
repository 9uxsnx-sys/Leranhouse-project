# Mandatory Testing Checklist

This is the **gate** that every new API feature must pass before it can be considered complete. Do not skip any item. If an item does not apply, mark it as N/A and explain why.

---

## How to Use

1. Create a copy of this checklist for your feature
2. Check off each item as you complete it
3. Link to the test file(s) that satisfy each requirement
4. Attach the completed checklist to your PR or commit

---

## Pre-Testing Setup

- [ ] I have read [01-infrastructure.md](./01-infrastructure.md) — understand fixtures, DB setup, and bypass patterns
- [ ] I have read [02-writing-router-tests.md](./02-writing-router-tests.md) — understand how to test endpoints
- [ ] I have read [03-writing-service-tests.md](./03-writing-service-tests.md) — understand how to test business logic
- [ ] I have read [04-writing-security-tests.md](./04-writing-security-tests.md) — understand authz patterns
- [ ] I have read [05-writing-integration-tests.md](./05-writing-integration-tests.md) — understand cross-layer flows
- [ ] I have selected the correct template(s) from 06-16 that match my feature
- [ ] If the feature combines multiple concerns, I have read [20-plan-generation.md](./20-plan-generation.md) to decompose it

---

## Template Selection

- [ ] I identified which template(s) apply to this feature
- [ ] If multiple templates apply, I created a test plan using 20-plan-generation.md
- [ ] If no template applies exactly, I used the closest match and adapted

---

## Phase A: Happy Path (CRUD)

- [ ] CREATE succeeds with valid data (200/201)
- [ ] READ (single) returns the created resource
- [ ] READ (list) returns paginated results
- [ ] UPDATE succeeds with valid data
- [ ] DELETE succeeds
- [ ] All happy-path assertions verify **both** status code and response body shape

---

## Phase B: Authz Boundary

- [ ] Admin user can perform all operations
- [ ] Regular user with read permission can LIST and GET
- [ ] Regular user cannot CREATE, UPDATE, or DELETE (403)
- [ ] User from another org cannot access the resource (403 or 404)
- [ ] Feature gate / permission check works correctly

---

## Phase C: Error / Edge Cases

- [ ] GET non-existent UUID returns 404
- [ ] DELETE non-existent UUID returns 404
- [ ] CREATE with invalid/missing fields returns 422
- [ ] UPDATE with invalid/missing fields returns 422
- [ ] CREATE with duplicate unique field returns 400/409
- [ ] Idempotency: same operation twice does not error (if applicable)
- [ ] Empty list returns 200 with `{"items": [], "total": 0}` (if applicable)

---

## Phase D: Anonymous Access

- [ ] Anonymous user cannot access private resources (401)
- [ ] Anonymous user can access public resources (if applicable)

---

## Feature-Specific Checks

### Boolean Toggle (publish/unpublish, enable/disable)
- [ ] Toggle on sets the field to true
- [ ] Toggle off sets the field to false
- [ ] Toggle is idempotent (toggle on twice is not an error)
- [ ] Toggle affects read behavior (published resources visible, unpublished hidden)

### File Upload
- [ ] Upload succeeds with valid file
- [ ] Upload without file returns 422
- [ ] Upload to non-existent resource returns 404
- [ ] Anonymous user cannot upload

### Search / Filter / List
- [ ] Default pagination returns correct number of items
- [ ] Search by name returns matching results
- [ ] Boolean filter works
- [ ] Sort by name works
- [ ] Invalid sort field returns 422
- [ ] Empty list returns 200 with empty items

### Webhook
- [ ] Valid signature processes successfully
- [ ] Invalid signature returns 401/403
- [ ] Duplicate idempotency key returns 200 (not an error)
- [ ] Malformed payload returns 422

### External API
- [ ] External API success returns correct response
- [ ] External API error returns fallback/error
- [ ] External API timeout triggers retry (if applicable)
- [ ] Unexpected response format is handled gracefully
- [ ] API keys are not exposed in error messages or logs

### State Machine / Workflow
- [ ] Valid transitions succeed
- [ ] Invalid transitions return 400/409
- [ ] Full workflow completes (e.g., draft -> pending -> approved)
- [ ] Rejection rolls back state correctly
- [ ] Idempotent transitions (same transition twice)

### AI / LLM
- [ ] Prompt context is correct
- [ ] Valid LLM response is parsed correctly
- [ ] Invalid JSON from LLM triggers retry (if applicable)
- [ ] Hallucinated/unsafe content is rejected
- [ ] Prompt injection is blocked
- [ ] LLM timeout is handled gracefully

### Plugin / MCP
- [ ] Valid plugin config is loaded
- [ ] Invalid plugin config is rejected with clear error
- [ ] Plugin tools are discoverable
- [ ] Plugin crash does not crash the host
- [ ] Plugin timeout triggers fallback

### Async Event Chain
- [ ] Event is emitted at the correct point in the workflow
- [ ] All subscribers receive the event
- [ ] A failed subscriber does not block other subscribers
- [ ] Duplicate events are handled idempotently
- [ ] Event payload matches the expected schema

---

## Integration Checks

- [ ] Router tests exist in `src/tests/routers/`
- [ ] Service tests exist in `src/tests/services/` (if business logic is complex)
- [ ] Security tests cover all user roles (admin, regular, cross-org, anonymous)
- [ ] Integration tests exist if the feature crosses multiple layers

---

## Coverage

- [ ] All new code paths are exercised by tests
- [ ] `pytest --co` passes (coverage >= 25%)
- [ ] Branch coverage is enabled and met

---

## Execution

- [ ] `pytest` passes with no failures
- [ ] `pytest -x` passes (no hidden failures)
- [ ] Tests are deterministic (same result every run)
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] (Optional) Live validation probe confirms behavior

---

## CI

- [ ] Test file is included in the test discovery path
- [ ] CI pipeline runs the new tests
- [ ] Coverage threshold is maintained

---

## Checklist Completion

| Item | Status | Link to Test File |
|------|--------|-------------------|
| Phase A: Happy Path | [ ] | |
| Phase B: Authz Boundary | [ ] | |
| Phase C: Error/Edge Cases | [ ] | |
| Phase D: Anonymous | [ ] | |
| Feature-Specific Checks | [ ] | |
| Integration Checks | [ ] | |
| Coverage Met | [ ] | |
| All Tests Pass | [ ] | |

**Signed off by:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
