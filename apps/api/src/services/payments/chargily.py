from typing import Any, Optional

import httpx

from src.db.payments.enums import PaymentModeEnum

TEST_BASE_URL = "https://pay.chargily.net/test/api/v2"
LIVE_BASE_URL = "https://pay.chargily.net/api/v2"


class ChargilyError(Exception):
    """Raised when Chargily rejects a request or is unreachable."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class ChargilyClient:
    """Minimal Chargily Pay v2 client.

    Credentials come from the organization's `paymentconfig` row; nothing is
    read from global settings.
    """

    def __init__(self, secret_key: str, mode: PaymentModeEnum):
        self.secret_key = secret_key
        self.base_url = LIVE_BASE_URL if mode is PaymentModeEnum.LIVE else TEST_BASE_URL

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    async def create_checkout(
        self,
        *,
        amount: int,
        description: str,
        success_url: str,
        failure_url: str,
        webhook_endpoint: Optional[str] = None,
        locale: str = "en",
        metadata: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """POST /checkouts — returns the Chargily checkout object."""
        payload: dict[str, Any] = {
            "amount": int(amount),
            "currency": "dzd",
            "description": description,
            "success_url": success_url,
            "failure_url": failure_url,
            "locale": locale,
            "metadata": metadata or {},
        }
        if webhook_endpoint:
            payload["webhook_endpoint"] = webhook_endpoint

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(
                    f"{self.base_url}/checkouts",
                    json=payload,
                    headers=self._headers,
                )
        except httpx.HTTPError as exc:
            raise ChargilyError(f"Chargily is unreachable: {exc}") from exc

        if response.status_code >= 400:
            raise ChargilyError(
                f"Chargily rejected the checkout ({response.status_code}): "
                f"{response.text[:500]}",
                status_code=response.status_code,
            )

        return response.json()
