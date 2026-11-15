# Agent Testing Mandatory Checklist

This is the **gate** that every new agent feature must pass before it can be considered complete.

---

## How to Use

1. Create a copy of this checklist for your feature
2. Check off each item as you complete it
3. Link to the test file(s) that satisfy each requirement
4. Attach the completed checklist to your PR or commit

---

## Pre-Testing Setup

- [ ] I have read [01-infrastructure.md](./01-infrastructure.md) — understand mock LLM, tool registry, and session state fixtures
- [ ] I have read [02-testing-capabilities.md](./02-testing-capabilities.md) — understand the 6 testing dimensions for agents
- [ ] I have selected the correct template(s) from 03-06 that match my feature
- [ ] If the feature combines multiple concerns, I have read [08-plan-generation.md](./08-plan-generation.md) to decompose it

---

## Template Selection

- [ ] I identified which template(s) apply to this feature
- [ ] If multiple templates apply, I created a test plan using 08-plan-generation.md
- [ ] If no template applies exactly, I used the closest match and adapted

---

## Phase A: Registration

- [ ] New tool/command is registered in the correct registry
- [ ] Name follows project conventions (kebab-case for tools, `/` prefix for commands)
- [ ] Description is clear and accurate
- [ ] Parameters have correct names, types, and descriptions
- [ ] Required parameters are marked as required

---

## Phase B: Execution

- [ ] Tool/command succeeds with valid arguments
- [ ] Tool/command handles missing required parameters (clear error)
- [ ] Tool/command handles invalid parameter values (clear error)
- [ ] Tool/command creates/modifies database state correctly (if applicable)
- [ ] Tool/command is idempotent (safe to run twice)

---

## Phase C: Permission Boundary

- [ ] Admin user can execute all operations
- [ ] Regular user with permission can execute read operations
- [ ] Regular user without permission is blocked (403)
- [ ] Cross-org access is prevented
- [ ] Anonymous/unauthenticated user is blocked (401)
- [ ] Feature-gated tools are hidden/blocked when the feature is off

---

## Phase D: Prompt Integration (Tools)

- [ ] A relevant user prompt triggers the correct tool call
- [ ] Agent includes tool results in its response
- [ ] Agent handles tool failure gracefully (friendly error, no crash)
- [ ] Agent asks for clarification when the prompt is ambiguous
- [ ] Agent blocks prompt injection / unsafe requests

---

## Phase E: Conversation Flow (Workflows)

- [ ] Workflow starts from the correct trigger message
- [ ] Workflow progresses through all expected steps
- [ ] Workflow can be cancelled mid-way
- [ ] Workflow state persists between conversation turns
- [ ] Workflow state is isolated between different users
- [ ] Workflow state is cleaned up on completion or cancellation

---

## Phase F: Data Queries

- [ ] Query returns correct results for valid parameters
- [ ] Query returns empty results gracefully
- [ ] Query respects pagination (offset/limit)
- [ ] Query filters work correctly
- [ ] Results are formatted as readable markdown/text
- [ ] Empty results return a friendly "no results" message

---

## Phase G: Error Handling

- [ ] LLM timeout is handled without crashing
- [ ] Tool execution failure returns friendly error message
- [ ] Workflow step failure allows recovery/retry
- [ ] Unexpected user input does not crash the conversation
- [ ] Error messages are user-friendly (no raw tracebacks)

---

## Coverage

- [ ] All new code paths are exercised by tests
- [ ] `pytest` passes with no failures
- [ ] Tests are deterministic (same result every run)
- [ ] Tests are isolated (no shared mutable state between tests)

---

## Checklist Completion

| Item | Status | Link to Test File |
|------|--------|-------------------|
| Phase A: Registration | [ ] | |
| Phase B: Execution | [ ] | |
| Phase C: Permission Boundary | [ ] | |
| Phase D: Prompt Integration | [ ] | |
| Phase E: Conversation Flow | [ ] | |
| Phase F: Data Queries | [ ] | |
| Phase G: Error Handling | [ ] | |
| Coverage Met | [ ] | |
| All Tests Pass | [ ] | |

**Signed off by:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
