# RCN CRM Production Readiness Check

Volledige checklist om de app productie-klaar te maken.

## Pre-flight Checklist

### 1. Code Quality
- [ ] `npm run build` - geen errors
- [ ] `npm run lint` - geen errors
- [ ] Geen console.log statements in productie code (behalve errors)
- [ ] Geen commented-out code
- [ ] Geen TODO's die kritiek zijn

### 2. Security (Kritiek!)
- [ ] Geen hardcoded API keys
- [ ] Alle Supabase tabellen hebben RLS
- [ ] Auth is verplicht voor alle protected routes
- [ ] Edge Functions valideren auth tokens
- [ ] Geen sensitive data in error messages
- [ ] CORS correct geconfigureerd

### 3. Error Handling
- [ ] Alle API calls hebben try/catch
- [ ] User-friendly error messages
- [ ] Error boundaries in React
- [ ] Failed states in UI

### 4. Performance
- [ ] Images geoptimaliseerd
- [ ] Code splitting waar mogelijk
- [ ] Geen memory leaks
- [ ] Lazy loading voor zware componenten

### 5. User Experience
- [ ] Loading states overal
- [ ] Empty states overal
- [ ] Form validatie met feedback
- [ ] Mobile responsive

### 6. Data Integrity
- [ ] Database constraints correct
- [ ] Foreign keys intact
- [ ] Seed data correct
- [ ] Migrations up-to-date

### 7. Deployment
- [ ] Environment variables geconfigureerd (Vercel)
- [ ] Supabase secrets geconfigureerd
- [ ] Domain correct
- [ ] SSL actief

### 8. Documentation
- [ ] CLAUDE.md up-to-date
- [ ] API endpoints gedocumenteerd
- [ ] Database schema gedocumenteerd

## Actions
1. Loop door elke sectie
2. Check elk item
3. Fix issues onmiddellijk
4. Document wat niet gefixed kan worden

## Output
Maak `PRODUCTION_READINESS_REPORT.md` met:
- ✅ Items die passen
- ⚠️ Items met warnings
- ❌ Items die gefixed moeten worden
- 📋 Action items voor team

Dit is de finale check. Wees grondig.
