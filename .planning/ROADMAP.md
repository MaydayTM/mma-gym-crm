# RCN CRM - Roadmap

## Current Milestone: Member Onboarding

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

**Research:** Not needed - using existing Supabase Auth patterns

### Phase 2: Mobile App Foundation (Future)
- Expo + React Native setup
- Monorepo migration
- Member app with QR access

### Phase 3: Multi-tenant (Future)
- Tenant isolation
- Per-gym configuration
