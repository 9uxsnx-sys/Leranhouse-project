from datetime import datetime
from typing import Any, Optional
from urllib.parse import quote
from uuid import uuid4

from fastapi import HTTPException, Request
from sqlmodel import Session, select

from config.config import get_learnhouse_config
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.payments.enums import (
    AccessTypeEnum,
    EntitlementStatusEnum,
    PaymentMethodEnum,
    PaymentOrderStatusEnum,
    PaymentProviderEnum,
)
from src.db.payments.payment_configs import PaymentConfig
from src.db.payments.payment_orders import PaymentOrder
from src.db.payments.resource_entitlements import ResourceEntitlement
from src.db.podcasts.podcasts import Podcast
from src.db.user_organizations import UserOrganization
from src.db.users import AnonymousUser, APITokenUser, PublicUser
from src.security.auth import resolve_acting_user_id
from src.services.payments.chargily import ChargilyClient, ChargilyError
from src.services.webhooks.crypto import decrypt_secret

SUPPORTED_LOCALES = {"ar", "en", "fr"}


def _frontend_base_url() -> str:
    hosting = get_learnhouse_config().hosting_config
    scheme = "https" if hosting.ssl else "http"
    return f"{scheme}://{hosting.frontend_domain}".rstrip("/")


def _api_base_url(request: Request) -> Optional[str]:
    try:
        base = str(request.base_url).rstrip("/")
    except Exception:
        return None
    return base or None


def _load_resources(
    org_id: int, resource_uuid: str, db_session: Session
) -> tuple[str, str, AccessTypeEnum, Optional[int], bool]:
    """Return (resource_type, name, access_type, price_amount, published)."""
    if resource_uuid.startswith("podcast_"):
        podcast = db_session.exec(
            select(Podcast).where(
                Podcast.podcast_uuid == resource_uuid,
                Podcast.org_id == org_id,
            )
        ).first()
        if not podcast:
            raise HTTPException(status_code=404, detail="Podcast not found")
        return (
            "podcast",
            podcast.name,
            podcast.access_type,
            podcast.price_amount,
            podcast.published,
        )

    course = db_session.exec(
        select(Course).where(
            Course.course_uuid == resource_uuid,
            Course.org_id == org_id,
        )
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return (
        "course",
        course.name,
        course.access_type,
        course.price_amount,
        course.published,
    )


async def create_resource_checkout(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    resource_uuid: str,
    db_session: Session,
    payment_method: Optional[str] = None,
    locale: Optional[str] = None,
) -> dict[str, Any]:
    org = db_session.exec(select(Organization).where(Organization.id == org_id)).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    acting_user_id = resolve_acting_user_id(current_user)
    if acting_user_id is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    membership = db_session.exec(
        select(UserOrganization).where(
            UserOrganization.user_id == acting_user_id,
            UserOrganization.org_id == org.id,
        )
    ).first()
    if not membership:
        raise HTTPException(
            status_code=403, detail="You are not a member of this organization"
        )

    resource_type, resource_name, access_type, price_amount, published = _load_resources(
        org.id, resource_uuid, db_session
    )

    if not published:
        raise HTTPException(status_code=400, detail="Resource is not published")
    if access_type != AccessTypeEnum.PAID:
        raise HTTPException(status_code=400, detail="Resource is not a paid resource")
    if price_amount is None or price_amount <= 0:
        raise HTTPException(status_code=400, detail="Resource has no price configured")

    existing = db_session.exec(
        select(ResourceEntitlement).where(
            ResourceEntitlement.org_id == org.id,
            ResourceEntitlement.user_id == acting_user_id,
            ResourceEntitlement.resource_uuid == resource_uuid,
            ResourceEntitlement.status == EntitlementStatusEnum.ACTIVE,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have access")

    config = db_session.exec(
        select(PaymentConfig).where(
            PaymentConfig.org_id == org.id,
            PaymentConfig.provider == PaymentProviderEnum.CHARGILY,
        )
    ).first()
    if not config or not config.active or not config.secret_key_encrypted:
        raise HTTPException(
            status_code=400, detail="Payments are not configured for this organization"
        )

    method_enum: Optional[PaymentMethodEnum] = None
    if payment_method:
        try:
            method_enum = PaymentMethodEnum(payment_method)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid payment method")

    locale_value = locale if locale in SUPPORTED_LOCALES else "en"

    now = datetime.now()
    order = PaymentOrder(
        order_uuid=f"order_{uuid4()}",
        org_id=org.id,
        user_id=acting_user_id,
        resource_uuid=resource_uuid,
        resource_type=resource_type,
        resource_name=resource_name,
        amount=int(price_amount),
        currency="DZD",
        price_snapshot={"amount": int(price_amount), "currency": "DZD"},
        payment_method=method_enum,
        status=PaymentOrderStatusEnum.PENDING,
        creation_date=now.isoformat(),
        update_date=now.isoformat(),
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    frontend = _frontend_base_url()
    resource_param = quote(resource_uuid, safe="")
    success_url = (
        f"{frontend}/orgs/{org.slug}/payment/success"
        f"?resource={resource_param}&order={order.order_uuid}&amount={order.amount}"
    )
    failure_url = (
        f"{frontend}/orgs/{org.slug}/payment/failure"
        f"?resource={resource_param}&order={order.order_uuid}&amount={order.amount}"
    )

    api_base = _api_base_url(request)
    webhook_endpoint = (
        f"{api_base}/api/v1/payments/webhook/chargily/{org.org_uuid}"
        if api_base
        else None
    )

    client = ChargilyClient(decrypt_secret(config.secret_key_encrypted), config.mode)
    try:
        checkout = await client.create_checkout(
            amount=int(price_amount),
            description=f"{resource_name} — {resource_type} access",
            success_url=success_url,
            failure_url=failure_url,
            webhook_endpoint=webhook_endpoint,
            locale=locale_value,
            metadata={
                "order_uuid": order.order_uuid,
                "user_id": str(acting_user_id),
                "org_id": str(org.id),
            },
        )
    except ChargilyError as exc:
        order.status = PaymentOrderStatusEnum.FAILED
        order.failure_message = str(exc)
        order.update_date = datetime.now().isoformat()
        db_session.add(order)
        db_session.commit()
        raise HTTPException(status_code=502, detail="Payment provider unavailable")

    order.chargily_checkout_id = checkout.get("id")
    order.checkout_url = checkout.get("checkout_url")
    order.fees = int(checkout.get("fees") or 0)
    order.fees_on_merchant = int(checkout.get("fees_on_merchant") or 0)
    order.provider_payload = checkout
    order.update_date = datetime.now().isoformat()
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    return {
        "order_uuid": order.order_uuid,
        "checkout_url": order.checkout_url,
        "amount": order.amount,
        "currency": order.currency.lower(),
        "status": order.status.value,
    }
