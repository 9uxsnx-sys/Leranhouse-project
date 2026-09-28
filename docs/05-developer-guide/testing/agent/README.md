# Agent Testing

This section covers testing for **native AI agent capabilities** — tools, commands, data queries, multi-step workflows, and permission boundaries.

The agent section is separate from the API section because agent testing focuses on **agent behavior** (tool discovery, prompt correctness, conversation flow) rather than HTTP endpoint behavior.

---

## How to Use This Guide

### If you are adding a new feature to the agent
Read the documents **in order 01 through 02**, then jump to the matching template in **03-06**, then read **07-08**:

```
01-infrastructure.md         → Foundation (mock LLM, tool registry, session state)
02-testing-capabilities.md   → How to test agent behavior
03-06 (matching template)    → Copy-paste template
07-checklist.md              → Verify you covered everything
08-plan-generation.md        → (Complex features) Decompose into atomic units
```

### If you are adding a new API endpoint that the agent will call
Use the [API testing guide](../api/README.md) instead. The agent section is only for **agent-native capabilities** (tools, commands, conversation logic).

---

## Template Index

| # | Template | When to Use |
|---|----------|-------------|
| 03 | [new-tool.md](./03-template-new-tool.md) | Adding a new tool/function the agent can call |
| 04 | [new-command.md](./04-template-new-command.md) | Adding a new chat command (e.g., /help, /summarize) |
| 05 | [data-query.md](./05-template-data-query.md) | Agent queries platform data (courses, users, analytics) |
| 06 | [workflow.md](./06-template-workflow.md) | Multi-step agent conversation workflow |

---

## How to Choose a Template

```
Does the agent gain a new callable tool?          → 03-template-new-tool.md
Does the agent gain a new chat command?            → 04-template-new-command.md
Does the agent query platform data?               → 05-template-data-query.md
Does the agent follow a multi-step conversation?  → 06-template-workflow.md
Multiple of the above?                            → 08-plan-generation.md
```
