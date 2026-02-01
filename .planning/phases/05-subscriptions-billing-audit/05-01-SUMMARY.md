---
phase: 05-subscriptions-billing-audit
plan: 01
subsystem: subscriptions, members
tags: [subscription, lifecycle, cancel, freeze, unfreeze, mrr, member-detail]

# Dependency graph
requires:
  - phase: 04-roles-permissions-access-audit
    provides: canEditMembers permission gating for action buttons
provides:
  - Subscription cancel/freeze/unfreeze mutations
  - Fixed MRR calculation (per-subscription monthly rate)
  - SubscriptionActions component for MemberDetail page
affects: [05-02, 05-03, 08-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Optimistic query invalidation for subscription mutations
    - Status-based conditional rendering for action buttons
    - Confirmation dialogs for destructive actions

key-files:
  created:
    - src/components/members/SubscriptionActions.tsx
  modified:
    - src/hooks/useSubscriptions.ts
    - src/pages/Subscriptions.tsx
    - src/pages/MemberDetail.tsx

key-decisions:
  - "MRR calculated as sum of (final_price / duration_months) per active subscription"
  - "Unfreeze extends end_date by frozen duration (frozen_until - today)"
  - "Cancel updates member status to cancelled if no other active subscriptions"
  - "Action buttons hidden (not disabled) for non-privileged users"

patterns-established:
  - "Subscription lifecycle mutations with query invalidation"
  - "Status-based action button rendering in SubscriptionActions"
  - "Date picker modal for freeze duration selection"

# Metrics
completed: 2026-02-01
---

# Plan 05-01: Subscription Lifecycle Management

**Cancel/freeze/unfreeze mutations, MRR fix, and SubscriptionActions component**

## Accomplishments
- Fixed MRR calculation: now `sum(final_price / duration_months)` instead of `sum(final_price) / 12`
- Added `useCancelSubscription` mutation (sets status, cancelled_at, updates member status)
- Added `useFreezeSubscription` mutation (sets status to frozen, sets frozen_until date)
- Added `useUnfreezeSubscription` mutation (returns to active, extends end_date)
- Created SubscriptionActions component with status-based buttons
- Integrated into MemberDetail subscription list
- All actions gated behind canEditMembers permission

## Task Commits
1. **Task 1: MRR fix + lifecycle mutations** - `6ddf013`
2. **Task 2: SubscriptionActions component** - `fd898d0`

## Files Created/Modified
- `src/hooks/useSubscriptions.ts` - Added 3 mutation hooks, fixed MRR calculation
- `src/pages/Subscriptions.tsx` - Removed /12 division from MRR display
- `src/components/members/SubscriptionActions.tsx` - New component with freeze/cancel/unfreeze
- `src/pages/MemberDetail.tsx` - Integrated SubscriptionActions

## Deviations
- Adapted for `frozen_until` column (not `frozen_at` which doesn't exist in DB schema)

## Checkpoint
Human-verified and approved: 2026-02-01

---
*Phase: 05-subscriptions-billing-audit*
*Completed: 2026-02-01*
