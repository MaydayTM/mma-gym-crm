# RCN CRM Security Audit Report

**Datum:** 9 januari 2026
**Status:** RLS GEFIXED - Klaar voor productie testen

---

## Executive Summary

| Categorie | Status | Actie |
|-----------|--------|-------|
| RLS Policies | **GEFIXED** | Migration 051 toegepast |
| API Keys | OK | Geen hardcoded secrets |
| Authentication | OK | Correct geimplementeerd |
| Edge Functions | OK | Auth verificatie aanwezig |
| Frontend Security | OK | XSS bescherming, safe links |
| Data Exposure | MEDIUM | Payment keys in DB |

---

## UITGEVOERDE FIXES

### RLS Enabled op Alle Tabellen (Migration 051)

**Datum:** 9 januari 2026
**Migration:** `051_enable_rls_production.sql`

De volgende tabellen hebben nu RLS met role-based policies:

| Tabel | RLS | Wie mag lezen | Wie mag schrijven |
|-------|-----|---------------|-------------------|
| `subscriptions` | ENABLED | Authenticated | Authenticated |
| `checkins` | ENABLED | Authenticated | Authenticated |
| `leads` | ENABLED | Staff only | Staff only |
| `revenue` | ENABLED | Admin/Medewerker | Admin/Medewerker |
| `tasks` | ENABLED | Authenticated | Authenticated |
| `activity_log` | ENABLED | Staff | System only |
| `disciplines` | ENABLED | Anon + Auth | Staff |
| `classes` | ENABLED | Anon (active) + Auth | Staff |
| `class_instances` | ENABLED | Authenticated | Staff |
| `reservations` | ENABLED | Authenticated | Own + Staff |
| `member_belts` | ENABLED | Anon + Auth | Staff |
| `belt_history` | ENABLED | Authenticated | Staff |
| `class_tracks` | ENABLED | Authenticated | Staff |
| `rooms` | ENABLED | Authenticated | Staff |
| `doors` | ENABLED | Admin only | Service role |
| `door_access_logs` | ENABLED | Admin/Medewerker | Service role |
| `modules` | ENABLED | Anon + Auth | Admin |
| `tenant_module_subscriptions` | ENABLED | Authenticated | Admin |
| `discounts` | ENABLED | Authenticated | Admin/Medewerker |
| `discount_codes` | ENABLED | Active only | Staff |

**Anon access verwijderd van:**
- `subscriptions`, `checkins`, `revenue`, `tasks`
- `leads`, `activity_log`, `integrations`
- `class_instances`, `reservations`, `belt_history`
- `class_tracks`, `rooms`, `doors`, `door_access_logs`
- `tenant_module_subscriptions`

---

## WAT IS GOED

### Edge Functions Security

| Function | Auth Check | Rol Check |
|----------|------------|-----------|
| `ai-assistant` | JWT token | Staff role check |
| `admin-set-password` | JWT token | Coordinator+ only |
| `door-token` | Service role | Member + subscription |
| `door-validate` | JWT verify | Token + subscription |
| `create-mollie-payment` | None (public) | Session validation |

### API Keys & Secrets

- Geen hardcoded API keys in broncode
- Alle keys via `import.meta.env.VITE_*`
- `.env` staat in `.gitignore`
- Service role key alleen in Edge Functions

### Frontend Security

| Check | Status |
|-------|--------|
| XSS Prevention | OK - Geen unsanitized user input |
| External Links | OK - Alle hebben `noopener noreferrer` |
| CSRF | OK - Supabase token handling |
| Protected Routes | OK - ProtectedRoute component |

---

## RESTERENDE AANBEVELINGEN

### 1. Payment API Keys in Database (MEDIUM)

**Locatie:** `tenant_payment_configs` tabel

Secret keys worden nog opgeslagen in database. Nu met RLS zijn ze alleen zichtbaar voor authenticated users, maar beter is:
- Verplaats naar Supabase Edge Function secrets
- Of: Encryptie toevoegen voor opslag

### 2. CORS Headers (LAAG)

Edge Functions gebruiken `'Access-Control-Allow-Origin': '*'`.

Voor extra security:
```typescript
'Access-Control-Allow-Origin': 'https://crm.mmagym.be'
```

### 3. Console Logging (LAAG)

Debug logs in production code:
- `AuthContext.tsx` - Auth events
- `supabase.ts` - Connection status

---

## VOLGENDE STAPPEN

### Prioriteit 1: Functionele Test (VANDAAG)
1. Test alle CRM flows met normale user login
2. Verificatie dat staff roles correct werken
3. Check dat anon geen toegang heeft tot gevoelige data

### Prioriteit 2: Build & Deploy
```bash
npm run build          # Controleer geen errors
vercel --prod          # Deploy naar productie
```

### Prioriteit 3: Production Monitoring
- Monitor Supabase logs voor RLS denied errors
- Check dat alle Edge Functions nog werken

---

## Verificatie Query

Run deze query in Supabase SQL Editor om RLS status te controleren:

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Alle tabellen moeten `rowsecurity = true` hebben.

---

## Conclusie

**Status: KLAAR VOOR PRODUCTIE TESTEN**

De kritieke RLS issues zijn opgelost met migration 051. Alle gevoelige tabellen hebben nu:
- RLS enabled
- Role-based access policies
- Anon access verwijderd waar nodig

Test de applicatie grondig voordat je live gaat.

---

*Rapport bijgewerkt na RLS fix - 9 januari 2026*
