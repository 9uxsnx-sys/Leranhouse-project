from fastapi import HTTPException, Request
from sqlmodel import Session, func, or_, select

from src.db.payments.enums import PaymentOrderStatusEnum
from src.db.payments.payment_orders import PaymentOrder
from src.db.users import AnonymousUser, APITokenUser, PublicUser, User
from src.services.payments.entitlements import authorize_org_admin
from src.services.search.normalization import LIKE_ESCAPE_CHAR, build_like_pattern


def _order_status(value: str) -> PaymentOrderStatusEnum:
    try:
        return PaymentOrderStatusEnum(value)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Unknown order status: {value}")


async def list_org_orders(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    db_session: Session,
    search: str = "",
    status: str = "",
    page: int = 1,
    limit: int = 20,
):
    await authorize_org_admin(current_user, org_id, db_session)

    limit = min(max(limit, 1), 100)
    page = max(page, 1)

    statement = (
        select(PaymentOrder, User)
        .join(User, User.id == PaymentOrder.user_id)
        .where(PaymentOrder.org_id == org_id)
    )

    if status:
        statement = statement.where(PaymentOrder.status == _order_status(status))

    if search:
        pattern = build_like_pattern(search)
        statement = statement.where(
            or_(
                User.first_name.ilike(pattern, escape=LIKE_ESCAPE_CHAR),
                User.last_name.ilike(pattern, escape=LIKE_ESCAPE_CHAR),
                User.username.ilike(pattern, escape=LIKE_ESCAPE_CHAR),
                User.email.ilike(pattern, escape=LIKE_ESCAPE_CHAR),
                PaymentOrder.resource_name.ilike(pattern, escape=LIKE_ESCAPE_CHAR),
                PaymentOrder.order_uuid.ilike(pattern, escape=LIKE_ESCAPE_CHAR),
            )
        )

    total = db_session.exec(
        select(func.count()).select_from(statement.subquery())
    ).one()

    offset = (page - 1) * limit
    rows = db_session.exec(
        statement.order_by(PaymentOrder.creation_date.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    items = [
        {
            "order_uuid": order.order_uuid,
            "resource_uuid": order.resource_uuid,
            "resource_type": order.resource_type,
            "resource_name": order.resource_name,
            "amount": order.amount,
            "currency": order.currency,
            "status": order.status.value,
            "payment_method": (
                order.payment_method.value if order.payment_method else None
            ),
            "checkout_url": order.checkout_url,
            "customer_name": order.customer_name,
            "customer_email": order.customer_email,
            "fees": order.fees,
            "fees_on_merchant": order.fees_on_merchant,
            "user": {
                "id": user.id,
                "user_uuid": user.user_uuid,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "avatar_image": user.avatar_image,
            },
            "creation_date": order.creation_date,
            "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        }
        for order, user in rows
    ]

    return {"items": items, "total": total, "page": page, "limit": limit}
