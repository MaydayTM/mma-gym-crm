# RCN CRM - Project State

## Current Position

Phase: 8 of 10 (Full Functionality Audit & E2E Testing)
Plan: 5 of 5 in current phase
Status: Phase complete — 115 E2E tests across 12 spec files
Last activity: 2026-02-02 - Completed Phase 8 (all 5 plans)

Progress: ████████░░ ~71%

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
- Webhook signature verification: svix library with graceful degradation (dev mode)
- Auth user lookup: always use auth_user_id (not members.id) for auth.uid() queries
- Try-create pattern for email existence check (avoids listUsers scalability issue)
- Error reason mapping: Edge Function error_reason → Dutch UI messages with fallback
- E2E claim flow testing deferred to Phase 8 (code audit approved)
- QR tokens stored as SHA256 hash in DB, plaintext JWT returned to frontend (Phase 7)
- door-token requires Bearer auth; door-validate requires apikey header (Phase 7)
- Wiegand QR detection by bit count: >100 bits = QR/ASCII, 26 bits = standard card (Phase 7)
- Playwright E2E: Chromium-only, graceful skip without .env.test, Vite auto-start (Phase 8)
- Tests use timestamp-based unique data and Supabase admin client for cleanup (Phase 8)

### Known Issues
- RLS recursion was fixed in migration 060 but some policies may still need SQL Editor drops (see LESSONS_LEARNED.md)
- 3 Settings sections not built: gym profile, notifications, branding
- Migration sync mismatch: remote DB has migrations not in local repo (see .planning/ISSUES.md)
- RESEND_WEBHOOK_SECRET not set in Supabase secrets (webhook verification gracefully degrades)
- Stale session/JWT observed: admin role briefly showed as "member" (re-login fixed it)
- ESP32 needs flashing with production firmware (ISS-001)
- End-to-end hardware door testing pending (ISS-002)
- check_member_door_access SQL fix needs manual application via SQL Editor (ISS-003)

### Blockers/Concerns Carried Forward
- Migration history sync issue should be investigated before next database schema changes
- ESP32 hardware testing requires physical access to device

### Roadmap Evolution
- v1.0 Member Onboarding: Claim account flow built, mobile & multi-tenant deferred
- v2.0 Beta Launch created: 7 phases (Phase 4-10), audit → test → fix → deploy

## Session Continuity

Last session: 2026-02-02
Stopped at: Completed Phase 8 (Full Functionality Audit & E2E Testing) - all 5 plans done, 115 tests across 12 spec files
Resume file: None

## Deferred Issues
- Mobile app (Phase 2) - deferred to post-beta
- Multi-tenant (Phase 3) - deferred to post-beta
- Stripe integration - deferred (Mollie is primary)
- Fighter Profile Generator - waiting on external repo
- ISS-001: Flash ESP32 with production firmware (need physical access)
- ISS-002: End-to-end hardware door access testing (depends on ISS-001)
- ISS-003: Apply check_member_door_access SQL fix via SQL Editor
