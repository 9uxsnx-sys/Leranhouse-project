"""Payment config, orders, entitlements, payout costs and webhook log."""

from __future__ import annotations

import uuid
from datetime import timedelta

from src.db.payments.enums import (
    EntitlementSourceEnum,
    EntitlementStatusEnum,
    PaymentMethodEnum,
    PaymentModeEnum,
    PaymentOrderStatusEnum,
    PaymentProviderEnum,
    WebhookEventStatusEnum,
)
from src.db.payments.payment_configs import PaymentConfig
from src.db.payments.payment_orders import PaymentOrder
from src.db.payments.payment_webhook_events import PaymentWebhookEvent
from src.db.payments.payout_costs import PayoutCost
from src.db.payments.resource_entitlements import ResourceEntitlement
from src.services.seed.core import SeedContext, iso, new_uuid

ORDER_TARGETS = 140


def create_payments(ctx: SeedContext) -> None:
    ctx.session.add(
        PaymentConfig(
            org_id=ctx.org_id,
            provider=PaymentProviderEnum.CHARGILY,
            mode=PaymentModeEnum.TEST,
            public_key="test_pk_seed_demo",
            secret_key_encrypted=None,
            webhook_secret_encrypted=None,
            active=False,
            creation_date=iso(ctx.date_between(200, 180)),
            update_date=iso(ctx.now),
        )
    )
    ctx.session.commit()

    paid_courses = [
        course for course in ctx.courses
        if course.published and course.price_amount
    ]
    paid_collections = [
        collection for collection in ctx.collections
        if collection.published and collection.price_amount
    ]

    if not paid_courses:
        return

    orders: list[PaymentOrder] = []
    for index in range(ORDER_TARGETS):
        buyer = ctx.rng.choice(ctx.students)
        use_collection = paid_collections and ctx.rng.random() < 0.35
        if use_collection:
            target = ctx.rng.choice(paid_collections)
            resource_uuid = target.collection_uuid
            resource_type = "collection"
            resource_name = target.name
            amount = int(target.price_amount or 0)
        else:
            target = ctx.rng.choice(paid_courses)
            resource_uuid = target.course_uuid
            resource_type = "course"
            resource_name = target.name
            amount = int(target.price_amount or 0)

        status = ctx.rng.choices(
            [
                PaymentOrderStatusEnum.PAID,
                PaymentOrderStatusEnum.PENDING,
                PaymentOrderStatusEnum.FAILED,
                PaymentOrderStatusEnum.EXPIRED,
                PaymentOrderStatusEnum.REFUNDED,
                PaymentOrderStatusEnum.CANCELED,
            ],
            weights=[78, 8, 6, 4, 3, 1],
        )[0]
        created = ctx.date_between(175, 1)
        paid_at = created + timedelta(minutes=ctx.rng.randint(2, 40))
        fees = int(amount * 0.025) if status != PaymentOrderStatusEnum.FAILED else 0

        order = PaymentOrder(
            order_uuid=new_uuid("paymentorder"),
            org_id=ctx.org_id,
            user_id=int(buyer.id or 0),
            resource_uuid=resource_uuid,
            resource_type=resource_type,
            resource_name=resource_name,
            amount=amount,
            currency="DZD",
            price_snapshot={
                "amount": amount,
                "currency": "DZD",
                "resource_name": resource_name,
            },
            payment_method=ctx.rng.choice(
                [PaymentMethodEnum.EDAHABIA, PaymentMethodEnum.CIB]
            ),
            status=status,
            chargily_checkout_id=f"checkout_{uuid.uuid4().hex[:18]}",
            chargily_payment_id=(
                f"pay_{uuid.uuid4().hex[:18]}"
                if status == PaymentOrderStatusEnum.PAID
                else None
            ),
            checkout_url=None,
            idempotency_key=None,
            customer_name=f"{buyer.first_name} {buyer.last_name}",
            customer_email=buyer.email,
            customer_phone="05" + str(ctx.rng.randint(10000000, 99999999)),
            fees=fees,
            fees_on_merchant=fees,
            failure_code="insufficient_funds" if status == PaymentOrderStatusEnum.FAILED else None,
            failure_message=(
                "The card was declined by the issuer."
                if status == PaymentOrderStatusEnum.FAILED
                else None
            ),
            provider_payload=None,
            expires_at=(created + timedelta(hours=1)).replace(tzinfo=None)
            if status in (PaymentOrderStatusEnum.PENDING, PaymentOrderStatusEnum.EXPIRED)
            else None,
            paid_at=paid_at.replace(tzinfo=None)
            if status
            in (
                PaymentOrderStatusEnum.PAID,
                PaymentOrderStatusEnum.REFUNDED,
            )
            else None,
            creation_date=iso(created),
            update_date=iso(paid_at),
        )
        ctx.session.add(order)
        orders.append(order)

    ctx.session.commit()

    granted: set[tuple[int, str]] = set()
    for order in orders:
        ctx.session.refresh(order)
        if order.status in (
            PaymentOrderStatusEnum.PAID,
            PaymentOrderStatusEnum.REFUNDED,
        ):
            key = (order.user_id, order.resource_uuid)
            if key in granted:
                continue
            granted.add(key)
            paid_at = order.paid_at
            ctx.session.add(
                ResourceEntitlement(
                    org_id=ctx.org_id,
                    user_id=order.user_id,
                    resource_uuid=order.resource_uuid,
                    resource_type=order.resource_type,
                    source=EntitlementSourceEnum.PURCHASE,
                    order_id=int(order.id or 0),
                    status=(
                        EntitlementStatusEnum.REVOKED
                        if order.status == PaymentOrderStatusEnum.REFUNDED
                        else EntitlementStatusEnum.ACTIVE
                    ),
                    valid_from=paid_at,
                    valid_until=None,
                    granted_by=None,
                    granted_at=paid_at,
                    revoked_at=paid_at if order.status == PaymentOrderStatusEnum.REFUNDED else None,
                    revoke_reason=(
                        "Refunded on request"
                        if order.status == PaymentOrderStatusEnum.REFUNDED
                        else None
                    ),
                )
            )

        event_status = (
            WebhookEventStatusEnum.PROCESSED
            if order.status != PaymentOrderStatusEnum.FAILED
            else WebhookEventStatusEnum.FAILED
        )
        ctx.session.add(
            PaymentWebhookEvent(
                event_id=f"evt_{uuid.uuid4().hex[:20]}",
                event_type="checkout.paid" if order.status == PaymentOrderStatusEnum.PAID else "checkout.updated",
                status=event_status,
                attempts=1 if event_status == WebhookEventStatusEnum.PROCESSED else 3,
                raw_payload={
                    "order": order.order_uuid,
                    "status": order.status.value,
                    "amount": order.amount,
                },
                error_message=(
                    None
                    if event_status == WebhookEventStatusEnum.PROCESSED
                    else "Signature verification failed on the first three attempts."
                ),
                received_at=order.paid_at or ctx.now.replace(tzinfo=None),
                processed_at=order.paid_at or None,
            )
        )
    ctx.session.commit()

    _create_payout_costs(ctx)


def _create_payout_costs(ctx: SeedContext) -> None:
    for offset in range(6):
        month_date = (ctx.now.replace(day=1) - timedelta(days=30 * offset))
        ctx.session.add(
            PayoutCost(
                org_id=ctx.org_id,
                month=month_date.strftime("%Y-%m"),
                hosting=18000 + offset * 500,
                marketing=25000 + ctx.rng.randint(0, 9000),
                other=4000 + ctx.rng.randint(0, 3000),
                creation_date=iso(ctx.now),
                update_date=iso(ctx.now),
            )
        )
    ctx.session.commit()
