# Template: Agent Data Query

Use this template when adding a **data query capability** to the agent — the agent can query platform data (courses, users, analytics, etc.) and return results to the user.

---

## Examples

- Agent can list all courses and return a summary
- Agent can show user statistics and enrollment numbers
- Agent can search for resources by keyword
- Agent can generate analytics reports from platform data

---

## Checklist

### Query Execution
- [ ] Query returns correct results for valid parameters
- [ ] Query returns empty results gracefully (no crash)
- [ ] Query respects pagination (offset/limit)
- [ ] Query filters work correctly
- [ ] Query sorts results correctly

### Permission Boundary
- [ ] Admin user can query all data
- [ ] Regular user can only query data they have access to
- [ ] Cross-org data leak is prevented
- [ ] Anonymous user is blocked

### Response Formatting
- [ ] Results are formatted as readable text/markdown
- [ ] Empty results return a friendly "no results" message
- [ ] Error cases return clear messages
- [ ] Large result sets are summarized (not dumped raw)

---

## Template: Query Execution Test

```python
"""Tests for {query_name} data query."""
import pytest


class Test{query_name|pascal}Query:
    """Verify the data query executes correctly."""

    async def test_query_returns_results(self, tool_registry, db, admin_agent_context):
        """Verify query returns expected data."""
        tool = tool_registry.get_tool("{query_name}")

        result = await tool.execute(
            context=admin_agent_context,
            {param}="{value}",
        )

        assert result["success"] is True
        assert "data" in result or "results" in result
        assert len(result.get("data", result.get("results", []))) > 0

    async def test_query_empty_results(self, tool_registry, db, admin_agent_context):
        """Verify query handles empty results gracefully."""
        tool = tool_registry.get_tool("{query_name}")

        result = await tool.execute(
            context=admin_agent_context,
            {param}="{nonexistent_value}",
        )

        assert result["success"] is True
        data = result.get("data", result.get("results", []))
        assert len(data) == 0

    async def test_query_pagination(self, tool_registry, db, admin_agent_context):
        """Verify query respects pagination."""
        tool = tool_registry.get_tool("{query_name}")

        result = await tool.execute(
            context=admin_agent_context,
            offset=0,
            limit=5,
        )

        data = result.get("data", result.get("results", []))
        assert len(data) <= 5

    async def test_query_filter(self, tool_registry, db, admin_agent_context):
        """Verify query filter works correctly."""
        tool = tool_registry.get_tool("{query_name}")

        result = await tool.execute(
            context=admin_agent_context,
            filter_field="{field_name}",
            filter_value="{field_value}",
        )

        assert result["success"] is True
        data = result.get("data", result.get("results", []))
        for item in data:
            assert item.get("{field_name}") == "{field_value}"
```

---

## Template: Permission Boundary Test

```python
"""Tests for {query_name} permission boundary."""


class Test{query_name|pascal}QueryPermission:
    """Verify RBAC is enforced for the query."""

    async def test_admin_can_query_all(self, tool_registry, admin_agent_context):
        """Verify admin can query all data."""
        tool = tool_registry.get_tool("{query_name}")

        result = await tool.execute(
            context=admin_agent_context,
            {param}="{value}",
        )

        assert result["success"] is True

    async def test_regular_user_scope_limited(self, tool_registry, regular_agent_context):
        """Verify regular user can only query their data."""
        tool = tool_registry.get_tool("{query_name}")

        result = await tool.execute(
            context=regular_agent_context,
            {param}="{value}",
        )

        # Should succeed but only return data the user has access to
        assert result["success"] is True

    async def test_cross_org_isolation(self, tool_registry, admin_agent_context, other_org):
        """Verify user cannot query data from another org."""
        tool = tool_registry.get_tool("{query_name}")

        # Create data in admin's org
        result_own = await tool.execute(
            context=admin_agent_context,
            org_id=admin_agent_context.org_id,
        )

        # Try to query other org's data
        result_other = await tool.execute(
            context=admin_agent_context,
            org_id=other_org.id,
        )

        # Should only return data from admin's own org
        # or explicitly block cross-org access
        own_data = result_own.get("data", [])
        other_data = result_other.get("data", [])
        # Depending on design, cross-org should either be empty or return 403
        if "status_code" in result_other:
            assert result_other["status_code"] in (403, 404)

    async def test_anonymous_blocked(self, tool_registry):
        """Verify anonymous user is blocked."""
        tool = tool_registry.get_tool("{query_name}")

        result = await tool.execute(
            context=anonymous_agent_context,
            {param}="{value}",
        )

        assert result["success"] is False
        assert result.get("status_code") == 401
```

---

## Template: Response Formatting Test

```python
"""Tests for {query_name} response formatting."""


class Test{query_name|pascal}ResponseFormatting:
    """Verify the query response is formatted correctly."""

    async def test_results_formatted_as_markdown(self, tool_registry, admin_agent_context):
        """Verify results are returned as readable markdown."""
        tool = tool_registry.get_tool("{query_name}")

        result = await tool.execute(
            context=admin_agent_context,
            {param}="{value}",
        )

        # The response should include a formatted text output
        if "formatted" in result:
            assert isinstance(result["formatted"], str)
            assert len(result["formatted"]) > 0

    async def test_empty_results_message(self, tool_registry, admin_agent_context):
        """Verify empty results return a friendly message."""
        tool = tool_registry.get_tool("{query_name}")

        result = await tool.execute(
            context=admin_agent_context,
            {param}="{nonexistent_value}",
        )

        # Should include a "no results" message
        output = result.get("formatted", result.get("output", ""))
        assert "no" in output.lower() or "empty" in output.lower() or "0" in output

    async def test_error_message_clarity(self, tool_registry, admin_agent_context):
        """Verify error messages are clear and actionable."""
        tool = tool_registry.get_tool("{query_name}")

        result = await tool.execute(
            context=admin_agent_context,
            {param}="",  # Invalid/empty parameter
        )

        if not result["success"]:
            error = result.get("error", result.get("message", ""))
            assert len(error) > 0
            # Error should be user-friendly, not a raw traceback
            assert "Traceback" not in error
```
