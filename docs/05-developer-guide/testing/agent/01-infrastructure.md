# Agent Test Infrastructure

This document describes the infrastructure needed to test an AI agent — mock LLM, tool registry, session state, and permission context.

---

## Test Framework

| Component | Technology | Notes |
|-----------|-----------|-------|
| Test runner | pytest | Same as API tests |
| Mock LLM | `unittest.mock.AsyncMock` | Return predefined responses instead of calling a real LLM |
| Tool registry | In-memory dict | Register tools, then verify discovery and execution |
| Session state | In-memory object | Simulate conversation context, message history |
| Permission context | Mock user/role | Same fixture hierarchy as API tests (`admin_user`, `regular_user`, etc.) |

---

## Mock LLM

The core challenge in agent testing is that real LLM calls are non-deterministic and expensive. **Never call a real LLM in tests.** Instead, mock the LLM to return predefined responses.

### Pattern: Mock the LLM client

```python
from unittest.mock import AsyncMock, patch

@pytest.fixture
def mock_llm():
    """Return a mock LLM that returns a predefined response."""
    with patch("src.agent.llm.LLMClient.chat") as mock:
        mock.return_value = {
            "role": "assistant",
            "content": "I have created the course 'Introduction to Python'.",
            "tool_calls": [
                {
                    "name": "create_course",
                    "arguments": {
                        "name": "Introduction to Python",
                        "description": "A beginner course"
                    }
                }
            ]
        }
        yield mock
```

### Pattern: Mock with streaming

```python
@pytest.fixture
def mock_llm_stream():
    """Return a mock streaming LLM response."""
    with patch("src.agent.llm.LLMClient.chat_stream") as mock:
        mock.return_value = [
            {"role": "assistant", "content": "Let me ", "done": False},
            {"role": "assistant", "content": "look that up ", "done": False},
            {"role": "assistant", "content": "for you.", "done": True},
        ]
        yield mock
```

### Pattern: Mock with error scenarios

```python
@pytest.fixture
def mock_llm_error():
    """Return a mock LLM that simulates an API error."""
    with patch("src.agent.llm.LLMClient.chat") as mock:
        mock.side_effect = TimeoutError("LLM API timed out after 30s")
        yield mock
```

---

## Tool Registry

The tool registry is a central registry where all agent tools are registered. Tests can inspect the registry to verify:

- The tool is discoverable
- The tool has the correct name and description
- The tool has the correct parameter schema
- The tool is available to the right roles

### Pattern: Tool registry fixture

```python
@pytest.fixture
def tool_registry():
    """Return the tool registry with all tools registered."""
    from src.agent.tools.registry import ToolRegistry
    from src.agent.tools.course_tools import CreateCourseTool, ListCoursesTool
    from src.agent.tools.user_tools import GetUserTool

    registry = ToolRegistry()
    registry.register(CreateCourseTool())
    registry.register(ListCoursesTool())
    registry.register(GetUserTool())
    return registry
```

### Pattern: Verify tool discovery

```python
async def test_tool_discovery(tool_registry):
    """Verify all expected tools are discoverable."""
    tools = tool_registry.list_tools()
    tool_names = [t.name for t in tools]

    assert "create_course" in tool_names
    assert "list_courses" in tool_names
    assert "get_user" in tool_names
```

### Pattern: Verify tool schema

```python
async def test_tool_schema(tool_registry):
    """Verify tool parameter schema is correct."""
    tool = tool_registry.get_tool("create_course")

    assert tool.name == "create_course"
    assert "name" in tool.parameters["required"]
    assert "description" in tool.parameters["required"]
    assert isinstance(tool.parameters["properties"]["name"]["type"], str)
```

---

## Session State

Agent conversations have state — message history, context, pending actions. Tests need to simulate this state.

### Pattern: Session state fixture

```python
@pytest.fixture
def session_state():
    """Return a fresh session state for each test."""
    from src.agent.session import SessionState

    state = SessionState()
    state.messages = []
    state.context = {}
    state.pending_approval = None
    return state
```

### Pattern: Session with history

```python
@pytest.fixture
def session_with_history(session_state):
    """Return a session with existing message history."""
    session_state.messages = [
        {"role": "user", "content": "Create a course about Python"},
        {"role": "assistant", "content": "I'll help you create that course."},
    ]
    session_state.context["last_action"] = "create_course"
    return session_state
```

---

## Permission Context

Agent actions must respect the same permission boundaries as API endpoints. Reuse the existing user fixtures from the API test infrastructure.

### Pattern: Permission context fixture

```python
@pytest.fixture
def admin_agent_context(admin_user, org):
    """Return an agent execution context for an admin user."""
    from src.agent.context import AgentContext

    return AgentContext(
        user=admin_user,
        org=org,
        session_id="test-session-001",
    )

@pytest.fixture
def regular_agent_context(regular_user, org):
    """Return an agent execution context for a regular user."""
    from src.agent.context import AgentContext

    return AgentContext(
        user=regular_user,
        org=org,
        session_id="test-session-002",
    )
```

---

## Bypass Patterns

Just like API tests have `bypass_rbac`, agent tests can have bypass patterns:

```python
@pytest.fixture
def bypass_llm_safety():
    """Disable LLM safety checks for tests that don't test safety."""
    with patch("src.agent.safety.SafetyChecker.check") as mock:
        mock.return_value = {"safe": True, "reason": ""}
        yield mock
```

---

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Tests call real LLM | Always mock the LLM client |
| Tests depend on LLM output format | Use deterministic mock responses |
| Session state leaks between tests | Use `scope="function"` on session fixtures |
| Tool registry is global/shared | Re-create the registry for each test |
| Permission checks are bypassed | Do not patch RBAC in agent tests |
