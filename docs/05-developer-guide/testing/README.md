# Testing Guide

This section contains everything you need to test any feature on this platform. It is split into two domains:

## Which Section to Read

| You Are Working On | Read This First |
|---|---|
| **A backend API feature** (new endpoint, service function, auth rule, webhook, AI integration, state machine, plugin) | [api/README.md](./api/README.md) |
| **An agent capability** (new tool, new command, data query, multi-step conversation workflow) | [agent/README.md](./agent/README.md) |
| **Live validation** against a running server (curl-based smoke test) | [api/18-live-validation.md](./api/18-live-validation.md) |

---

## Quick Reference

| Document | What It Covers |
|---|---|
| [api/01-infrastructure.md](./api/01-infrastructure.md) | Test framework, fixtures, DB setup, bypass patches |
| [api/02-writing-router-tests.md](./api/02-writing-router-tests.md) | How to test HTTP endpoints with httpx AsyncClient |
| [api/03-writing-service-tests.md](./api/03-writing-service-tests.md) | How to test service/business logic functions |
| [api/04-writing-security-tests.md](./api/04-writing-security-tests.md) | How to test RBAC, cross-org isolation, anonymous access |
| [api/05-writing-integration-tests.md](./api/05-writing-integration-tests.md) | How to test cross-layer flows, admin API, webhooks |
| [api/06-template-crud.md](./api/06-template-crud.md) | Template: new CRUD resource |
| [api/07-template-boolean.md](./api/07-template-boolean.md) | Template: boolean toggle (publish/unpublish, enable/disable) |
| [api/08-template-upload.md](./api/08-template-upload.md) | Template: file upload |
| [api/09-template-search.md](./api/09-template-search.md) | Template: search/filter/paginated list |
| [api/10-template-authz.md](./api/10-template-authz.md) | Template: authorization rule |
| [api/11-template-webhook.md](./api/11-template-webhook.md) | Template: incoming webhook |
| [api/12-template-external-api.md](./api/12-template-external-api.md) | Template: third-party API mocking |
| [api/13-template-state-machine.md](./api/13-template-state-machine.md) | Template: state machine / approval workflow |
| [api/14-template-ai-llm.md](./api/14-template-ai-llm.md) | Template: AI/LLM integration |
| [api/15-template-plugin.md](./api/15-template-plugin.md) | Template: plugin/MCP contract testing |
| [api/16-template-async-event.md](./api/16-template-async-event.md) | Template: async event chain |
| [api/17-execution.md](./api/17-execution.md) | How to run tests, coverage, CI integration |
| [api/18-live-validation.md](./api/18-live-validation.md) | curl-based ad-hoc testing against running server |
| [api/19-checklist.md](./api/19-checklist.md) | Mandatory checklist for every new feature |
| [api/20-plan-generation.md](./api/20-plan-generation.md) | Meta-guide: decompose any feature into a test plan |
| [agent/README.md](./agent/README.md) | Agent testing entry point |
| [agent/01-infrastructure.md](./agent/01-infrastructure.md) | Mock LLM, tool registry, session state fixtures |
| [agent/02-testing-capabilities.md](./agent/02-testing-capabilities.md) | Tool discovery, prompt behavior, permissions, conversation flow |
| [agent/03-template-new-tool.md](./agent/03-template-new-tool.md) | Template: adding a new tool |
| [agent/04-template-new-command.md](./agent/04-template-new-command.md) | Template: adding a new command |
| [agent/05-template-data-query.md](./agent/05-template-data-query.md) | Template: agent queries platform data |
| [agent/06-template-workflow.md](./agent/06-template-workflow.md) | Template: multi-step agent conversation workflow |
| [agent/07-checklist.md](./agent/07-checklist.md) | Agent testing checklist |
| [agent/08-plan-generation.md](./agent/08-plan-generation.md) | Agent test plan generation meta-guide |
