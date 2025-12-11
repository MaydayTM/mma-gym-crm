# RCN CRM Security Hardening Plan

**Created:** December 10, 2025
**Based on:** Security Audit Report
**Status:** Ready for Implementation

---

## Overview

This plan addresses all security issues identified in the audit, organized by priority phase. Each task includes estimated effort, specific files to modify, and acceptance criteria.

---

## Phase 1: Critical - Before ANY Production Use

**Total Estimated Effort:** 17 hours
**Deadline:** Must complete before deployment

### Task 1.1: Create RLS Enable Migration

**Effort:** 2 hours
**File:** `supabase/migrations/018_enable_rls_production.sql`

**Description:**
Create a new migration that enables RLS on all tables and revokes dangerous permissions.

**Steps:**
1. Create migration file
2. Enable RLS on all 26 tables
3. Revoke `ALL` from `anon` role
4. Grant appropriate permissions to `authenticated` role

**Acceptance Criteria:**
- [ ] All tables have `ENABLE ROW LEVEL SECURITY`
- [ ] No `GRANT ALL TO anon` statements remain
- [ ] Migration runs without errors

---

### Task 1.2: Write Core Table RLS Policies

**Effort:** 4 hours
**File:** `supabase/migrations/018_enable_rls_production.sql` (continued)

**Tables:**
- `members`
- `subscriptions`
- `checkins`
- `leads`
- `revenue`

**Policy Pattern:**
```sql
-- Admin full access
-- Staff read/write (role-based)
-- Users own data only
-- Anon: no access (except public checkout data)
```

**Acceptance Criteria:**
- [ ] Each table has at least 3 policies (admin, staff, user)
- [ ] Policies tested with different user roles
- [ ] No data leaks between users

---

### Task 1.3: Write Schedule & Class RLS Policies

**Effort:** 3 hours
**File:** `supabase/migrations/018_enable_rls_production.sql` (continued)

**Tables:**
- `disciplines` (public read)
- `classes` (public read, staff write)
- `class_instances` (public read, staff write)
- `reservations` (user own, staff all)
- `member_belts` (user own read, staff write)
- `belt_history` (user own read, staff write)

**Acceptance Criteria:**
- [ ] Public can view class schedule
- [ ] Users can only see/manage own reservations
- [ ] Staff can manage all reservations

---

### Task 1.4: Write Subscription & Checkout RLS Policies

**Effort:** 4 hours
**File:** `supabase/migrations/018_enable_rls_production.sql` (continued)

**Tables:**
- `age_groups` (public read)
- `plan_types` (public read)
- `pricing_matrix` (public read)
- `plan_addons` (public read)
- `family_discounts` (public read)
- `one_time_products` (public read)
- `family_groups` (staff only)
- `family_members` (staff only)
- `member_subscriptions` (user own, staff all)
- `subscription_addons` (user own, staff all)
- `checkout_sessions` (special: anon can INSERT for guest checkout)

**Special Case - checkout_sessions:**
```sql
-- Allow anonymous users to create checkout sessions (guest checkout)
CREATE POLICY "anon_create_checkout" ON checkout_sessions
  FOR INSERT WITH CHECK (true);

-- Only session owner (by email match) or staff can view
CREATE POLICY "owner_or_staff_read" ON checkout_sessions
  FOR SELECT USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
    OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role IN ('admin', 'medewerker'))
  );
```

**Acceptance Criteria:**
- [ ] Public checkout flow still works
- [ ] Guest users can create checkout sessions
- [ ] Users cannot see other users' checkout data

---

### Task 1.5: Write Module & Tenant RLS Policies

**Effort:** 2 hours
**File:** `supabase/migrations/018_enable_rls_production.sql` (continued)

**Tables:**
- `modules` (public read)
- `tenant_module_subscriptions` (admin only)
- `tasks` (staff only)
- `activity_log` (admin only)
- `webhook_events` (admin only)
- `integrations` (admin only)

**Acceptance Criteria:**
- [ ] Only admins can manage tenant modules
- [ ] Activity log protected from regular users

---

### Task 1.6: Test All RLS Policies

**Effort:** 2 hours

**Test Scenarios:**
1. **Anonymous user:** Can only read public data (plans, classes)
2. **Fighter (regular member):** Can only access own data
3. **Coach:** Can view members, manage own classes
4. **Medewerker:** Can manage members, leads, subscriptions
5. **Admin:** Full access to everything

**Testing Method:**
```sql
-- Test as specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "user-uuid-here", "role": "authenticated"}';

-- Try queries
SELECT * FROM members; -- Should return limited results
```

**Acceptance Criteria:**
- [ ] All 5 user scenarios tested
- [ ] No unauthorized data access possible
- [ ] Application still functions correctly

---

## Phase 2: High Priority - Before Public Launch

**Total Estimated Effort:** 14 hours
**Deadline:** Before first external users

### Task 2.1: Add Zod Validation Library

**Effort:** 1 hour

**Steps:**
1. `npm install zod`
2. Create `src/lib/validation.ts` with base schemas

**File:** `src/lib/validation.ts`
```typescript
import { z } from 'zod'

export const memberSchema = z.object({
  first_name: z.string().min(1, 'Voornaam is verplicht').max(255),
  last_name: z.string().min(1, 'Achternaam is verplicht').max(255),
  email: z.string().email('Ongeldig email adres'),
  phone: z.string().regex(/^\+?[\d\s-]*$/, 'Ongeldig telefoonnummer').optional().nullable(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  gender: z.enum(['man', 'vrouw', 'anders', 'onbekend']).optional().nullable(),
  // ... etc
})

export const leadSchema = z.object({
  first_name: z.string().max(255).optional(),
  last_name: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.enum(['instagram', 'facebook', 'google', 'website', 'walk_in', 'referral', 'other']),
  // ... etc
})

export const checkoutSchema = z.object({
  email: z.string().email('Ongeldig email adres'),
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  phone: z.string().optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum'),
})
```

**Acceptance Criteria:**
- [ ] Zod installed
- [ ] Base schemas created
- [ ] Types exported for form usage

---

### Task 2.2: Add Validation to Member Forms

**Effort:** 3 hours

**Files:**
- `src/components/members/NewMemberForm.tsx`
- `src/components/members/EditMemberForm.tsx`

**Implementation:**
```typescript
import { memberSchema } from '../../lib/validation'

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()

  const result = memberSchema.safeParse(formData)
  if (!result.success) {
    setErrors(result.error.flatten().fieldErrors)
    return
  }

  createMember(result.data)
}
```

**Acceptance Criteria:**
- [ ] All member forms validate before submit
- [ ] User-friendly error messages displayed
- [ ] Invalid data never reaches database

---

### Task 2.3: Add Validation to Lead Forms

**Effort:** 2 hours

**Files:**
- `src/components/leads/NewLeadForm.tsx`
- `src/components/leads/LeadDetailModal.tsx`

**Acceptance Criteria:**
- [ ] Lead creation validates input
- [ ] Lead updates validate input

---

### Task 2.4: Add Validation to Checkout Flow

**Effort:** 2 hours

**File:** `src/pages/checkout/PlanCheckout.tsx`

**Acceptance Criteria:**
- [ ] Checkout form validates before submission
- [ ] Email format enforced
- [ ] Birth date format enforced

---

### Task 2.5: Sanitize CSV Import

**Effort:** 2 hours

**File:** `src/components/members/ImportMembersModal.tsx`

**Steps:**
1. `npm install dompurify @types/dompurify`
2. Sanitize all text fields before insert
3. Add file size validation (max 5MB)
4. Validate against member schema

**Implementation:**
```typescript
import DOMPurify from 'dompurify'
import { memberSchema } from '../../lib/validation'

// Sanitize each field
const sanitizedMember = {
  first_name: DOMPurify.sanitize(row.first_name),
  last_name: DOMPurify.sanitize(row.last_name),
  email: row.email.toLowerCase().trim(),
  // ...
}

// Validate
const result = memberSchema.safeParse(sanitizedMember)
```

**Acceptance Criteria:**
- [ ] HTML stripped from all text fields
- [ ] File size limit enforced
- [ ] Each row validated against schema
- [ ] Clear error reporting per row

---

### Task 2.6: Remove Debug Logging

**Effort:** 2 hours

**Files to clean:**
- `src/lib/supabase.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/Login.tsx`
- `src/hooks/useLeads.ts`
- `src/hooks/useDashboardStats.ts`
- `src/hooks/useCheckin.ts`
- `src/hooks/useModules.ts`
- `src/pages/checkout/PlanCheckout.tsx`

**Implementation:**
1. Remove all `console.log` statements
2. Create dev-only logger utility:

```typescript
// src/lib/logger.ts
export const log = {
  debug: import.meta.env.DEV ? console.log : () => {},
  error: console.error, // Keep errors in production
  warn: import.meta.env.DEV ? console.warn : () => {},
}
```

**Acceptance Criteria:**
- [ ] No console.log in production build
- [ ] Errors still logged
- [ ] Dev mode still has helpful logging

---

### Task 2.7: Fix Storage Bucket Policies

**Effort:** 2 hours

**File:** `supabase/migrations/019_fix_storage_policies.sql`

**Implementation:**
```sql
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile pictures" ON storage.objects;

-- Create restrictive policies
CREATE POLICY "Users upload own profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own profile pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Staff can manage any profile picture
CREATE POLICY "Staff manage all profile pictures"
ON storage.objects FOR ALL
USING (
  bucket_id = 'profile-pictures'
  AND EXISTS (
    SELECT 1 FROM members
    WHERE id = auth.uid()
    AND role IN ('admin', 'medewerker')
  )
);
```

**Acceptance Criteria:**
- [ ] Users can only upload to their own folder
- [ ] Users cannot modify others' pictures
- [ ] Staff can manage all pictures

---

## Phase 3: Medium Priority - Before Scale

**Total Estimated Effort:** 16 hours
**Deadline:** Before significant user growth

### Task 3.1: Implement Rate Limiting

**Effort:** 4 hours

**Options:**
1. Supabase Edge Functions with rate limit
2. Upstash Rate Limit (serverless)
3. Client-side debouncing (basic)

**Implementation (Edge Function approach):**

**File:** `supabase/functions/rate-limit/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RATE_LIMIT = 100 // requests per minute
const rateLimitMap = new Map<string, number[]>()

serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowMs = 60000 // 1 minute

  const requests = rateLimitMap.get(ip) || []
  const recentRequests = requests.filter(t => t > now - windowMs)

  if (recentRequests.length >= RATE_LIMIT) {
    return new Response('Too Many Requests', { status: 429 })
  }

  recentRequests.push(now)
  rateLimitMap.set(ip, recentRequests)

  // Continue to actual function...
})
```

**Acceptance Criteria:**
- [ ] Login attempts limited to 5/minute
- [ ] API calls limited to 100/minute per IP
- [ ] Clear error message on rate limit hit

---

### Task 3.2: Sanitize Error Messages

**Effort:** 2 hours

**File:** `src/lib/errors.ts`

```typescript
const errorMap: Record<string, string> = {
  'duplicate key value violates unique constraint': 'Dit record bestaat al',
  'violates foreign key constraint': 'Gerelateerde data niet gevonden',
  'violates check constraint': 'Ongeldige waarde',
  'JWT expired': 'Sessie verlopen, log opnieuw in',
  'Invalid login credentials': 'Onjuist email of wachtwoord',
  'Email not confirmed': 'Bevestig eerst je email adres',
}

export function getDisplayError(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message

  for (const [pattern, displayMessage] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(pattern.toLowerCase())) {
      return displayMessage
    }
  }

  // Log original error for debugging
  console.error('Unhandled error:', message)

  return 'Er ging iets mis. Probeer het opnieuw.'
}
```

**Files to update:**
- All components with error display
- All hooks that throw errors

**Acceptance Criteria:**
- [ ] No technical error messages visible to users
- [ ] Original errors logged for debugging
- [ ] User-friendly Dutch error messages

---

### Task 3.3: Add Audit Logging

**Effort:** 4 hours

**File:** `supabase/migrations/020_audit_logging.sql`

```sql
-- Create audit log function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    created_at
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER audit_members
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_revenue
  AFTER INSERT OR UPDATE OR DELETE ON revenue
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
```

**Acceptance Criteria:**
- [ ] All CRUD operations on sensitive tables logged
- [ ] User ID captured
- [ ] Old and new values stored
- [ ] Timestamps accurate

---

### Task 3.4: Implement Data Retention Policy

**Effort:** 4 hours

**Steps:**
1. Add `deleted_at` column to members table
2. Create scheduled function to hard-delete old records
3. Document GDPR data subject request process

**File:** `supabase/migrations/021_data_retention.sql`

```sql
-- Add soft delete column
ALTER TABLE members ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for cleanup queries
CREATE INDEX idx_members_deleted ON members(deleted_at) WHERE deleted_at IS NOT NULL;

-- Function to purge old deleted records (run via cron)
CREATE OR REPLACE FUNCTION purge_deleted_records()
RETURNS void AS $$
BEGIN
  -- Delete members cancelled > 2 years ago
  DELETE FROM members
  WHERE deleted_at < NOW() - INTERVAL '2 years';

  -- Delete old checkout sessions > 90 days
  DELETE FROM checkout_sessions
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND payment_status != 'completed';

  -- Delete old activity logs > 1 year
  DELETE FROM activity_log
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;
```

**Acceptance Criteria:**
- [ ] Soft delete uses `deleted_at` timestamp
- [ ] Cleanup function created
- [ ] Cron job configured (Supabase pg_cron or external)
- [ ] GDPR process documented

---

### Task 3.5: Create .env.example

**Effort:** 30 minutes

**File:** `.env.example`

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: External URLs
VITE_SHOP_URL=https://www.mmagym.be/shop
VITE_SHOP_ADMIN_URL=https://www.mmagym.be/admin/shop

# Development only
VITE_DEBUG=false
```

**Acceptance Criteria:**
- [ ] File created with all required variables
- [ ] Comments explain each variable
- [ ] No actual secrets in file

---

### Task 3.6: Fix Multi-Tenant Architecture

**Effort:** 2 hours

**File:** `supabase/migrations/022_fix_tenant_id.sql`

```sql
-- Remove default tenant ID
ALTER TABLE tenant_module_subscriptions
ALTER COLUMN tenant_id DROP DEFAULT;

-- Add tenant_id to members for proper multi-tenancy
ALTER TABLE members ADD COLUMN tenant_id VARCHAR(100);

-- Backfill existing data
UPDATE members SET tenant_id = 'reconnect' WHERE tenant_id IS NULL;

-- Make tenant_id required
ALTER TABLE members ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE members ALTER COLUMN tenant_id SET DEFAULT 'reconnect'; -- Temporary for migration

-- Add index
CREATE INDEX idx_members_tenant ON members(tenant_id);
```

**Acceptance Criteria:**
- [ ] No hardcoded tenant ID in new code
- [ ] Existing data migrated
- [ ] Future multi-tenant ready

---

## Phase 4: Ongoing Improvements

**Deadline:** Continuous

### Task 4.1: Add Test Coverage

**Effort:** 20+ hours (ongoing)

**Priority test areas:**
1. Authentication flow
2. RLS policy enforcement
3. Member CRUD operations
4. Lead conversion
5. Checkout flow

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

### Task 4.2: Performance Optimization

**Effort:** 8 hours

**Areas:**
- Fix N+1 in useMemberBelts
- Add pagination to member/lead lists
- Optimize dashboard stats queries

---

### Task 4.3: Documentation

**Effort:** 4 hours

**Deliverables:**
- API documentation
- Deployment runbook
- GDPR compliance documentation
- Security incident response plan

---

## Progress Tracking

### Phase 1: Critical
- [ ] Task 1.1: Create RLS Enable Migration
- [ ] Task 1.2: Write Core Table RLS Policies
- [ ] Task 1.3: Write Schedule & Class RLS Policies
- [ ] Task 1.4: Write Subscription & Checkout RLS Policies
- [ ] Task 1.5: Write Module & Tenant RLS Policies
- [ ] Task 1.6: Test All RLS Policies

### Phase 2: High Priority
- [ ] Task 2.1: Add Zod Validation Library
- [ ] Task 2.2: Add Validation to Member Forms
- [ ] Task 2.3: Add Validation to Lead Forms
- [ ] Task 2.4: Add Validation to Checkout Flow
- [ ] Task 2.5: Sanitize CSV Import
- [ ] Task 2.6: Remove Debug Logging
- [ ] Task 2.7: Fix Storage Bucket Policies

### Phase 3: Medium Priority
- [ ] Task 3.1: Implement Rate Limiting
- [ ] Task 3.2: Sanitize Error Messages
- [ ] Task 3.3: Add Audit Logging
- [ ] Task 3.4: Implement Data Retention Policy
- [ ] Task 3.5: Create .env.example
- [ ] Task 3.6: Fix Multi-Tenant Architecture

### Phase 4: Ongoing
- [ ] Task 4.1: Add Test Coverage
- [ ] Task 4.2: Performance Optimization
- [ ] Task 4.3: Documentation

---

## Estimated Total Effort

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1 | 17 | CRITICAL |
| Phase 2 | 14 | HIGH |
| Phase 3 | 16 | MEDIUM |
| Phase 4 | 32+ | ONGOING |
| **Total** | **79+** | - |

---

*Plan created by Claude Code based on Security Audit Report*
