# Dodo Payments & Entitlement System Documentation

This document describes the production monetization and usage-control architecture for **RegCompiler**, powered by **Dodo Payments**.

---

## 1. Core Monetization Architecture

```
                                  [User Request]
                                        │
                                        ▼
                           [Clerk Auth & Session]
                                        │
                                        ▼
                           [EntitlementService Check]
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
     [Admin User?]                                         [Standard User]
     Yes: Unlimited bypass                                         │
     Audit logged, no decrement                                    ▼
                                                          [Has Paid Active Plan?]
                                                          Yes: Allowed (Pro)
                                                          No: Check Free Usage
                                                                   │
                                                   ┌───────────────┴───────────────┐
                                                   ▼                               ▼
                                            [Used < 3 Free]                 [Used >= 3 Free]
                                            Allowed: Reserve               HTTP 402 PAYMENT_REQUIRED
                                            Increment counter                      │
                                            Execute Compilation                    ▼
                                                                           [Paywall Modal]
                                                                                   │
                                                                                   ▼
                                                                        [Dodo Payments Checkout]
                                                                                   │
                                                                                   ▼
                                                                        [Webhook Confirmation]
                                                                        (HMAC SHA-256 Verified)
                                                                                   │
                                                                                   ▼
                                                                        [Entitlement Granted]
```

---

## 2. Free Usage Policy

- **Complimentary Operations**: Every newly registered organization receives exactly **3 free regulatory compilation/audit operations**.
- **Metered Operations**:
  - Regulation document upload and NLP compilation (`POST /api/v1/regulations/upload`)
  - Standard regulatory framework ingestion and compilation (`POST /api/v1/regulations/frameworks/{acronym}/ingest`)
  - Automated website compliance crawler (`POST /api/audit/website`)
- **Non-Metered Operations**:
  - Browsing the dashboard, viewing uploaded regulations, inspecting existing requirements and policy ASTs, reading generated reports, reviewing audit history, and downloading compliance certificates are **always free**.
- **Atomic Concurrency Guarantee**:
  - The entitlement check executes `SELECT ... FOR UPDATE` row-level locks on the `user_entitlements` table.
  - Two simultaneous requests cannot race to consume the final free credit; only one succeeds, while the other receives HTTP 402 `PAYMENT_REQUIRED`.
- **Idempotency**:
  - Every operation creates a `usage_events` record with `UniqueConstraint("org_id", "operation_id")`.
  - Retried requests or double-clicks will never double-charge.

---

## 3. Dodo Payments Setup & Configuration

### Step 1: Create a Dodo Payments Account
1. Visit [Dodo Payments](https://app.dodopayments.com) and create an account.
2. Complete developer onboarding and select **Test Mode** for initial sandbox testing.

### Step 2: Create a Product / Plan
1. In the Dodo dashboard, navigate to **Products** > **Create Product**.
2. Name: `RegCompiler Pro` (or `Compiler Unlimited`).
3. Pricing: Set price (e.g., `$49.00 / month` or one-time license).
4. Save and copy the **Product ID** (e.g., `prod_01j9...`).

### Step 3: Generate API Key
1. Go to **Developer Settings** > **API Keys**.
2. Create a new API Key with write permissions for checkouts and customer management.
3. Set this value in your backend environment as `DODO_PAYMENTS_API_KEY`.
4. **NEVER** expose this key to client-side code or prefix with `NEXT_PUBLIC_`.

### Step 4: Configure Webhooks
1. In Dodo Payments, navigate to **Webhooks** > **Add Webhook Endpoint**.
2. Set Endpoint URL to your public production/staging URL:
   `https://api.yourdomain.com/api/v1/billing/webhooks/dodo`
   *(Or on local dev using ngrok / localtunnel: `https://<subdomain>.ngrok-free.app/api/v1/billing/webhooks/dodo`)*
3. Select subscribed events:
   - `payment.succeeded`
   - `payment.failed`
   - `refund.succeeded` / `dispute.opened`
4. Copy the **Webhook Secret** (Standard Webhooks format: `whsec_...`).
5. Set this value in your backend environment as `DODO_PAYMENTS_WEBHOOK_SECRET`.

---

## 4. Environment Variables

### Backend (`apps/api/.env`)
```bash
# Dodo Payments Integration
DODO_PAYMENTS_API_KEY=test_your_dodo_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
DODO_PAYMENTS_ENVIRONMENT=test_mode   # Set to 'live_mode' in production
DODO_PAYMENTS_RETURN_URL=http://localhost:3000/billing/success
DODO_PAYMENTS_PRODUCT_ID=prod_your_dodo_product_id_here
```

### Frontend (`apps/web/.env`)
```bash
# Public API & App Configuration
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Webhook Security & Verification

The webhook endpoint (`POST /api/v1/billing/webhooks/dodo`) enforces cryptographic HMAC SHA-256 verification using the Standard Webhooks specification (`svix`):
- Checks `webhook-id`, `webhook-timestamp`, and `webhook-signature` headers.
- Rejects requests with invalid or expired signatures (tolerance: 300 seconds).
- Verifies idempotency against the `webhook_events` database ledger.
- If an event has already been processed (`UniqueConstraint("provider", "event_id")`), it immediately returns HTTP 200 without duplicate credit allocation.

---

## 6. Admin Exemption

Administrative users are explicitly recognized server-side:
- Users with role `RoleEnum.admin`.
- Super-admin email: `rcraghul12@gmail.com`.
- Administrative Clerk IDs.
- Admin users enjoy unlimited compilations and audits with no countdowns, no paywalls, and no payment prompts, while usage events are still logged for auditing.

---

## 7. Migration & Local Database Upgrade

To apply the billing schema migration:
```bash
cd apps/api
alembic upgrade head
```

This creates:
- `user_entitlements`: Organizations' billing status, plan, free uses counter, customer IDs, and period timestamps.
- `usage_events`: Concurrency-safe immutable ledger of every metered operation.
- `payment_transactions`: Record of all checkout transactions, amounts, and statuses.
- `webhook_events`: Deduplication ledger for webhook deliveries.

---

## 8. Switching to Production (Live Mode)

1. In the Dodo Payments dashboard, toggle from **Test Mode** to **Live Mode**.
2. Create live products and obtain the live Product ID.
3. Generate a Live API Key and Webhook Secret.
4. Update production environment variables:
   ```bash
   DODO_PAYMENTS_ENVIRONMENT=live_mode
   DODO_PAYMENTS_API_KEY=live_...
   DODO_PAYMENTS_WEBHOOK_SECRET=whsec_...
   DODO_PAYMENTS_PRODUCT_ID=prod_...
   DODO_PAYMENTS_RETURN_URL=https://yourdomain.com/billing/success
   ```
5. Deploy database migrations to the production PostgreSQL cluster.
