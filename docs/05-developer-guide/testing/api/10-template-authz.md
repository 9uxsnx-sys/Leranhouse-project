# Template: Authorization Rule

Use this template when adding a **new permission, role check, or feature gate** that controls who can access or modify a resource.

---

## Examples

- Adding a `can_manage_users` permission
- Adding a `require_premium_feature` dependency
- Adding a `require_org_admin` dependency
- Adding resource ownership checks (user can only edit their own content)

---

## Checklist

### Happy Path
- [ ] User with the required permission can perform the action (200)
- [ ] The permission check is applied to all relevant endpoints

### Authz Boundary (Critical)
- [ ] User without the required permission gets 403
- [ ] User from another org gets 403 (or 404 for resource hiding)
- [ ] Anonymous user gets 401

### Error/Edge Cases
- [ ] The dependency handles missing user gracefully
- [ ] The dependency handles missing role gracefully
- [ ] Feature gate returns False → 403 with appropriate message

---

## Service-Level Template

```python
class Test{PermissionName}Rule:

    async def test_user_with_permission_can_access(
        self, db, org, admin_user, bypass_webhooks
    ):
        """User with the {permission} permission can access."""
        # Don't bypass_rbac — we want to test the actual RBAC check
        result = await some_protected_function(
            request=mock_request,
            current_user=admin_user,
            db_session=db,
            ...
        )
        assert result is not None

    async def test_user_without_permission_gets_403(
        self, db, org, regular_user, bypass_webhooks
    ):
        """User without the {permission} permission gets 403."""
        with pytest.raises(HTTPException) as exc:
            await some_protected_function(
                request=mock_request,
                current_user=regular_user,
                db_session=db,
                ...
            )
        assert exc.value.status_code == 403

    async def test_cross_org_user_gets_403(
        self, db, org, other_org, regular_user, bypass_webhooks
    ):
        """User from another org gets 403."""
        with pytest.raises(HTTPException) as exc:
            await some_protected_function(
                request=mock_request,
                current_user=regular_user,
                db_session=db,
                org_id=other_org.id,
                ...
            )
        assert exc.value.status_code == 403

    async def test_anonymous_user_gets_401(
        self, db, bypass_webhooks
    ):
        """Anonymous user gets 401."""
        with pytest.raises(HTTPException) as exc:
            await some_protected_function(
                request=mock_request,
                current_user=AnonymousUser(),
                db_session=db,
                ...
            )
        assert exc.value.status_code == 401
```

---

## Router-Level Template (Feature Gate)

```python
class Test{FeatureName}Gate:

    async def test_feature_enabled_allows_access(self, app, client):
        """When feature is enabled, the endpoint returns 200."""
        app.dependency_overrides[require_{feature}_feature] = lambda: True
        with patch("src.routers.{domain}.{module}.get_{entities}", ...):
            response = await client.get("/api/v1/{domain}")
        assert response.status_code == 200

    async def test_feature_disabled_blocks_access(self, app, client):
        """When feature is disabled, the endpoint returns 403."""
        app.dependency_overrides[require_{feature}_feature] = lambda: False
        response = await client.get("/api/v1/{domain}")
        assert response.status_code == 403
        assert "feature" in response.json()["detail"].lower()
```
