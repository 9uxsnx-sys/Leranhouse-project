# Template: State Machine / Workflow

Use this template when a feature involves **multi-step workflows** with defined states and transitions — approval flows, onboarding sequences, order processing, etc.

---

## Examples

- Course proposal: DRAFT → PENDING_APPROVAL → APPROVED → REJECTED → PUBLISHED
- Agent action: REQUESTED → IN_PROGRESS → COMPLETED → FAILED
- User onboarding: INVITED → ACTIVATED → VERIFIED → ACTIVE
- Payment: PENDING → PROCESSING → COMPLETED → FAILED → REFUNDED

---

## Checklist

### Happy Path
- [ ] Valid state transitions work (e.g., DRAFT → PENDING_APPROVAL → APPROVED)
- [ ] Each transition updates the state in the database
- [ ] The state is returned in the API response

### Error/Edge Cases
- [ ] Invalid state transitions are rejected (e.g., DRAFT → APPROVED directly) with 422
- [ ] Transition from unknown state returns 404
- [ ] Non-existent resource returns 404
- [ ] Idempotency: applying the same transition twice doesn't error

### Authz Boundary
- [ ] Only users with the right role can trigger specific transitions
- [ ] User from another org cannot trigger transitions (403/404)
- [ ] Anonymous user cannot trigger transitions (401)

### Time-Sensitive Behavior (if applicable)
- [ ] Pending approval expires → auto-rejected or notified
- [ ] Timeout transitions work correctly

---

## Service-Level Template

```python
class Test{Entity}StateMachine:

    async def test_valid_state_transition(
        self, db, org, admin_user, {entity}, bypass_rbac, bypass_webhooks
    ):
        """Transitioning from a valid state succeeds."""
        {entity}.status = "draft"
        db.commit()

        result = await transition_{entity}_status(
            request=mock_request,
            {entity}_uuid={entity}.{entity}_uuid,
            new_status="pending_approval",
            current_user=admin_user,
            db_session=db,
        )
        assert result.status == "pending_approval"

    async def test_invalid_state_transition_returns_422(
        self, db, org, admin_user, {entity}, bypass_rbac, bypass_webhooks
    ):
        """Transitioning from an invalid state is rejected."""
        {entity}.status = "draft"
        db.commit()

        with pytest.raises(HTTPException) as exc:
            await transition_{entity}_status(
                request=mock_request,
                {entity}_uuid={entity}.{entity}_uuid,
                new_status="approved",  # Can't go from draft to approved directly
                current_user=admin_user,
                db_session=db,
            )
        assert exc.value.status_code == 422
        assert "transition" in str(exc.value.detail).lower()

    async def test_full_approval_workflow(
        self, db, org, admin_user, {entity}, bypass_rbac, bypass_webhooks
    ):
        """Complete workflow: draft → pending → approved."""
        {entity}.status = "draft"
        db.commit()

        # Step 1: Submit for approval
        r1 = await transition_{entity}_status(
            ..., new_status="pending_approval", ...
        )
        assert r1.status == "pending_approval"

        # Step 2: Approve
        r2 = await transition_{entity}_status(
            ..., new_status="approved", ...
        )
        assert r2.status == "approved"

    async def test_approval_then_rejection(
        self, db, org, admin_user, {entity}, bypass_rbac, bypass_webhooks
    ):
        """Once approved, rejection should not be possible."""
        {entity}.status = "approved"
        db.commit()

        with pytest.raises(HTTPException) as exc:
            await transition_{entity}_status(
                ..., new_status="rejected", ...
            )
        assert exc.value.status_code == 422

    async def test_idempotent_transition(
        self, db, org, admin_user, {entity}, bypass_rbac, bypass_webhooks
    ):
        """Transitioning to the same state twice succeeds (no-op)."""
        {entity}.status = "approved"
        db.commit()

        result = await transition_{entity}_status(
            ..., new_status="approved", ...
        )
        assert result.status == "approved"  # No error
```

---

## Router-Level Template

```python
class Test{Entity}StateMachineRouter:

    async def test_transition_endpoint_returns_200(self, client):
        """Valid state transition via HTTP returns 200."""
        with patch(
            "src.routers.{domain}.{module}.transition_{entity}_status",
            new_callable=AsyncMock,
            return_value={{"status": "approved"}},
        ):
            response = await client.put(
                "/api/v1/{domain}/{entity}_uuid/status",
                json={{"status": "approved"}},
            )
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

    async def test_invalid_transition_via_http_returns_422(self, client):
        """Invalid state transition via HTTP returns 422."""
        with patch(
            "src.routers.{domain}.{module}.transition_{entity}_status",
            new_callable=AsyncMock,
            side_effect=HTTPException(
                status_code=422,
                detail="Invalid transition from 'draft' to 'approved'",
            ),
        ):
            response = await client.put(
                "/api/v1/{domain}/{entity}_uuid/status",
                json={{"status": "approved"}},
            )
        assert response.status_code == 422
```
