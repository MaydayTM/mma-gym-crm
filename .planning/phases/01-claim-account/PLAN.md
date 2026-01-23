# Phase 1: Claim Account Flow

## Goal
Existing members (imported from ClubPlanner) can activate their accounts and set a password to access the new system.

## Prerequisites (All Complete)
- [x] Email infrastructure (Resend + reconnect.academy domain)
- [x] Email template (ClaimAccountEmail.ts)
- [x] Security fixes (migration 056)

## Implementation Plan

### Task 1: Database Migration (account_claim_tokens)

**File:** `supabase/migrations/057_account_claim_tokens.sql`

**Schema:**
```sql
CREATE TABLE account_claim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,              -- SHA256 hash of token
  email TEXT NOT NULL,                   -- Email token was sent to
  expires_at TIMESTAMP NOT NULL,         -- 48 hours from creation
  claimed_at TIMESTAMP,                  -- When account was activated
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_claim_tokens_member ON account_claim_tokens(member_id);
CREATE INDEX idx_claim_tokens_hash ON account_claim_tokens(token_hash);
CREATE INDEX idx_claim_tokens_expires ON account_claim_tokens(expires_at);

-- RLS: Only service role can access
ALTER TABLE account_claim_tokens ENABLE ROW LEVEL SECURITY;
-- No user policies - Edge Functions use service role
```

**Functions needed:**
- `create_claim_token(member_id, email)` - Creates token, returns plaintext (stored as hash)
- `verify_claim_token(token)` - Validates token, returns member data
- `mark_token_claimed(token_hash)` - Marks token as used

### Task 2: Edge Function - send-claim-email

**File:** `supabase/functions/send-claim-email/index.ts`

**Endpoint:** POST `/functions/v1/send-claim-email`

**Request (requires admin/medewerker auth):**
```json
{
  "member_id": "uuid",
  "resend_email": true  // Optional: resend even if token exists
}
```

**Flow:**
1. Verify caller is admin/medewerker
2. Get member data (email, first_name, clubplanner_member_nr)
3. Check member doesn't already have auth_user_id (already claimed)
4. Create or refresh claim token (48h expiry)
5. Generate activation URL: `https://crm.mmagym.be/activate?token=xxx`
6. Send email using ClaimAccountEmail template via Resend API
7. Return success/error

**Response:**
```json
{
  "success": true,
  "email_sent_to": "member@example.com",
  "expires_at": "2026-01-25T20:00:00Z"
}
```

### Task 3: Edge Function - verify-claim-token

**File:** `supabase/functions/verify-claim-token/index.ts`

**Endpoint:** POST `/functions/v1/verify-claim-token`

**Request (no auth required - public):**
```json
{
  "token": "base64-token-from-email"
}
```

**Flow:**
1. Hash the token
2. Find matching record in account_claim_tokens
3. Check not expired
4. Check not already claimed
5. Return member preview data

**Response:**
```json
{
  "valid": true,
  "member": {
    "id": "uuid",
    "first_name": "Mehdi",
    "email": "mehdi@example.com",
    "member_number": 2548
  }
}
```

### Task 4: Edge Function - complete-claim

**File:** `supabase/functions/complete-claim/index.ts`

**Endpoint:** POST `/functions/v1/complete-claim`

**Request (no auth required - public):**
```json
{
  "token": "base64-token-from-email",
  "password": "new-password-from-user"
}
```

**Flow:**
1. Verify token (reuse verify logic)
2. Create Supabase Auth user with member's email
3. Set the password
4. Link auth user to member (update auth_user_id)
5. Mark token as claimed
6. Return success + session token

**Response:**
```json
{
  "success": true,
  "message": "Account geactiveerd!",
  "session": { ... }  // Auto-login
}
```

### Task 5: Frontend - ClaimAccountLink on Login Page

**File:** `src/pages/Login.tsx` (modify)

**Changes:**
- Add link below login form: "Nieuw lid? Activeer je account"
- Link goes to `/claim-account`

### Task 6: Frontend - ClaimAccount Page

**File:** `src/pages/ClaimAccount.tsx` (new)

**Route:** `/claim-account`

**UI Flow:**
1. Input field: "Lidnummer of e-mailadres"
2. Submit button: "Verstuur activatielink"
3. On submit: Call Edge Function to find member and send email
4. Success message: "Check je inbox voor de activatielink"

**Edge Function needed:** `request-claim-email` (public, rate-limited)
- Takes email OR member_number
- Finds matching member
- Sends claim email
- Returns generic "If account exists, email sent" (security)

### Task 7: Frontend - ActivateAccount Page

**File:** `src/pages/ActivateAccount.tsx` (new)

**Route:** `/activate?token=xxx`

**UI Flow:**
1. On load: Extract token from URL, call verify-claim-token
2. If invalid/expired: Show error with link to request new
3. If valid: Show welcome message + password form
   - Display: "Welkom terug, {firstName}!"
   - Display: "Email: {email}"
   - Input: New password (with requirements)
   - Input: Confirm password
   - Button: "Account Activeren"
4. On submit: Call complete-claim
5. On success: Redirect to dashboard (auto-logged in)

### Task 8: CRM - Member Onboarding Management

**File:** `src/pages/Settings.tsx` (add tab) or new `src/pages/Onboarding.tsx`

**Location:** Settings > Automatisering > Onboarding

**Features:**
1. Stats dashboard:
   - Total imported members (no auth_user_id)
   - Pending claim tokens (sent but not claimed)
   - Activated accounts (has auth_user_id)

2. Member list with filters:
   - "Nog niet uitgenodigd"
   - "Uitnodiging verstuurd"
   - "Account geactiveerd"

3. Actions:
   - "Verstuur uitnodiging" (individual)
   - "Verstuur alle uitnodigingen" (bulk)
   - "Stuur herinnering" (for pending > 24h)

4. Activity log:
   - Recent claim emails sent
   - Recent activations

## File Changes Summary

### New Files
- `supabase/migrations/057_account_claim_tokens.sql`
- `supabase/functions/send-claim-email/index.ts`
- `supabase/functions/verify-claim-token/index.ts`
- `supabase/functions/complete-claim/index.ts`
- `supabase/functions/request-claim-email/index.ts`
- `src/pages/ClaimAccount.tsx`
- `src/pages/ActivateAccount.tsx`
- `src/hooks/useClaimAccount.ts`

### Modified Files
- `src/pages/Login.tsx` - Add claim account link
- `src/pages/Settings.tsx` - Add onboarding management tab
- `src/App.tsx` - Add routes for /claim-account and /activate
- `src/pages/index.ts` - Export new pages

## Execution Order

1. **Database first** - Migration 057
2. **Edge Functions** - All 4 functions
3. **Frontend public** - ClaimAccount + ActivateAccount pages
4. **Frontend CRM** - Onboarding management UI
5. **Testing** - End-to-end flow with test member
6. **Deploy** - Push migration + functions + frontend

## Security Considerations

- Tokens are hashed (SHA256) before storage
- Tokens expire after 48 hours
- Rate limiting on public endpoints (request-claim-email)
- Generic responses to prevent email enumeration
- Password requirements enforced (min 8 chars)
- HTTPS only for all endpoints

## Dependencies

- Resend API key (already configured)
- ClaimAccountEmail template (already created)
- reconnect.academy domain verified (already done)
