# Store

> Purchasing courses on Koodook.

> **Implementation status:** the Store/checkout flow is **not live yet**. Course pages, prices and the "Get access" entry point exist; the Chargily checkout and webhook that would complete a purchase are still to be built. See [Payments — Progress & Roadmap](../08-features/payments/progress.md).

---

The **Store** page shows courses available for purchase.

## Payment Flow

1. Browse available courses
2. Click **Purchase** on a course
3. You are redirected to the **Chargily Pay v2** payment page
4. Select payment method:
   - **EDAHABIA** --- Algérie Poste e-wallet
   - **CIB** --- Bank card (SATIM)
5. Complete payment on the secure Chargily page
6. You are redirected back to Koodook on success
7. The course is immediately accessible

## Payment Methods

### EDAHABIA

- Algeria Poste electronic wallet
- Enter your EDAHABIA credentials on the Chargily page
- Confirm the payment

### CIB

- Standard bank card (SATIM)
- Enter card details on the Chargily page
- Complete 3D Secure verification if required

## Pricing

- Prices are set by the organization admin in **Payments → Offers**
- Prices are displayed in DZD (Algerian Dinar)
- A price of `0` means the course is explicitly **Free**
- A course with no price cannot be switched to Paid access

## After Purchase

- The course appears in your enrolled courses
- All lessons are unlocked
- Receipt is available in your account
- Purchase history shows all transactions
