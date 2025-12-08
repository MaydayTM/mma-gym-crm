# Subscription Plans Module - Design Document

**Datum:** 8 december 2025
**Status:** Design Compleet - Klaar voor Implementatie
**Auteur:** Claude Code + Mehdi

---

## 1. Overzicht

Dit document beschrijft het design voor de Subscription Plans module van RCN CRM. De module maakt het mogelijk voor Reconnect Academy om lidmaatschappen te verkopen via hun website (mmagym.be) met een flexibele, white-label ready architectuur.

### Doelstellingen

- Flexibele prijsstructuur met 3 leeftijdscategorieën
- Basic (1 sport) en All-In (alle sporten) opties
- Maand/Kwartaal/Jaar looptijden met staffelkorting
- Gezinskorting ondersteuning
- Guest checkout (minimale friction)
- Payment provider agnostic (Stripe + Mollie)
- White-label ready voor toekomstige clubs

---

## 2. Prijsstructuur 2026

### Leeftijdscategorieën

| Categorie | Leeftijd | Basic (1 sport) | All-In |
|-----------|----------|-----------------|--------|
| **Kids** | Tot 12 jaar | €40/maand | €50/maand |
| **Students** | 12-21 jaar | €50/maand | €65/maand |
| **Adults** | Vanaf 22 jaar | €55/maand | €70/maand |

### Looptijdkortingen

| Looptijd | Korting |
|----------|---------|
| Maandelijks | Geen |
| 3 maanden prepaid | €15 besparing |
| Jaarpas | €120 besparing + gratis verzekering (All-In) |

### Gezinskorting

- 2e gezinslid: -€20/maand
- 3e gezinslid of meer: -€30/maand

### Eenmalige Producten

| Product | Prijs | Geldigheid |
|---------|-------|------------|
| Dagpas | €15 | 1 dag |
| 5-beurtenkaart | €70 | 3 maanden |
| 10-beurtenkaart | €120 | 6 maanden |

### Add-ons

| Add-on | Prijs | Type |
|--------|-------|------|
| Sportverzekering | €26/jaar | Optioneel (verplicht bij wedstrijden) |
| Materiaalhuur | €5 | Eenmalig (bij dagpas) |

### Bonus Programma

- 12 maanden onafgebroken lid: 1 maand gratis
- Bring-a-friend: €20 korting bij inschrijving

---

## 3. Disciplines

Alle disciplines die aangeboden worden:

- MMA
- BJJ (Brazilian Jiu-Jitsu)
- Worstelen
- Nogi Grappling
- Muay Thai
- Olympisch Boksen
- MMA4Kids

Elke discipline heeft twee niveaus:
- **Groep I:** Fundamentals
- **Groep II:** Advanced

> **Note:** Niveau is niet relevant voor abonnementsprijs, alleen voor rooster/lesinschrijving.

---

## 4. Database Schema

### 4.1 Age Groups

```sql
CREATE TABLE age_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(20) UNIQUE NOT NULL,     -- 'kids', 'students', 'adults'
  name VARCHAR(50) NOT NULL,            -- 'Kids', 'Jongeren & Studenten', 'Volwassenen'
  subtitle VARCHAR(100),                -- 'Tot 12 jaar', '12-21 jaar', 'Vanaf 22 jaar'
  min_age INTEGER,                      -- 0, 12, 22
  max_age INTEGER,                      -- 11, 21, NULL
  starting_price DECIMAL(10,2),         -- 40.00 (voor "vanaf €40/maand")
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_age_groups_slug ON age_groups(slug);
CREATE INDEX idx_age_groups_active ON age_groups(is_active);
```

### 4.2 Plan Types

```sql
CREATE TABLE plan_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(20) UNIQUE NOT NULL,     -- 'basic', 'allin'
  name VARCHAR(50) NOT NULL,            -- '1 Sport', 'All-In'
  description TEXT,                     -- 'Kies één discipline naar keuze'
  features JSONB,                       -- ['1 sport naar keuze', '2 lessen/week']
  highlight_text VARCHAR(100),          -- 'BESTE WAARDE' voor All-In
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_plan_types_slug ON plan_types(slug);
```

### 4.3 Pricing Matrix

```sql
CREATE TABLE pricing_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group_id UUID NOT NULL REFERENCES age_groups(id) ON DELETE CASCADE,
  plan_type_id UUID NOT NULL REFERENCES plan_types(id) ON DELETE CASCADE,
  duration_months INTEGER NOT NULL,     -- 1, 3, 12
  price DECIMAL(10,2) NOT NULL,         -- Totaalprijs voor de periode
  price_per_month DECIMAL(10,2),        -- Berekende maandprijs (voor display)
  savings DECIMAL(10,2) DEFAULT 0,      -- Hoeveel korting vs maandelijks
  includes_insurance BOOLEAN DEFAULT false,
  stripe_price_id VARCHAR(255),
  mollie_plan_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(age_group_id, plan_type_id, duration_months)
);

CREATE INDEX idx_pricing_matrix_lookup ON pricing_matrix(age_group_id, plan_type_id, duration_months);
CREATE INDEX idx_pricing_matrix_active ON pricing_matrix(is_active);
```

### 4.4 Plan Add-ons

```sql
CREATE TABLE plan_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,     -- 'insurance', 'equipment-rental'
  name VARCHAR(100) NOT NULL,           -- 'Sportverzekering'
  description TEXT,
  price DECIMAL(10,2) NOT NULL,         -- 26.00
  billing_type VARCHAR(20) NOT NULL,    -- 'yearly', 'once', 'monthly'
  applicable_to JSONB,                  -- ['subscription', 'daypass'] of NULL voor alles
  is_required BOOLEAN DEFAULT false,    -- Verplicht bij wedstrijden
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_plan_addons_slug ON plan_addons(slug);
```

### 4.5 Family Discounts

```sql
CREATE TABLE family_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position INTEGER UNIQUE NOT NULL,     -- 2, 3, 4...
  discount_amount DECIMAL(10,2) NOT NULL, -- 20.00, 30.00
  description VARCHAR(100),             -- '2e gezinslid: -€20/maand'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.6 One-Time Products

```sql
CREATE TABLE one_time_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,     -- 'daypass', '5-sessions', '10-sessions'
  name VARCHAR(100) NOT NULL,           -- 'Dagpas', '5-Beurtenkaart'
  product_type VARCHAR(20) NOT NULL,    -- 'daypass', 'punch_card'
  price DECIMAL(10,2) NOT NULL,
  sessions INTEGER,                     -- NULL voor dagpas, 5 of 10 voor kaarten
  validity_days INTEGER NOT NULL,       -- 1 voor dagpas, 90 of 180 voor kaarten
  description TEXT,
  stripe_price_id VARCHAR(255),
  mollie_payment_id VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_one_time_products_slug ON one_time_products(slug);
CREATE INDEX idx_one_time_products_type ON one_time_products(product_type);
```

### 4.7 Family Groups

```sql
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),                    -- 'Familie Janssens'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,            -- 1 = eerste lid (geen korting), 2 = tweede, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(family_group_id, member_id),
  UNIQUE(member_id) -- Een member kan maar in 1 family zijn
);

CREATE INDEX idx_family_members_family ON family_members(family_group_id);
CREATE INDEX idx_family_members_member ON family_members(member_id);
```

### 4.8 Member Subscriptions

```sql
CREATE TABLE member_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Subscription details
  age_group_id UUID REFERENCES age_groups(id),
  plan_type_id UUID REFERENCES plan_types(id),
  duration_months INTEGER,

  -- Of een beurtenkaart/dagpas
  one_time_product_id UUID REFERENCES one_time_products(id),
  sessions_remaining INTEGER,           -- Voor beurtenkaarten

  -- Pricing snapshot (op moment van aankoop)
  base_price DECIMAL(10,2) NOT NULL,
  family_discount DECIMAL(10,2) DEFAULT 0,
  addon_total DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,

  -- Periode
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'cancelled', 'expired', 'frozen'
  auto_renew BOOLEAN DEFAULT true,
  frozen_until DATE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,

  -- Payment provider
  payment_provider VARCHAR(20),         -- 'stripe', 'mollie'
  external_subscription_id VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_member_subscriptions_member ON member_subscriptions(member_id);
CREATE INDEX idx_member_subscriptions_status ON member_subscriptions(status);
CREATE INDEX idx_member_subscriptions_end_date ON member_subscriptions(end_date);
```

### 4.9 Subscription Add-ons

```sql
CREATE TABLE subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES member_subscriptions(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES plan_addons(id),
  price_paid DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_addons_subscription ON subscription_addons(subscription_id);
```

### 4.10 Checkout Sessions

```sql
CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Wat wordt er gekocht?
  checkout_type VARCHAR(20) NOT NULL,   -- 'subscription', 'punch_card', 'daypass'
  age_group_id UUID REFERENCES age_groups(id),
  plan_type_id UUID REFERENCES plan_types(id),
  duration_months INTEGER,
  one_time_product_id UUID REFERENCES one_time_products(id),

  -- Discipline keuze (voor Basic)
  selected_discipline_id UUID REFERENCES disciplines(id),

  -- Klantgegevens (guest checkout)
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  birth_date DATE,

  -- Opties
  selected_addons JSONB DEFAULT '[]',   -- ['insurance', 'equipment-rental']
  family_group_id UUID REFERENCES family_groups(id),
  family_position INTEGER,
  family_discount DECIMAL(10,2) DEFAULT 0,

  -- Pricing
  subtotal DECIMAL(10,2),
  discount_total DECIMAL(10,2) DEFAULT 0,
  addon_total DECIMAL(10,2) DEFAULT 0,
  final_total DECIMAL(10,2),

  -- Payment
  payment_provider VARCHAR(20),         -- 'stripe', 'mollie'
  external_checkout_id VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'expired'

  -- Resultaat
  created_member_id UUID REFERENCES members(id),
  created_subscription_id UUID REFERENCES member_subscriptions(id),

  -- Marketing tracking
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  referrer_url TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_checkout_sessions_status ON checkout_sessions(payment_status);
CREATE INDEX idx_checkout_sessions_email ON checkout_sessions(email);
CREATE INDEX idx_checkout_sessions_expires ON checkout_sessions(expires_at);
```

---

## 5. URL Structuur

### Public Checkout URLs

```
/checkout/plans                     → Overzicht met 3 leeftijdskaarten
/checkout/plans/kids                → Kids checkout flow
/checkout/plans/students            → Students checkout flow
/checkout/plans/adults              → Adults checkout flow
/checkout/plans/adults/allin        → Direct naar All-In
/checkout/plans/adults/allin/12     → Direct naar jaarpas All-In

/checkout/daypass                   → Dagpas kopen
/checkout/punch-card/5              → 5-beurtenkaart
/checkout/punch-card/10             → 10-beurtenkaart

/checkout/success                   → Bevestigingspagina
/checkout/cancel                    → Geannuleerd/gefaald
```

### Admin URLs (CRM)

```
/subscriptions                      → Overzicht actieve lidmaatschappen
/subscriptions/plans                → Plan & pricing beheer
/subscriptions/families             → Gezinnen beheren
```

---

## 6. Checkout Flow (UX)

```
┌─────────────────────────────────────────────────────────┐
│  STAP 1: Kies je categorie                              │
│  ┌─────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  KIDS   │  │  JONGEREN   │  │ VOLWASSENEN │         │
│  │ Tot 12  │  │   12-21     │  │  Vanaf 22   │         │
│  │vanaf €40│  │ vanaf €50   │  │ vanaf €55   │         │
│  └─────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────┘
                        ↓ klik
┌─────────────────────────────────────────────────────────┐
│  STAP 2: Kies je formule                                │
│  ○ 1 Sport (Basic)     - €55/maand                     │
│  ● All-In (alle sporten) - €70/maand  ← BESTE WAARDE   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STAP 3: Kies je looptijd                               │
│  ○ Maandelijks        €70/maand                        │
│  ○ 3 maanden prepaid  €65/maand  (bespaar €15)         │
│  ● Jaarpas            €60/maand  (bespaar €120)        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STAP 4: Extra opties                                   │
│  ☐ Ik heb een gezinslid dat al traint  → -€20/maand    │
│  ☐ Sportverzekering toevoegen          → +€26/jaar     │
│    (verplicht bij wedstrijden)                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STAP 5: Je gegevens                                    │
│  Voornaam: [____________]                               │
│  Achternaam: [____________]                             │
│  Email: [____________]                                  │
│  Telefoon: [____________]                               │
│  Geboortedatum: [__/__/____]                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  TOTAAL: €720/jaar (€60/maand)                         │
│  Verzekering inbegrepen bij jaarpas All-In ✓           │
│                                                         │
│  [Ga naar betaling →]                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
          Redirect naar Stripe/Mollie
                        ↓
┌─────────────────────────────────────────────────────────┐
│  ✓ Betaling geslaagd!                                  │
│                                                         │
│  Welkom bij Reconnect Academy!                          │
│  Je ontvangt een bevestigingsmail op [email]           │
│                                                         │
│  [Bekijk je profiel →]                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Payment Flow

```
1. Klant kiest plan → checkout_session aangemaakt
2. Klant vult gegevens in → checkout_session updated
3. Klant klikt "Betalen" → redirect naar Stripe/Mollie
4. Betaling succesvol → webhook ontvangen
5. Webhook handler:
   a. Vindt checkout_session via external_checkout_id
   b. Maakt member aan (of vindt bestaande via email)
   c. Maakt member_subscription aan
   d. Koppelt subscription_addons
   e. Update checkout_session (completed_at, created_member_id, etc.)
   f. Stuurt welkomstmail
6. Klant wordt geredirect naar /checkout/success
```

---

## 8. Volgende Stappen

### Phase 5: Worktree Setup
- [ ] Git worktree aanmaken voor feature branch

### Phase 6: Implementation Plan
- [ ] Database migrations schrijven
- [ ] Seed data voor plans, pricing, addons
- [ ] API endpoints voor checkout
- [ ] Public checkout pages
- [ ] Stripe/Mollie integratie
- [ ] Webhook handlers
- [ ] Admin beheer pagina's
- [ ] Email templates

---

## 9. Open Vragen (voor implementatie)

1. **Welke email provider gebruiken?** (voor welkomstmails)
2. **Moet de eerste proefles apart geboekt worden of is dat onderdeel van dagpas?**
3. **Hoe werkt de "Bring-a-friend" tracking technisch?**

---

*Document gegenereerd tijdens brainstorm sessie 8 december 2025*
