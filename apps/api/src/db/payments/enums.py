from enum import Enum


class AccessTypeEnum(str, Enum):
    """Who may open a resource once it is published."""
    PUBLIC = "public"          # Free — every logged-in user
    USERS_ONLY = "users_only"  # Restricted — only members of linked user groups
    PAID = "paid"              # Only buyers with an active entitlement


class PaymentProviderEnum(str, Enum):
    CHARGILY = "chargily"


class PaymentModeEnum(str, Enum):
    TEST = "test"
    LIVE = "live"


class PaymentMethodEnum(str, Enum):
    EDAHABIA = "edahabia"
    CIB = "cib"
    CHARGILY_APP = "chargily_app"


class PaymentOrderStatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PAID = "paid"
    FAILED = "failed"
    CANCELED = "canceled"
    EXPIRED = "expired"            # local only — Chargily keeps the checkout "pending"
    REFUNDED = "refunded"          # manual, after a dashboard refund
    PARTIALLY_REFUNDED = "partially_refunded"


class EntitlementSourceEnum(str, Enum):
    PURCHASE = "purchase"
    MANUAL = "manual"
    USERGROUP = "usergroup"
    FREE = "free"


class EntitlementStatusEnum(str, Enum):
    ACTIVE = "active"
    REVOKED = "revoked"


class WebhookEventStatusEnum(str, Enum):
    RECEIVED = "received"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"
