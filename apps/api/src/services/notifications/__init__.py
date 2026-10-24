from src.services.notifications.service import (
    create_notification,
    notify,
    get_notification_feed,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
    get_recipients_for_event,
    create_announcement,
    get_announcements,
)
from src.services.notifications.templates import (
    get_event_catalog,
    get_effective_template,
    render_notification,
    DEFAULT_TEMPLATES_EN,
    DEFAULT_TEMPLATES_FR,
    DEFAULT_TEMPLATES_AR,
    DEFAULT_TEMPLATES,
)

__all__ = [
    "create_notification",
    "notify",
    "get_notification_feed",
    "get_unread_count",
    "mark_as_read",
    "mark_all_as_read",
    "get_recipients_for_event",
    "create_announcement",
    "get_announcements",
    "get_event_catalog",
    "get_effective_template",
    "render_notification",
    "DEFAULT_TEMPLATES_EN",
    "DEFAULT_TEMPLATES_FR",
    "DEFAULT_TEMPLATES_AR",
    "DEFAULT_TEMPLATES",
]
