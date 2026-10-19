"""Service tests for per-organization Chargily configuration."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from sqlmodel import select

from src.db.payments.enums import PaymentModeEnum
from src.db.payments.payment_configs import PaymentConfig
from src.services.payments.config import get_payment_config, update_payment_config
from src.services.webhooks.crypto import decrypt_secret


@pytest.fixture
def authorized(org, admin_user):
    with patch(
        "src.services.payments.config.authorize_org_admin",
        new_callable=AsyncMock,
        return_value=(org, admin_user.id),
    ):
        yield


class TestPaymentConfig:
    async def test_unconfigured_org_returns_defaults(
        self, db, org, admin_user, authorized, mock_request
    ):
        result = await get_payment_config(mock_request, admin_user, org.id, db)
        assert result["configured"] is False
        assert result["provider"] == "chargily"
        assert result["mode"] == "test"
        assert result["active"] is False
        assert result["has_secret_key"] is False

    async def test_update_stores_encrypted_secret_and_hides_it(
        self, db, org, admin_user, authorized, mock_request
    ):
        result = await update_payment_config(
            mock_request,
            admin_user,
            org.id,
            {
                "provider": "chargily",
                "mode": "live",
                "public_key": "pk_test_123",
                "secret_key": "sk_test_456",
                "webhook_secret": "whsec_789",
                "active": True,
            },
            db,
        )

        assert result["configured"] is True
        assert result["mode"] == "live"
        assert result["public_key"] == "pk_test_123"
        assert result["active"] is True
        assert result["has_secret_key"] is True
        assert result["has_webhook_secret"] is True
        assert "secret_key" not in result
        assert "secret_key_encrypted" not in result

        row = db.exec(select(PaymentConfig).where(PaymentConfig.org_id == org.id)).one()
        assert row.secret_key_encrypted != "sk_test_456"
        assert decrypt_secret(row.secret_key_encrypted) == "sk_test_456"
        assert decrypt_secret(row.webhook_secret_encrypted) == "whsec_789"
        assert row.mode == PaymentModeEnum.LIVE

    async def test_update_is_an_upsert(
        self, db, org, admin_user, authorized, mock_request
    ):
        await update_payment_config(
            mock_request,
            admin_user,
            org.id,
            {
                "mode": "test",
                "public_key": "pk_1",
                "secret_key": "sk_1",
                "active": True,
            },
            db,
        )
        second = await update_payment_config(
            mock_request,
            admin_user,
            org.id,
            {"mode": "live", "public_key": "pk_2", "active": True},
            db,
        )

        assert second["mode"] == "live"
        assert second["public_key"] == "pk_2"
        assert second["has_secret_key"] is True
        assert len(db.exec(select(PaymentConfig)).all()) == 1

    async def test_activation_requires_keys(
        self, db, org, admin_user, authorized, mock_request
    ):
        with pytest.raises(HTTPException) as exc:
            await update_payment_config(
                mock_request,
                admin_user,
                org.id,
                {"mode": "test", "active": True},
                db,
            )
        assert exc.value.status_code == 400

    async def test_invalid_mode_is_rejected(
        self, db, org, admin_user, authorized, mock_request
    ):
        with pytest.raises(HTTPException) as exc:
            await update_payment_config(
                mock_request, admin_user, org.id, {"mode": "sandbox"}, db
            )
        assert exc.value.status_code == 422
