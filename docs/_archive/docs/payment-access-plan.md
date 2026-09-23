# Payment & Access Integration Plan

## Chargily Pay v2 — Learnhouse Integration

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [Backend — FastAPI Services](#3-backend--fastapi-services)
4. [Frontend — Next.js Components](#4-frontend--nextjs-components)
5. [Access System Redesign](#5-access-system-redesign)
6. [Webhook Handling & Reliability](#6-webhook-handling--reliability)
7. [Test Mode & Local Development](#7-test-mode--local-development)
8. [Implementation Order](#8-implementation-order)
9. [Files to Create / Modify](#9-files-to-create--modify)

---

## 1. Architecture Overview

### 1.1 High-Level Flow

```
┌─────────────┐         ┌──────────────────┐         ┌────────────────┐
│   Browser    │         │  Learnhouse API   │         │  Chargily Pay   │
│  (Next.js)   │         │   (FastAPI)       │         │  (Algeria)      │
└──────┬───────┘         └────────┬──────────┘         └────────┬───────┘
       │                          │                             │
       │  1. POST /checkout       │                             │
       │─────────────────────────►│                             │
       │                          │  2. POST /checkouts         │
       │                          │────────────────────────────►│
       │                          │                             │
       │  3. ← checkout URL       │                             │
       │◄─────────────────────────│                             │
       │                          │                             │
       │  4. Redirect user to     │                             │
       │     Chargily payment     │                             │
       │     page ───────────────►│                             │
       │                          │                             │
       │                          │  5. Webhook: checkout.paid  │
       │                          │◄────────────────────────────│
       │                          │                             │
       │                          │  6. Update purchase status  │
       │                          │     Grant user access       │
       │                          │                             │
       │  7. User sees "Access    │                             │
       │     Granted" on next     │                             │
       │     page load            │                             │
       │◄─────────────────────────│                             │
```

### 1.2 Key Principles

- **No direct frontend-to-Chargily communication.** The backend is the single source of truth for payment state. The frontend never holds API keys.
- **Idempotent webhook handling.** Chargily may deliver the same webhook multiple times. Processing must be safe to repeat.
- **Atomic access grants.** When a payment succeeds, the purchase record and access grant happen in a single database transaction.
- **Audit trail.** Every purchase, refund, and access change is logged with timestamps.

---

## 2. Database Schema

### 2.1 New Tables

#### `payment_orders`

Stores the lifecycle of each Chargily checkout session.

```sql
CREATE TABLE payment_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Chargily identifiers
    chargily_checkout_id   VARCHAR(255) UNIQUE,
    chargily_payment_intent_id VARCHAR(255),
    -- Amount & currency
    amount          DECIMAL(12, 2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'DZD',
    -- Status enum
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                        'pending',
                        'paid',
                        'failed',
                        'expired',
                        'refunded',
                        'partially_refunded'
                    )),
    -- Metadata
    metadata        JSONB DEFAULT '{}',
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at         TIMESTAMPTZ
);

CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_chargily_id ON payment_orders(chargily_checkout_id);
```

#### `course_purchases`

Records that a specific user purchased access to a specific course.

```sql
CREATE TABLE course_purchases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uuid       UUID NOT NULL REFERENCES users(uuid),
    course_uuid     UUID NOT NULL REFERENCES courses(course_uuid),
    payment_order_id UUID NOT NULL REFERENCES payment_orders(id),
    -- Access period
    access_starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    access_ends_at   TIMESTAMPTZ,  -- NULL = lifetime access
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at      TIMESTAMPTZ,
    revoked_reason  VARCHAR(255),
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_uuid, course_uuid)  -- One purchase per user per course
);

CREATE INDEX idx_course_purchases_user ON course_purchases(user_uuid);
CREATE INDEX idx_course_purchases_course ON course_purchases(course_uuid);
CREATE INDEX idx_course_purchases_active ON course_purchases(user_uuid, course_uuid, is_active);
```

#### `webhook_events` (idempotency log)

Prevents duplicate processing of Chargily webhooks.

```sql
CREATE TABLE webhook_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chargily_event_id   VARCHAR(255) UNIQUE NOT NULL,
    event_type          VARCHAR(50) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'received'
                        CHECK (status IN ('received', 'processing', 'processed', 'failed')),
    raw_payload         JSONB NOT NULL,
    error_message       TEXT,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at        TIMESTAMPTZ
);

CREATE INDEX idx_webhook_events_id ON webhook_events(chargily_event_id);
```

### 2.2 Existing Tables to Modify

#### `courses`

Add a column for pricing:

```sql
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price_amount DECIMAL(12, 2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price_currency VARCHAR(3) NOT NULL DEFAULT 'DZD';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS access_type VARCHAR(20) NOT NULL DEFAULT 'public'
    CHECK (access_type IN ('public', 'users_only', 'paid'));
```

#### `chapters` / `activities`

No changes needed. Access gating happens at the course level, not chapter/lesson level.

---

## 3. Backend — FastAPI Services

### 3.1 Chargily Client Module

**File:** `apps/api/src/services/payments/chargily.py`

```python
class ChargilyClient:
    """Thin wrapper around Chargily Pay v2 REST API."""

    def __init__(self):
        self.test_mode = settings.CHARGILY_TEST_MODE  # bool
        self.secret_key = settings.CHARGILY_SECRET_KEY
        self.base_url = (
            "https://pay.chargily.net/test/api/v2"
            if self.test_mode
            else "https://pay.chargily.net/api/v2"
        )

    async def create_checkout(
        self,
        amount: Decimal,
        currency: str,
        success_url: str,
        failure_url: str,
        metadata: dict,
        customer_id: str | None = None,
        payment_method: str = "edahabia",
    ) -> ChargilyCheckoutResponse:
        """
        POST /checkouts
        Returns a ChargilyCheckoutResponse with .checkout_url (redirect the user here).
        """

    async def retrieve_checkout(self, checkout_id: str) -> dict:
        """GET /checkouts/{id} — for manual status checks."""

    async def expire_checkout(self, checkout_id: str) -> None:
        """POST /checkouts/{id}/expire — cancel unpaid checkouts."""

    def verify_webhook_signature(
        self, raw_body: bytes, signature_header: str
    ) -> bool:
        """HMAC-SHA256 signature verification."""
```

### 3.2 Payment Service

**File:** `apps/api/src/services/payments/payments.py`

```python
class PaymentService:
    """
    Orchestrates the full payment lifecycle:
    create → confirm via webhook → grant access → handle failures/refunds.
    """

    async def create_course_checkout(
        self, user_uuid: str, course_uuid: str
    ) -> str:
        """
        1. Validate user doesn't already own the course.
        2. Validate course has a price set.
        3. Create a payment_order record (status: pending).
        4. Call ChargilyClient.create_checkout().
        5. Return the checkout URL for frontend redirect.
        """

    async def handle_webhook_event(self, raw_body: bytes, signature: str) -> None:
        """
        1. Verify signature.
        2. Check chargily_event_id in webhook_events table (idempotency).
        3. If already processed, return 200 immediately.
        4. Insert webhook_event (status: processing).
        5. Parse event type:
           - checkout.paid → process_successful_payment()
           - checkout.failed → process_failed_payment()
           - checkout.expired → process_expired_checkout()
           - checkout.refunded → process_refund()
        6. Update webhook_event (status: processed).
        """

    async def process_successful_payment(
        self, checkout_id: str, payment_intent_id: str
    ) -> None:
        """
        1. Find payment_order by chargily_checkout_id.
        2. Update status → 'paid', set paid_at, set chargily_payment_intent_id.
        3. Create course_purchase record (user_uuid, course_uuid).
        4. Commit transaction.
        """

    async def revoke_access(self, purchase_id: str, reason: str) -> None:
        """
        Set is_active = False, revoked_at = NOW(), revoked_reason = reason.
        Called on refund webhook or manual admin action.
        """
```

### 3.3 API Routes

**File:** `apps/api/src/api/v1/payments.py`

```python
router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/checkout/{course_uuid}")
async def create_course_checkout(
    course_uuid: str,
    user: User = Depends(get_current_user),
):
    """
    Creates a Chargily checkout for the given course.
    Returns { "checkout_url": "https://pay.chargily.net/..." }
    Frontend redirects the user to this URL.
    """

@router.post("/webhooks/chargily")
async def chargily_webhook(
    request: Request,
):
    """
    Receives Chargily webhook events.
    - Reads raw body for signature verification.
    - Returns 200 immediately if event already processed.
    - Returns 401 if signature is invalid.
    - Processes payment asynchronously.
    """

@router.get("/purchases")
async def list_user_purchases(
    user: User = Depends(get_current_user),
):
    """Returns all courses the user has purchased."""

@router.get("/purchases/{course_uuid}/status")
async def check_purchase_status(
    course_uuid: str,
    user: User = Depends(get_current_user),
):
    """
    Returns { "purchased": bool, "purchase": {...} | null }.
    Used by frontend to determine lesson access.
    """
```

### 3.4 Access Gating Middleware

**File:** `apps/api/src/api/v1/courses.py` (modify existing lesson/chapter endpoints)

```python
async def check_course_access(
    course_uuid: str,
    user: User | None,  # Anonymous users allowed for public courses
):
    """
    1. Load course.
    2. If access_type == 'public' → allow.
    3. If access_type == 'users_only' → require authenticated user.
    4. If access_type == 'paid' → require authenticated user +
       active course_purchase record.
    5. Return 403 with appropriate message if denied.
    """

@router.get("/courses/{uuid}/lessons")
async def list_course_lessons(
    uuid: str,
    user: User | None = Depends(get_optional_user),
):
    await check_course_access(uuid, user)
    # ... return lessons
```

---

## 4. Frontend — Next.js Components

### 4.1 Purchase Button

**Component:** `apps/web/components/Dashboard/Pages/Course/PurchaseButton.tsx`

```
┌─────────────────────────────────────┐
│  DA 2,500.00                        │
│  Get unlimited access to this course│
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Purchase with EDAHABIA     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Purchase with CIB Card     │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**States:**
- **Loading** — skeleton while checking purchase status
- **Not purchased** — show price + payment method buttons
- **Already purchased** — show "You own this course" badge + "Go to lessons" button
- **Error** — retry button if checkout creation fails

**Logic:**

```typescript
const PurchaseButton = ({ courseUuid }: { courseUuid: string }) => {
  const { data: purchaseStatus } = useSWR(
    `/api/payments/purchases/${courseUuid}/status`
  )
  const [isCreating, setIsCreating] = useState(false)

  const handlePurchase = async (method: 'edahabia' | 'cib') => {
    setIsCreating(true)
    const res = await fetch(`/api/payments/checkout/${courseUuid}`, {
      method: 'POST',
      body: JSON.stringify({ payment_method: method })
    })
    const { checkout_url } = await res.json()
    window.location.href = checkout_url  // Redirect to Chargily
  }

  if (purchaseStatus?.purchased) {
    return <AlreadyPurchasedBadge />
  }

  return (
    <div>
      <PriceDisplay amount={course.price_amount} currency={course.price_currency} />
      <Button onClick={() => handlePurchase('edahabia')} disabled={isCreating}>
        Purchase with EDAHABIA
      </Button>
      <Button onClick={() => handlePurchase('cib')} disabled={isCreating}>
        Purchase with CIB Card
      </Button>
    </div>
  )
}
```

### 4.2 Payment Success / Failure Pages

**File:** `apps/web/app/orgs/[orgslug]/course/[courseuuid]/payment/success/page.tsx`
**File:** `apps/web/app/orgs/[orgslug]/course/[courseuuid]/payment/failure/page.tsx`

- Success page: shows "Payment successful! You now have access to this course." + "Go to course" button
- Failure page: shows "Payment failed or was cancelled." + "Try again" button

Both pages:
- Poll the purchase status endpoint to confirm the webhook was processed
- Show loading state while waiting for webhook delivery (webhooks can take 2-5 seconds)
- Auto-redirect after confirmed

### 4.3 Lesson Access Gating (Frontend)

In the lesson preview page or course content page:

```typescript
const CourseContent = ({ courseUuid }: { courseUuid: string }) => {
  const { data: course } = useSWR(`/api/courses/${courseUuid}`)

  if (course.access_type === 'paid' && !course.user_has_access) {
    return (
      <LockedCourseBanner>
        <PurchaseButton courseUuid={courseUuid} />
      </LockedCourseBanner>
    )
  }

  return <LessonList />
}
```

The backend also enforces this — the frontend gating is just UX polish.

### 4.4 User Purchase History

**File:** `apps/web/app/orgs/[orgslug]/dashboard/courses/page.tsx` (modify existing "My Courses" page)

Add a filter: "All" | "Free" | "Purchased". Show purchase date and access expiry if applicable.

### 4.5 Admin: Manual Grant / Refund

In the Access tab (when course is set to "paid"), add:
- **Manual grant** — grant access to a user without payment (for testing, comped accounts)
- **View purchases** — table of all purchases for this course
- **Revoke access** — button per purchase row

---

## 5. Access System Redesign

### 5.1 New Access Type: `paid`

The Access tab will offer **three** options instead of two:

| Option | Icon | Behavior |
|--------|------|----------|
| **Public** | `Globe` | Free for everyone, no sign-in required |
| **Users Only** | `Users` | Requires authentication, no purchase needed |
| **Paid** | `ShoppingCart` or `CreditCard` | Requires authentication + purchase |

### 5.2 Access Tab UI Redesign

```
┌──────────────────────────────────────────────────────┐
│  ┌────────────────────┐  ┌────────────────────┐  ┌────┐
│  │      Globe         │  │       Users        │  │ 🛒 │
│  │     Public         │  │    Users Only      │  │Paid│
│  │   Free access      │  │  Auth required     │  │Buy │
│  └────────────────────┘  └────────────────────┘  └────┘
│                                                       │
│  ┌─── Price & Currency (only when Paid is selected) ─┐│
│  │  Amount: [______]   Currency: [DZD ▼]             ││
│  └───────────────────────────────────────────────────┘│
│                                                       │
│  ┌─── User Groups ───────────────────────────────────┐│
│  │  (same as current, shows for Users Only + Paid)   ││
│  └───────────────────────────────────────────────────┘│
│                                                       │
│  ┌─── Purchase History (only when Paid is selected) ─┐│
│  │  User     │  Amount  │  Date    │  Status  │ Act. ││
│  │  ──────── │ ──────── │ ──────── │ ──────── │ ──── ││
│  │  user@..  │  2500 DA │ 23/09   │ Active   │ [X]  ││
│  └───────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

### 5.3 Access Enforcement Points

| Layer | What happens |
|-------|-------------|
| **Database** | `courses.access_type` column determines the rule |
| **Backend API** | `check_course_access()` middleware on lesson/chapter endpoints |
| **Frontend** | `CourseContent` component checks access before rendering |
| **Edge (future)** | CDN-level gating for video content (optional) |

### 5.4 User Groups + Paid

When `access_type = 'paid'`, user groups still work as **supplementary access**:
- A user can get access via purchase OR by being in a linked user group
- This is useful for: beta testers, reviewers, staff, comped accounts
- The `course_purchases` table handles paid access, user groups handle group-based access
- `check_course_access()` checks both: `user has purchase OR user is in a linked group`

---

## 6. Webhook Handling & Reliability

### 6.1 Chargily Webhook Details

- Chargily sends webhooks to your registered endpoint URL
- Signature header: `signature` (HMAC-SHA256 of raw body with your secret key)
- Event types relevant to us:
  - `checkout.paid` — payment succeeded
  - `checkout.failed` — payment failed
  - `checkout.expired` — user didn't complete payment in time
  - `checkout.refunded` — payment was refunded

### 6.2 Idempotency Strategy

```python
async def handle_webhook_event(raw_body, signature):
    # 1. Verify signature
    if not chargily_client.verify_webhook_signature(raw_body, signature):
        return HTTPException(401, "Invalid signature")

    # 2. Parse event
    event = json.loads(raw_body)
    event_id = event["id"]

    # 3. Idempotency check
    existing = await db.execute(
        "SELECT status FROM webhook_events WHERE chargily_event_id = :eid",
        {"eid": event_id}
    )
    if existing and existing.status in ("processing", "processed"):
        return {"status": "already_processed"}

    # 4. Insert with status = 'processing'
    await db.execute(
        "INSERT INTO webhook_events (...) VALUES (...) ON CONFLICT DO NOTHING"
    )

    # 5. Process
    try:
        await payment_service.handle_event(event)
        await db.execute(
            "UPDATE webhook_events SET status = 'processed' WHERE chargily_event_id = :eid"
        )
    except Exception as e:
        await db.execute(
            "UPDATE webhook_events SET status = 'failed', error_message = :err WHERE chargily_event_id = :eid"
        )
        raise

    return {"status": "processed"}
```

### 6.3 Retry Behavior

- Chargily retries failed webhook deliveries up to **3 times** with exponential backoff (1min → 5min → 30min)
- If our endpoint returns non-200, Chargily will retry
- Our idempotency table ensures retries are safe

### 6.4 Manual Reconciliation

- Admin panel shows all webhook_events with their status
- Admin can manually re-process a failed event
- Admin can manually create a purchase record (for comped access)

---

## 7. Test Mode & Local Development

### 7.1 Chargily Test Mode

- Sign up at pay.chargily.com → automatically in test mode
- Secret keys start with `test_sk_...`
- Test mode base URL: `https://pay.chargily.net/test/api/v2`
- Test payment methods: Chargily provides test card numbers
- No real money moves in test mode

### 7.2 Environment Variables

```env
# .env (backend)
CHARGILY_TEST_MODE=true
CHARGILY_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxxxxxx
CHARGILY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# Frontend (only needs to know the API URL, never the secret key)
NEXT_PUBLIC_API_URL=http://localhost:1338
```

### 7.3 Local Webhook Testing

Since Chargily needs to reach your server for webhooks, use **ngrok**:

```bash
ngrok http 1338
# → https://abc123.ngrok.io
```

Register `https://abc123.ngrok.io/api/v1/payments/webhooks/chargily` as your webhook URL in the Chargily dashboard.

### 7.4 Chargily Dashboard (For later reference)

| Setting | Value |
|---------|-------|
| Registration | [pay.chargily.com/register](https://pay.chargily.com/register) |
| Dashboard | [pay.chargily.com/dashboard](https://pay.chargily.com/dashboard) |
| API Keys | Dashboard → Developers Corner |
| Webhook URL Setting | Dashboard → Webhooks → Add endpoint |
| Test Card Numbers | Dashboard → Developers → Test cards |

---

## 8. Implementation Order

### Phase 1 — Database & Backend Foundation (4-5 days)

| Step | What | Files |
|------|------|-------|
| 1.1 | Create migration: payment_orders, course_purchases, webhook_events tables | `apps/api/src/db/payments/` |
| 1.2 | Create migration: add price_amount, price_currency, access_type to courses | `apps/api/src/db/courses/` |
| 1.3 | Build ChargilyClient service | `apps/api/src/services/payments/chargily.py` |
| 1.4 | Build PaymentService | `apps/api/src/services/payments/payments.py` |
| 1.5 | Build API routes: POST /checkout, GET /purchases, GET /purchases/{uuid}/status | `apps/api/src/api/v1/payments.py` |
| 1.6 | Build access gating middleware | Modify existing course endpoints |
| 1.7 | Register the payments router in the app | `apps/api/src/main.py` |

### Phase 2 — Webhook Endpoint (2 days)

| Step | What | Files |
|------|------|-------|
| 2.1 | Build POST /webhooks/chargily endpoint | `apps/api/src/api/v1/payments.py` |
| 2.2 | Implement signature verification | `apps/api/src/services/payments/chargily.py` |
| 2.3 | Implement idempotency logic | `apps/api/src/services/payments/payments.py` |
| 2.4 | Handle all event types (paid, failed, expired, refunded) | `apps/api/src/services/payments/payments.py` |

### Phase 3 — Frontend: Purchase Flow (3 days)

| Step | What | Files |
|------|------|-------|
| 3.1 | Build PurchaseButton component | `apps/web/components/Dashboard/Pages/Course/PurchaseButton.tsx` |
| 3.2 | Build payment success/failure pages | `apps/web/app/.../payment/success/page.tsx` |
| 3.3 | Add purchase status check to lesson preview page | Modify lesson preview page |
| 3.4 | Add "My Purchases" section to dashboard | Modify dashboard courses page |
| 3.5 | Add frontend access gating (locked course UI) | `apps/web/components/Dashboard/Pages/Course/CourseContent.tsx` |

### Phase 4 — Access Tab Redesign (2 days)

| Step | What | Files |
|------|------|-------|
| 4.1 | Add "Paid" option to Access tab cards | `apps/web/components/Dashboard/Pages/Course/EditCourseAccess/EditCourseAccess.tsx` |
| 4.2 | Add price/currency fields (shown when Paid selected) | Same file |
| 4.3 | Add purchase history table (admin view) | Same file |
| 4.4 | Add manual grant/revoke functionality | `apps/api/src/api/v1/payments.py` |

### Phase 5 — Testing & Polish (2 days)

| Step | What |
|------|------|
| 5.1 | Test full purchase flow in Chargily test mode |
| 5.2 | Test webhook delivery with ngrok |
| 5.3 | Test edge cases: expired checkout, refund, duplicate webhooks |
| 5.4 | Test access gating: public, users_only, paid, user group access |
| 5.5 | Test mobile responsiveness of purchase UI |

**Total estimated time: ~2 weeks** (13-14 working days)

---

## 9. Files to Create / Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/api/src/services/payments/__init__.py` | Package init |
| `apps/api/src/services/payments/chargily.py` | Chargily HTTP client |
| `apps/api/src/services/payments/payments.py` | Payment orchestration service |
| `apps/api/src/db/payments/__init__.py` | Package init |
| `apps/api/src/db/payments/payment_orders.py` | PaymentOrder model (SQLAlchemy) |
| `apps/api/src/db/payments/course_purchases.py` | CoursePurchase model |
| `apps/api/src/db/payments/webhook_events.py` | WebhookEvent model |
| `apps/api/src/api/v1/payments.py` | Payment API routes |
| `apps/web/components/Dashboard/Pages/Course/PurchaseButton.tsx` | Purchase CTA component |
| `apps/web/components/Dashboard/Pages/Course/LockedCourseBanner.tsx` | "Access denied" UI |
| `apps/web/app/orgs/[orgslug]/course/[courseuuid]/payment/success/page.tsx` | Success page |
| `apps/web/app/orgs/[orgslug]/course/[courseuuid]/payment/failure/page.tsx` | Failure page |
| `apps/api/alembic/versions/XXXX_add_payment_tables.py` | Migration 1 |
| `apps/api/alembic/versions/XXXX_add_course_price_fields.py` | Migration 2 |

### Files to Modify

| File | Changes |
|------|---------|
| `apps/api/src/main.py` | Register payments router |
| `apps/api/src/db/courses/courses.py` | Add price_amount, price_currency, access_type fields |
| `apps/api/src/api/v1/courses.py` | Add access check to lesson endpoints |
| `apps/web/components/Dashboard/Pages/Course/EditCourseAccess/EditCourseAccess.tsx` | Add Paid option, price fields, purchase history |
| `apps/web/app/orgs/[orgslug]/course/[courseuuid]/page.tsx` | Show purchase button if access_type = paid |
| `apps/web/app/orgs/[orgslug]/dashboard/courses/page.tsx` | Show purchase status |

---

*Last updated: 2026-09-23*
