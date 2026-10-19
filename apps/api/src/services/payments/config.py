from datetime import datetime
from typing import Any, Optional

from fastapi import HTTPException, Request
from sqlmodel import Session, select

from src.db.payments.enums import PaymentModeEnum, PaymentProviderEnum
from src.db.payments.payment_configs import PaymentConfig
from src.db.users import AnonymousUser, APITokenUser, PublicUser
from src.services.payments.entitlements import authorize_org_admin
from src.services.webhooks.crypto import encrypt_secret


def _serialize(config: PaymentConfig) -> dict[str, Any]:
    """Public view of a config row — secrets never leave the server."""
    return {
        "configured": True,
        "id": config.id,
        "provider": config.provider.value,
        "mode": config.mode.value,
        "public_key": config.public_key,
        "active": config.active,
        "has_secret_key": bool(config.secret_key_encrypted),
        "has_webhook_secret": bool(config.webhook_secret_encrypted),
        "creation_date": config.creation_date,
        "update_date": config.update_date,
    }


def _get_config(org_id: int, db_session: Session) -> Optional[PaymentConfig]:
    return db_session.exec(
        select(PaymentConfig).where(
            PaymentConfig.org_id == org_id,
            PaymentConfig.provider == PaymentProviderEnum.CHARGILY,
        )
    ).first()


async def get_payment_config(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    db_session: Session,
) -> dict[str, Any]:
    org, _ = await authorize_org_admin(current_user, org_id, db_session)
    config = _get_config(org.id, db_session)
    if not config:
        return {
            "configured": False,
            "provider": PaymentProviderEnum.CHARGILY.value,
            "mode": PaymentModeEnum.TEST.value,
            "public_key": None,
            "active": False,
            "has_secret_key": False,
            "has_webhook_secret": False,
        }
    return _serialize(config)


async def update_payment_config(
    request: Request,
    current_user: PublicUser | AnonymousUser | APITokenUser,
    org_id: int,
    data: dict[str, Any],
    db_session: Session,
) -> dict[str, Any]:
    org, _ = await authorize_org_admin(current_user, org_id, db_session)

    provider = data.get("provider") or PaymentProviderEnum.CHARGILY.value
    if provider != PaymentProviderEnum.CHARGILY.value:
        raise HTTPException(status_code=422, detail="Unsupported payment provider")

    mode = data.get("mode") or PaymentModeEnum.TEST.value
    try:
        mode_enum = PaymentModeEnum(mode)
    except ValueError:
        raise HTTPException(status_code=422, detail="Mode must be 'test' or 'live'")

    config = _get_config(org.id, db_session)
    now = datetime.now().isoformat()

    if not config:
        config = PaymentConfig(
            org_id=org.id,
            provider=PaymentProviderEnum.CHARGILY,
            mode=mode_enum,
            active=False,
            creation_date=now,
            update_date=now,
        )
    else:
        config.mode = mode_enum

    if "public_key" in data:
        public_key = (data.get("public_key") or "").strip()
        if config.active and not public_key:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove the public key while payments are active",
            )
        config.public_key = public_key or None

    secret_key = (data.get("secret_key") or "").strip()
    if secret_key:
        config.secret_key_encrypted = encrypt_secret(secret_key)

    webhook_secret = (data.get("webhook_secret") or "").strip()
    if webhook_secret:
        config.webhook_secret_encrypted = encrypt_secret(webhook_secret)

    if "active" in data and data.get("active") is not None:
        desired_active = bool(data["active"])
        if desired_active and not (config.public_key and config.secret_key_encrypted):
            raise HTTPException(
                status_code=400,
                detail="A public key and a secret key are required to enable payments",
            )
        config.active = desired_active

    config.update_date = now
    db_session.add(config)
    db_session.commit()
    db_session.refresh(config)

    return _serialize(config)
