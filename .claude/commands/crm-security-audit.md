# RCN CRM Security Audit

Voer een grondige security audit uit voor de MMA Gym CRM applicatie.

## Focus Gebieden

### 1. Supabase Security
- [ ] Controleer alle RLS policies in `supabase/migrations/`
- [ ] Verify dat alle tabellen RLS enabled hebben
- [ ] Check dat service_role_key NOOIT in frontend code staat
- [ ] Controleer Edge Functions op auth verificatie

### 2. API Keys & Secrets
- [ ] Zoek naar hardcoded keys in alle bestanden: `SUPABASE`, `STRIPE`, `RESEND`, `ANTHROPIC`
- [ ] Verify `.env` staat in `.gitignore`
- [ ] Check dat `import.meta.env` alleen `VITE_` prefixed variabelen gebruikt
- [ ] Scan voor exposed credentials in git history

### 3. Authentication
- [ ] Verify alle protected routes in `App.tsx`
- [ ] Check `useAuth` hook voor security
- [ ] Controleer password reset flow
- [ ] Verify admin-only functies zijn beschermd

### 4. Data Exposure
- [ ] Check member data queries - geen sensitive data lekken
- [ ] Verify payment info is masked
- [ ] Check error messages voor info leakage
- [ ] Review API responses

### 5. Frontend Security
- [ ] Check voor XSS in user inputs (search, forms)
- [ ] Verify dangerouslySetInnerHTML usage (mag niet met user input)
- [ ] Check external links hebben `rel="noopener noreferrer"`

### 6. Edge Functions
- [ ] Controleer auth headers in alle functions
- [ ] Verify input validation
- [ ] Check voor injection vulnerabilities

## Output
Maak een `SECURITY_AUDIT_REPORT.md` in de root met:
- Samenvatting
- Kritieke issues (fix onmiddellijk)
- Aanbevelingen
- Wat is goed

Start nu met de audit. Stop niet tot alles gecontroleerd is.
