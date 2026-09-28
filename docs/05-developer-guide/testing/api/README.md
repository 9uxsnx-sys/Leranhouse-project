# API Testing

This section covers testing for **backend API features** — endpoints, services, auth, integrations, AI, plugins, and event chains.

---

## How to Use This Guide

### If you are testing a simple feature (1-2 endpoints)
Read the documents **in order 01 through 05**, then jump to the matching template in **06-16**, then read **17-19**:

```
01-infrastructure.md   → Foundation (fixtures, DB, bypasses)
02-writing-router-tests.md   → How to test endpoints
03-writing-service-tests.md  → How to test business logic
04-writing-security-tests.md → How to test authz
05-writing-integration-tests.md → How to test cross-layer flows
06-16 (matching template)    → Copy-paste template
17-execution.md              → Run the tests
18-live-validation.md        → (Optional) curl smoke test
19-checklist.md              → Verify you covered everything
```

### If you are testing a complex feature (multiple endpoints, workflows)
Read the same documents above, then read **20-plan-generation.md** to learn how to decompose the feature into atomic test units and combine multiple templates.

---

## Template Index

| # | Template | When to Use |
|---|----------|-------------|
| 06 | [crud-resource.md](./06-template-crud.md) | New domain entity with full Create/Read/Update/Delete |
| 07 | [boolean-toggle.md](./07-template-boolean.md) | Publish/unpublish, enable/disable, lock/unlock |
| 08 | [file-upload.md](./08-template-upload.md) | Thumbnail, document, content file upload |
| 09 | [search-filter.md](./09-template-search.md) | Paginated listing with search/filter/sort |
| 10 | [authz-rule.md](./10-template-authz.md) | New permission, role check, feature gate |
| 11 | [webhook.md](./11-template-webhook.md) | Incoming webhook from external service |
| 12 | [external-api.md](./12-template-external-api.md) | Outgoing call to Stripe, S3, Resend, etc. |
| 13 | [state-machine.md](./13-template-state-machine.md) | Approval workflow, state transitions |
| 14 | [ai-llm.md](./14-template-ai-llm.md) | LLM call, AI content generation, hallucination safety |
| 15 | [plugin.md](./15-template-plugin.md) | Plugin/MCP contract, tool discovery, sandbox isolation |
| 16 | [async-event.md](./16-template-async-event.md) | Event-driven chains, notifications, multi-subscriber |

---

## How to Choose a Template

```
Is it a simple CRUD endpoint?              → 06-template-crud.md
Does it add a boolean field?               → 07-template-boolean.md
Does it accept a file upload?              → 08-template-upload.md
Does it return a paginated list?           → 09-template-search.md
Does it enforce a permission?              → 10-template-authz.md
Does it receive a callback from outside?   → 11-template-webhook.md
Does it call an external service?          → 12-template-external-api.md
Does it have a multi-step workflow?        → 13-template-state-machine.md
Does it call an AI/LLM?                    → 14-template-ai-llm.md
Does it load a plugin or MCP tool?         → 15-template-plugin.md
Does it emit events that trigger actions?  → 16-template-async-event.md
Multiple of the above?                     → 20-plan-generation.md
```
