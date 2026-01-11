# COMBO - Mobile App Design Document

> **Status:** HERSTELD NA CRASH - Brainstorm moet hervat worden
> **Datum originele sessie:** 9 januari 2026
> **Datum herstel:** 11 januari 2026
> **Context:** PC crash heeft deel van de planning verloren. Dit document bevat de teruggevonden informatie uit Claude Code sessie logs.

---

## Executive Summary

We bouwen een **community-driven martial arts app** die verder gaat dan een simpele gym member app. De app combineert:

1. **Member App** - QR toegang, reserveringen, profiel voor gym leden
2. **Multi-tenant CRM** - Meerdere gyms kunnen het platform gebruiken
3. **Social Platform "FightFlow"** - Video-driven content sharing

---

## Technische Stack (BESLOTEN)

| Component | Keuze | Reden |
|-----------|-------|-------|
| **Framework** | Expo + React Native | Één codebase voor iOS + Android, React kennis herbruikbaar |
| **Codebase** | Monorepo | Code delen tussen web CRM en mobile app |
| **Backend** | Bestaande Supabase | Zelfde database, RLS, Edge Functions |
| **Multi-tenant** | Eén database met tenant_id | Schaalbaar, community features mogelijk |

### Monorepo Structuur (GEPLAND)

```
mma-gym-crm/
├── apps/
│   ├── web/              # Huidige CRM (React + Vite) - VERHUIZEN
│   └── mobile/           # Nieuwe app (React Native + Expo)
├── packages/
│   └── shared/           # Gedeelde code (types, hooks, utils)
├── supabase/             # Backend (onveranderd)
└── package.json          # Workspace root
```

---

## Visie & Unique Selling Points

### Niet zomaar een gym app

> "Ik wil niet gewoon dezelfde app maken die de concurrenten allemaal hebben. De onze zal meer community-based zijn."
> — Mehdi, 9 januari 2026

### Doelgroep

- **Primair:** Leden van Reconnect Academy
- **Secundair:** Hele martial arts community (iedereen kan registreren)
- **Tertiair:** Andere gyms die het platform willen gebruiken

### Core Concept: FightFlow

Video-driven social feed waar gebruikers:
- 15-seconden techniek video's uploaden
- Video's koppelen in "combo's" (flows)
- Voorbeeld flow: `Jab → Takedown → Guard Pass → Rear Naked Choke`
- Later: AI pose-herkenning voor automatische combo generatie

---

## Features per Product

### 1. Member App (MVP)

| Feature | Beschrijving | Prioriteit |
|---------|--------------|------------|
| Login/Register | Supabase Auth, social login | P0 |
| Profiel | Foto, disciplines, gordels, gym affiliatie | P0 |
| QR Check-in | Deur toegang met QR code | P0 |
| Lesrooster | Bekijken + reserveren | P0 |
| Push notifications | Leswijzigingen, herinneringen | P1 |
| Gordel tracking | Eigen progressie zien | P1 |

### 2. Multi-tenant CRM

| Feature | Beschrijving | Prioriteit |
|---------|--------------|------------|
| Gym registratie | Nieuwe gym kan zich aanmelden | P1 |
| Tenant isolation | Data gescheiden per gym | P0 |
| Gym verificatie | Approved/verified badge | P2 |
| Gym dashboard | Eigen leden, rooster, stats | P1 |

### 3. Social Platform - FightFlow (Later)

| Feature | Beschrijving | Prioriteit |
|---------|--------------|------------|
| Video upload | Max 15 sec, techniek clips | P2 |
| Feed | Scroll door community content | P2 |
| Flows | Combo's maken van moves | P3 |
| Likes/Comments | Social interactions | P2 |
| Follows | Andere fighters volgen | P2 |
| AI Combo maker | Pose recognition (toekomst) | P4 |

---

## Database Uitbreiding (NODIG)

### Nieuwe Tabellen

```sql
-- =============================================
-- MULTI-TENANT: Gyms als tenants
-- =============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  verified BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES members(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- GORDEL VERIFICATIE SYSTEEM
-- =============================================
-- "Certified" = bewezen door erkende zwarte gordel
-- "Approved" = goedgekeurd door gym owner/coach
CREATE TABLE belt_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  discipline_id UUID REFERENCES disciplines(id),
  belt_color VARCHAR(50) NOT NULL,

  -- Wie heeft geverifieerd?
  verified_by_id UUID REFERENCES members(id),
  verified_by_tenant_id UUID REFERENCES tenants(id),

  -- Bewijs
  certificate_url TEXT,
  verification_type VARCHAR(50), -- 'certified', 'approved', 'self_reported'

  verified_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- SOCIAL: Moves Library (Techniek video's)
-- =============================================
CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES members(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  discipline_id UUID REFERENCES disciplines(id),

  -- Video
  video_url TEXT NOT NULL,
  video_type VARCHAR(50) DEFAULT 'uploaded', -- 'uploaded', 'youtube', 'tiktok'
  thumbnail_url TEXT,
  duration_seconds INTEGER,

  -- Visibility
  is_public BOOLEAN DEFAULT true,
  tenant_id UUID REFERENCES tenants(id), -- NULL = global/community

  -- Stats
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- SOCIAL: FightFlows (Combo's van moves)
-- =============================================
CREATE TABLE fightflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES members(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Stats
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fightflow_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fightflow_id UUID REFERENCES fightflows(id) ON DELETE CASCADE,
  move_id UUID REFERENCES moves(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Volgorde in de flow

  UNIQUE(fightflow_id, position)
);

-- =============================================
-- SOCIAL: Interactions
-- =============================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE,
  likeable_type VARCHAR(50) NOT NULL, -- 'move', 'fightflow', 'comment'
  likeable_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, likeable_type, likeable_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE,
  commentable_type VARCHAR(50) NOT NULL, -- 'move', 'fightflow'
  commentable_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id), -- Voor replies
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES members(id) ON DELETE CASCADE,
  following_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(follower_id, following_id)
);

-- =============================================
-- MESSAGING (Later)
-- =============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) DEFAULT 'direct', -- 'direct', 'group'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES members(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY(conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementatie Stappenplan

### Fase 0: Voorbereiding (NU)
- [x] Sessie informatie hersteld
- [x] Design document gemaakt
- [ ] **VOLGENDE SESSIE:** Brainstorm hervatten, details invullen
- [ ] Beslissen: Monorepo migratie timing

### Fase 1: Expo Setup
- [ ] Expo project initialiseren in `apps/mobile/`
- [ ] Supabase client configureren
- [ ] Auth flow implementeren (login/register)
- [ ] Basic navigation (tabs)

### Fase 2: Member App MVP
- [ ] Profiel scherm
- [ ] Lesrooster + reserveren
- [ ] QR code generatie voor check-in
- [ ] Push notifications setup

### Fase 3: Multi-tenant
- [ ] Database migratie: tenants tabel
- [ ] RLS policies voor tenant isolation
- [ ] Gym registratie flow
- [ ] Gym affiliate selectie bij registratie

### Fase 4: Social (FightFlow)
- [ ] Video upload naar Supabase Storage
- [ ] Moves CRUD
- [ ] Feed component
- [ ] Likes/Comments
- [ ] FightFlows (combo maker)

### Fase 5: Polish & Launch
- [ ] TestFlight (iOS)
- [ ] APK distributie (Android)
- [ ] App Store / Play Store (optioneel)

---

## Open Vragen (Te Bespreken)

1. **Monorepo timing:** Migreren we de huidige CRM code direct naar `apps/web/` of later?

2. **Naming:**
   - ~~App naam?~~ ✅ **COMBO** (besloten)
   - Package naam voor stores? `com.combo.app` ?

3. **Onboarding flow:**
   - Kan iemand zonder gym registreren? (community-only user)
   - Moet gym selectie verplicht zijn?

4. **Video hosting:**
   - Supabase Storage (goedkoop maar limiet)
   - Cloudflare Stream (beter voor video)
   - Mux (professioneel, duurder)

5. **MVP scope:**
   - Starten met alleen Member App features?
   - Of direct multi-tenant + social basics?

---

## Resources & Referenties

- **Expo Docs:** https://docs.expo.dev
- **React Native:** https://reactnative.dev
- **Supabase React Native:** https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native

---

## Sessie Notities

### 11 januari 2026 - Herstel na crash
- PC was gecrasht, werk verloren
- Sessie logs teruggevonden in `~/.claude/projects/`
- Dit document bevat alle teruggevonden informatie
- **Volgende stap:** Brainstorm hervatten, open vragen beantwoorden

---

*Document aangemaakt: 11 januari 2026*
*Laatste update: 11 januari 2026*
