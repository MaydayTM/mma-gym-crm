---
phase: 05-subscriptions-billing-audit
plan: 02
subsystem: payments, checkout
tags: [mollie, payment, webhook, security, checkout, idempotency, revenue]

# Dependency graph
requires:
  - phase: 04-roles-permissions-access-audit
    provides: RLS policies for checkout_sessions
provides:
  - Hardened create-mollie-payment with SERVICE_ROLE_KEY
  - Idempotent webhook (no duplicate subscriptions)
  - Revenue record creation on successful payment
  - Member status update on payment success
affects: [07-door-access, 08-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SERVICE_ROLE_KEY for edge functions (not ANON_KEY)
    - Idempotency guard on webhook handlers
    - Revenue record creation alongside subscription creation

key-files:
  modified:
    - supabase/functions/create-mollie-payment/index.ts
    - supabase/functions/mollie-webhook/index.ts
    - src/pages/checkout/PlanCheckout.tsx
    - src/pages/checkout/CheckoutSuccess.tsx
    - src/types/database.types.ts

key-decisions:
  - "SERVICE_ROLE_KEY for edge functions reading checkout_sessions"
  - "24h session freshness check prevents stale checkout sessions"
  - "Webhook idempotency: return 200 if payment_status already completed"
  - "Revenue record created in webhook matching useAssignSubscription pattern"

patterns-established:
  - "Edge function security: SERVICE_ROLE_KEY + amount validation + session freshness"
  - "Webhook idempotency: check completion status before processing"
  - "Revenue tracking: always create revenue record alongside subscription"

# Metrics
completed: 2026-02-01
---

# Plan 05-02: Mollie Payment Flow Hardening

**Security audit and hardening of payment creation, webhook processing, and checkout flow**

## Accomplishments
- create-mollie-payment: Switched to SERVICE_ROLE_KEY, added 24h session freshness check, positive amount validation, description truncation (255 char Mollie limit)
- mollie-webhook: Added idempotency guard (no duplicate subscriptions on retry), revenue record creation, member status update to active
- PlanCheckout: Added email pattern validation
- CheckoutSuccess: Improved pending payment handling
- Regenerated database.types.ts to fix type mismatches

## Task Commits
1. **Task 1: Harden create-mollie-payment** - `3322b73`
2. **Task 2: Harden webhook + audit checkout flow** - `c332ec4`

## Files Modified
- `supabase/functions/create-mollie-payment/index.ts` - SERVICE_ROLE_KEY, validations
- `supabase/functions/mollie-webhook/index.ts` - Idempotency, revenue, member status
- `src/pages/checkout/PlanCheckout.tsx` - Email validation
- `src/pages/checkout/CheckoutSuccess.tsx` - Pending payment handling
- `src/types/database.types.ts` - Regenerated from Supabase

## Security Improvements
- No more ANON_KEY in edge function that reads checkout_sessions
- Stale sessions (>24h) rejected
- Zero/negative payment amounts rejected
- Webhook can't create duplicate subscriptions on retry

## Checkpoint
Human-verified and approved: 2026-02-01

---
*Phase: 05-subscriptions-billing-audit*
*Completed: 2026-02-01*
