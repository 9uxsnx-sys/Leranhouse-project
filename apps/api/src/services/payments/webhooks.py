"""Chargily Pay v2 webhook processing.

Contract (dev.chargily.com/pay-v2/webhooks):
- POST with a `signature` header = hex HMAC-SHA256 of the **raw body**,
  keyed with the organization's API secret key.
- Missing header → 400, mismatch → 403.
- Events: `checkout.paid`, `checkout.failed`, `checkout.canceled`.
- Respond 200 to acknowledge.
"""

import hashlib
import hmac
import json
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

from fastapi import HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.payments.enums import (
    EntitlementSourceEnum,
    EntitlementStatusEnum,
    PaymentMethodEnum,
    PaymentOrderStatusEnum,
    PaymentProviderEnum,
    WebhookEventStatusEnum,
)
from src.db.payments.payment_configs import PaymentConfig
from src.db.payments.payment_orders import PaymentOrder
from src.db.payments.payment_webhook_events import PaymentWebhookEvent
from src.db.payments.resource_entitlements import ResourceEntitlement
from src.db.podcasts.episodes import PodcastEpisode  # noqa: F401 — TrailStep FK target
from src.db.podcasts.podcasts import Podcast  # noqa: F401 — TrailStep FK target
from src.db.trail_runs import TrailRun
from src.db.trails import Trail
from src.services.webhooks.crypto import decrypt_secret

SIGNATURE_HEADER = "signature"


def verify_signature(raw_body: bytes, signature: Optional[str], secret: str) -> bool:
    """Constant-time check of the Chargily HMAC-SHA256 signature."""
    if not signature:
        return False
    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def _resolve_secret(config: PaymentConfig) -> Optional[str]:
    encrypted = config.webhook_secret_encrypted or config.secret_key_encrypted
    if not encrypted:
        return None
    return decrypt_secret(encrypted)


def _ensure_course_enrollment(order: PaymentOrder, db_session: Session, now: datetime) -> None:
    """Create the TrailRun so the purchased course lands in the Progress tab."""
    if order.resource_type != "course":
        return

    course = db_session.exec(
        select(Course).where(Course.course_uuid == order.resource_uuid)
    ).first()
    if not course:
        return

    trail = db_session.exec(
        select(Trail).where(
            Trail.org_id == order.org_id,
            Trail.user_id == order.user_id,
        )
    ).first()
    if not trail:
        trail = Trail(
            org_id=order.org_id,
            user_id=order.user_id,
            trail_uuid=f"trail_{uuid4()}",
            creation_date=now.isoformat(),
            update_date=now.isoformat(),
        )
        db_session.add(trail)
        db_session.flush()

    run = db_session.exec(
        select(TrailRun).where(
            TrailRun.trail_id == trail.id,
            TrailRun.course_id == course.id,
            TrailRun.user_id == order.user_id,
        )
    ).first()
    if not run:
        db_session.add(
            TrailRun(
                trail_id=trail.id,
                course_id=course.id,
                org_id=order.org_id,
                user_id=order.user_id,
                creation_date=now.isoformat(),
                update_date=now.isoformat(),
            )
        )


def _mark_paid(order: PaymentOrder, checkout: dict[str, Any], now: datetime) -> None:
    order.status = PaymentOrderStatusEnum.PAID
    order.paid_at = now
    order.fees = int(checkout.get("fees") or order.fees or 0)
    order.fees_on_merchant = int(
        checkout.get("fees_on_merchant") or order.fees_on_merchant or 0
    )

    method = checkout.get("payment_method")
    if method:
        try:
            order.payment_method = PaymentMethodEnum(method)
        except ValueError:
            pass

    order.provider_payload = checkout
    order.update_date = now.isoformat()


def _handle_event(
    event_type: str,
    checkout: dict[str, Any],
    db_session: Session,
    now: datetime,
) -> bool:
    """Apply one Chargily event. Returns False when the order is unknown."""
    checkout_id = checkout.get("id")
    if not checkout_id:
        return False

    order = db_session.exec(
        select(PaymentOrder).where(PaymentOrder.chargily_checkout_id == checkout_id)
    ).first()
    if not order:
        return False

    if event_type == "checkout.paid":
        _mark_paid(order, checkout, now)

        existing = db_session.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.org_id == order.org_id,
                ResourceEntitlement.user_id == order.user_id,
                ResourceEntitlement.resource_uuid == order.resource_uuid,
                ResourceEntitlement.status == EntitlementStatusEnum.ACTIVE,
            )
        ).first()
        if not existing:
            db_session.add(
                ResourceEntitlement(
                    org_id=order.org_id,
                    user_id=order.user_id,
                    resource_uuid=order.resource_uuid,
                    resource_type=order.resource_type,
                    source=EntitlementSourceEnum.PURCHASE,
                    order_id=order.id,
                    status=EntitlementStatusEnum.ACTIVE,
                    valid_from=now,
                    granted_at=now,
                )
            )

        _ensure_course_enrollment(order, db_session, now)

    elif event_type == "checkout.failed":
        order.status = PaymentOrderStatusEnum.FAILED
        order.provider_payload = checkout
        order.update_date = now.isoformat()

    elif event_type == "checkout.canceled":
        order.status = PaymentOrderStatusEnum.CANCELED
        order.provider_payload = checkout
        order.update_date = now.isoformat()

    db_session.add(order)
    return True


async def handle_chargily_webhook(
    request: Request,
    org_uuid: str,
    db_session: Session,
) -> dict[str, Any]:
    raw_body = await request.body()

    org = db_session.exec(
        select(Organization).where(Organization.org_uuid == org_uuid)
    ).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    config = db_session.exec(
        select(PaymentConfig).where(
            PaymentConfig.org_id == org.id,
            PaymentConfig.provider == PaymentProviderEnum.CHARGILY,
        )
    ).first()
    if not config:
        raise HTTPException(status_code=400, detail="Payments are not configured")

    secret = _resolve_secret(config)
    if not secret:
        raise HTTPException(status_code=400, detail="Payments are not configured")

    signature = request.headers.get(SIGNATURE_HEADER)
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature header")
    if not verify_signature(raw_body, signature, secret):
        raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        payload = json.loads(raw_body)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_id = payload.get("id")
    event_type = payload.get("type") or ""
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event id")

    event = db_session.exec(
        select(PaymentWebhookEvent).where(PaymentWebhookEvent.event_id == event_id)
    ).first()

    if event and event.status == WebhookEventStatusEnum.PROCESSED:
        return {"status": "ok", "duplicate": True}

    now = datetime.now()
    if event:
        event.attempts += 1
        event.status = WebhookEventStatusEnum.PROCESSING
    else:
        event = PaymentWebhookEvent(
            event_id=event_id,
            event_type=event_type,
            status=WebhookEventStatusEnum.PROCESSING,
            attempts=1,
            raw_payload=payload,
            received_at=now,
        )
        db_session.add(event)

    try:
        db_session.commit()
    except IntegrityError:
        # Another delivery inserted the same event concurrently.
        db_session.rollback()
        return {"status": "ok", "duplicate": True}

    try:
        checkout = payload.get("data") or {}
        _handle_event(event_type, checkout, db_session, now)

        event.status = WebhookEventStatusEnum.PROCESSED
        event.processed_at = datetime.now()
        db_session.add(event)
        db_session.commit()
    except Exception as exc:
        db_session.rollback()
        failed = db_session.exec(
            select(PaymentWebhookEvent).where(
                PaymentWebhookEvent.event_id == event_id
            )
        ).first()
        if failed:
            failed.status = WebhookEventStatusEnum.FAILED
            failed.error_message = str(exc)[:1000]
            db_session.add(failed)
            db_session.commit()
        raise HTTPException(status_code=500, detail="Webhook processing failed")

    return {"status": "ok"}
