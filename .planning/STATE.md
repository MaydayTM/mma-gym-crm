# RCN CRM - Project State

## Current Position

Phase: 5 of 10 (Subscriptions & Billing Audit)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-02-01 - Completed Phase 5 (all 3 plans)

Progress: █████░░░░░ ~30%

## Accumulated Context

### Key Decisions
- RLS uses `USING(true)` + app-layer role checks (avoid querying members table in policies - causes recursion)
- Resend configured with noreply@reconnect.academy
- Mollie is primary payment provider (Stripe deferred)
- Edge Functions pinned to supabase-js v2.39.3
- Owner tenant (Reconnect) bypasses all module checks
- Account claim tokens stored as SHA256 hash, 48h expiry
- Route guards use permission checks (canManageLeads, etc.) not direct role checks for flexibility
- Inline "Geen toegang" message instead of redirect for blocked routes
- Action buttons hidden (not disabled) for non-privileged users - cleaner UX
- Own-profile edit uses member.id === currentMember?.id pattern
- Sidebar uses permission field mapped to usePermissions keys for flexible visibility
- Settings sections split: admin-only (Betalingen, Gym Profiel, etc.) vs staff-accessible (Onboarding, Rooster)
- MRR calculated as sum of (final_price / duration_months) per active subscription
- Edge functions use SERVICE_ROLE_KEY (not ANON_KEY) for reading checkout_sessions
- Mollie webhook idempotency: check payment_status before processing to prevent duplicates
- Revenue records created alongside subscriptions in webhook flow
- Pricing matrix duplicate detection via catching PostgreSQL 23505 error
- Cascade delete warnings show count of affected pricing entries

### Known Issues
- RLS recursion was fixed in migration 060 but some policies may still need SQL Editor drops (see LESSONS_LEARNED.md)
- 3 Settings sections not built: gym profile, notifications, branding
- No automated E2E tests exist yet
- Migration sync mismatch: remote DB has migrations not in local repo (see .planning/ISSUES.md)
- Database function check_member_door_access missing team role bypass (not used in production, Edge Function is correct)

### Blockers/Concerns Carried Forward
- Migration history sync issue should be investigated before next database schema changes

### Roadmap Evolution
- v1.0 Member Onboarding: Claim account flow built, mobile & multi-tenant deferred
- v2.0 Beta Launch created: 7 phases (Phase 4-10), audit → test → fix → deploy

## Session Continuity

Last session: 2026-02-01
Stopped at: Completed Phase 5 (Subscriptions & Billing Audit) - all 3 plans done
Resume file: None

## Deferred Issues
- Mobile app (Phase 2) - deferred to post-beta
- Multi-tenant (Phase 3) - deferred to post-beta
- Stripe integration - deferred (Mollie is primary)
- Fighter Profile Generator - waiting on external repo
- check_member_door_access DB function team bypass fix (logged in .planning/ISSUES.md)
