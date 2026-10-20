# Payment Configuration

> Configure Chargily Pay v2 to accept Algerian Dinar payments via EDAHABIA (Algérie Poste) and CIB cards on the Koodook platform.

> **Implementation status:** pricing (Payments → Offers), payments configuration (Payments → Configuration), access management (Access tab, all three modes), checkout creation, the Chargily webhook receiver, the post-payment result pages, and the Transactions / Overview / Payouts tabs are **live** — every tab reads real order data. A completed payment grants access, enrolls the learner, and lands on a success page. Payments is available in every deployment (no plan or OSS gate). See [Payments — Progress & Roadmap](../08-features/payments/progress.md).

## Overview of Chargily Pay v2 Integration

Koodook uses **Chargily Pay v2** as its payment gateway for all transactions. Chargily Pay is a payment service provider that supports Algerian payment methods, including:

- **EDAHABIA** — The national e-wallet service of Algérie Poste. Users pay using their EDAHABIA card balance.
- **CIB** — Interbank cards (Cartes Interbancaires) issued by Algerian banks.

All pricing on the platform is configured in **Algerian Dinars (DZD)**. Payments are processed securely through Chargily's infrastructure — credit card details and EDAHABIA credentials are never transmitted to or stored on Koodook servers.

## Setting Up Chargily API Keys

Before accepting payments, you need to connect Koodook to your Chargily Pay account.

### Step 1: Create a Chargily Pay account
1. Go to [https://merchants.chargily.com](https://merchants.chargily.com) and register.
2. Complete the merchant verification process (you will need your business registration documents).
3. Wait for account approval (typically 24–48 hours).

### Step 2: Obtain API credentials
1. Log into your Chargily merchant dashboard.
2. Navigate to **Settings → API Keys**.
3. Copy the following values:
   - **API Key** (also called the Public Key) — Used by the frontend to initiate payments.
   - **Secret Key** — Used by the backend to verify payment signatures and process webhooks.

### Step 3: Configure in Koodook
1. Go to **Admin Dashboard → Payments → Configuration**.
2. Paste the **API Key** and **Secret Key** into the corresponding fields, and the **Webhook Secret** if you set one in Chargily.
3. Set the **Mode**:
   - **Test** — use test credentials for development and testing.
   - **Live** — use live credentials for real payments.
4. Turn on **Enable payments** (a secret key is required before it can be enabled).
5. Click **Save** in the action row.

Credentials are stored **per organization** in `paymentconfig`; secret keys are encrypted at rest and never returned by the API.

> **Security warning:** Never share your Secret Key. It is used for server-to-server communication only. Store it securely and rotate it periodically from the Chargily dashboard.

## Configuring Product Pricing (DZD)

Prices are set **per resource**, in one place: **Admin Dashboard → Payments → Offers**.

1. Open **Payments → Offers**.
2. Find the course or podcast in the table (search, or the **Needs price** filter).
3. Type the amount in the **Price (DZD)** column — the field is borderless, currency is fixed to DZD.
4. Repeat for as many rows as you need, then press **Save** once in the toolbar.

Semantics:

| Value | Meaning |
|---|---|
| empty | not priced — Paid mode refuses to activate |
| `0` | explicitly **Free** |
| `> 0` | price in DZD |

Clearing the field and saving removes the price. There is no sale price, no sale end date and no group discount in this build — the listed price is the price.

## Payment Methods: EDAHABIA and CIB

### EDAHABIA (Algérie Poste)
- Users select **EDAHABIA** at checkout.
- They are redirected to the Chargily payment page where they log into their EDAHABIA account.
- Payment is confirmed via OTP (one-time password) sent to their registered phone number.
- The balance is deducted immediately from their EDAHABIA e-wallet.

### CIB Cards
- Users select **CIB** at checkout.
- They enter their card details (card number, expiry date, CVV) on the Chargily-hosted payment page.
- 3D Secure authentication is performed if supported by the issuing bank.
- The payment is processed through the Algerian interbank system.

Both methods are enabled by default; the learner picks one at checkout.

## Webhook Configuration

Webhooks allow Chargily to notify Koodook about payment events in real time.

### Setting up the webhook URL

**In production:**
1. Go to your Chargily merchant dashboard → **Settings → Webhooks**.
2. Add a new webhook endpoint pointing to: `https://your-domain.com/api/v1/payments/webhook/chargily/{org_uuid}`
3. Select the events to listen for: `checkout.paid`, `checkout.failed`, `checkout.canceled`.
4. Save the webhook.

> The webhook receiver is live: send `checkout.paid`, `checkout.failed`, `checkout.canceled` to the URL above.

**For local development (using ngrok):**
1. Start ngrok against the API port: `ngrok http 1338`.
2. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`).
3. Set the webhook URL to: `https://abc123.ngrok.io/api/v1/payments/webhook/chargily/{org_uuid}` — either in the dashboard or per checkout via `webhook_endpoint`.
4. Ensure the Koodook API is running locally on the same port.

### Verifying webhook signatures
Every delivery carries a `signature` header: the hex HMAC-SHA256 of the **raw request body**, keyed with the organization's Secret Key. Koodook compares it in constant time before parsing anything. A missing header returns `400`, a mismatch returns `403`.

## Testing Payments (Sandbox Mode)

### Enabling sandbox mode
1. Go to **Admin Dashboard → Payments → Configuration**.
2. Set the mode to **Test**.
3. Use the test API keys from your Chargily dashboard (under **Settings → API Keys → Test Mode**).

### Test card numbers

Use the following test credentials in sandbox mode:

| Payment Method | Test Credentials |
|---|---|
| **EDAHABIA** | Use the Chargily sandbox e-wallet simulator. Log in with any test credentials provided in the Chargily documentation. |
| **CIB** | Card: `4242 4242 4242 4242`, Expiry: any future date, CVV: any 3 digits. |

### Testing workflow
1. As a test user, enroll in a paid course.
2. Proceed to checkout and select the payment method.
3. Enter the test credentials.
4. Verify that:
   - The payment succeeds on the Chargily side.
   - The webhook is received and processed (check Webhook Logs).
   - The user is enrolled in the course.
   - The transaction appears in **Admin Dashboard → Payments → Transactions**.
5. Test a failed payment scenario (use card `4000 0000 0000 0002` for CIB) to verify error handling.

## Transaction History and Refunds

### Viewing transactions
1. Go to **Admin Dashboard → Payments → Transactions**.
2. The table shows:
   - Transaction ID (Chargily reference).
   - Course purchased.
   - Customer name and email.
   - Amount (DZD).
   - Payment method (EDAHABIA or CIB).
   - Status (Completed, Failed, Refunded, Pending).
   - Date and time.
3. Click any transaction to view full details, including the Chargily payment link.

### Processing a refund
1. Open the transaction in **Chargily merchant dashboard** and issue the refund there (Chargily Pay v2 has **no refund endpoint**).
2. Back in Koodook, open **Payments → Transactions** and mark the order as refunded.
3. Enter the **refund amount** (full or partial) and an optional **reason** (admin-only).

The order status updates to "Refunded" or "Partially Refunded". A **full** refund revokes the entitlement, so the learner loses access; a **partial** refund keeps it. Nothing is deleted — the order and the entitlement row stay for audit.

## Payouts

Chargily settles the money it collects; **Payments → Payouts** is Koodook's own monthly reconciliation and teacher-payout report. It does not move money — it tells you how much to send each teacher.

1. Open **Admin Dashboard → Payments → Payouts**.
2. Pick the month in the selector (the label shows the month name; the report covers that calendar month).
3. Enter the month's **Hosting & infrastructure**, **Marketing & ads** and **Other operating costs**. Press **Save** — the report recalculates immediately.
4. Read the result:
   - **Gross revenue** — paid orders whose `paid_at` falls inside the month.
   - **Payment gateway fees** — Chargily's `fees_on_merchant` for those orders (read-only).
   - **Net profit** — gross revenue minus gateway fees and the costs you entered.
   - **Teacher pool / Platform pool** — net profit split 40% / 60%.
   - **Teacher payouts** — the teacher pool shared pro-rata by each teacher's attributed revenue, with a total row.
5. Transfer each teacher's payout outside Koodook (bank transfer or cash) and keep your own record of the payment.

Revenue attribution: a course order counts towards that course; a collection (bundle) order is split evenly across its member courses. Each course's revenue goes to its active **maintainers**, otherwise its **creator**. Revenue with no active author is listed as **Unattributed revenue** and stays with the platform.

Chargily's own settlement schedule (when Chargily pays *you*) is still configured in the Chargily merchant dashboard under **Settings → Payouts**.

## Currency Configuration

Koodook is configured to use **Algerian Dinar (DZD)** as its sole currency.

**What this means:**
- All course prices are entered and displayed in DZD.
- All transaction amounts in the admin panel are in DZD.
- Chargily processes payments in DZD.
- Payout reports and analytics show amounts in DZD.

Currency is fixed in the payments stack (`dzd` / `DZD`), so there is no settings screen to change it. Koodook does not support multi-currency at this time; if you need to serve users in other countries, run a separate instance with the appropriate currency.
