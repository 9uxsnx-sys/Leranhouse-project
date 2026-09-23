# Payment Configuration

> Configure Chargily Pay v2 to accept Algerian Dinar payments via EDAHABIA (Algérie Poste) and CIB cards on the Koodook platform.

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
1. Go to **Admin Dashboard → Settings → Payments → Chargily**.
2. Paste the **API Key** and **Secret Key** into the corresponding fields.
3. Set the **Mode** toggle:
   - **Sandbox** (toggle ON) — Use test credentials for development and testing.
   - **Production** (toggle OFF) — Use live credentials for real payments.
4. Click **Save Configuration**.

> **Security warning:** Never share your Secret Key. It is used for server-to-server communication only. Store it securely and rotate it periodically from the Chargily dashboard.

## Configuring Product Pricing (DZD)

Prices are set at the course level:

1. Go to **Admin Dashboard → Courses** and open the course you want to price.
2. Navigate to the **Pricing** tab.
3. Enter the **Price** in Algerian Dinars (DZD). Example values:
   - Single course: 1,500 DZD
   - Bundle: 5,000 DZD
   - Premium course: 15,000 DZD
4. Optionally set a **Sale Price** and a **Sale End Date** to run promotions.
5. Click **Save**.

**Price display rules:**
- If a sale price is active, the original price is shown with a strikethrough and the sale price is highlighted.
- If the sale end date passes, the price reverts to the original.
- Group discounts (configured in User Groups) stack on top of the sale price if applicable.

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

Both methods are enabled by default. You can disable one method from **Admin Dashboard → Settings → Payments → Payment Methods** if needed.

## Webhook Configuration

Webhooks allow Chargily to notify Koodook about payment events (success, failure, refund) in real time.

### Setting up the webhook URL

**In production:**
1. Go to your Chargily merchant dashboard → **Settings → Webhooks**.
2. Add a new webhook endpoint pointing to: `https://your-domain.com/api/payments/chargily/webhook`
3. Select the events to listen for: `payment.success`, `payment.failed`, `payment.refunded`.
4. Save the webhook.

**For local development (using ngrok):**
1. Start ngrok: `ngrok http 3000` (or your app's port).
2. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`).
3. In the Chargily dashboard, set the webhook URL to: `https://abc123.ngrok.io/api/payments/chargily/webhook`
4. Ensure the Koodook app is running locally on the same port.

### Verifying webhook signatures
Koodook automatically verifies incoming webhooks using the **Secret Key**. If signature verification fails, the webhook is rejected with a `401 Unauthorized` response. Check the **Admin Dashboard → Settings → Payments → Webhook Logs** for delivery history and any failures.

## Testing Payments (Sandbox Mode)

### Enabling sandbox mode
1. Go to **Admin Dashboard → Settings → Payments → Chargily**.
2. Toggle **Sandbox Mode** ON.
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
1. Open the transaction detail page.
2. Click **Refund**.
3. Enter the **refund amount** (partial refunds are supported).
4. Optionally enter a **reason** (visible to the admin only).
5. Click **Process Refund**.

The refund is sent to Chargily, which processes it according to the original payment method's rules. The transaction status updates to "Refunded" (or "Partially Refunded"). The user's course enrollment is **not** automatically removed — you can unenroll the user manually if needed.

## Payout Settings

Payouts refer to the transfer of collected funds from Chargily to your bank account.

1. In your **Chargily merchant dashboard**, go to **Settings → Payouts**.
2. Configure your bank account details (Algerian bank account required).
3. Set the **payout schedule**:
   - **Automatic** — Funds are transferred on a regular schedule (weekly, bi-weekly, or monthly).
   - **Manual** — You initiate payouts on demand.
4. Confirm the payout configuration.

Koodook does not manage payouts directly — this is handled entirely within your Chargily merchant account. The **Pending Payouts** figure shown in Koodook's analytics is informational and reflects the balance of completed but unpaid transactions.

## Currency Configuration

Koodook is configured to use **Algerian Dinar (DZD)** as its sole currency.

**What this means:**
- All course prices are entered and displayed in DZD.
- All transaction amounts in the admin panel are in DZD.
- Chargily processes payments in DZD.
- Reports and analytics show amounts in DZD.

To verify or change the currency setting:
1. Go to **Admin Dashboard → Settings → Payments → Currency**.
2. The currency is set to **DZD (Algerian Dinar)** .
3. If you change the currency, all existing prices must be updated manually. Historical transaction data remains in the original currency.

> **Note:** Koodook does not support multi-currency at this time. If you need to serve users in other countries, consider setting up a separate instance with the appropriate currency.
