# Store

> Purchasing courses on Koodook.

> **Implementation status:** the paid flow is live — "Get access" opens Chargily, and the return page confirms the purchase. See [Payments — Progress & Roadmap](../08-features/payments/progress.md).

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
6. You are redirected to a **success** page that confirms your access
7. Press **Back to course** to start learning

If the payment fails or is cancelled, you land on a **failure** page instead. You are not charged, and the same button takes you back to the course so you can try again.

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
