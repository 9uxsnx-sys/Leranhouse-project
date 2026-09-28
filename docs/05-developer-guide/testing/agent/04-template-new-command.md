# Template: New Agent Command

Use this template when adding a **new chat command** to the agent (e.g., `/help`, `/summarize`, `/export`).

---

## Examples

- Adding a `/help` command that shows available tools
- Adding a `/summarize` command that summarizes the current conversation
- Adding a `/export` command that exports data in a specific format

---

## Checklist

### Command Registration
- [ ] Command is registered in the command registry
- [ ] Command name starts with `/`
- [ ] Command description is clear and accurate
- [ ] Command has correct argument parser (if applicable)

### Command Execution
- [ ] Command executes with valid arguments
- [ ] Command returns the correct response
- [ ] Command handles missing arguments gracefully
- [ ] Command handles invalid arguments with clear error

### Permission Boundary
- [ ] Admin user can execute the command
- [ ] Regular user can execute (if allowed)
- [ ] Anonymous user is blocked (if required)

### Conversation Integration
- [ ] Command works in a conversation context
- [ ] Command output is formatted correctly
- [ ] Command does not break conversation flow

---

## Template: Command Registration Test

```python
"""Tests for /{command_name} command registration."""
import pytest


class Test{command_name|pascal}CommandRegistration:
    """Verify the command is registered correctly."""

    async def test_command_is_registered(self, command_registry):
        """Verify the command exists in the registry."""
        commands = command_registry.list_commands()
        command_names = [c.name for c in commands]

        assert "/{command_name}" in command_names

    async def test_command_metadata(self, command_registry):
        """Verify command name, description, and arguments."""
        cmd = command_registry.get_command("/{command_name}")

        assert cmd.name == "/{command_name}"
        assert cmd.description != ""
        assert cmd.help_text is not None

    async def test_command_arguments(self, command_registry):
        """Verify command argument parser is configured."""
        cmd = command_registry.get_command("/{command_name}")

        if hasattr(cmd, "parser"):
            assert "{arg_name}" in cmd.parser.args
```

---

## Template: Command Execution Test

```python
"""Tests for /{command_name} command execution."""
from unittest.mock import AsyncMock, patch

import pytest


class Test{command_name|pascal}CommandExecution:
    """Verify the command executes correctly."""

    async def test_execute_with_valid_args(self, command_registry, session_state, admin_agent_context):
        """Verify command succeeds with valid arguments."""
        cmd = command_registry.get_command("/{command_name}")

        result = await cmd.execute(
            context=admin_agent_context,
            session=session_state,
            args="{arg_value}",
        )

        assert result["success"] is True
        assert "{expected_field}" in result

    async def test_execute_without_args(self, command_registry, session_state, admin_agent_context):
        """Verify command handles missing arguments."""
        cmd = command_registry.get_command("/{command_name}")

        result = await cmd.execute(
            context=admin_agent_context,
            session=session_state,
            args="",
        )

        # Should either use defaults or return helpful error
        assert result["success"] is True or "usage" in result.get("output", "").lower()

    async def test_execute_invalid_args(self, command_registry, session_state, admin_agent_context):
        """Verify command handles invalid arguments."""
        cmd = command_registry.get_command("/{command_name}")

        result = await cmd.execute(
            context=admin_agent_context,
            session=session_state,
            args="--invalid-flag",
        )

        assert result["success"] is False
        assert "error" in result or "usage" in result.get("output", "").lower()
```

---

## Template: Permission Boundary Test

```python
"""Tests for /{command_name} command permission boundary."""


class Test{command_name|pascal}CommandPermission:
    """Verify RBAC is enforced for the command."""

    async def test_admin_can_execute(self, command_registry, session_state, admin_agent_context):
        """Verify admin user can execute the command."""
        cmd = command_registry.get_command("/{command_name}")

        result = await cmd.execute(
            context=admin_agent_context,
            session=session_state,
            args="{arg_value}",
        )

        assert result["success"] is True

    async def test_regular_user_access(self, command_registry, session_state, regular_agent_context):
        """Verify regular user access matches expected permission."""
        cmd = command_registry.get_command("/{command_name}")

        result = await cmd.execute(
            context=regular_agent_context,
            session=session_state,
            args="{arg_value}",
        )

        # If command is admin-only, expect 403; otherwise expect success
        if cmd.admin_only:
            assert result["success"] is False
            assert result.get("status_code") == 403
        else:
            assert result["success"] is True

    async def test_anonymous_blocked_for_admin_commands(self, command_registry, session_state):
        """Verify anonymous user is blocked for admin commands."""
        cmd = command_registry.get_command("/{command_name}")

        if cmd.admin_only:
            result = await cmd.execute(
                context=anonymous_agent_context,
                session=session_state,
                args="{arg_value}",
            )

            assert result["success"] is False
            assert result.get("status_code") == 401
```

---

## Template: Conversation Integration Test

```python
"""Tests for /{command_name} conversation integration."""


class Test{command_name|pascal}Conversation:
    """Verify the command integrates with conversation flow."""

    async def test_command_output_format(self, command_registry, session_state, admin_agent_context):
        """Verify command output is correctly formatted."""
        cmd = command_registry.get_command("/{command_name}")

        result = await cmd.execute(
            context=admin_agent_context,
            session=session_state,
            args="{arg_value}",
        )

        # Output should be a string (markdown or plain text)
        assert isinstance(result.get("output"), str)
        assert len(result["output"]) > 0

    async def test_command_does_not_crash_conversation(self, command_registry, session_state, admin_agent_context):
        """Verify command execution does not corrupt session state."""
        from src.agent.engine import AgentEngine

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        # Send a normal message first
        await engine.process_message(
            session=session_state,
            message="Hello",
        )

        # Execute command
        cmd = command_registry.get_command("/{command_name}")
        await cmd.execute(
            context=admin_agent_context,
            session=session_state,
            args="{arg_value}",
        )

        # Session should still be usable
        response = await engine.process_message(
            session=session_state,
            message="What did I just ask?",
        )

        assert response.content is not None
```
