"""Service tests for Chargily checkout creation."""

from unittest.mock import patch

import pytest
from fastapi import HTTPException
from sqlmodel import select

from src.db.payments.enums import (
    AccessTypeEnum,
    EntitlementStatusEnum,
    PaymentModeEnum,
    PaymentOrderStatusEnum,
    PaymentProviderEnum,
)
from src.db.payments.payment_configs import PaymentConfig
from src.db.payments.payment_orders import PaymentOrder
from src.db.payments.resource_entitlements import ResourceEntitlement
from src.db.users import PublicUser
from src.services.payments.chargily import ChargilyError
from src.services.payments.checkout import create_resource_checkout
from src.services.webhooks.crypto import encrypt_secret

COURSE_UUID = "course_test"


class FakeChargilyClient:
    calls: list = []
    fail: bool = False

    def __init__(self, secret_key, mode):
        self.secret_key = secret_key
        self.mode = mode

    async def create_checkout(self, **kwargs):
        FakeChargilyClient.calls.append(kwargs)
        if FakeChargilyClient.fail:
            raise ChargilyError("boom", status_code=500)
        return {
            "id": "ch_123",
            "checkout_url": "https://pay.chargily.test/checkouts/ch_123/pay",
            "fees": 15,
            "fees_on_merchant": 15,
        }


@pytest.fixture(autouse=True)
def reset_fake():
    FakeChargilyClient.calls = []
    FakeChargilyClient.fail = False
    yield


@pytest.fixture
def paid_course(db, course):
    course.access_type = AccessTypeEnum.PAID
    course.price_amount = 1500
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@pytest.fixture
def payment_config(db, org):
    config = PaymentConfig(
        org_id=org.id,
        provider=PaymentProviderEnum.CHARGILY,
        mode=PaymentModeEnum.TEST,
        public_key="pk_test",
        secret_key_encrypted=encrypt_secret("sk_test"),
        active=True,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


class TestCheckoutCreation:
    async def test_creates_pending_order_and_returns_checkout_url(
        self, db, org, paid_course, payment_config, regular_user, mock_request
    ):
        with patch(
            "src.services.payments.checkout.ChargilyClient", FakeChargilyClient
        ):
            result = await create_resource_checkout(
                mock_request, regular_user, org.id, COURSE_UUID, db
            )

        assert result["checkout_url"] == "https://pay.chargily.test/checkouts/ch_123/pay"
        assert result["amount"] == 1500
        assert result["currency"] == "dzd"
        assert result["status"] == "pending"
        assert result["order_uuid"].startswith("order_")

        order = db.exec(
            select(PaymentOrder).where(PaymentOrder.order_uuid == result["order_uuid"])
        ).one()
        assert order.user_id == regular_user.id
        assert order.amount == 1500
        assert order.status == PaymentOrderStatusEnum.PENDING
        assert order.chargily_checkout_id == "ch_123"
        assert order.fees_on_merchant == 15

        assert FakeChargilyClient.calls[0]["amount"] == 1500
        assert FakeChargilyClient.calls[0]["metadata"]["order_uuid"] == result["order_uuid"]
        assert "/payment/success?resource=course_test" in FakeChargilyClient.calls[0]["success_url"]
        assert "/payment/failure?resource=course_test" in FakeChargilyClient.calls[0]["failure_url"]

    async def test_public_resource_is_rejected(
        self, db, org, course, payment_config, regular_user, mock_request
    ):
        with pytest.raises(HTTPException) as exc:
            await create_resource_checkout(
                mock_request, regular_user, org.id, COURSE_UUID, db
            )
        assert exc.value.status_code == 400
        assert "not a paid resource" in exc.value.detail

    async def test_unpriced_resource_is_rejected(
        self, db, org, course, payment_config, regular_user, mock_request
    ):
        course.access_type = AccessTypeEnum.PAID
        db.add(course)
        db.commit()

        with pytest.raises(HTTPException) as exc:
            await create_resource_checkout(
                mock_request, regular_user, org.id, COURSE_UUID, db
            )
        assert exc.value.status_code == 400

    async def test_missing_payment_config_is_rejected(
        self, db, org, paid_course, regular_user, mock_request
    ):
        with pytest.raises(HTTPException) as exc:
            await create_resource_checkout(
                mock_request, regular_user, org.id, COURSE_UUID, db
            )
        assert exc.value.status_code == 400
        assert "not configured" in exc.value.detail

    async def test_existing_entitlement_blocks_checkout(
        self, db, org, paid_course, payment_config, regular_user, mock_request
    ):
        db.add(
            ResourceEntitlement(
                org_id=org.id,
                user_id=regular_user.id,
                resource_uuid=COURSE_UUID,
                resource_type="course",
                status=EntitlementStatusEnum.ACTIVE,
            )
        )
        db.commit()

        with pytest.raises(HTTPException) as exc:
            await create_resource_checkout(
                mock_request, regular_user, org.id, COURSE_UUID, db
            )
        assert exc.value.status_code == 400
        assert "already have access" in exc.value.detail

    async def test_non_member_is_rejected(
        self, db, org, paid_course, payment_config, mock_request
    ):
        outsider = PublicUser(
            id=999,
            username="outsider",
            first_name="Out",
            last_name="Sider",
            email="out@test.com",
            user_uuid="user_outsider",
        )
        with pytest.raises(HTTPException) as exc:
            await create_resource_checkout(
                mock_request, outsider, org.id, COURSE_UUID, db
            )
        assert exc.value.status_code == 403

    async def test_provider_failure_marks_order_failed(
        self, db, org, paid_course, payment_config, regular_user, mock_request
    ):
        FakeChargilyClient.fail = True
        with patch(
            "src.services.payments.checkout.ChargilyClient", FakeChargilyClient
        ):
            with pytest.raises(HTTPException) as exc:
                await create_resource_checkout(
                    mock_request, regular_user, org.id, COURSE_UUID, db
                )

        assert exc.value.status_code == 502
        order = db.exec(select(PaymentOrder)).one()
        assert order.status == PaymentOrderStatusEnum.FAILED
        assert order.failure_message


@pytest.fixture
def paid_collection(db, org, collection, course):
    """A published paid collection with one member course."""
    collection.access_type = AccessTypeEnum.PAID
    collection.price_amount = 2500
    collection.public = False
    collection.published = True
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection


class TestCollectionCheckoutCreation:
    async def test_creates_order_with_membership_snapshot(
        self, db, org, paid_collection, payment_config, regular_user, mock_request
    ):
        with patch(
            "src.services.payments.checkout.ChargilyClient", FakeChargilyClient
        ):
            result = await create_resource_checkout(
                mock_request,
                regular_user,
                org.id,
                paid_collection.collection_uuid,
                db,
            )

        order = db.exec(
            select(PaymentOrder).where(PaymentOrder.order_uuid == result["order_uuid"])
        ).one()
        assert order.resource_type == "collection"
        assert order.amount == 2500
        assert order.price_snapshot["courses"] == ["course_test"]

    async def test_empty_paid_collection_is_rejected(
        self, db, org, collection, payment_config, regular_user, mock_request
    ):
        collection.access_type = AccessTypeEnum.PAID
        collection.price_amount = 2500
        collection.public = False
        collection.published = True
        db.add(collection)
        db.commit()

        from src.db.collections_courses import CollectionCourse

        for link in db.exec(
            select(CollectionCourse).where(
                CollectionCourse.collection_id == collection.id
            )
        ).all():
            db.delete(link)
        db.commit()

        with pytest.raises(HTTPException) as exc:
            await create_resource_checkout(
                mock_request,
                regular_user,
                org.id,
                collection.collection_uuid,
                db,
            )

        assert exc.value.status_code == 400
        assert "no items" in exc.value.detail

    async def test_draft_collection_is_rejected(
        self, db, org, paid_collection, payment_config, regular_user, mock_request
    ):
        paid_collection.published = False
        db.add(paid_collection)
        db.commit()

        with pytest.raises(HTTPException) as exc:
            await create_resource_checkout(
                mock_request,
                regular_user,
                org.id,
                paid_collection.collection_uuid,
                db,
            )

        assert exc.value.status_code == 400
        assert "not published" in exc.value.detail
