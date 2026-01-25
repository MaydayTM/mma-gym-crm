# RCN CRM - Lessons Learned & Known Patterns

> **Doel:** Dit document voorkomt dat AI assistants dezelfde fouten herhalen.
> Lees dit document VOOR je complexe wijzigingen maakt.

---

## Database & RLS

### 1. RLS Recursie Probleem (KRITIEK)

**Probleem:** Een RLS policy op tabel X mag NOOIT tabel X zelf queryen.

**Fout voorbeeld:**
```sql
-- FOUT: Dit veroorzaakt infinite recursion op members tabel
CREATE FUNCTION get_my_role() RETURNS TEXT AS $$
  SELECT role FROM members WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql;

CREATE POLICY "Admin access" ON members
  USING (get_my_role() = 'admin');  -- RECURSIE!
```

**Oplossing:**
- Gebruik `USING (true)` voor authenticated users
- Rol-gebaseerde permissies afdwingen in applicatie laag
- Of gebruik `auth.jwt() ->> 'role'` (maar dit vereist custom JWT claims)

**Gerelateerde migraties:** 060_fix_members_rls_recursion.sql

---

### 2. Supabase Edge Functions - Package Versies

**Probleem:** Supabase Edge Functions kunnen crashen met nieuwere versies van `@supabase/supabase-js`.

**Oplossing:** Pin naar versie 2.39.3:
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
```

**Gerelateerde commits:** f7211ce

---

### 3. Database Function Dependencies

**Probleem:** `DROP FUNCTION` faalt als andere objecten (policies) ervan afhangen.

**Oplossing:** Eerst alle afhankelijke policies droppen, DAN de functie:
```sql
-- Eerst policies droppen
DROP POLICY IF EXISTS "Policy using function" ON table_name;
-- Dan functie droppen
DROP FUNCTION IF EXISTS function_name();
```

---

## Module Systeem

### 4. Owner Tenant Bypass

**Probleem:** Trial periodes verlopen en modules verdwijnen uit sidebar.

**Oplossing:** Owner tenant (Reconnect) heeft altijd volledige toegang:
```typescript
const isOwner = TENANT_ID === OWNER_TENANT_ID
if (isOwner) return true  // Bypass alle checks
```

**Gerelateerde bestanden:** src/hooks/useModules.ts

---

### 5. Module Sidebar Visibility

**Probleem:** Modules verdwijnen volledig uit sidebar na trial expiry.

**Gewenst gedrag:**
- Expired trials: Toon in sidebar met "Verlopen" badge, maar disabled
- Owner tenant: Toon ALLE modules altijd

**Gerelateerde bestanden:** src/components/layout/Sidebar.tsx

---

## Claim Account Flow

### 6. Member Lookup voor Claim

**Probleem:** `find_member_for_claim` vindt alleen leden met status 'active' of 'frozen'.

**Checks:**
- Email moet EXACT matchen (case-insensitive)
- Status moet 'active' of 'frozen' zijn
- `auth_user_id` moet NULL zijn (nog niet geclaimd)

**Debug:** Altijd eerst checken in CRM of lid bestaat met juiste status.

---

## Frontend

### 7. Environment Variables

**Probleem:** `.env` keys kunnen leeg zijn na git clone.

**Vereiste variabelen:**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Check:** Nooit hardcoded keys in code, altijd via `import.meta.env`

---

## Deployment

### 8. Edge Functions Deployment

**Probleem:** Nieuwe Edge Functions moeten expliciet deployed worden.

**Commando:**
```bash
npx supabase functions deploy function-name
```

**Check deployed functions:**
```bash
npx supabase functions list
```

---

### 9. Migratie Volgorde

**Probleem:** Migraties met lagere nummers dan reeds toegepaste worden overgeslagen.

**Oplossing:** Gebruik `--include-all` flag:
```bash
npx supabase db push --include-all
```

---

## Testing Checklist

### Voor elke RLS wijziging:
- [ ] Test als authenticated user
- [ ] Test als anon user
- [ ] Check of policies niet recursief zijn
- [ ] Verify met `pg_policies` view

### Voor elke Edge Function:
- [ ] Test CORS preflight (OPTIONS)
- [ ] Test met en zonder auth header
- [ ] Check Resend/externe API keys aanwezig
- [ ] Verify function is deployed

### Voor module wijzigingen:
- [ ] Test als owner tenant
- [ ] Test als niet-owner tenant
- [ ] Test met active subscription
- [ ] Test met expired trial

---

## Architectuur Beslissingen

| Beslissing | Rationale | Datum |
|------------|-----------|-------|
| RLS via `USING(true)` + app-layer checks | Voorkomt recursie, simpeler | Jan 2026 |
| Owner tenant bypass | Reconnect is eigenaar, altijd toegang | Jan 2026 |
| Supabase-js v2.39.3 pinned | Stabiliteit Edge Functions | Jan 2026 |
| Resend voor email | Goede deliverability, NL support | Dec 2025 |
| Mollie voor payments | België/NL focused, iDEAL support | Dec 2025 |

---

---

## Open Issues (volgende sessie)

### RLS Recursie - Members Table (24 jan 2026)

**Status:** Gedeeltelijk gefixed

**Gedaan:**
- `get_my_role()` functie gedropped
- Migration 060 toegepast

**Nog te doen:** Drop deze policies via SQL Editor:
```sql
DROP POLICY IF EXISTS "Staff can update any member" ON members;
DROP POLICY IF EXISTS "Users can read their own member record" ON members;
```

**Reden:** Deze policies bevatten waarschijnlijk subqueries op `members` tabel.

---

*Laatst bijgewerkt: 24 januari 2026*
