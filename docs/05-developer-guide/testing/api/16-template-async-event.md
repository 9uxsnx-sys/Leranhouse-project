# Template: Async Event Chain

Use this template when a feature involves **event-driven chains** — one action triggers a sequence of async reactions such as notifications, webhooks, analytics, and side effects.

---

## Examples

- Course published → notify subscribers → dispatch webhook → track analytics
- Payment received → grant access → send email → update dashboard
- User registered → send welcome email → create default workspace → track signup
- Comment added → notify thread participants → update comment count → trigger moderation

---

## Checklist

### Happy Path
- [ ] Event is emitted at the correct point in the workflow
- [ ] Event payload contains all required data
- [ ] All subscribers receive the event
- [ ] Each subscriber performs its expected side effect

### Error/Edge Cases
- [ ] Failed subscriber doesn't block other subscribers
- [ ] Failed subscriber is retried (if configured)
- [ ] Events are idempotent — replaying doesn't duplicate effects
- [ ] Event ordering is preserved where required
- [ ] Events with no subscribers are handled (logged or dead-lettered)

### Authz
- [ ] Event emission respects the permissions of the triggering user
- [ ] Events cannot be emitted manually by unauthorized users

---

## Service-Level Template

```python
class Test{EventName}EventChain:

    async def test_event_emitted_at_correct_point(
        self, db, org, admin_user, {entity}, bypass_rbac
    ):
        """The event is emitted when the action completes."""
        events_received = []

        with patch(
            "src.services.events.dispatch.dispatch_event",
            new_callable=AsyncMock,
            side_effect=lambda event: events_received.append(event.name),
        ):
            await publish_{entity}(
                request=mock_request,
                {entity}_uuid={entity}.{entity}_uuid,
                current_user=admin_user,
                db_session=db,
            )

        assert "{event_name}" in events_received

    async def test_all_subscribers_receive_event(
        self, db, org, admin_user, {entity}, bypass_rbac
    ):
        """All configured subscribers process the event."""
        subscriber_calls = {{}}

        async def track_subscriber(subscriber_name, payload):
            subscriber_calls[subscriber_name] = payload

        with patch(
            "src.services.events.subscribers.send_notification",
            new_callable=AsyncMock,
            side_effect=lambda p: track_subscriber("notification", p),
        ), patch(
            "src.services.events.subscribers.dispatch_webhook",
            new_callable=AsyncMock,
            side_effect=lambda p: track_subscriber("webhook", p),
        ), patch(
            "src.services.events.subscribers.track_analytics",
            new_callable=AsyncMock,
            side_effect=lambda p: track_subscriber("analytics", p),
        ):
            await publish_{entity}(...)

        assert "notification" in subscriber_calls
        assert "webhook" in subscriber_calls
        assert "analytics" in subscriber_calls

    async def test_failed_subscriber_does_not_block_others(
        self, db, org, admin_user, {entity}, bypass_rbac
    ):
        """If webhook dispatch fails, notification is still sent."""
        notification_sent = False

        with patch(
            "src.services.events.subscribers.dispatch_webhook",
            new_callable=AsyncMock,
            side_effect=ConnectionError("Webhook target unreachable"),
        ), patch(
            "src.services.events.subscribers.send_notification",
            new_callable=AsyncMock,
            side_effect=lambda p: set_notification_sent(),
        ):
            await publish_{entity}(...)
            # Notification should still be sent despite webhook failure

        assert notification_sent is True

    async def test_event_idempotency(
        self, db, org, admin_user, {entity}, bypass_rbac
    ):
        """Same event delivered twice does not duplicate side effects."""
        effect_count = 0

        async def count_side_effects(payload):
            nonlocal effect_count
            effect_count += 1

        with patch(
            "src.services.events.subscribers.grant_course_access",
            new_callable=AsyncMock,
            side_effect=count_side_effects,
        ):
            # Emit the same event twice
            await publish_{entity}(...)
            await publish_{entity}(...)  # Same event ID

        # Side effect should only happen once
        assert effect_count == 1

    async def test_event_payload_contains_required_data(
        self, db, org, admin_user, {entity}, bypass_rbac
    ):
        """The event payload includes all necessary context."""
        received_payload = {{}}

        with patch(
            "src.services.events.dispatch.dispatch_event",
            new_callable=AsyncMock,
            side_effect=lambda event, payload: received_payload.update(payload),
        ):
            await publish_{entity}(...)

        assert "{entity}_uuid" in received_payload
        assert "org_id" in received_payload
        assert "published_by" in received_payload
```
