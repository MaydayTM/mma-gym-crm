# RCN CRM Security & Code Quality Audit Report

**Date:** December 10, 2025
**Auditor:** Claude Code (Automated)
**Project:** RCN CRM (Reconnect Academy CRM)
**Version:** 0.1.0 (MVP Phase)

---

## Executive Summary

This comprehensive audit identified **1 CRITICAL**, **4 HIGH**, **6 MEDIUM**, and **5 LOW** severity issues. The codebase demonstrates solid architectural patterns and modern React practices, but has significant security gaps that MUST be addressed before production deployment.

### Risk Score: 7.5/10 (High Risk for Production)

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 1 | Requires immediate action |
| HIGH | 4 | Must fix before production |
| MEDIUM | 6 | Should fix before production |
| LOW | 5 | Recommended improvements |

---

## CRITICAL Issues

### CRIT-001: Row Level Security (RLS) Disabled on ALL Tables

**Location:** `supabase/migrations/004_disable_rls_for_development.sql`, `012_disable_rls_new_tables.sql`, `014_ensure_rls_disabled.sql`, `015_subscription_plans.sql`, `017_tenant_modules.sql`

**Description:** RLS is explicitly disabled on ALL database tables with `GRANT ALL` permissions to both `authenticated` AND `anon` roles. This means:

- **Anyone with the Supabase anon key can read ALL data** (members, subscriptions, revenue, leads)
- **Anyone with the anon key can INSERT, UPDATE, DELETE any record**
- **No authentication required for data access**

**Affected Tables (26 total):**
```
members, subscriptions, checkins, leads, revenue, tasks, activity_log,
webhook_events, integrations, disciplines, classes, reservations,
member_belts, belt_history, class_instances, age_groups, plan_types,
pricing_matrix, plan_addons, family_discounts, one_time_products,
family_groups, family_members, member_subscriptions, subscription_addons,
checkout_sessions, modules, tenant_module_subscriptions
```

**Evidence:**
```sql
-- From 014_ensure_rls_disabled.sql
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
GRANT ALL ON members TO anon;
```

**Impact:** Complete data breach possible. Any malicious actor with the public anon key (visible in browser) can:
- Download entire member database (PII, contact info, addresses)
- View all financial revenue data
- Modify or delete any records
- Access checkout sessions with personal data

**Remediation:**
1. Create new migration `018_enable_rls_production.sql`
2. Enable RLS on all tables
3. Implement proper policies (see appendix for templates)
4. Remove `GRANT ALL ON * TO anon` statements
5. Test thoroughly before deployment

**Priority:** IMMEDIATE - Do not deploy to production without fixing

---

## HIGH Severity Issues

### HIGH-001: No Input Validation Framework

**Location:** All hooks and form components

**Description:** No input validation library (Zod, Yup, Joi) is used. User input goes directly to Supabase without sanitization or validation beyond basic HTML5 form attributes.

**Affected Files:**
- `src/components/members/NewMemberForm.tsx`
- `src/components/members/EditMemberForm.tsx`
- `src/components/leads/NewLeadForm.tsx`
- `src/pages/checkout/PlanCheckout.tsx`
- `src/components/members/ImportMembersModal.tsx`

**Example (PlanCheckout.tsx:559-580):**
```typescript
// No validation before database insert
const { data: session, error } = await supabase
  .from('checkout_sessions')
  .insert({
    email,           // Unvalidated
    first_name: firstName,  // Unvalidated
    last_name: lastName,    // Unvalidated
    phone: phone || null,   // Unvalidated
    birth_date: birthDate,  // Unvalidated
    // ...
  })
```

**Impact:**
- SQL injection via Supabase (mitigated by Supabase's parameterization)
- Invalid data in database
- Business logic bypass
- Potential XSS if data rendered without escaping

**Remediation:**
1. Install Zod: `npm install zod`
2. Create validation schemas for all entities
3. Validate on form submission AND server-side (Edge Functions)

```typescript
// Example schema
const memberSchema = z.object({
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s-]+$/).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
```

---

### HIGH-002: CSV Import Without Sanitization

**Location:** `src/components/members/ImportMembersModal.tsx:54-167`

**Description:** CSV import parses user-uploaded files with minimal validation. The email regex is basic and other fields are not sanitized.

**Vulnerable Code:**
```typescript
// Line 142 - Basic email regex, no sanitization
if (typeof row.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
  errors.push({ row: i + 1, field: 'email', message: 'Ongeldig email formaat' })
}

// Lines 147-163 - Direct casting without sanitization
data.push({
  first_name: row.first_name as string,  // Could contain HTML/scripts
  last_name: row.last_name as string,
  email: row.email as string,
  // ...
})
```

**Impact:**
- Stored XSS via malicious CSV content
- Data corruption
- Formula injection (if exported to Excel later)

**Remediation:**
1. Add DOMPurify for text sanitization
2. Validate all fields against schemas
3. Escape special characters
4. Add file size limits (currently no limit check)

---

### HIGH-003: Debug Logging in Production Code

**Location:** Multiple files

**Description:** Extensive `console.log` statements expose internal state and timing information.

**Affected Files (8):**
- `src/lib/supabase.ts` - Logs Supabase URL prefix
- `src/contexts/AuthContext.tsx` - Logs auth events, session state
- `src/pages/Login.tsx` - Logs authentication status
- `src/hooks/useLeads.ts` - Logs query performance
- `src/hooks/useDashboardStats.ts` - Logs stats queries
- `src/hooks/useCheckin.ts` - Logs check-in operations
- `src/hooks/useModules.ts` - Logs module fetching
- `src/pages/checkout/PlanCheckout.tsx` - Logs checkout errors

**Example (AuthContext.tsx):**
```typescript
console.log('[Auth] onAuthStateChange fired:', _event, !!session)
console.log('[Auth] Member profile fetched:', !!member)
console.log('[Auth] Setting state from onAuthStateChange, isLoading: false')
```

**Impact:**
- Information disclosure to browser console
- Timing attacks possible
- Credential/session info could leak

**Remediation:**
1. Remove all console.log statements
2. Use environment-based logging:
```typescript
const log = import.meta.env.DEV ? console.log : () => {}
```
3. Implement proper error reporting (Sentry, LogRocket)

---

### HIGH-004: Hardcoded Tenant ID

**Location:** `supabase/migrations/017_tenant_modules.sql:37`

**Description:** Multi-tenant architecture uses hardcoded `'reconnect'` tenant ID.

```sql
tenant_id VARCHAR(100) NOT NULL DEFAULT 'reconnect',
```

**Also in seed data:**
```sql
INSERT INTO tenant_module_subscriptions (tenant_id, module_id, status, trial_ends_at)
SELECT 'reconnect', id, 'trial', NOW() + INTERVAL '30 days'
```

**Impact:**
- Future multi-tenant expansion will require significant refactoring
- Cross-tenant data access possible if tenant ID spoofed
- No tenant isolation enforcement

**Remediation:**
1. Remove default tenant ID
2. Derive tenant from authenticated user's organization
3. Add tenant validation in RLS policies

---

## MEDIUM Severity Issues

### MED-001: Missing .env.example File

**Location:** Project root

**Description:** No `.env.example` file exists to document required environment variables. Developers must guess or find them in code.

**Required Variables (found in code):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Remediation:** Create `.env.example`:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_SHOP_URL=
VITE_SHOP_ADMIN_URL=
```

---

### MED-002: Storage Bucket Policies Too Permissive

**Location:** `supabase/migrations/005_profile_pictures_storage.sql`

**Description:** Profile picture storage policies allow any authenticated user to upload/update/delete ANY profile picture.

```sql
-- Anyone authenticated can upload to ANY member's folder
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
);
```

**Impact:** User A can overwrite User B's profile picture.

**Remediation:**
```sql
-- Restrict to own folder
CREATE POLICY "Users can upload own profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### MED-003: No Rate Limiting

**Location:** All mutation hooks

**Description:** No client-side or server-side rate limiting exists for:
- Login attempts
- Member creation
- Lead creation
- Check-ins
- CSV imports

**Impact:**
- Brute force login attacks
- DoS via bulk operations
- Data flooding

**Remediation:**
1. Implement Supabase Edge Functions with rate limiting
2. Use Upstash Rate Limit for serverless
3. Add client-side debouncing for forms

---

### MED-004: Error Messages Expose Technical Details

**Location:** Multiple components and hooks

**Description:** Raw Supabase error messages displayed to users.

**Example (EditMemberForm.tsx:182):**
```tsx
{error && (
  <div className="p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl">
    <p className="text-rose-300 text-[14px]">{(error as Error).message}</p>
  </div>
)}
```

**Impact:** Database schema information, constraint names, and internal errors visible to users.

**Remediation:**
```typescript
const getDisplayError = (error: Error): string => {
  // Map known errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'duplicate key': 'Dit email adres is al in gebruik',
    'violates foreign key': 'Gerelateerde data niet gevonden',
    'violates check constraint': 'Ongeldige waarde ingevoerd',
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message.includes(key)) return message;
  }

  return 'Er ging iets mis. Probeer het opnieuw.';
};
```

---

### MED-005: Soft Delete Without Data Retention Policy

**Location:** `src/hooks/useDeleteMember.ts`

**Description:** Members are "deleted" by setting `status = 'cancelled'` but data remains forever.

```typescript
mutationFn: async (id: string) => {
  const { error } = await supabase
    .from('members')
    .update({ status: 'cancelled' })
    .eq('id', id)
```

**Impact:**
- GDPR compliance issues (right to erasure)
- Database growth over time
- Cancelled members still visible in some queries

**Remediation:**
1. Add `deleted_at` timestamp column
2. Implement data retention policy (e.g., hard delete after 2 years)
3. Add scheduled job to purge old data
4. Document GDPR process for data subject requests

---

### MED-006: N+1 Query Pattern in Belt System

**Location:** `src/hooks/useMemberBelts.ts`

**Description:** Training count fetched separately for each discipline via RPC calls.

**Impact:** Poor performance with many disciplines (multiple database roundtrips).

**Remediation:** Create single RPC that returns all training counts:
```sql
CREATE FUNCTION get_all_training_counts(p_member_id UUID)
RETURNS TABLE (discipline_id UUID, training_count INTEGER) AS $$
  -- Single query for all disciplines
$$ LANGUAGE plpgsql;
```

---

## LOW Severity Issues

### LOW-001: No Test Coverage

**Description:** Zero test files found in the project.

**Remediation:**
1. Add Jest + React Testing Library
2. Start with critical paths: auth, member CRUD, lead conversion
3. Aim for 70% coverage before production

---

### LOW-002: TypeScript @ts-expect-error Usage

**Location:** `src/pages/Login.tsx:57`

```tsx
// @ts-expect-error CSS custom properties
'--border-gradient': 'linear-gradient(...)',
```

**Remediation:** Extend CSSProperties type properly:
```typescript
declare module 'react' {
  interface CSSProperties {
    '--border-gradient'?: string;
    '--border-radius-before'?: string;
  }
}
```

---

### LOW-003: Unused Variable Pattern

**Location:** `src/components/members/ImportMembersModal.tsx:36`

```typescript
const [_file, setFile] = useState<File | null>(null)
```

**Remediation:** Remove if truly unused, or use it.

---

### LOW-004: Trial Date Calculated Client-Side

**Location:** `src/hooks/useModules.ts`

**Description:** Trial expiration calculated in browser, susceptible to clock manipulation.

**Remediation:** Add server-side validation in RLS policies:
```sql
AND (trial_ends_at IS NULL OR trial_ends_at >= NOW())
```

---

### LOW-005: QueryClient StaleTime May Be Too Long

**Location:** `src/App.tsx:26`

```typescript
staleTime: 1000 * 60 * 5, // 5 minutes
```

**Impact:** Dashboard stats may show stale data for 5 minutes.

**Remediation:** Consider shorter staleTime for real-time data (dashboard, reservations).

---

## Dependency Audit Results

**npm audit:** 0 vulnerabilities found

| Package | Version | Status |
|---------|---------|--------|
| @supabase/supabase-js | 2.86.0 | Secure |
| @tanstack/react-query | 5.90.11 | Secure |
| react | 19.2.0 | Secure |
| react-router-dom | 7.9.6 | Secure |
| vite | 7.2.4 | Secure |
| typescript | 5.9.3 | Secure |

**Recommendation:** Run `npm audit` regularly and keep dependencies updated.

---

## Code Quality Assessment

### Strengths

1. **Modern React Patterns** - Functional components, hooks, proper state management
2. **TypeScript Usage** - Strict mode enabled, proper typing throughout
3. **Consistent Architecture** - Clear separation of concerns (hooks, components, pages)
4. **React Query** - Proper cache management and invalidation
5. **Database Design** - Well-normalized schema with proper indexes
6. **Error Boundaries** - Global error boundary implemented

### Areas for Improvement

1. **Form State Management** - Consider React Hook Form for complex forms
2. **Modal Management** - Could use modal context pattern
3. **Props Drilling** - Some components have deep prop chains
4. **Code Comments** - Limited inline documentation
5. **Internationalization** - Hardcoded Dutch strings

---

## Security Hardening Plan

### Phase 1: Critical (Before ANY Production Use)

| Task | Effort | Priority |
|------|--------|----------|
| Enable RLS on all tables | 4 hours | P0 |
| Write RLS policies for each table | 8 hours | P0 |
| Remove `GRANT ALL TO anon` | 1 hour | P0 |
| Test all policies thoroughly | 4 hours | P0 |

### Phase 2: High (Before Public Launch)

| Task | Effort | Priority |
|------|--------|----------|
| Add Zod validation | 8 hours | P1 |
| Sanitize CSV imports | 2 hours | P1 |
| Remove debug logging | 2 hours | P1 |
| Fix storage policies | 2 hours | P1 |

### Phase 3: Medium (Before Scale)

| Task | Effort | Priority |
|------|--------|----------|
| Implement rate limiting | 4 hours | P2 |
| Error message sanitization | 2 hours | P2 |
| Add audit logging | 4 hours | P2 |
| Data retention policy | 4 hours | P2 |

### Phase 4: Ongoing

| Task | Effort | Priority |
|------|--------|----------|
| Add test coverage | 20+ hours | P3 |
| Performance optimization | 8 hours | P3 |
| Documentation | 4 hours | P3 |

---

## RLS Policy Templates (Appendix A)

### Members Table Policy

```sql
-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admin_full_access" ON members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid() AND m.role = 'admin'
    )
  );

-- Staff can view all members
CREATE POLICY "staff_read_members" ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid() AND m.role IN ('medewerker', 'coordinator', 'coach')
    )
  );

-- Users can view/edit own profile
CREATE POLICY "user_own_profile" ON members
  FOR ALL USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Revoke public access
REVOKE ALL ON members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON members TO authenticated;
```

### Public Tables (age_groups, plan_types, etc.)

```sql
-- Read-only for everyone (anon + authenticated)
ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON age_groups
  FOR SELECT USING (is_active = true);

-- Only admins can modify
CREATE POLICY "admin_write" ON age_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid() AND m.role = 'admin'
    )
  );

REVOKE ALL ON age_groups FROM anon;
GRANT SELECT ON age_groups TO anon;
GRANT ALL ON age_groups TO authenticated;
```

---

## Conclusion

The RCN CRM has a solid foundation but requires **critical security fixes** before production deployment. The most urgent issue is the completely disabled Row Level Security, which exposes all data to anyone with the public API key.

**Recommended Actions:**
1. **STOP** - Do not deploy current code to production
2. **FIX** - Enable RLS and implement policies (Phase 1)
3. **VALIDATE** - Test all access patterns thoroughly
4. **THEN** - Deploy with monitoring enabled

The code quality is good and the architecture is sound. With the security fixes implemented, this will be a robust CRM system.

---

*Report generated by Claude Code automated audit*
