# Template: Multi-Step Agent Workflow

Use this template when adding a **multi-step conversation workflow** to the agent — the agent needs multiple turns to complete a task (e.g., create course with approval, collect information step by step).

---

## Examples

- Agent creates a course by collecting name, description, and chapters across multiple turns
- Agent drafts content, waits for user approval, then publishes
- Agent troubleshoots an issue by asking diagnostic questions sequentially

---

## Checklist

### Workflow Steps
- [ ] Workflow has a clear starting point (initial trigger)
- [ ] Each step has a clear completion criteria
- [ ] Workflow progresses correctly through all steps
- [ ] Workflow can be cancelled/aborted mid-way
- [ ] Workflow times out after inactivity (if applicable)

### State Management
- [ ] Workflow state is persisted between turns
- [ ] Workflow state is isolated between different users
- [ ] Workflow state is cleaned up on completion or cancellation
- [ ] Workflow can resume from the correct step after interruption

### Permission Boundary
- [ ] Workflow respects user role throughout all steps
- [ ] Approval steps check the correct user's permissions
- [ ] Cross-org workflow access is prevented

### Error Handling
- [ ] Invalid input at any step returns a helpful message
- [ ] Workflow can recover from a failed step
- [ ] Workflow handles unexpected user input gracefully

---

## Template: Workflow Flow Test

```python
"""Tests for {workflow_name} multi-step workflow."""
import pytest


class Test{workflow_name|pascal}Workflow:
    """Verify the workflow progresses correctly through all steps."""

    async def test_workflow_completes_all_steps(self, mock_llm, tool_registry, session_state, admin_agent_context):
        """Verify the workflow can complete all steps successfully."""
        from src.agent.engine import AgentEngine
        from src.agent.workflow import WorkflowManager

        workflow_mgr = WorkflowManager(tool_registry)
        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        # Step 1: Trigger the workflow
        response = await engine.process_message(
            session=session_state,
            message="{trigger_message}",
        )

        assert response.workflow_active is True
        assert response.workflow_step == "{first_step}"

        # Step 2: Provide first input
        response = await engine.process_message(
            session=session_state,
            message="{first_step_input}",
        )

        assert response.workflow_step == "{second_step}"

        # Step 3: Complete the workflow
        response = await engine.process_message(
            session=session_state,
            message="{final_step_input}",
        )

        assert response.workflow_active is False or response.workflow_complete is True
        assert "{completion_indicator}" in response.content

    async def test_workflow_can_be_cancelled(self, mock_llm, tool_registry, session_state, admin_agent_context):
        """Verify workflow can be cancelled mid-way."""
        from src.agent.engine import AgentEngine
        from src.agent.workflow import WorkflowManager

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        # Start the workflow
        await engine.process_message(
            session=session_state,
            message="{trigger_message}",
        )

        # Cancel with "cancel" or "stop"
        response = await engine.process_message(
            session=session_state,
            message="cancel",
        )

        assert response.workflow_active is False
        assert response.workflow_cancelled is True
```

---

## Template: State Management Test

```python
"""Tests for {workflow_name} state management."""


class Test{workflow_name|pascal}StateManagement:
    """Verify workflow state is managed correctly."""

    async def test_state_persists_between_turns(self, mock_llm, tool_registry, session_state, admin_agent_context):
        """Verify workflow state is maintained across conversation turns."""
        from src.agent.engine import AgentEngine

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        # Start the workflow with initial data
        response = await engine.process_message(
            session=session_state,
            message="{trigger_message_with_data}",
        )

        # Verify the workflow remembered the initial data
        assert "{data_field}" in response.workflow_context or "{data_field}" in str(session_state.context)

    async def test_state_isolation_between_users(self, mock_llm, tool_registry):
        """Verify workflow state is isolated between different users."""
        from src.agent.engine import AgentEngine
        from src.agent.session import SessionState

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        # User A starts a workflow
        session_a = SessionState()
        await engine.process_message(
            session=session_a,
            message="{trigger_message}",
        )
        assert session_a.workflow_active is True

        # User B has no workflow
        session_b = SessionState()
        assert session_b.workflow_active is False

        # User B's actions should not affect User A
        await engine.process_message(
            session=session_b,
            message="Hello",
        )
        assert session_b.workflow_active is False
        assert session_a.workflow_active is True  # User A still in workflow

    async def test_state_cleanup_on_completion(self, mock_llm, tool_registry, session_state, admin_agent_context):
        """Verify workflow state is cleaned up after completion."""
        from src.agent.engine import AgentEngine

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        # Complete the workflow
        await self._complete_workflow(engine, session_state)

        # State should be cleaned up
        assert session_state.workflow_active is False
        assert session_state.workflow_context == {} or session_state.workflow_context is None

    async def _complete_workflow(self, engine, session_state):
        """Helper to run through all workflow steps."""
        # Implement based on the specific workflow steps
        await engine.process_message(session=session_state, message="{trigger_message}")
        await engine.process_message(session=session_state, message="{first_step_input}")
        await engine.process_message(session=session_state, message="{final_step_input}")
```

---

## Template: Permission Boundary Test

```python
"""Tests for {workflow_name} permission boundary."""


class Test{workflow_name|pascal}WorkflowPermission:
    """Verify RBAC is enforced throughout the workflow."""

    async def test_admin_can_run_workflow(self, mock_llm, tool_registry, session_state, admin_agent_context):
        """Verify admin can run the full workflow."""
        from src.agent.engine import AgentEngine

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        response = await engine.process_message(
            session=session_state,
            message="{trigger_message}",
        )

        assert response.workflow_active is True

    async def test_regular_user_blocked_at_approval_step(self, mock_llm, tool_registry, session_state, regular_agent_context):
        """Verify regular user is blocked at permission-gated steps."""
        from src.agent.engine import AgentEngine

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        response = await engine.process_message(
            session=session_state,
            message="{trigger_message}",
        )

        # If the workflow involves admin-only steps, regular user should be blocked
        if response.workflow_active:
            # Try to reach the approval step
            response = await engine.process_message(
                session=session_state,
                message="{approval_attempt_input}",
            )

            # Should be blocked
            assert response.blocked is True or "permission" in response.content.lower()
```

---

## Template: Error Handling Test

```python
"""Tests for {workflow_name} error handling."""


class Test{workflow_name|pascal}WorkflowErrors:
    """Verify the workflow handles errors gracefully."""

    async def test_invalid_input_at_step(self, mock_llm, tool_registry, session_state, admin_agent_context):
        """Verify workflow handles invalid input at any step."""
        from src.agent.engine import AgentEngine

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        # Start workflow
        await engine.process_message(
            session=session_state,
            message="{trigger_message}",
        )

        # Provide invalid input
        response = await engine.process_message(
            session=session_state,
            message="",
        )

        # Should return a helpful error message, not crash
        assert response.content is not None
        assert "sorry" in response.content.lower() or "please" in response.content.lower() or "invalid" in response.content.lower()

    async def test_workflow_recovers_from_failed_step(self, mock_llm, tool_registry, session_state, admin_agent_context):
        """Verify workflow can recover from a failed step."""
        from src.agent.engine import AgentEngine

        engine = AgentEngine(tool_registry, llm_client=mock_llm)

        # Start workflow
        await engine.process_message(
            session=session_state,
            message="{trigger_message}",
        )

        # Make a tool fail
        tool = tool_registry.get_tool("{tool_in_workflow}")
        tool.execute = AsyncMock(side_effect=Exception("Temporary failure"))

        # This step should fail
        response = await engine.process_message(
            session=session_state,
            message="{step_input}",
        )

        # Should report the error but not crash
        assert "error" in response.content.lower() or "sorry" in response.content.lower()

        # Next attempt should work (tool is restored)
        tool.execute = AsyncMock(return_value={"success": True})

        response = await engine.process_message(
            session=session_state,
            message="{step_input_retry}",
        )

        # Should recover and progress
        assert response.workflow_step != "{failed_step}"
```
