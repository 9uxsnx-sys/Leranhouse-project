"""One webhook endpoint and a realistic delivery history."""

from __future__ import annotations

from src.db.webhooks import WebhookDeliveryLog, WebhookEndpoint
from src.services.seed.core import SeedContext, iso, new_uuid

EVENTS = [
    "course_enrolled",
    "course_completed",
    "user_signed_up",
    "discussion_posted",
    "certificate_claimed",
    "activity_completed",
]


def create_webhooks(ctx: SeedContext) -> None:
    endpoint = WebhookEndpoint(
        webhook_uuid=new_uuid("webhook"),
        org_id=ctx.org_id,
        url="https://hooks.example.com/koodook/events",
        secret_encrypted="seed_placeholder_secret",
        description="Sends enrollment and completion events to the internal CRM.",
        events=EVENTS,
        is_active=True,
        source="manual",
        zap_name=None,
        zap_id=None,
        created_by_user_id=int(ctx.owner.id or 0),
        creation_date=iso(ctx.date_between(160, 120)),
        update_date=iso(ctx.now),
    )
    ctx.session.add(endpoint)
    ctx.session.commit()
    ctx.session.refresh(endpoint)

    for index in range(60):
        success = ctx.rng.random() < 0.88
        attempt = 1 if success else ctx.rng.randint(2, 4)
        created = ctx.date_between(120, 1)
        ctx.session.add(
            WebhookDeliveryLog(
                webhook_id=int(endpoint.id or 0),
                event_name=ctx.rng.choice(EVENTS),
                delivery_uuid=new_uuid("delivery"),
                request_payload={
                    "event": ctx.rng.choice(EVENTS),
                    "org": ctx.org.slug,
                    "sequence": index,
                },
                response_status=200 if success else ctx.rng.choice([500, 502, 504]),
                response_body='{"received":true}' if success else '{"error":"timeout"}',
                success=success,
                attempt=attempt,
                error_message=None if success else "The endpoint did not answer within ten seconds.",
                created_at=iso(created),
            )
        )
    ctx.session.commit()
