# Template: Plugin / MCP Contract

Use this template when your application **loads external plugins or MCP (Model Context Protocol) tools** dynamically — agent plugins, visualization tools, messaging integrations, etc.

---

## Examples

- Agent connects to Telegram MCP server
- Agent generates charts via a visualization plugin
- Agent calls n8n webhooks
- Agent uses a file-system MCP tool

---

## Checklist

### Happy Path
- [ ] Plugin with valid config is loaded and registered
- [ ] Plugin is callable via the expected interface
- [ ] Plugin returns expected response shape
- [ ] Multiple plugins can be loaded simultaneously

### Error/Edge Cases
- [ ] Plugin with invalid config is rejected with a clear error
- [ ] Plugin times out → agent retries or falls back
- [ ] Plugin crashes → agent continues with other plugins (no crash propagation)
- [ ] Unknown plugin → rejected, not loaded
- [ ] Plugin with excessive permissions → sandbox restricted
- [ ] Malicious plugin → blocked by validation

### Authz
- [ ] Plugin registration requires admin/owner permission
- [ ] Plugin execution respects user role permissions

---

## Service-Level Template

```python
class Test{PluginName}Plugin:

    # ── Contract Validation ─────────────────────────────────

    async def test_plugin_conforms_to_contract(self):
        """Every plugin must conform to the MCPPluginContract schema."""
        plugin = load_plugin("telegram")
        assert isinstance(plugin, MCPPluginContract)
        assert "send_message" in [a.name for a in plugin.actions]

    async def test_plugin_invalid_config_rejected(self):
        """Plugin with invalid config is rejected."""
        invalid_config = {{"api_key": ""}}  # Missing required fields
        with pytest.raises(ValidationError) as exc:
            load_plugin("telegram", config=invalid_config)
        assert "api_key" in str(exc.value)

    # ── Tool Discovery ──────────────────────────────────────

    async def test_plugin_tools_are_discoverable(self):
        """Agent discovers and registers plugin tools on startup."""
        with patch(
            "src.services.plugins.registry.discover_tools",
            return_value=[
                {{"name": "send_telegram", "input_schema": {{...}}}},
            ],
        ):
            tools = await discover_plugin_tools("telegram")
            assert any(t["name"] == "send_telegram" for t in tools)

    # ── Isolation / Crash Safety ────────────────────────────

    async def test_plugin_crash_does_not_crash_agent(self):
        """One plugin crashing should not crash the whole system."""
        with patch(
            "src.services.plugins.executor.execute_plugin_action",
            new_callable=AsyncMock,
            side_effect=RuntimeError("Plugin crashed"),
        ):
            result = await execute_plugin_safely(
                plugin_name="charts",
                action="generate",
                params={{"data": [...]}},
            )
        assert result.status == "plugin_error"
        assert "Plugin crashed" in result.error

    # ── Timeout Handling ────────────────────────────────────

    async def test_plugin_timeout_triggers_fallback(self):
        """Plugin timeout triggers fallback behavior."""
        with patch(
            "src.services.plugins.executor.execute_plugin_action",
            new_callable=AsyncMock,
            side_effect=TimeoutError("Plugin timed out"),
        ):
            result = await execute_plugin_with_fallback(
                plugin_name="charts",
                action="generate",
                fallback_action="generate_basic",
            )
        # Should have fallen back to the basic action
        assert result.status == "completed"
        assert result.used_fallback is True
```

---

## Contract Schema Template

Define the contract that every plugin must conform to:

```python
from pydantic import BaseModel


class MCPActionSchema(BaseModel):
    name: str
    description: str
    input_schema: dict
    output_schema: dict


class MCPPluginContract(BaseModel):
    name: str
    version: str
    description: str
    actions: list[MCPActionSchema]


def test_plugin_contract_validation():
    """Test that the contract schema itself is correct."""
    valid_plugin = MCPPluginContract(
        name="telegram",
        version="1.0.0",
        description="Send messages to Telegram",
        actions=[
            MCPActionSchema(
                name="send_message",
                description="Send a message to a chat",
                input_schema={{"chat_id": "string", "text": "string"}},
                output_schema={{"message_id": "string"}},
            )
        ],
    )
    assert valid_plugin.name == "telegram"
```
