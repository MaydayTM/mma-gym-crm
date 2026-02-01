# Roadmap: RCN CRM

## Overview

RCN CRM replaces ClubPlanner for Reconnect Academy. The MVP is built and deployed. Now we prepare for beta testers by auditing security, testing all flows, and hardening for production use.

## Milestones

- ✅ **v1.0 Member Onboarding** - Phases 1-3 (claim account flow built, mobile & multi-tenant deferred)
- 🚧 **v2.0 Beta Launch** - Phases 4-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 Member Onboarding (Phases 1-3)</summary>

### Phase 1: Claim Account Flow
**Goal:** Existing members (imported from ClubPlanner) can activate their accounts

**Scope:**
- Database: Add account_claim_tokens table
- Edge Function: Send claim emails, validate tokens
- Frontend: Claim account UI on login page + activation page
- CRM: Member onboarding management in Settings/Automations

**Dependencies:**
- ✅ Email infrastructure (Resend + reconnect.academy)
- ✅ Email templates (ClaimAccountEmail.ts)
- ✅ Security fixes (role escalation, shop policies, QR hashing)

**Status:** Complete (code built, needs E2E testing in v2.0)

### Phase 2: Mobile App Foundation (Future)
- Expo + React Native setup
- Monorepo migration
- Member app with QR access

### Phase 3: Multi-tenant (Future)
- Tenant isolation
- Per-gym configuration

</details>

### 🚧 v2.0 Beta Launch (In Progress)

**Milestone Goal:** Prepare the CRM for real beta testers by auditing every role, permission, subscription flow, email delivery, hardware integration, and page functionality. Fix all issues found and deploy with monitoring.

#### Phase 4: Roles, Permissions & Access Audit
**Goal**: Systematic audit of every page, action, and data access per role. Verify profile edit restrictions, sidebar visibility, RLS policies, and ensure no unauthorized access or missing access.
**Depends on**: v1.0 complete
**Research**: Unlikely (internal patterns, RLS already in place)
**Plans**: 3

Plans:
- [x] 04-01: RoleGuard & Route Access Control
- [x] 04-02: Member management permission checks
- [x] 04-03: Remaining pages + sidebar audit + full verification

#### Phase 5: Subscriptions & Billing Audit
**Goal**: Verify complete subscription lifecycle (create, assign, cancel, freeze, expire), Mollie payment flow, plan pricing matrix, and subscription-gated access (features + door entry).
**Depends on**: Phase 4
**Research**: Unlikely (Mollie already integrated)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

#### Phase 6: Email & Account Claim Testing
**Goal**: End-to-end testing of Resend email delivery, claim account flow with real emails, bulk invitation sending, and member migration onboarding from ClubPlanner.
**Depends on**: Phase 4
**Research**: Unlikely (already built, needs verification)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

#### Phase 7: Door Access & QR Integration
**Goal**: Hardware testing of ESP32 door modules, QR token generation/validation, access logging, and subscription-gated entry. Verify the full physical access flow.
**Depends on**: Phase 5 (subscription gating)
**Research**: Likely (ESP32 firmware, WiFi connectivity, Wiegand protocol)
**Research topics**: ESP32 firmware setup and flashing, WiFi configuration for gym environment, Wiegand reader integration, fallback when offline
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

#### Phase 8: Full Functionality Audit & E2E Testing
**Goal**: Page-by-page functionality testing of all 24 pages. Automated Playwright tests for critical user flows (login, member CRUD, lead pipeline, scheduling, check-in, reports).
**Depends on**: Phases 4-7
**Research**: Unlikely (internal testing)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

#### Phase 9: Bug Fixes & Polish
**Goal**: Address all issues found in phases 4-8. UI polish, error handling improvements, edge case fixes, and UX improvements based on audit findings.
**Depends on**: Phase 8
**Research**: Unlikely (internal fixes)
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

#### Phase 10: Beta Deployment & Monitoring
**Goal**: Production hardening, error tracking setup (Sentry), uptime monitoring, invite first beta testers, and feedback collection mechanism.
**Depends on**: Phase 9
**Research**: Likely (monitoring/error tracking tools)
**Research topics**: Sentry integration with Vite/React, uptime monitoring service, structured feedback collection
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 4. Roles & Permissions Audit | v2.0 | 3/3 | Complete | 2026-02-01 |
| 5. Subscriptions & Billing Audit | v2.0 | 0/? | Not started | - |
| 6. Email & Account Claim Testing | v2.0 | 0/? | Not started | - |
| 7. Door Access & QR Integration | v2.0 | 0/? | Not started | - |
| 8. Functionality Audit & E2E Testing | v2.0 | 0/? | Not started | - |
| 9. Bug Fixes & Polish | v2.0 | 0/? | Not started | - |
| 10. Beta Deployment & Monitoring | v2.0 | 0/? | Not started | - |
