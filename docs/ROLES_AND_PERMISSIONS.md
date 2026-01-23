# Rollen & Permissies - Reconnect Academy CRM + Mobile App

> **Laatste update:** 23 januari 2026
> **Status:** Productie + Mobile App Planning

---

## Inhoudsopgave

1. [Rollen Overzicht](#1-rollen-overzicht)
2. [Permissies per Module](#2-permissies-per-module)
3. [Mobile App Rollen](#3-mobile-app-rollen)
4. [Technische Implementatie](#4-technische-implementatie)
5. [Bekende Issues](#5-bekende-issues--aanbevelingen)

---

## 1. Rollen Overzicht

### Hiërarchie

```
┌─────────────────────────────────────────────────────────────┐
│  NIVEAU 1: admin                                             │
│  ─────────────────────────────────────────────────────────   │
│  Volledige toegang tot alles. Systeem configuratie.          │
│  Voorbeeld: Mehdi (Owner)                                    │
├─────────────────────────────────────────────────────────────┤
│  NIVEAU 2: medewerker                                        │
│  ─────────────────────────────────────────────────────────   │
│  Leden beheer, financiën, rapportages. Geen system settings. │
│  Voorbeeld: Balie medewerker, Gym manager                    │
├─────────────────────────────────────────────────────────────┤
│  NIVEAU 3: coordinator                                       │
│  ─────────────────────────────────────────────────────────   │
│  Rooster beheer, groepen, communicatie. Geen leden wijzigen. │
│  Voorbeeld: Event planner, Schedule manager                  │
├─────────────────────────────────────────────────────────────┤
│  NIVEAU 4: coach                                             │
│  ─────────────────────────────────────────────────────────   │
│  Eigen lessen, check-ins, toegewezen leads bekijken.         │
│  Voorbeeld: BJJ instructor, MMA coach                        │
├─────────────────────────────────────────────────────────────┤
│  NIVEAU 5: fighter (default)                                 │
│  ─────────────────────────────────────────────────────────   │
│  Eigen profiel, reserveren, check-in (met actief abo).       │
│  Voorbeeld: Actief lid met abonnement                        │
├─────────────────────────────────────────────────────────────┤
│  NIVEAU 6: fan                                               │
│  ─────────────────────────────────────────────────────────   │
│  Alleen bekijken. Geen gym toegang, geen reserveringen.      │
│  Voorbeeld: Ouder van jeugdlid, supporter                    │
└─────────────────────────────────────────────────────────────┘
```

### Rol Definities

| Rol | Database Value | Default | Beschrijving |
|-----|---------------|---------|--------------|
| Admin | `admin` | Nee | Eigenaar/Head coach met volledige controle |
| Medewerker | `medewerker` | Nee | Backoffice/administratie |
| Coordinator | `coordinator` | Nee | Planning & communicatie |
| Coach | `coach` | Nee | Instructeur/trainer |
| Fighter | `fighter` | **Ja** | Standaard rol voor nieuwe leden |
| Fan | `fan` | Nee | Supporters zonder gym toegang |

---

## 2. Permissies per Module

### Legende
- ✅ Volledige toegang
- 👁️ Alleen lezen
- 🔒 Alleen eigen data
- ❌ Geen toegang

---

### A. Leden Beheer (Members)

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Alle leden bekijken | ✅ | ✅ | 👁️ | 👁️ | ❌ | ❌ |
| Lid details bekijken | ✅ | ✅ | 👁️ | 👁️ | 🔒 | ❌ |
| Nieuw lid aanmaken | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lid wijzigen | ✅ | ✅ | ❌ | ❌ | 🔒 | ❌ |
| Lid verwijderen | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Rol wijzigen | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CSV import | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Profielfoto uploaden | ✅ | ✅ | ❌ | ❌ | 🔒 | ❌ |

---

### B. Abonnementen (Subscriptions)

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Alle abonnementen zien | ✅ | ✅ | 👁️ | 👁️ | ❌ | ❌ |
| Eigen abonnement zien | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Abonnement aanmaken | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Abonnement wijzigen | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Abonnement opzeggen | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### C. Lesrooster (Schedule)

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Rooster bekijken | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ |
| Les aanmaken | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Les wijzigen | ✅ | ✅ | ✅ | 🔒* | ❌ | ❌ |
| Les verwijderen | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Coach toewijzen | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Disciplines beheren | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

*Coach kan alleen eigen lessen wijzigen (bv. afmelden)

---

### D. Reserveringen

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Alle reserveringen zien | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Eigen reservering zien | ✅ | ✅ | ✅ | ✅ | 🔒 | ❌ |
| Reservering aanmaken | ✅ | ✅ | ✅ | ✅ | 🔒* | ❌ |
| Reservering annuleren | ✅ | ✅ | ✅ | ✅ | 🔒 | ❌ |
| Lid inchecken | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

*Fighter kan alleen reserveren met actief abonnement

---

### E. Check-ins

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Alle check-ins zien | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Eigen check-ins zien | ✅ | ✅ | ✅ | ✅ | 🔒 | ❌ |
| Handmatig inchecken | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| QR code check-in | ✅ | ✅ | ✅ | ✅ | 🔒* | ❌ |

*Fighter kan zichzelf inchecken met QR code (vereist actief abo)

---

### F. Leads (Prospects)

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Alle leads zien | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Toegewezen leads zien | ✅ | ✅ | ✅ | 🔒 | ❌ | ❌ |
| Lead aanmaken | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lead wijzigen | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lead converteren | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lead toewijzen | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### G. Financiën (Revenue)

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Omzet rapportages | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Betalingen bekijken | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Refunds verwerken | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Prijzen wijzigen | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### H. Gordels (Belts)

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Alle gordels zien | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ |
| Gordel toekennen | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Promotie registreren | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Historie bekijken | ✅ | ✅ | ✅ | ✅ | 🔒 | ❌ |

---

### I. Team Beheer

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Team pagina zien | ✅ | ✅ | ✅ | 👁️ | ❌ | ❌ |
| Coach toevoegen | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Coach rol wijzigen | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Coach verwijderen | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### J. Rapportages & Analytics

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Dashboard KPIs | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ |
| Retentie rapporten | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Omzet rapporten | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Check-in statistieken | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export naar CSV | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### K. Shop (Premium Module)

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Producten bekijken | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ |
| Product aanmaken | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voorraad beheren | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bestellingen zien | ✅ | ✅ | ❌ | ❌ | 🔒 | ❌ |
| Bestellingen verwerken | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### L. Email Marketing (Premium Module)

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Campagnes bekijken | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Campagne aanmaken | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Templates beheren | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Statistieken zien | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### M. Kitana AI Hub

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| AI Chat gebruiken | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Rapporten genereren | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Leden zoeken via AI | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

### N. Instellingen (Settings)

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Gym instellingen | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modules activeren | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Integraties beheren | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gebruikers beheren | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Eigen profiel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

### O. Deur Toegang (Hardware)

| Actie | Admin | Medewerker | Coordinator | Coach | Fighter | Fan |
|-------|-------|------------|-------------|-------|---------|-----|
| Deur configuratie | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Access logs bekijken | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| QR code genereren | ✅ | ✅ | ✅ | ✅ | 🔒 | ❌ |
| Fysieke toegang | ✅* | ✅* | ✅* | ✅* | 🔒** | ❌ |

*Staff heeft altijd toegang (geen abo nodig)
**Fighter heeft alleen toegang met actief abonnement

---

## 3. Mobile App Rollen

### Fighter App (Member View)

De mobile app voor leden heeft een vereenvoudigd rollenmodel:

| Feature | Fighter (met abo) | Fighter (zonder abo) | Fan |
|---------|-------------------|---------------------|-----|
| QR code voor toegang | ✅ | ❌ | ❌ |
| Reserveren voor les | ✅ | ❌ | ❌ |
| Check-in historie | ✅ | ✅ | ❌ |
| Eigen profiel bewerken | ✅ | ✅ | ✅ |
| Gordel voortgang zien | ✅ | ✅ | 👁️ |
| Abonnement status | ✅ | ✅ | ❌ |
| Lesrooster bekijken | ✅ | ✅ | ✅ |
| Push notificaties | ✅ | ✅ | ✅ |

### Staff App Features (Toekomstig)

| Feature | Admin | Medewerker | Coordinator | Coach |
|---------|-------|------------|-------------|-------|
| Leden inchecken | ✅ | ✅ | ✅ | ✅ |
| Aanwezigheid les | ✅ | ✅ | ✅ | ✅ |
| Gordel toekennen | ✅ | ✅ | ✅ | ✅ |
| Leads bekijken | ✅ | ✅ | ✅ | 🔒 |
| Push naar leden | ✅ | ✅ | ✅ | ❌ |

---

## 4. Technische Implementatie

### Database Constraint

```sql
-- In members tabel
role VARCHAR(50) NOT NULL DEFAULT 'fighter'
  CHECK (role IN ('admin', 'medewerker', 'coordinator', 'coach', 'fighter', 'fan'))
```

### RLS Policy Patroon

```sql
-- Voorbeeld: Staff-only toegang
CREATE POLICY "Staff can manage leads"
  ON leads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator', 'coach')
    )
  );

-- Voorbeeld: Eigen data
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (member_id = auth.uid());
```

### Frontend Route Guards

```tsx
// Sidebar.tsx - Menu items met adminOnly flag
{
  icon: Users,
  label: 'Team',
  path: '/team',
  adminOnly: true, // Alleen zichtbaar voor admin/medewerker
}
```

### Staff Check Helper

```sql
-- Veel gebruikte check
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members
    WHERE id = auth.uid()
    AND role IN ('admin', 'medewerker', 'coordinator', 'coach')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Bekende Issues & Aanbevelingen

### Kritiek (Security)

| # | Issue | Impact | Status |
|---|-------|--------|--------|
| 1 | Members UPDATE policy te breed | User kan zichzelf tot admin promoveren | ⚠️ Open |
| 2 | Shop policies overly permissive | Alle authenticated users kunnen producten beheren | ⚠️ Open |
| 3 | QR tokens plaintext in database | Database breach = tokens compromised | ⚠️ Open |

### Hoog (Functionality)

| # | Issue | Impact | Status |
|---|-------|--------|--------|
| 4 | Module trial expiry niet gecheckt in RLS | Expired trials nog toegankelijk | ⚠️ Open |
| 5 | Activity log toont staff acties aan fighters | Privacy/security concern | ⚠️ Open |
| 6 | Tasks zichtbaar voor alle authenticated users | Mogelijk sensitive info zichtbaar | ⚠️ Open |

### Aanbevelingen voor Fixes

**Issue 1 - Members UPDATE:**
```sql
-- Voorgestelde fix: alleen admin kan roles wijzigen
CREATE POLICY "Only admin can update roles"
  ON members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- Bestaande role niet wijzigen, tenzij admin
    (NEW.role = OLD.role) OR
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
  );
```

**Issue 3 - QR Tokens:**
```sql
-- Voorgestelde fix: hash tokens
ALTER TABLE qr_tokens
  ADD COLUMN token_hash VARCHAR(64),
  DROP COLUMN token;

-- Bij creatie: SHA256 hash opslaan
-- Bij validatie: hash vergelijken
```

---

## Changelog

| Datum | Wijziging |
|-------|-----------|
| 23 jan 2026 | Document aangemaakt |
| 9 jan 2026 | RLS productie enabled (migration 051) |
| 8 dec 2025 | Schedule & Reservations permissions |
| 6 dec 2025 | Belt permissions toegevoegd |
| 1 dec 2025 | Basis auth flow |

---

*Dit document wordt bijgewerkt bij elke wijziging aan het rollenmodel.*
