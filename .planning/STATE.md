# RCN CRM - Project State

## Current Position

Phase: 4 of 10 (Roles, Permissions & Access Audit)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-01 - Completed 04-01-PLAN.md

Progress: █░░░░░░░░░ ~5%

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

### Known Issues
- RLS recursion was fixed in migration 060 but some policies may still need SQL Editor drops (see LESSONS_LEARNED.md)
- 3 Settings sections not built: gym profile, notifications, branding
- No automated E2E tests exist yet

### Blockers/Concerns Carried Forward
- None (fresh milestone)

### Roadmap Evolution
- v1.0 Member Onboarding: Claim account flow built, mobile & multi-tenant deferred
- v2.0 Beta Launch created: 7 phases (Phase 4-10), audit → test → fix → deploy

## Session Continuity

Last session: 2026-02-01
Stopped at: Completed 04-01-PLAN.md (RoleGuard & Route Access Control)
Resume file: None

## Deferred Issues
- Mobile app (Phase 2) - deferred to post-beta
- Multi-tenant (Phase 3) - deferred to post-beta
- Stripe integration - deferred (Mollie is primary)
- Fighter Profile Generator - waiting on external repo
