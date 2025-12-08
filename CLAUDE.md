# RCN CRM - Project Context voor Claude Code

## 🎯 PROJECT OVERZICHT

**Naam:** RCN CRM (Reconnect Academy CRM)
**Doel:** ClubPlanner vervangen met eigen CRM voor martial arts gym
**Status:** MVP Development - Fase 1: Functionele Shell

### Business Context
- **Bedrijf:** Reconnect Academy - MMA/BJJ gym in Aalst, België
- **Huidige software:** ClubPlanner (€135/maand, contract loopt nog ~9 maanden)
- **Bestaande data:** 200 leden om te migreren via CSV import
- **Eigenaar:** Mehdi - BJJ zwarte band, head coach, tech entrepreneur

### Waarom eigen CRM?
ClubPlanner is technisch verouderd (ASP.NET 2017-2019 stack):
- Trage performance door client-side geocoding
- Geen echte REST API (HTML snippets met embedded JSON)
- Oude jQuery frontend, geen moderne frameworks
- Dure hosting, moeilijk te integreren

---

## 🏗️ TECHNISCHE ARCHITECTUUR

### Stack Beslissingen (DEFINITIEF)
```
Frontend:     Vite + React 18 + TypeScript
Styling:      Tailwind CSS (design-agnostic in fase 1)
State:        React Query (TanStack Query) voor server state
Backend:      Supabase (PostgreSQL + Edge Functions + Auth)
Payments:     Stripe (bestaande integratie)
Hosting:      Vercel
Types:        Auto-generated via `supabase gen types typescript`
```

### Mappenstructuur
```
rcn-crm/
├── CLAUDE.md                    # Dit bestand - ALTIJD LEZEN
├── DESIGN_TOKENS.md             # Fase 2: Design specificaties
├── src/
│   ├── components/
│   │   ├── ui/                  # Basis componenten (Button, Input, Card)
│   │   ├── dashboard/           # Dashboard widgets
│   │   ├── members/             # Leden beheer
│   │   ├── leads/               # Lead pipeline
│   │   └── layout/              # Navigation, Sidebar
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Members.tsx
│   │   ├── MemberDetail.tsx
│   │   ├── Leads.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useMembers.ts
│   │   ├── useLeads.ts
│   │   ├── useAuth.ts
│   │   └── useSubscriptions.ts
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   └── utils.ts             # Helper functions
│   └── types/
│       └── database.types.ts    # AUTO-GENERATED - NIET HANDMATIG WIJZIGEN
├── supabase/
│   ├── migrations/              # Database schema versies
│   └── functions/               # Edge Functions
└── tailwind.config.js
```

---

## 📊 DATABASE SCHEMA

### Kernentiteiten

#### 1. Members (Leden)
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basis info
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  
  -- Adres (voor kaart visualisatie)
  street VARCHAR(255),
  city VARCHAR(255),
  zip_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Belgium',
  latitude DECIMAL(10, 8),      -- Pre-calculated voor snelle kaart
  longitude DECIMAL(11, 8),
  
  -- Persoonlijke info
  birth_date DATE,
  gender VARCHAR(20),           -- 'man', 'vrouw', 'anders', 'onbekend'
  profile_picture_url TEXT,
  
  -- Gym specifiek
  role VARCHAR(50) NOT NULL DEFAULT 'fighter',  -- 'admin', 'medewerker', 'coordinator', 'coach', 'fighter', 'fan'
  disciplines TEXT[],           -- ['bjj', 'mma', 'kickboxing']
  
  -- Gordel tracking (BJJ/Judo/Karate)
  belt_color VARCHAR(50),       -- 'white', 'blue', 'purple', 'brown', 'black'
  belt_stripes INTEGER DEFAULT 0,
  belt_updated_at TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'frozen', 'cancelled', 'lead'
  insurance_active BOOLEAN DEFAULT false,
  insurance_expires_at DATE,
  
  -- Toegangscontrole
  access_enabled BOOLEAN DEFAULT false,
  access_card_id VARCHAR(100),
  last_checkin_at TIMESTAMP,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Stripe koppeling
  stripe_customer_id VARCHAR(255)
);

-- Index voor snelle zoekacties
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_role ON members(role);
CREATE INDEX idx_members_last_checkin ON members(last_checkin_at);
```

#### 2. Subscriptions (Abonnementen)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  
  -- Abonnement details
  name VARCHAR(255) NOT NULL,           -- '1 Maand BJJ', '1 Jaar Unlimited'
  type VARCHAR(50) NOT NULL,            -- 'subscription', 'punch_card', 'trial'
  
  -- Periode
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Financieel
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  billing_interval VARCHAR(20),          -- 'monthly', 'quarterly', 'yearly'
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',   -- 'active', 'cancelled', 'expired', 'frozen'
  cancelled_at TIMESTAMP,
  frozen_until DATE,
  
  -- Stripe
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_member ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### 3. Check-ins (Bezoeken)
```sql
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  
  checkin_at TIMESTAMP NOT NULL DEFAULT NOW(),
  checkout_at TIMESTAMP,
  
  -- Context
  method VARCHAR(50),            -- 'qr_code', 'card', 'manual'
  location VARCHAR(100),         -- 'main_entrance', 'side_door'
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checkins_member ON checkins(member_id);
CREATE INDEX idx_checkins_date ON checkins(checkin_at);
```

#### 4. Leads (Potentiële leden)
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact info
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Lead tracking
  source VARCHAR(100),           -- 'facebook', 'instagram', 'website', 'walk_in', 'referral'
  status VARCHAR(50) DEFAULT 'new',  -- 'new', 'contacted', 'trial_scheduled', 'trial_done', 'converted', 'lost'
  
  -- Pipeline
  assigned_to UUID REFERENCES members(id),  -- Coach die follow-up doet
  trial_date TIMESTAMP,
  
  -- Interest
  interested_in TEXT[],          -- ['bjj', 'mma', 'kids_class']
  notes TEXT,
  
  -- Conversie
  converted_member_id UUID REFERENCES members(id),
  converted_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
```

#### 5. Revenue (Omzet tracking)
```sql
CREATE TABLE revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  subscription_id UUID REFERENCES subscriptions(id),
  
  -- Transactie
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  category VARCHAR(100) NOT NULL,    -- 'subscription', 'bar', 'merchandise', 'pt_session', 'insurance'
  description TEXT,
  
  -- Stripe
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  
  -- Timing
  paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
  period_start DATE,
  period_end DATE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revenue_member ON revenue(member_id);
CREATE INDEX idx_revenue_category ON revenue(category);
CREATE INDEX idx_revenue_paid_at ON revenue(paid_at);
```

---

## 👤 ROLLEN & PERMISSIES

### Rollen Hiërarchie
```
admin         → Volledige toegang, kan alles
medewerker    → Leden beheer, check-ins, geen financiën
coordinator   → Rooster, groepen, communicatie
coach         → Eigen lessen zien, aanwezigheid
fighter       → Eigen profiel, check-in (met actief abo)
fan           → Alleen bekijken, geen gym toegang
```

### RLS (Row Level Security) Regels
```sql
-- Admin ziet alles
CREATE POLICY "admin_all_access" ON members
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Fighters zien alleen eigen data
CREATE POLICY "fighter_own_data" ON members
  FOR SELECT USING (
    auth.uid() = id OR
    auth.jwt() ->> 'role' IN ('admin', 'medewerker', 'coordinator', 'coach')
  );

-- Toegangscontrole regel
-- Medewerkers krijgen ALTIJD toegang (geen abo nodig)
-- Fighters alleen met actief abonnement
```

---

## 📈 MVP FEATURES (FASE 1)

### Must Have - ALLE AFGEROND
- [x] Dashboard met KPI cards (nieuwe leden, opzeggingen, actieve leden)
- [x] Members tabel met zoeken/filteren
- [x] Member detail pagina met abonnementen en check-in historie
- [x] Simpele Lead pipeline (Kanban board met drag & drop)
- [x] CSV import voor 200 bestaande leden
- [x] Basis authenticatie (email/wachtwoord)

### Should Have
- [ ] Retentie score berekening
- [x] Check-in logging (handmatig)
- [x] Lead → Member conversie
- [x] Gordel tracking (multi-discipline met promotie historie)
- [x] Lesrooster beheer (Schedule pagina)
- [ ] Basis rapportages

### Nice to Have (later)
- [ ] Stripe integratie
- [ ] Fysieke toegangscontrole (ESP32)
- [ ] Kaart visualisatie leden
- [ ] Mobile app (PWA)
- [ ] Fighter Profile Generator integratie

---

## 🗓️ AFGEROND SESSIE 1 december 2025

### Authenticatie (DONE)
- [x] Supabase Auth configureren (email/wachtwoord)
- [x] Login pagina bouwen (met Reconnect brand styling)
- [x] Auth context/provider maken
- [x] Protected routes implementeren
- [x] Logout functionaliteit in sidebar
- [x] Landing page knoppen gekoppeld aan login

### Features (DONE)
- [x] Profile picture uploads (RLS policies waren al actief)
- [x] Lead → Member conversie functie
- [x] Check-in logging (handmatig via member detail)

---

## 🗓️ AFGEROND SESSIE 6 december 2025

### Database Uitbreiding (DONE)
- [x] disciplines tabel met seed data (BJJ, Judo, Karate, etc.)
- [x] classes tabel voor lesrooster
- [x] reservations tabel voor inschrijvingen
- [x] member_belts tabel (gordel per discipline)
- [x] belt_history tabel (promotie historie met trainingscount)
- [x] Training count SQL functies (get_training_count, get_trainings_since_promotion)

### Hooks (DONE)
- [x] useDisciplines hook
- [x] useClasses hook (CRUD)
- [x] useReservations hook (CRUD + check-in)
- [x] useMemberBelts hook (met promotie functie)
- [x] useMembers uitgebreid met role/status filter

### Components (DONE)
- [x] BeltProgressCard - gordel overzicht per discipline
- [x] BeltPromotionModal - nieuwe promotie registreren
- [x] AddBeltModal - gordel toevoegen voor discipline
- [x] Schedule pagina - weekrooster met class management

### Integratie (DONE)
- [x] BeltProgressCard toegevoegd aan MemberDetail pagina

---

## 🗓️ AFGEROND SESSIE 8 december 2025

### Schedule Uitbreiden (DONE)
- [x] Edit Class Modal - Lessen bewerken/verwijderen via klik op rooster
- [x] Recurring Classes - Wekelijks herhalen tot einddatum (bulk create)
- [x] Team pagina - coaches toevoegen en toewijzen aan lessen

### Reservaties & Check-in (DONE)
- [x] Reservaties pagina - leden kunnen inschrijven voor lessen (weekoverzicht)
- [x] Check-in validatie scherm (handmatig, QR placeholder)
- [x] CSV import uitgebreid met legacy_checkin_count

### Polish & Testen (DONE)
- [x] Retentie score berekening (dashboard widget + useRetentionStats hook)
- [x] Basis rapportages (Reports pagina met stats en grafieken)

---

## 🗓️ PLAN VOLGENDE SESSIE

### Prioriteit 1: Nice to have
1. Fighter Profile Generator koppelen (externe repo - wacht op integratie)
2. Stripe integratie voorbereiden

### Prioriteit 2: Uitbreiding
1. QR scanner voor check-in (camera integratie)
2. Push notifications voor retentie alerts
3. Export functies voor rapportages

> **Implementatie plan:** Zie `docs/plans/2025-12-06-training-tracking-implementation.md` voor details

---

## 🚧 BLOKKERENDE TODO'S

### Fighter Profile Generator koppelen
- Knop staat klaar in EditMemberForm (disabled)
- Wacht op externe app integratie (andere repo)

---

## 🎨 DESIGN RICHTLIJNEN (FASE 1)

### Belangrijk: Design-Agnostic Bouwen
In fase 1 bouwen we **functionele shells** zonder specifieke design keuzes.

**WEL doen:**
```tsx
// Semantic Tailwind classes
<div className="bg-white rounded-lg shadow p-4">
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
```

**NIET doen:**
```tsx
// Hardcoded kleuren die later moeilijk te wijzigen zijn
<div style={{ backgroundColor: '#1a1a2e' }}>
<button className="bg-[#e94560]">
```

### Component Structuur
Elk component heeft:
1. **Props interface** - TypeScript types
2. **Loading state** - Skeleton of spinner
3. **Error state** - Foutmelding
4. **Empty state** - Geen data beschikbaar

```tsx
// Voorbeeld structuur
interface MembersTableProps {
  filters?: MemberFilters;
  onSelect?: (member: Member) => void;
}

export function MembersTable({ filters, onSelect }: MembersTableProps) {
  const { data, isLoading, error } = useMembers(filters);
  
  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.length) return <EmptyState message="Geen leden gevonden" />;
  
  return (
    <table>
      {/* Functionele implementatie */}
    </table>
  );
}
```

---

## 🔧 DEVELOPMENT COMMANDS

```bash
# Project setup
npm create vite@latest rcn-crm -- --template react-ts
cd rcn-crm
npm install

# Dependencies
npm install @supabase/supabase-js @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Supabase setup
npx supabase init
npx supabase link --project-ref wiuzjpoizxeycrshsuqn
npx supabase db push              # Push migrations
npx supabase gen types typescript --linked > src/types/database.types.ts

# Development
npm run dev                       # Start dev server
npx supabase functions serve      # Local Edge Functions

# Deployment
npm run build
vercel --prod
```

---

## ⚠️ BELANGRIJKE REGELS VOOR AI

### ALTIJD doen:
1. **Lees dit bestand eerst** bij elke sessie
2. **Gebruik TypeScript** - geen `any` types
3. **Genereer database types** na schema wijzigingen
4. **Schrijf RLS policies** voor elke tabel
5. **Test lokaal** voor deployment

### NOOIT doen:
1. **Geen `SERVICE_ROLE_KEY` in frontend** - alleen in Edge Functions
2. **Geen hardcoded kleuren** - gebruik Tailwind semantic classes
3. **Geen mock data** - gebruik Supabase direct
4. **Geen inline styles** - alleen Tailwind classes
5. **Wijzig NOOIT `database.types.ts` handmatig** - dit is auto-generated

### Bij twijfel:
- Vraag Mehdi voor verduidelijking
- Kies de simpelste werkende oplossing
- Bouw iteratief - eerst werkend, dan mooi

---

## 📞 CONTACT & CONTEXT

**Eigenaar:** Mehdi
**Expertise:** React, TypeScript, Tailwind, Supabase (5 projecten)
**Voorkeur:** Stap-voor-stap instructies, iteratief bouwen
**Andere projecten:** Helios (health tech), Held Lab (biohacking)

---

*Laatste update: November 2025*
*Fase: MVP Development - Functionele Shell*
