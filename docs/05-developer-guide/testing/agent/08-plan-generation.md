# Agent Test Plan Generation

This is the **meta-guide** for agents — it teaches how to decompose any new agent feature into atomic test units, select the correct templates, and generate a complete test plan.

Read this when:
- The agent feature combines multiple concerns (e.g., a new tool with a multi-step workflow)
- You are unsure which templates to combine
- You want to generate a test plan before writing any code

---

## Step 1: Decompose the Feature

Every agent feature can be broken down into **atomic test units**. Each unit maps to exactly one template.

### Decomposition Questions

| Question | Identifies |
|----------|-----------|
| Does the agent gain a new callable function? | Tool unit |
| Does the agent gain a new `/command`? | Command unit |
| Does the agent query platform data (courses, users, etc.)? | Data query unit |
| Does the feature require multiple conversation turns? | Workflow unit |
| Does the feature enforce a permission check? | Permission boundary unit |

### Example: "Course Creator" Workflow

```
Feature: Course creation wizard (multi-step)
├── Tool unit (create_course tool)           → 03-template-new-tool.md
├── Workflow unit (collect info step by step)→ 06-template-workflow.md
└── Data query unit (list available courses) → 05-template-data-query.md
```

### Example: "Analytics Dashboard" Command

```
Feature: /analytics command
├── Command unit (/analytics)                → 04-template-new-command.md
├── Data query unit (query analytics)       → 05-template-data-query.md
└── Permission boundary (admin-only)        → Covered by command + data query templates
```

### Example: "Help" Command

```
Feature: /help command
├── Command unit (/help)                     → 04-template-new-command.md
└── Tool discovery (list all tools)          → Covered by 02-testing-capabilities.md
```

---

## Step 2: Select Templates

For each atomic unit identified in Step 1, select the corresponding template:

| Unit Type | Template |
|-----------|----------|
| New tool | [03-template-new-tool.md](./03-template-new-tool.md) |
| New command | [04-template-new-command.md](./04-template-new-command.md) |
| Data query | [05-template-data-query.md](./05-template-data-query.md) |
| Multi-step workflow | [06-template-workflow.md](./06-template-workflow.md) |

For permission boundaries and prompt integration, each template includes those sections built-in. Use [02-testing-capabilities.md](./02-testing-capabilities.md) as a reference for the full methodology.

---

## Step 3: Identify Shared Fixtures

| Unit | Typical Fixtures |
|------|------------------|
| New tool | `tool_registry`, `mock_llm`, `admin_agent_context`, `regular_agent_context`, `session_state` |
| New command | `command_registry`, `mock_llm`, `admin_agent_context`, `regular_agent_context`, `session_state` |
| Data query | `tool_registry`, `db`, `admin_agent_context`, `regular_agent_context`, `session_state` |
| Workflow | `tool_registry`, `mock_llm`, `admin_agent_context`, `regular_agent_context`, `session_state` |

---

## Step 4: Generate the Test Plan

Use this template to document your test plan:

```markdown
# Agent Test Plan: {Feature Name}

## Atomic Units

| # | Unit Type | Template | Fixtures Needed |
|---|-----------|----------|-----------------|
| 1 | {type} | {template} | {fixtures} |
| 2 | {type} | {template} | {fixtures} |

## Test Files

| File | Units Covered |
|------|---------------|
| `src/tests/agent/test_{feature}_tool.py` | {units} |
| `src/tests/agent/test_{feature}_workflow.py` | {units} |

## Execution Order

1. Registration tests first (verify the feature is wired up)
2. Execution tests (verify the feature works)
3. Permission boundary tests (verify RBAC)
4. Integration tests (verify prompt routing and conversation flow)

## Checklist

Attach [07-checklist.md](./07-checklist.md) with each item checked off.
```

---

## Step 5: Combine Templates into One Test File

When combining multiple templates into one test file:

1. **Group by concern**: Registration tests together, execution tests together, etc.
2. **Order by dependency**: Test registration before execution, execution before integration
3. **Use descriptive class names**: `TestCreateCourseToolRegistration`, `TestCreateCourseToolExecution`

### Example structure for combined test file:

```python
class TestFeatureRegistration:
    """Verify the feature is registered correctly."""
    async def test_tool_registered(self, tool_registry): ...
    async def test_tool_metadata(self, tool_registry): ...

class TestFeatureExecution:
    """Verify the feature executes correctly."""
    async def test_success(self, tool_registry, admin_agent_context): ...
    async def test_invalid_input(self, tool_registry, admin_agent_context): ...

class TestFeaturePermission:
    """Verify RBAC is enforced."""
    async def test_admin_access(self, tool_registry, admin_agent_context): ...
    async def test_regular_user_blocked(self, tool_registry, regular_agent_context): ...

class TestFeatureIntegration:
    """Verify prompt routing and conversation integration."""
    async def test_prompt_triggers_tool(self, mock_llm, tool_registry, session_state): ...
    async def test_tool_failure_handling(self, mock_llm, tool_registry, session_state): ...
```

---

## Rules Summary

| Rule | Detail |
|------|--------|
| Always decompose first | Do not jump to writing tests without a plan |
| One atomic unit per template | If a feature has 3 concerns, use 3 templates |
| Always mock the LLM | Never call a real LLM in tests |
| Generate the plan before code | The plan guides both implementation and testing |
| Document the plan in the PR | Attach the generated plan to the pull request |
