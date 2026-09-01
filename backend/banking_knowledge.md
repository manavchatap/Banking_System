# MyBank — Comprehensive Knowledge Base

> This document is the authoritative knowledge base for the MyBank digital banking platform. It is designed to be used by an AI assistant via RAG (Retrieval-Augmented Generation) to answer user questions about the application — its features, usage, rules, and behavior.

---

## 1. App Overview and Purpose

**MyBank** is a full-stack digital banking web application that allows customers to manage accounts, check balances, and transfer funds — all through a secure, modern interface.

- The platform supports two roles: **regular customers** and **system administrators (bank staff)**.
- Administrators register customers, seed initial funds into accounts, and manage account statuses.
- Customers can view their balance, send money to other customers, and track transaction history.
- The system uses a **double-entry ledger architecture** — no balance is ever stored directly; it is always computed in real time from immutable ledger records.
- Built with React + Vite (frontend), Node.js + Express (backend), MongoDB (database), Redis (OTP cache), and Nodemailer (email notifications).

---

## 2. User Roles

### Regular Customer
- Registered by a bank admin (no self-registration).
- Has access to their own dashboard, account, transfer, and transaction history pages.
- Can perform peer-to-peer transfers to other active accounts.
- Receives email alerts for credits and debits.

### System Administrator (System User)
- A special bank staff account created with `systemUser: true` at the database level — this flag is immutable and cannot be changed after creation.
- Has a separate admin dashboard and admin-only API endpoints.
- Can register new customers, fund accounts, freeze/close/activate accounts, and view all accounts and disbursements across the platform.
- Cannot create an account for themselves using the customer flow — the system account used for seeding funds is separately managed.

---

## 3. Features

### Customer Features
- **Secure login** with JWT-based authentication stored in an HttpOnly cookie.
- **Dashboard** with real-time account balance, account status, currency, and quick actions.
- **Account creation** — a customer can open exactly one account after registration.
- **Fund transfers** — transfer money to any other active account using a 4-step wizard (form → review → processing → done).
- **Transaction history** — view the last 50 transactions with DEBIT/CREDIT labels, amounts, dates, and counterparty account IDs. Filterable by debit or credit.
- **Balance summary** — total credits and total debits are summarized at the top of the history page.
- **Password reset** — via email OTP (6-digit code, 5-minute expiry).
- **Email notifications** — receive email alerts on debits, credits, account funding, and password reset OTP.

### Admin Features
- **Register customers** — create new user accounts for customers; a welcome email is sent automatically.
- **Fund accounts** — seed opening balances into any customer account from the system account.
- **Manage account statuses** — activate, freeze, or close any customer account directly from the dashboard.
- **View all accounts** — see every customer account on the platform with real-time balances, filterable by status (ACTIVE / FROZEN / CLOSED).
- **View disbursement history** — see all initial-funds transactions made from the system account.
- **View all registered users** — list of all customers with name, email, and registration date.
- **Platform-wide stats** — total accounts, active/frozen/closed counts, total INR disbursed.

---

## 4. How to Use the App

### For Customers

#### Logging In
1. Go to the login page.
2. Enter your registered email and password.
3. On success, you are redirected to your Dashboard.
4. If you forget your password, click "Forgot Password" and follow the 3-step OTP reset flow.

#### Opening an Account
1. After logging in, go to the **Accounts** page.
2. Click "Create Account" if you don't have one yet.
3. Each customer may only have one account. The system will reject a second account creation.

#### Checking Your Balance
- Your current balance is shown on the **Dashboard** in real time.
- You can also see it on the **Accounts** page next to your account entry.
- Balance is always computed live from ledger records — it reflects all completed transactions instantly.

#### Transferring Money
1. Go to the **Transfer** page.
2. Enter the recipient's Account ID (visible on their Accounts page), the amount, and a unique idempotency key (auto-generated but editable).
3. Review the transfer details on the confirmation screen.
4. Confirm to execute. The system will deduct from your account and credit the recipient simultaneously.
5. Both parties receive an email notification.
- You cannot transfer to your own account.
- You cannot transfer more than your current balance.
- Both accounts must be ACTIVE for a transfer to succeed.

#### Viewing Transaction History
1. Go to the **Transactions** page.
2. See your last 50 transactions listed in reverse chronological order.
3. Use the DEBIT / CREDIT filter tabs to narrow results.
4. Total credits and debits are summarized at the top.

#### Resetting Your Password
1. On the login page, click "Forgot Password."
2. Enter your registered email address — a 6-digit OTP will be sent.
3. Enter the OTP within 5 minutes on the next step.
4. Create and confirm your new password (minimum 6 characters).
5. You are redirected to login after success.

---

### For Administrators

#### Accessing the Admin Panel
- Log in with your admin credentials. You will be automatically redirected to the **Admin Dashboard** (not the customer dashboard).

#### Registering a New Customer
1. Go to **Admin → Accounts**.
2. In the "Register Customer" panel, fill in the customer's name, email, and a temporary password.
3. Click Register. The customer receives a welcome email with login instructions.

#### Funding a Customer Account
1. Go to **Admin → Accounts**.
2. In the "Add Funds" panel, enter the customer's Account ID, the amount to credit, and an idempotency key (auto-generated).
3. Click Fund Account. The customer receives a "Account Funded" email.

#### Managing Account Statuses
- From the **Admin Dashboard**, find the customer's account in the accounts table.
- Click **Activate**, **Freeze**, or **Close** depending on the required action.
  - **ACTIVE** — normal, fully functional.
  - **FROZEN** — no transactions allowed; account is locked.
  - **CLOSED** — account is deactivated; no transactions allowed.

#### Viewing All Accounts and Stats
- The Admin Dashboard shows a stats grid (total, active, frozen, closed counts and total INR disbursed).
- The accounts table below is searchable by account ID, user name, or status.
- The disbursement history table shows all system-to-customer initial fund transfers.

---

## 5. Account Rules and Policies

- **One account per customer.** Each registered user may open exactly one bank account. Attempting to open a second account returns an error.
- **Account statuses:**
  - `ACTIVE` — fully operational; can send and receive transfers.
  - `FROZEN` — no transactions can be made from or to this account until reactivated by an admin.
  - `CLOSED` — permanently deactivated; no transactions are possible.
- **Both accounts must be ACTIVE** for any transfer to succeed. If either the sender's or the recipient's account is FROZEN or CLOSED, the transfer is rejected.
- **Default currency is INR (Indian Rupee).** All balances and transaction amounts are displayed in INR.
- **Balance is never stored.** It is always derived at query time by aggregating all ledger CREDIT entries minus all DEBIT entries for that account.

---

## 6. Transaction Rules and Policies

- **Minimum transfer amount:** ₹1.
- **Insufficient funds:** Transfers will be rejected if the sender's current balance is less than the transfer amount.
- **Self-transfer prevention:** You cannot transfer money to your own account.
- **Idempotency key:** Every transfer requires a unique idempotency key. If a transfer with the same key has already been processed, the server returns the original result instead of creating a duplicate. This prevents double-charging on network retries.
- **Atomic transactions:** The debit from the sender and the credit to the recipient are committed in a single atomic MongoDB session. Either both succeed or neither does — there is no partial state.
- **Transaction history limit:** The Transactions page shows the 50 most recent transactions.
- **Transaction statuses:** PENDING → COMPLETED (normal flow). FAILED and REVERSED exist for future use but are not currently set by any operation.
- **Ledger immutability:** Once a ledger entry (debit or credit) is created, it can never be modified or deleted. The ledger is the permanent, append-only financial record.

---

## 7. Security

- **JWT authentication:** Login generates a signed JSON Web Token valid for 3 days, stored in an HttpOnly cookie (not accessible via JavaScript). Can also be passed as a `Bearer` token in the `Authorization` header.
- **Token blacklist:** On logout, the current JWT is added to a blacklist in MongoDB (auto-expires via TTL index after 3 days). Every authenticated request checks this blacklist first.
- **Password hashing:** All passwords are hashed with bcrypt before storage. Plaintext passwords are never stored.
- **Role separation:** Admin-only endpoints require the `authSystemUserMiddleware`, which verifies both the JWT and the `systemUser` flag. Regular users cannot access admin routes.
- **Password reset security:**
  - OTPs are 6-digit, expire in 5 minutes, and are deleted immediately after use (single-use).
  - Reset tokens are 32-byte hex strings, expire in 10 minutes, and are deleted immediately after the password is changed (single-use).
  - The forgot-password endpoint returns the same message whether the email exists or not (prevents email enumeration attacks).
- **CORS:** The backend is configured to only accept requests from the frontend's origin URL.
- **Immutable ledger:** Financial records cannot be altered programmatically — all modification and deletion operations on the Ledger collection throw errors.

---

## 8. Email Notifications

MyBank sends automatic email notifications for the following events:

| Event | Recipient | Email Subject |
|-------|-----------|---------------|
| New customer registered | New customer | "Welcome to MyBank" |
| Money transferred (sent) | Sender | "MyBank — Debit Alert" |
| Money transferred (received) | Recipient | "MyBank — Credit Alert" |
| Admin seeds initial funds | Customer | "MyBank — Account Funded" |
| Password reset requested | Customer | "MyBank — Password Reset OTP" |

- All amounts in emails are formatted in INR using Indian number formatting (e.g., ₹1,00,000).
- Emails are sent via Gmail SMTP (Nodemailer). Email delivery does not block the transaction — if an email fails to send, the transaction still completes.
- If you do not receive a notification email, check your spam/junk folder. Contact the bank admin if the issue persists.

---

## 9. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite | UI framework and build tool |
| Frontend Styling | Tailwind CSS | Utility-first dark-themed styling |
| HTTP Client | Axios | API communication from browser |
| Routing | React Router v7 | Client-side page routing |
| Icons | Lucide React | Icon library |
| Backend | Node.js + Express | REST API server |
| Database | MongoDB + Mongoose | Persistent data storage |
| Auth | JWT + bcrypt | Authentication and password security |
| Cache / OTP Store | Upstash Redis (REST) | Temporary OTP and reset token storage |
| Email | Nodemailer + Gmail SMTP | Transactional email delivery |
| Session | HttpOnly Cookie | Secure token transport |

---

## 10. Application Pages

| Page | URL | Who Can Access | What It Does |
|------|-----|---------------|-------------|
| Login | `/login` | Everyone | Authenticates user; redirects based on role |
| Forgot Password | `/forgot-password` | Everyone | 3-step OTP-based password reset wizard |
| Dashboard | `/dashboard` | Customers | Balance, account info, quick actions |
| Accounts | `/accounts` | Customers | View account details and full account ID |
| Transfer | `/transfer` | Customers | 4-step money transfer wizard |
| Transactions | `/transactions` | Customers + Admins | Transaction history with filters |
| Admin Dashboard | `/admin` | Admins only | Stats, all accounts, disbursement history |
| Admin Accounts | `/admin/accounts` | Admins only | Register customers, fund accounts |

---

## 11. Common FAQs

**Q: How do I create an account with MyBank?**
A: Accounts are opened by a bank administrator. Contact your bank to register. You cannot self-register on the platform. Once registered, you can log in and open your own bank account from the Accounts page.

**Q: I forgot my password. What should I do?**
A: Click "Forgot Password" on the login page. Enter your registered email address. You'll receive a 6-digit OTP valid for 5 minutes. Enter the OTP, then set a new password (at least 6 characters).

**Q: How is my balance calculated?**
A: Your balance is computed in real time by summing all credits and subtracting all debits from your account's ledger history. There is no stored balance field — every balance check is a live calculation.

**Q: Can I open more than one account?**
A: No. Each customer is allowed exactly one bank account. If you try to create a second one, the system will reject it.

**Q: Why was my transfer rejected?**
A: Transfers can fail for these reasons:
- Your balance is insufficient for the amount.
- Your account or the recipient's account is FROZEN or CLOSED.
- You tried to transfer to your own account.
- The recipient's Account ID is incorrect or does not exist.
- The amount is less than ₹1.

**Q: What is an idempotency key?**
A: An idempotency key is a unique string attached to each transfer. If the same key is submitted twice (e.g., due to a network retry), the system returns the original transaction result instead of processing it again. This prevents accidental duplicate transfers. The Transfer page auto-generates one for you, but you can also set your own.

**Q: How long does a transfer take?**
A: Transfers are processed instantly. The debit and credit happen atomically in real time.

**Q: Can I transfer money internationally?**
A: No. MyBank operates in INR only and does not support international or multi-currency transfers.

**Q: My account is FROZEN. What do I do?**
A: A frozen account means a bank administrator has restricted your account. You cannot send or receive money while frozen. Contact your bank administrator to have it reactivated.

**Q: Why didn't I receive my OTP email?**
A: Check your spam or junk folder first. OTPs expire after 5 minutes — if it has expired, restart the forgot-password flow. If you still don't receive it, contact your bank administrator to verify your registered email address.

**Q: Can I see where my money went?**
A: Yes. The Transactions page shows your last 50 transactions with DEBIT/CREDIT labels, amounts, dates, and the counterparty's account ID.

**Q: Is my money safe?**
A: All financial records are stored in an immutable ledger — no transaction can be modified or deleted once created. Transfers are atomic — they either fully complete or are fully rolled back. No partial states exist.

**Q: Can I change my email or name after registration?**
A: Currently the platform does not have a self-service profile update feature. Contact your bank administrator for account detail changes.

**Q: What does CLOSED status mean?**
A: A CLOSED account is permanently deactivated. No money can be sent to or from a closed account. This is typically done when a customer's relationship with the bank ends.

---

## 12. Troubleshooting

### "Insufficient funds" error on transfer
- Your balance is less than the transfer amount.
- Check your current balance on the Dashboard before initiating a transfer.

### "Account is not active" error on transfer
- Either your account or the recipient's account is FROZEN or CLOSED.
- Contact the bank admin if you believe your account should be active.

### "Account already exists" error when creating an account
- Each user can only have one account. You already have an account — go to the Accounts page to view it.

### OTP not received / expired
- Check your spam/junk folder.
- OTPs expire in 5 minutes. If expired, restart the forgot-password process.
- Ensure your email address is correctly registered with the bank.

### Transfer processed twice / duplicate charge concern
- MyBank uses idempotency keys to prevent duplicates. If you submitted the same transfer twice with the same key, only one transaction was processed.
- Check your Transaction History page to confirm.

### Cannot log in
- Ensure you are using the correct email and password.
- Your password is case-sensitive.
- If locked out, use the Forgot Password flow to reset it.
- If the issue persists, contact your bank administrator.

### Session expired / logged out unexpectedly
- JWT tokens expire after 3 days. Log in again to get a new session.
- If you logged out on another device, the session was invalidated there (the token was blacklisted).

### Transfer page shows "Cannot transfer to your own account"
- You have entered your own Account ID as the recipient. Enter the recipient's account ID instead.

### Admin: "User already exists" when registering a customer
- The email address is already registered on the platform. Use a different email.

### Admin: Funding fails with "Account not found" or "Account not active"
- Verify the Account ID entered is correct.
- The customer's account status must be ACTIVE for funds to be added.

---

## 13. Limitations

- **No self-registration.** Customers must be registered by a bank administrator.
- **One account per customer.** Multiple accounts are not supported.
- **INR only.** No multi-currency support. All transactions are in Indian Rupees.
- **No international transfers.** Only domestic, platform-to-platform transfers are supported.
- **Last 50 transactions only.** The transaction history page does not support pagination — only the 50 most recent entries are shown.
- **No direct withdrawal or deposit.** All money movement is modeled as transfers. Customers cannot deposit cash or withdraw to external accounts; only admins can seed initial funds.
- **No loan or credit products.** MyBank is a basic transactional banking platform only.
- **No account statements or export.** There is no PDF/CSV export for transaction history.
- **No multi-factor authentication (MFA).** Password reset uses OTP, but login does not require a second factor.
- **No profile update page.** Customers cannot update their own name, email, or password from the UI (only via forgot-password flow).
- **Email dependency.** Password reset requires a working email address. If the registered email is invalid, the forgot-password flow cannot complete.
- **Redis required for password reset.** The OTP and reset token are stored in Redis. Without Redis configured, password reset will silently fail.
- **FAILED/REVERSED transaction statuses** are defined in the system but not currently triggered by any operation — they exist for future use.

---

## 14. Tips for Using MyBank Effectively

- **Save your Account ID.** Your Account ID is long (a MongoDB ObjectId). Share it carefully with people who need to send you money — it is visible on the Accounts page.
- **Use descriptive idempotency keys.** If you manage transfers programmatically or via the API, use meaningful, unique keys (e.g., `transfer-2025-08-31-001`) to avoid accidental duplicates.
- **Check your balance before transferring.** The Transfer page shows your current balance — confirm you have enough funds before submitting.
- **Monitor your email.** Debit and credit alerts are sent by email after every transaction. If you notice an unexpected alert, contact the bank admin immediately.
- **Use the transaction filter tabs.** On the Transactions page, switch between "All," "DEBIT," and "CREDIT" tabs to quickly find what you're looking for.
- **Admins: regenerate idempotency keys** between separate funding operations using the "Regenerate" button in the Admin Accounts panel to avoid key collisions.
- **Log out after use.** Logging out blacklists your session token — even if someone obtains the cookie afterward, it cannot be reused.

---

*This knowledge base covers the MyBank digital banking platform. For administrative or technical support, contact the bank's system administrator.*
