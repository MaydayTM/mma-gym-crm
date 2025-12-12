# Subscriptions Admin Interface - Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Datum:** 12 december 2025
**Status:** Design Compleet - Klaar voor Implementatie
**Auteur:** Claude Code + Mehdi

---

## 1. Overzicht

Dit document beschrijft het design voor de admin interface van het lidmaatschappen-systeem. De huidige checkout wizard is klant-facing; dit design voegt de admin-kant toe voor volledige controle over services, kortingen en lidmaatschap-toewijzing.

### Twee Gescheiden Interfaces

| Interface | Doel | Gebruiker |
|-----------|------|-----------|
| **Admin CRM** (`/subscriptions/*`) | Services beheren, lidmaatschappen toewijzen, prijzen aanpassen | Gym eigenaar/admin |
| **Checkout Wizard** (`checkout.gymname.be`) | Self-service inschrijving met Mollie betaling | Klant/prospect |

### Kernprincipes

- **Admin volledig vrij** - Volledige flexibiliteit in configuratie
- **Klant ziet alleen keuzes** - Checkout toont wat admin heeft klaargezet
- **Services, geen producten** - We verkopen diensten, geen fysieke producten
- **Multi-gym ready** - Structuur moet werken voor andere gyms

---

## 2. Service Structuur

### Drie Service-categorieën

| Type | Doel | Doelgroep | Voorbeelden |
|------|------|-----------|-------------|
| **Abonnementen** | Recurring toegang | Leden | 1 maand, 3 maanden, 1 jaar |
| **Beurtenkaarten** | X aantal beurten | Leden | 5-beurtenkaart, 10-beurtenkaart |
| **Dagpassen** | Eenmalige toegang (lead magnet) | Prospects | Proefles, dagpas |

### Belangrijk Onderscheid

- **Kortingen** zijn alleen voor abonnementen (student, gezin, junior)
- **Dagpas** = lead magnet voor prospects, niet voor bestaande leden
- **Add-ons** kunnen per service-type (materiaalhuur alleen bij dagpas)

### Per Service Configureerbaar (Admin Volledig Vrij)

- Naam, beschrijving, prijs
- Duur (dagen/maanden) of aantal beurten
- Welke disciplines toegang geven
- Welke kortingen beschikbaar (alleen abonnementen)
- Zichtbaar op checkout wizard ja/nee
- Toegang hardware ja/nee

---

## 3. Kortingen Systeem

### Korting Definitie

| Veld | Beschrijving |
|------|--------------|
| Naam | Studentenkorting, Gezinskorting, etc. |
| Bedrag | Vast bedrag (€240/jaar) |
| Percentage | Alternatief of aanvulling (20%) |
| Exclusief | Kan niet gestapeld worden met andere kortingen |
| Webshop | Zichtbaar op checkout wizard |

### Koppeling aan Services

- Per abonnement-service selecteert admin welke kortingen beschikbaar zijn
- Per korting kan admin het bedrag overschrijven voor die specifieke service
- Voorbeeld: Studentenkorting = standaard €20/maand, maar bij jaarpas = €240 vast

### Later Toevoegen

- **Couponcodes** - Codes die klant invoert (ZOMER2025, VRIEND20)
- **Cadeaubonnen** - Vooraf betaald tegoed

---

## 4. Pagina Structuur

### Navigatie

```
/subscriptions                    → Overzicht actieve lidmaatschappen van leden
/subscriptions/manage             → Tabbed beheer interface
/subscriptions/manage?tab=services    → Services beheren
/subscriptions/manage?tab=discounts   → Kortingen beheren
/subscriptions/manage?tab=groups      → Leeftijdsgroepen beheren
/members/:id                      → Lidmaatschap toewijzen vanuit lid-profiel
```

### /subscriptions (Hoofdpagina)

Bestaande pagina met actieve lidmaatschappen. Toevoegen:
- Link naar `/subscriptions/manage` voor beheer
- Optionele shortcut: "Wijs toe aan lid"

### /subscriptions/manage (Beheer Interface)

**Tab 1: Services**

| Kolom | Voorbeeld |
|-------|-----------|
| Naam | "1 jaar All-In" |
| Type | Abonnement / Beurtenkaart / Dagpas |
| Duur | 12 maanden |
| Prijs | €720 |
| Webshop | ✓ (zichtbaar op checkout) |
| Actief | ✓ |
| Acties | Bewerk / Dupliceer / Verwijder |

Filters: Alle | Abonnementen | Beurtenkaarten | Dagpassen

**Tab 2: Kortingen**

| Kolom | Voorbeeld |
|-------|-----------|
| Naam | "Studentenkorting" |
| Bedrag | €240/jaar |
| Exclusief | ✓ |
| Webshop | ✓ |
| Acties | Bewerk / Verwijder |

**Tab 3: Groepen**

| Kolom | Voorbeeld |
|-------|-----------|
| Naam | "Volwassenen" |
| Leeftijd | 22+ jaar |
| Startprijs | vanaf €55/maand |
| Actief | ✓ |
| Acties | Bewerk / Verwijder |

---

## 5. Service Detail Scherm

Wanneer je een service aanklikt/bewerkt, tabbed interface:

### Tab: Gegevens

| Veld | Type |
|------|------|
| Naam | Text |
| Slug | Text (URL-vriendelijk) |
| Omschrijving | Textarea |
| Type | Select: Abonnement / Beurtenkaart / Dagpas |
| Duur | Number + unit (maanden/dagen/beurten) |
| Prijs | Currency |
| Prijs per maand | Berekend (readonly) |
| Besparing | Currency (optioneel) |
| Inclusief verzekering | Toggle |
| Actief | Toggle |

### Tab: Disciplines

- Checklist van alle disciplines
- "Alle disciplines" toggle voor All-In services

### Tab: Kortingen (alleen bij abonnementen)

- Lijst van beschikbare kortingen
- Per korting: aan/uit toggle
- Override bedrag indien afwijkend

### Tab: Toegang

- Geeft toegang tot gym: ja/nee toggle
- (Later: koppeling aan specifieke hardware/deuren)

### Tab: Webshop

| Veld | Type |
|------|------|
| Tonen op checkout | Toggle |
| Highlight tekst | Text (bijv. "BESTE WAARDE") |
| Sorteervolgorde | Number |

---

## 6. Admin Lidmaatschap Toewijzen

### Flow vanuit /members/:id

1. Klik "Lidmaatschap toevoegen"
2. **Stap 1:** Selecteer service (dropdown met zoeken)
3. **Stap 2:** Configureer details:
   - Startdatum (default: vandaag)
   - Einddatum (auto-berekend, aanpasbaar)
   - Prijs (default: service-prijs, overschrijfbaar)
   - Korting selecteren (indien beschikbaar voor deze service)
   - Discipline kiezen (bij 1-sport services)
4. **Stap 3:** Betaling registreren:
   - Methode: Contant / Overschrijving / Bancontact / Mollie link / Gratis / Domiciliëring
   - Status: Betaald / Openstaand / Gedeeltelijk
   - Bedrag ontvangen
5. **Stap 4:** Bevestigen → Lidmaatschap actief

**Belangrijk:** Admin registreert alleen betaalmethode, Mollie wordt NIET getriggerd. Mollie is alleen voor checkout wizard (klant self-service).

### Acties op Bestaand Lidmaatschap

| Actie | Beschrijving |
|-------|--------------|
| Verlengen | Einddatum aanpassen |
| Pauzeren | Freeze met datum |
| Opzeggen | Met reden |
| Upgraden/downgraden | Naar andere service |
| Prijs aanpassen | Voor dit specifieke lidmaatschap |
| Disciplines wijzigen | Bij 1-sport services |
| Korting toevoegen/verwijderen | |
| Notitie toevoegen | |

---

## 7. Checkout Wizard (Klant-facing)

### Dagpas Flow (Leads)

1. Kies dagpas
2. Vul gegevens in:
   - Naam, email, telefoon, geboortedatum
   - Adres (straat, postcode, stad)
3. Extra vraag: Materiaal huren? (+€5)
4. Betaal via Mollie
5. → Persoon komt in systeem als **lead met dagpas**

### Abonnement Flow (Leden)

1. Kies leeftijdsgroep
2. Kies service (abonnement)
3. Kies discipline (indien van toepassing)
4. Selecteer kortingen (indien beschikbaar)
5. Vul gegevens in (incl. adres)
6. Betaal via Mollie
7. → Automatisch lid + lidmaatschap aangemaakt

### Verschil Dagpas vs Abonnement

| | Dagpas koper | Abonnement koper |
|---|---|---|
| Account | ✓ | ✓ |
| Status | Lead | Lid (fighter) |
| In leden-lijst | Nee | Ja |
| In leads-lijst | Ja | Nee |
| Toegang | Eenmalig | Volgens abonnement |

### Custom Domein (Later)

- `checkout.mmagym.be` voor Reconnect
- Elke gym krijgt eigen subdomein
- Goed voor SEO/backlinks

---

## 8. Database Wijzigingen

### Nieuwe Tabellen

```sql
-- Services (vervangt plan_types, pricing_matrix, one_time_products)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Type
  type VARCHAR(20) NOT NULL, -- 'subscription', 'punch_card', 'day_pass'

  -- Duur/beurten
  duration_months INTEGER,
  duration_days INTEGER,
  sessions INTEGER,

  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  price_per_month DECIMAL(10,2),
  savings DECIMAL(10,2) DEFAULT 0,
  includes_insurance BOOLEAN DEFAULT false,

  -- Toegang
  gives_access BOOLEAN DEFAULT true,

  -- Webshop
  show_on_checkout BOOLEAN DEFAULT true,
  highlight_text VARCHAR(100),
  sort_order INTEGER DEFAULT 0,

  -- Koppeling
  age_group_id UUID REFERENCES age_groups(id),

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service-Discipline koppeling
CREATE TABLE service_disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(service_id, discipline_id)
);

-- Kortingen
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Korting waarde (een of beide)
  amount DECIMAL(10,2),
  percentage DECIMAL(5,2),

  -- Regels
  is_exclusive BOOLEAN DEFAULT false,

  -- Webshop
  show_on_checkout BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service-Korting koppeling
CREATE TABLE service_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,

  -- Override voor deze specifieke service
  override_amount DECIMAL(10,2),
  override_percentage DECIMAL(5,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(service_id, discount_id)
);
```

### Bestaande Tabellen

| Tabel | Actie |
|-------|-------|
| `age_groups` | Behouden (groepen tab) |
| `member_subscriptions` | Behouden, `service_id` toevoegen |
| `plan_addons` | Behouden (verzekering, materiaalhuur) |
| `disciplines` | Behouden |

### Migratie (data overzetten)

| Van | Naar |
|----|------|
| `plan_types` + `pricing_matrix` | `services` |
| `one_time_products` | `services` |
| `family_discounts` | `discounts` |

---

## 9. Later Toevoegen

Deze features zijn niet in de eerste versie:

- [ ] Couponcodes (ZOMER2025, VRIEND20)
- [ ] Cadeaubonnen (vooraf betaald tegoed)
- [ ] Custom domein setup per gym (checkout.gymname.be)
- [ ] Hardware toegangscontrole koppeling
- [ ] Domiciliëring (automatische incasso)
- [ ] Openingsuren per gym (hardware settings)

---

## 10. Implementatie Volgorde

### Fase 1: Database

1. Nieuwe tabellen aanmaken
2. Data migreren van oude tabellen
3. `member_subscriptions` uitbreiden met `service_id`

### Fase 2: Admin Beheer Interface

1. `/subscriptions/manage` pagina met tabs
2. Services CRUD
3. Kortingen CRUD
4. Groepen CRUD (al bestaand, verplaatsen)

### Fase 3: Service Detail Scherm

1. Tabbed interface voor service bewerken
2. Disciplines koppeling
3. Kortingen koppeling
4. Webshop instellingen

### Fase 4: Lidmaatschap Toewijzen

1. Modal/form in `/members/:id`
2. Service selectie
3. Prijs/korting configuratie
4. Betaling registratie

### Fase 5: Checkout Wizard Aanpassen

1. Nieuwe `services` tabel gebruiken
2. Kortingen via nieuwe structuur
3. Dagpas flow met adres + materiaalhuur

---

*Document gegenereerd tijdens brainstorm sessie 12 december 2025*
