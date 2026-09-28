# Template: Incoming Webhook

Use this template when your application **receives callbacks** from an external service — payment confirmations, email delivery status, CI/CD events, etc.

---

## Examples

- Chargily payment webhook (payment succeeded/failed)
- Resend email delivery webhook
- Stripe checkout session completed webhook
- GitHub push event webhook

---

## Checklist

### Happy Path
- [ ] Valid webhook payload with correct signature returns 200
- [ ] The webhook triggers the expected side effect (payment marked paid, email marked delivered)
- [ ] Response confirms receipt

### Error/Edge Cases
- [ ] Invalid signature returns 400/403
- [ ] Malformed payload returns 400/422
- [ ] Duplicate webhook (same event ID) is idempotent — returns 200 without duplicate side effects
- [ ] Unknown event type returns 200 (acknowledge but ignore)
- [ ] Expired timestamp returns 400

### Authz
- [ ] No auth required (webhooks are authenticated via signature, not user token)

---

## Router-Level Template

```python
class Test{WebhookName}Webhook:

    async def test_valid_webhook_processes_successfully(
        self, app, client
    ):
        """A valid webhook with correct signature is processed."""
        payload = {{
            "event": "payment.succeeded",
            "data": {{
                "payment_id": "pay_123",
                "amount": 2999,
                "currency": "DZD",
            }},
            "signature": "valid_signature",
        }}
        with patch(
            "src.routers.webhooks.{module}.verify_signature",
            return_value=True,
        ):
            with patch(
                "src.routers.webhooks.{module}.process_payment",
                new_callable=AsyncMock,
                return_value={{"status": "processed"}},
            ):
                response = await client.post(
                    "/api/v1/webhooks/{provider}",
                    json=payload,
                )
        assert response.status_code == 200

    async def test_invalid_signature_returns_403(
        self, app, client
    ):
        """Webhook with invalid signature is rejected."""
        payload = {{
            "event": "payment.succeeded",
            "data": {{}},
            "signature": "invalid",
        }}
        with patch(
            "src.routers.webhooks.{module}.verify_signature",
            return_value=False,
        ):
            response = await client.post(
                "/api/v1/webhooks/{provider}",
                json=payload,
            )
        assert response.status_code == 403

    async def test_duplicate_webhook_is_idempotent(
        self, app, client
    ):
        """Same event ID processed twice returns 200 without duplicate effects."""
        payload = {{
            "event_id": "evt_unique_123",
            "event": "payment.succeeded",
            "data": {{"payment_id": "pay_123"}},
            "signature": "valid",
        }}
        side_effects = []

        async def process_with_idempotency_check(data):
            if data["event_id"] not in side_effects:
                side_effects.append(data["event_id"])
                return {{"status": "processed"}}
            return {{"status": "already_processed"}}

        with patch(
            "src.routers.webhooks.{module}.verify_signature",
            return_value=True,
        ):
            with patch(
                "src.routers.webhooks.{module}.process_webhook_event",
                new_callable=AsyncMock,
                side_effect=process_with_idempotency_check,
            ):
                # First call
                r1 = await client.post("/api/v1/webhooks/{provider}", json=payload)
                assert r1.status_code == 200
                # Duplicate call
                r2 = await client.post("/api/v1/webhooks/{provider}", json=payload)
                assert r2.status_code == 200
                # Side effect should only have happened once
                assert len(side_effects) == 1

    async def test_malformed_payload_returns_422(
        self, app, client
    ):
        """Malformed JSON body returns 422."""
        response = await client.post(
            "/api/v1/webhooks/{provider}",
            content=b"not-json",
            headers={{"content-type": "application/json"}},
        )
        assert response.status_code == 422
```
