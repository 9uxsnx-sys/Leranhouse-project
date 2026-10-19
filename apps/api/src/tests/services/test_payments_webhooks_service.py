"""Service tests for the Chargily webhook receiver."""

import hashlib
import hmac
import json

import pytest
from fastapi import HTTPException
from sqlmodel import select
from starlette.requests import Request

from src.db.courses.courses import Course
from src.db.payments.enums import (
    EntitlementStatusEnum,
    PaymentModeEnum,
    PaymentOrderStatusEnum,
    PaymentProviderEnum,
    WebhookEventStatusEnum,
)
from src.db.payments.payment_configs import PaymentConfig
from src.db.payments.payment_orders import PaymentOrder
from src.db.payments.payment_webhook_events import PaymentWebhookEvent
from src.db.payments.resource_entitlements import ResourceEntitlement
from src.db.podcasts.podcasts import Podcast
from src.db.trail_runs import TrailRun
from src.db.trails import Trail
from src.services.payments.webhooks import (
    handle_chargily_webhook,
    verify_signature,
)
from src.services.webhooks.crypto import encrypt_secret

SECRET = "test_sk_webhook"
ORG_UUID = "org_test"
CHECKOUT_ID = "ch_123"


def _sign(body: bytes, secret: str = SECRET) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def _request(body: bytes, signature: str | None) -> Request:
    headers = [(b"content-type", b"application/json")]
    if signature is not None:
        headers.append((b"signature", signature.encode()))
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/",
        "headers": headers,
        "query_string": b"",
    }

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(scope, receive)


def _payload(event_id: str = "evt_1", event_type: str = "checkout.paid") -> dict:
    return {
        "id": event_id,
        "entity": "event",
        "livemode": "false",
        "type": event_type,
        "data": {
            "id": CHECKOUT_ID,
            "entity": "checkout",
            "amount": 1500,
            "fees": 15,
            "fees_on_merchant": 15,
            "status": "paid" if event_type == "checkout.paid" else "failed",
            "payment_method": "edahabia",
            "metadata": {"order_uuid": "order_test", "user_id": "2", "org_id": "1"},
        },
    }


@pytest.fixture
def payment_config(db, org):
    config = PaymentConfig(
        org_id=org.id,
        provider=PaymentProviderEnum.CHARGILY,
        mode=PaymentModeEnum.TEST,
        public_key="pk_test",
        secret_key_encrypted=encrypt_secret(SECRET),
        active=True,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


@pytest.fixture
def pending_order(db, org, course, regular_user):
    order = PaymentOrder(
        order_uuid="order_test",
        org_id=org.id,
        user_id=regular_user.id,
        resource_uuid=course.course_uuid,
        resource_type="course",
        resource_name=course.name,
        amount=1500,
        currency="DZD",
        status=PaymentOrderStatusEnum.PENDING,
        chargily_checkout_id=CHECKOUT_ID,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


class TestVerifySignature:
    def test_accepts_matching_signature(self):
        body = b'{"a":1}'
        assert verify_signature(body, _sign(body), SECRET) is True

    def test_rejects_missing_or_wrong_signature(self):
        body = b'{"a":1}'
        assert verify_signature(body, None, SECRET) is False
        assert verify_signature(body, "deadbeef", SECRET) is False


class TestChargilyWebhook:
    async def test_checkout_paid_grants_access_and_enrolls(
        self, db, org, payment_config, pending_order, regular_user
    ):
        body = json.dumps(_payload()).encode()
        result = await handle_chargily_webhook(
            _request(body, _sign(body)), ORG_UUID, db
        )
        assert result["status"] == "ok"

        order = db.exec(
            select(PaymentOrder).where(PaymentOrder.id == pending_order.id)
        ).one()
        assert order.status == PaymentOrderStatusEnum.PAID
        assert order.paid_at is not None
        assert order.fees_on_merchant == 15

        entitlement = db.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.user_id == regular_user.id
            )
        ).one()
        assert entitlement.status == EntitlementStatusEnum.ACTIVE
        assert entitlement.source.value == "purchase"
        assert entitlement.order_id == order.id

        # The purchase lands in the learner's Progress tab.
        trail = db.exec(select(Trail).where(Trail.user_id == regular_user.id)).one()
        run = db.exec(
            select(TrailRun).where(TrailRun.trail_id == trail.id)
        ).one()
        enrolled_course = db.exec(
            select(Course).where(Course.course_uuid == order.resource_uuid)
        ).one()
        assert run.course_id == enrolled_course.id

        event = db.exec(select(PaymentWebhookEvent)).one()
        assert event.status == WebhookEventStatusEnum.PROCESSED
        assert event.processed_at is not None

    async def test_duplicate_event_is_a_noop(
        self, db, org, payment_config, pending_order, regular_user
    ):
        body = json.dumps(_payload()).encode()
        signature = _sign(body)

        await handle_chargily_webhook(_request(body, signature), ORG_UUID, db)
        second = await handle_chargily_webhook(_request(body, signature), ORG_UUID, db)

        assert second == {"status": "ok", "duplicate": True}
        assert len(db.exec(select(PaymentWebhookEvent)).all()) == 1
        assert (
            len(
                db.exec(
                    select(ResourceEntitlement).where(
                        ResourceEntitlement.user_id == regular_user.id
                    )
                ).all()
            )
            == 1
        )

    async def test_missing_signature_is_rejected(
        self, db, org, payment_config, pending_order
    ):
        body = json.dumps(_payload()).encode()
        with pytest.raises(HTTPException) as exc:
            await handle_chargily_webhook(_request(body, None), ORG_UUID, db)
        assert exc.value.status_code == 400

    async def test_tampered_signature_is_rejected(
        self, db, org, payment_config, pending_order
    ):
        body = json.dumps(_payload()).encode()
        with pytest.raises(HTTPException) as exc:
            await handle_chargily_webhook(_request(body, "0" * 64), ORG_UUID, db)
        assert exc.value.status_code == 403

    async def test_failed_checkout_updates_order_only(
        self, db, org, payment_config, pending_order, regular_user
    ):
        body = json.dumps(_payload(event_type="checkout.failed")).encode()
        await handle_chargily_webhook(_request(body, _sign(body)), ORG_UUID, db)

        order = db.exec(select(PaymentOrder)).one()
        assert order.status == PaymentOrderStatusEnum.FAILED
        assert db.exec(select(ResourceEntitlement)).first() is None

    async def test_canceled_checkout_updates_order_only(
        self, db, org, payment_config, pending_order
    ):
        body = json.dumps(_payload(event_type="checkout.canceled")).encode()
        await handle_chargily_webhook(_request(body, _sign(body)), ORG_UUID, db)

        order = db.exec(select(PaymentOrder)).one()
        assert order.status == PaymentOrderStatusEnum.CANCELED

    async def test_webhook_secret_is_preferred_when_set(
        self, db, org, payment_config, pending_order
    ):
        payment_config.webhook_secret_encrypted = encrypt_secret("whsec_custom")
        db.add(payment_config)
        db.commit()

        body = json.dumps(_payload()).encode()
        # Signed with the API secret → rejected.
        with pytest.raises(HTTPException) as exc:
            await handle_chargily_webhook(_request(body, _sign(body)), ORG_UUID, db)
        assert exc.value.status_code == 403

        # Signed with the dedicated webhook secret → accepted.
        result = await handle_chargily_webhook(
            _request(body, _sign(body, "whsec_custom")), ORG_UUID, db
        )
        assert result["status"] == "ok"

    async def test_unknown_order_is_acknowledged(
        self, db, org, payment_config
    ):
        payload = _payload(event_id="evt_unknown")
        payload["data"]["id"] = "ch_missing"
        body = json.dumps(payload).encode()

        result = await handle_chargily_webhook(_request(body, _sign(body)), ORG_UUID, db)

        assert result["status"] == "ok"
        event = db.exec(select(PaymentWebhookEvent)).one()
        assert event.status == WebhookEventStatusEnum.PROCESSED

    async def test_unknown_org_is_rejected(self, db, payment_config):
        body = json.dumps(_payload()).encode()
        with pytest.raises(HTTPException) as exc:
            await handle_chargily_webhook(
                _request(body, _sign(body)), "org_missing", db
            )
        assert exc.value.status_code == 404


@pytest.fixture
def collection_order(db, org, collection, course, regular_user):
    """A pending collection order whose snapshot holds two courses."""
    from src.db.collections_courses import CollectionCourse

    second = Course(
        id=51,
        name="Second Course",
        description="Second",
        public=True,
        published=True,
        open_to_contributors=False,
        org_id=org.id,
        course_uuid="course_second",
        creation_date="2026-01-02 00:00:00",
        update_date="2026-01-02 00:00:00",
    )
    db.add(second)
    db.commit()
    db.refresh(second)
    db.add(
        CollectionCourse(
            collection_id=collection.id,
            course_id=second.id,
            resource_type="course",
            resource_uuid=second.course_uuid,
            org_id=org.id,
            creation_date="2026-01-02 00:00:00",
            update_date="2026-01-02 00:00:00",
        )
    )
    db.commit()

    order = PaymentOrder(
        order_uuid="order_collection",
        org_id=org.id,
        user_id=regular_user.id,
        resource_uuid=collection.collection_uuid,
        resource_type="collection",
        resource_name=collection.name,
        amount=2500,
        currency="DZD",
        price_snapshot={
            "amount": 2500,
            "currency": "DZD",
            "courses": [course.course_uuid, second.course_uuid],
        },
        status=PaymentOrderStatusEnum.PENDING,
        chargily_checkout_id=CHECKOUT_ID,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order, course, second


class TestCollectionFanOut:
    async def test_purchase_grants_every_member_course(
        self, db, org, payment_config, collection_order, regular_user
    ):
        order, first, second = collection_order
        body = json.dumps(_payload()).encode()

        result = await handle_chargily_webhook(
            _request(body, _sign(body)), ORG_UUID, db
        )
        assert result["status"] == "ok"

        entitlements = db.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.user_id == regular_user.id
            )
        ).all()
        granted_uuids = {e.resource_uuid for e in entitlements}
        assert order.resource_uuid in granted_uuids
        assert first.course_uuid in granted_uuids
        assert second.course_uuid in granted_uuids

        trail = db.exec(select(Trail).where(Trail.user_id == regular_user.id)).one()
        runs = db.exec(select(TrailRun).where(TrailRun.trail_id == trail.id)).all()
        assert {run.course_id for run in runs} == {first.id, second.id}

    async def test_purchase_grants_podcast_members(
        self, db, org, payment_config, collection_order, regular_user
    ):
        podcast = Podcast(
            id=81,
            org_id=org.id,
            name="Bundle Podcast",
            public=True,
            published=True,
            podcast_uuid="podcast_bundle",
            creation_date="2026-01-03 00:00:00",
            update_date="2026-01-03 00:00:00",
        )
        db.add(podcast)
        db.commit()

        order, first, _second = collection_order
        order.price_snapshot = {
            **(order.price_snapshot or {}),
            "resources": [first.course_uuid, podcast.podcast_uuid],
        }
        db.add(order)
        db.commit()

        body = json.dumps(_payload()).encode()
        result = await handle_chargily_webhook(
            _request(body, _sign(body)), ORG_UUID, db
        )
        assert result["status"] == "ok"

        entitlements = db.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.user_id == regular_user.id
            )
        ).all()
        podcast_entitlement = next(
            e for e in entitlements if e.resource_uuid == podcast.podcast_uuid
        )
        assert podcast_entitlement.resource_type == "podcast"

        trail = db.exec(select(Trail).where(Trail.user_id == regular_user.id)).one()
        runs = db.exec(select(TrailRun).where(TrailRun.trail_id == trail.id)).all()
        assert {run.course_id for run in runs} == {first.id}

    async def test_already_owned_course_is_not_granted_twice(
        self, db, org, payment_config, collection_order, regular_user
    ):
        order, first, second = collection_order
        db.add(
            ResourceEntitlement(
                org_id=org.id,
                user_id=regular_user.id,
                resource_uuid=first.course_uuid,
                resource_type="course",
                status=EntitlementStatusEnum.ACTIVE,
            )
        )
        db.commit()

        body = json.dumps(_payload()).encode()
        await handle_chargily_webhook(_request(body, _sign(body)), ORG_UUID, db)

        first_grants = db.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.user_id == regular_user.id,
                ResourceEntitlement.resource_uuid == first.course_uuid,
            )
        ).all()
        assert len(first_grants) == 1

        second_grants = db.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.user_id == regular_user.id,
                ResourceEntitlement.resource_uuid == second.course_uuid,
            )
        ).all()
        assert len(second_grants) == 1

    async def test_duplicate_collection_event_does_not_duplicate_grants(
        self, db, org, payment_config, collection_order, regular_user
    ):
        body = json.dumps(_payload()).encode()
        signature = _sign(body)

        await handle_chargily_webhook(_request(body, signature), ORG_UUID, db)
        second = await handle_chargily_webhook(_request(body, signature), ORG_UUID, db)

        assert second == {"status": "ok", "duplicate": True}
        entitlements = db.exec(
            select(ResourceEntitlement).where(
                ResourceEntitlement.user_id == regular_user.id
            )
        ).all()
        assert len(entitlements) == 3

        trail = db.exec(select(Trail).where(Trail.user_id == regular_user.id)).one()
        assert len(db.exec(select(TrailRun).where(TrailRun.trail_id == trail.id)).all()) == 2
