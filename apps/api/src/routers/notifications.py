import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from pydantic import BaseModel

from src.core.events.database import get_db_session
from src.db.users import PublicUser
from src.db.notifications import NotificationTemplate
from src.security.auth import get_current_user
from src.services.notifications import (
    get_notification_feed,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
    get_event_catalog,
    create_announcement,
    get_announcements,
)

router = APIRouter()


# ─── Response models ──────────────────────────────────────────────────────────


class MarkReadResponse(BaseModel):
    success: bool


class MarkAllReadResponse(BaseModel):
    count: int


class UnreadCountResponse(BaseModel):
    count: int


class TemplateOverrideBody(BaseModel):
    title_template: Optional[str] = None
    body_template: Optional[str] = None
    link_url: Optional[str] = None


class TemplateToggleBody(BaseModel):
    is_enabled: bool


class AnnouncementBody(BaseModel):
    title: str
    body: str
    link_url: Optional[str] = None
    category: str = "Announcement"
    recipient_user_ids: List[int]


class AnnouncementResponse(BaseModel):
    id: int
    title: Optional[str] = None
    body: Optional[str] = None
    link_url: Optional[str] = None
    category: str
    created_at: Optional[str] = None


# ─── Feed & read endpoints ───────────────────────────────────────────────────


@router.get(
    "/notifications",
    summary="Get notification feed",
    description="Returns a paginated feed of in-app notifications for the current user in the given org.",
)
async def api_get_notification_feed(
    org_id: int = Query(..., description="Organization ID"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user=Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
) -> dict:
    user_id = current_user.id
    return get_notification_feed(user_id, org_id, page=page, limit=limit, db_session=db_session)


@router.get(
    "/notifications/unread-count",
    summary="Get unread notification count",
    description="Returns the number of unread notifications for the current user in the given org.",
    response_model=UnreadCountResponse,
)
async def api_get_unread_count(
    org_id: int = Query(..., description="Organization ID"),
    current_user=Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
) -> UnreadCountResponse:
    user_id = current_user.id
    count = get_unread_count(user_id, org_id, db_session=db_session)
    return UnreadCountResponse(count=count)


@router.patch(
    "/notifications/{recipient_id}/read",
    summary="Mark notification as read",
    description="Marks a single notification as read for the current user.",
    response_model=MarkReadResponse,
)
async def api_mark_as_read(
    recipient_id: int,
    current_user=Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
) -> MarkReadResponse:
    user_id = current_user.id
    result = mark_as_read(recipient_id, user_id, db_session=db_session)
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    return MarkReadResponse(success=True)


@router.post(
    "/notifications/read-all",
    summary="Mark all notifications as read",
    description="Marks all unread notifications for the current user in the given org as read.",
    response_model=MarkAllReadResponse,
)
async def api_mark_all_as_read(
    org_id: int = Query(..., description="Organization ID"),
    current_user=Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
) -> MarkAllReadResponse:
    user_id = current_user.id
    count = mark_all_as_read(user_id, org_id, db_session=db_session)
    return MarkAllReadResponse(count=count)


# ─── Management: event catalog ────────────────────────────────────────────────


@router.get(
    "/notifications/events",
    summary="Get event catalog with template status",
    description="Returns every registered webhook event annotated with its notification template status for the given org.",
)
async def api_get_event_catalog(
    org_id: int = Query(..., description="Organization ID"),
    current_user=Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
) -> list:
    return get_event_catalog(org_id, db_session)


@router.put(
    "/notifications/events/{event_type}/template",
    summary="Save template override for an event type",
    description="Creates or updates the org-specific notification template for this event type.",
)
async def api_save_template_override(
    event_type: str,
    body: TemplateOverrideBody,
    org_id: int = Query(..., description="Organization ID"),
    current_user=Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
) -> dict:
    # Check for existing override
    from sqlmodel import select

    existing = db_session.exec(
        select(NotificationTemplate).where(
            NotificationTemplate.org_id == org_id,
            NotificationTemplate.event_type == event_type,
        )
    ).first()

    if existing:
        existing.title_template = body.title_template
        existing.body_template = body.body_template
        existing.link_url = body.link_url
        existing.updated_at = str(datetime.datetime.now())
        db_session.add(existing)
    else:
        from src.services.webhooks.events import WEBHOOK_EVENTS

        ev = WEBHOOK_EVENTS.get(event_type, {})
        new_row = NotificationTemplate(
            org_id=org_id,
            event_type=event_type,
            category=ev.get("category", "other"),
            title_template=body.title_template,
            body_template=body.body_template,
            link_url=body.link_url,
            created_at=str(datetime.datetime.now()),
            updated_at=str(datetime.datetime.now()),
        )
        db_session.add(new_row)

    db_session.commit()
    return {"success": True}


@router.put(
    "/notifications/events/{event_type}/toggle",
    summary="Enable or disable a notification event",
    description="Toggles whether this event type produces notifications for the given org.",
)
async def api_toggle_event(
    event_type: str,
    body: TemplateToggleBody,
    org_id: int = Query(..., description="Organization ID"),
    current_user=Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
) -> dict:
    from sqlmodel import select

    existing = db_session.exec(
        select(NotificationTemplate).where(
            NotificationTemplate.org_id == org_id,
            NotificationTemplate.event_type == event_type,
        )
    ).first()

    if existing:
        existing.is_enabled = body.is_enabled
        existing.updated_at = str(datetime.datetime.now())
        db_session.add(existing)
    else:
        from src.services.webhooks.events import WEBHOOK_EVENTS

        ev = WEBHOOK_EVENTS.get(event_type, {})
        new_row = NotificationTemplate(
            org_id=org_id,
            event_type=event_type,
            category=ev.get("category", "other"),
            is_enabled=body.is_enabled,
            created_at=str(datetime.datetime.now()),
            updated_at=str(datetime.datetime.now()),
        )
        db_session.add(new_row)

    db_session.commit()
    return {"success": True, "is_enabled": body.is_enabled}


# ─── Management: announcements ────────────────────────────────────────────────


@router.post(
    "/notifications/announcements",
    summary="Send an announcement",
    description="Creates a broadcast notification sent to the specified user IDs.",
)
async def api_create_announcement(
    body: AnnouncementBody,
    org_id: int = Query(..., description="Organization ID"),
    current_user=Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
) -> dict:
    if not body.recipient_user_ids:
        raise HTTPException(status_code=400, detail="At least one recipient is required")
    if not body.title and not body.body:
        raise HTTPException(status_code=400, detail="Title or body is required")

    notification = create_announcement(
        org_id=org_id,
        title=body.title,
        body=body.body,
        recipient_user_ids=body.recipient_user_ids,
        link_url=body.link_url,
        category=body.category,
        db_session=db_session,
    )
    if notification is None:
        raise HTTPException(status_code=500, detail="Failed to create announcement")
    db_session.commit()

    return {
        "success": True,
        "notification_id": notification.id,
        "recipient_count": len(body.recipient_user_ids),
    }


@router.get(
    "/notifications/announcements",
    summary="List sent announcements",
    description="Returns paginated list of announcements sent by admins for the given org.",
)
async def api_list_announcements(
    org_id: int = Query(..., description="Organization ID"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user=Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
) -> dict:
    return get_announcements(org_id, page=page, limit=limit, db_session=db_session)
