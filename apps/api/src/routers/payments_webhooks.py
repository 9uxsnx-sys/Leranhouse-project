from fastapi import APIRouter, Depends, Request
from sqlmodel import Session

from src.core.events.database import get_db_session
from src.services.payments.webhooks import handle_chargily_webhook

router = APIRouter()


@router.post(
    "/webhook/chargily/{org_uuid}",
    summary="Chargily Pay webhook receiver",
    description=(
        "Receives checkout.paid / checkout.failed / checkout.canceled events, "
        "verifies the HMAC-SHA256 signature over the raw body, and is "
        "idempotent per Chargily event id."
    ),
)
async def api_chargily_webhook(
    request: Request,
    org_uuid: str,
    db_session: Session = Depends(get_db_session),
):
    return await handle_chargily_webhook(request, org_uuid, db_session)
