# Template: New Agent Tool

Use this template when adding a **new callable tool** to the agent (e.g., `create_course`, `get_analytics`, `send_message`).

---

## Examples

- Adding a `create_course` tool that creates a course via the API
- Adding a `get_analytics` tool that returns platform statistics
- Adding a `send_notification` tool that sends alerts to users

---

## Checklist

### Tool Registration
- [ ] Tool is registered in the tool registry
- [ ] Tool name follows kebab-case convention
- [ ] Tool description is clear and accurate
- [ ] Tool parameters have correct names, types, and descriptions
- [ ] Required parameters are marked as required

### Tool Execution
- [ ] Tool succeeds with valid arguments
- [ ] Tool returns the correct response shape
- [ ] Tool creates/modifies database state correctly (if applicable)
- [ ] Tool validates required parameters
- [ ] Tool returns clear error messages for invalid input

### Permission Boundary
- [ ] Admin user can execute the tool
- [ ] Regular user with permission can execute
- [ ] Regular user without permission is blocked (403)
- [ ] Cross-org access is blocked
- [ ] Anonymous user is blocked

### Prompt Integration
- [ ] Agent correctly routes a relevant prompt to the tool
- [ ] Agent includes tool results in its response to the user
- [ ] Agent handles tool failure gracefully

---

## Template: Tool Registration Test

```python
"""Tests for {tool_name} tool registration."""
import pytest


class Test{tool_name|pascal}ToolRegistration:
    """Verify the tool is registered with correct metadata."""

    async def test_tool_is_registered(self, tool_registry):
        """Verify the tool exists in the registry."""
        tools = tool_registry.list_tools()
        tool_names = [t.name for t in tools]

        assert "{tool_name}" in tool_names

    async def test_tool_metadata(self, tool_registry):
        """Verify tool name, description, and parameters."""
        tool = tool_registry.get_tool("{tool_name}")

        assert tool.name == "{tool_name}"
        assert tool.description != ""
        assert "{param_required}" in tool.parameters["required"]

        # Verify parameter types
        assert tool.parameters["properties"]["{param_required}"]["type"] == "{param_type}"
```

---

## Template: Tool Execution Test

```python
"""Tests for {tool_name} tool execution."""
from unittest.mock import AsyncMock, patch

import pytest


class Test{tool_name|pascal}ToolExecution:
    """Verify the tool executes correctly."""

    async def test_execute_success(self, tool_registry, db, admin_agent_context):
        """Verify tool succeeds with valid arguments."""
        tool = tool_registry.get_tool("{tool_name}")

        result = await tool.execute(
            context=admin_agent_context,
            {param_required}="{test_value}",
        )

        assert result["success"] is True
        assert "{expected_field}" in result

    async def test_execute_missing_required_param(self, tool_registry, admin_agent_context):
        """Verify tool rejects missing required parameters."""
        tool = tool_registry.get_tool("{tool_name}")

        with pytest.raises(ValueError, match="required"):
            await tool.execute(
                context=admin_agent_context,
                # Missing required param
            )

    async def test_execute_invalid_param(self, tool_registry, admin_agent_context):
        """Verify tool rejects invalid parameter values."""
        tool = tool_registry.get_tool("{tool_name}")

        result = await tool.execute(
            context=admin_agent_context,
            {param_required}="",
        )

        assert result["success"] is False
        assert "error" in result
```

---

## Template: Permission Boundary Test

```python
"""Tests for {tool_name} permission boundary."""


class Test{tool_name|pascal}ToolPermission:
    """Verify RBAC is enforced for the tool."""

    async def test_admin_can_execute(self, tool_registry, admin_agent_context):
        """Verify admin user can execute the tool."""
        tool = tool_registry.get_tool("{tool_name}")

        result = await tool.execute(
            context=admin_agent_context,
            {param_required}="{test_value}",
        )

        assert result["success"] is True

    async def test_regular_user_blocked(self, tool_registry, regular_agent_context):
        """Verify regular user without permission is blocked."""
        tool = tool_registry.get_tool("{tool_name}")

        result = await tool.execute(
            context=regular_agent_context,
            {param_required}="{test_value}",
        )

        assert result["success"] is False
        assert result.get("status_code") == 403

    async def test_anonymous_blocked(self, tool_registry):
        """Verify anonymous user is blocked."""
        tool = tool_registry.get_tool("{tool_name}")

        # Use anonymous context fixture
        result = await tool.execute(
            context=anonymous_agent_context,
            {param_required}="{test_value}",
        )

        assert result["success"] is False
        assert result.get("status_code") == 401
```

---

## Template: Prompt Integration Test

```python
"""Tests for {tool_name} prompt routing."""
from unittest.mock import AsyncMock, patch

import pytest


class Test{tool_name|pascal}PromptRouting:
    """Verify the agent routes prompts to the correct tool."""

    async def test_prompt_triggers_tool(self, mock_llm, tool_registry, session_state):
        """Verify a relevant prompt triggers the tool."""
        from src.agent.engine import AgentEngine

        # Configure mock LLM to return a tool call
        mock_llm.return_value = {
            "role": "assistant",
            "content": "I'll help you with that.",
            "tool_calls": [
                {
                    "name": "{tool_name}",
                    "arguments": {
                        "{param_required}": "{test_value}",
                    },
                }
            ],
        }

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        response = await engine.process_message(
            session=session_state,
            message="{trigger_prompt}",
        )

        assert response.tool_calls is not None
        assert len(response.tool_calls) > 0
        assert response.tool_calls[0]["name"] == "{tool_name}"

    async def test_tool_failure_response(self, mock_llm, tool_registry, session_state):
        """Verify agent handles tool failure gracefully."""
        from src.agent.engine import AgentEngine

        # Make the tool fail
        tool = tool_registry.get_tool("{tool_name}")
        tool.execute = AsyncMock(side_effect=Exception("Something went wrong"))

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        response = await engine.process_message(
            session=session_state,
            message="{trigger_prompt}",
        )

        # Should not crash — should return a friendly message
        assert response.content is not None
        assert "sorry" in response.content.lower() or "error" in response.content.lower()
```
