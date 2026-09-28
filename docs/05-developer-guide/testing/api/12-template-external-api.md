# Template: External API Mocking

Use this template when your code **calls an external service** — S3 for file storage, Stripe/Chargily for payments, Resend for email, OpenAI for AI, etc.

---

## Examples

- Uploading a file to S3
- Charging a payment via Chargily/Stripe
- Sending an email via Resend
- Calling OpenAI for content generation
- Fetching data from a third-party API

---

## Checklist

### Happy Path
- [ ] External API call succeeds → function returns expected result
- [ ] Response from external API is correctly parsed

### Error/Edge Cases
- [ ] External API returns 4xx → handled gracefully (retry or error)
- [ ] External API returns 5xx → handled gracefully (retry or error)
- [ ] External API times out → handled gracefully (timeout exception)
- [ ] External API returns unexpected data format → handled gracefully
- [ ] Rate limiting → requests are queued or throttled

### Authz
- [ ] API keys are not exposed in error messages
- [ ] API keys are not logged

---

## Service-Level Template

```python
class Test{ExternalService}Integration:

    async def test_successful_api_call(
        self, db, org, admin_user, bypass_rbac, bypass_webhooks
    ):
        """External API call succeeds and returns expected data."""
        mock_response = {{
            "id": "charge_123",
            "status": "succeeded",
            "amount": 2999,
            "currency": "DZD",
        }}

        with patch(
            "src.services.{domain}.{module}.{external_client}.create_charge",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            result = await process_payment(
                request=mock_request,
                amount=2999,
                currency="DZD",
                current_user=admin_user,
                db_session=db,
            )
        assert result["status"] == "succeeded"
        assert result["amount"] == 2999

    async def test_api_returns_error_raises_exception(
        self, db, org, admin_user, bypass_rbac, bypass_webhooks
    ):
        """External API returns an error."""
        with patch(
            "src.services.{domain}.{module}.{external_client}.create_charge",
            new_callable=AsyncMock,
            side_effect=HTTPException(
                status_code=402,
                detail="Payment failed: insufficient funds",
            ),
        ):
            with pytest.raises(HTTPException) as exc:
                await process_payment(
                    request=mock_request,
                    amount=999999,
                    currency="DZD",
                    current_user=admin_user,
                    db_session=db,
                )
        assert exc.value.status_code == 402

    async def test_api_timeout_retries(
        self, db, org, admin_user, bypass_rbac, bypass_webhooks
    ):
        """External API timeout triggers retry logic."""
        call_count = 0

        async def timeout_then_succeed(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise TimeoutError("Connection timed out")
            return {{"status": "succeeded"}}

        with patch(
            "src.services.{domain}.{module}.{external_client}.create_charge",
            new_callable=AsyncMock,
            side_effect=timeout_then_succeed,
        ):
            result = await process_payment(
                request=mock_request,
                amount=2999,
                currency="DZD",
                current_user=admin_user,
                db_session=db,
                max_retries=3,
            )
        assert result["status"] == "succeeded"
        assert call_count == 3  # 2 timeouts + 1 success

    async def test_api_unexpected_response_format(
        self, db, org, admin_user, bypass_rbac, bypass_webhooks
    ):
        """External API returns unexpected data shape."""
        with patch(
            "src.services.{domain}.{module}.{external_client}.create_charge",
            new_callable=AsyncMock,
            return_value={{"unexpected": "data"}},  # Missing required fields
        ):
            with pytest.raises(ValueError) as exc:
                await process_payment(
                    request=mock_request,
                    amount=2999,
                    currency="DZD",
                    current_user=admin_user,
                    db_session=db,
                )
            assert "unexpected" in str(exc.value).lower()

    async def test_api_key_not_exposed_in_error(
        self, db, org, admin_user, bypass_rbac, bypass_webhooks
    ):
        """Error messages do not contain API keys."""
        with patch(
            "src.services.{domain}.{module}.{external_client}.create_charge",
            new_callable=AsyncMock,
            side_effect=Exception("API key 'sk_live_xxx' is invalid"),
        ):
            with pytest.raises(HTTPException) as exc:
                await process_payment(
                    request=mock_request,
                    amount=2999,
                    currency="DZD",
                    current_user=admin_user,
                    db_session=db,
                )
            assert "sk_live" not in str(exc.value.detail)
```
