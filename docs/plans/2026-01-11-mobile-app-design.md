# FightFlow - Mobile App Design Document

> **Status:** ACTIEF - Brainstorm sessie 18 januari 2026
> **App Naam:** FightFlow
> **Originele sessie:** 9 januari 2026
> **Laatste update:** 18 januari 2026

---

## Executive Summary

We bouwen **FightFlow** - een community-driven martial arts app die verder gaat dan een simpele gym member app. De app combineert:

1. **Member App** - QR toegang, reserveringen, profiel voor gym leden
2. **Multi-tenant Platform** - Meerdere gyms kunnen het platform gebruiken
3. **Social Platform "FightFlow Feed"** - Video-driven content sharing (YouTube Shorts)

---

## ✅ Beslissingen (18 januari 2026)

### Bevestigde Keuzes

| Vraag | Beslissing | Notities |
|-------|------------|----------|
| **App naam** | FightFlow | - |
| **Package naam** | TBD | Moet URL beschikbaarheid checken |
| **Monorepo timing** | Later migreren (B) | Mobile eerst in `apps/mobile/`, web blijft in root |
| **Video hosting** | YouTube Shorts embeds | Max 15 sec, geen eigen opslag nodig |
| **Gym registratie** | Hybride systeem | Vrij opgeven + groeiende verified database |

### MVP Prioriteiten

**P0 - Must Have (Eerste Release):**
1. QR code generator voor deurtoegang
2. Lessenrooster + reserveren
3. Lidmaatschap link (koppel abonnement aan account)
4. Instellingen pagina (profiel, wachtwoord, etc.)

**P1 - Should Have (Snel daarna):**
1. FightFlow Feed (social wall met YouTube Shorts)
2. Profiel foto upload
3. Account gegevens wijzigen

**P2 - Nice to Have (Later):**
1. Multi-tenant gym registratie
2. Volledige social features (likes, comments, follows)
3. Push notifications

---

## Technische Stack (DEFINITIEF)

| Component | Keuze | Reden |
|-----------|-------|-------|
| **Framework** | Expo + React Native | Één codebase voor iOS + Android, React kennis herbruikbaar |
| **Codebase** | Monorepo (later) | Mobile eerst apart, dan samenvoegen |
| **Backend** | Bestaande Supabase | Zelfde database, RLS, Edge Functions |
| **Video** | YouTube Shorts embeds | Geen opslag/transcoding nodig |

### Monorepo Structuur (TOEKOMST)

```
mma-gym-crm/
├── apps/
│   ├── web/              # CRM (React + Vite) - LATER VERHUIZEN
│   └── mobile/           # FightFlow (React Native + Expo)
├── packages/
│   └── shared/           # Gedeelde code (types, hooks, utils)
├── supabase/             # Backend (onveranderd)
└── package.json          # Workspace root
```

### Huidige Aanpak (MVP)

```
mma-gym-crm/
├── src/                  # Web CRM (blijft hier)
├── apps/
│   └── mobile/           # FightFlow app (NIEUW)
├── supabase/             # Backend (onveranderd)
└── package.json
```

---

## Gym Registratie Systeem

### Hybride Model

Gebruikers kunnen hun gym op twee manieren opgeven:

1. **Vrije invoer** - Typ gym naam (wordt opgeslagen als `unverified`)
2. **Selecteer uit lijst** - Kies uit verified gyms database

### Database Structuur

```sql
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basis info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,

  -- Locatie
  city VARCHAR(255),
  country VARCHAR(100) DEFAULT 'Belgium',
  address TEXT,

  -- Verificatie
  status VARCHAR(50) DEFAULT 'unverified', -- 'unverified', 'claimed', 'verified'
  claimed_by UUID REFERENCES members(id),  -- Gym owner die heeft geclaimd
  verified_at TIMESTAMP,

  -- Details (alleen voor verified/claimed)
  logo_url TEXT,
  website VARCHAR(255),
  disciplines TEXT[],                       -- ['bjj', 'mma', 'kickboxing']

  -- Stats
  member_count INTEGER DEFAULT 0,           -- Cached count

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Member's gym affiliatie
ALTER TABLE members ADD COLUMN gym_id UUID REFERENCES gyms(id);
ALTER TABLE members ADD COLUMN gym_role VARCHAR(50) DEFAULT 'member'; -- 'owner', 'coach', 'member', 'fan'
```

### Flow

1. **Nieuwe user registreert:**
   - Zoekt gym naam
   - Niet gevonden? → Vrije invoer, gym wordt aangemaakt als `unverified`
   - Gevonden? → Selecteer, wordt gekoppeld

2. **Gym owner wil claimen:**
   - Vindt zijn gym in lijst
   - Klikt "Claim deze gym"
   - Verificatie proces (later: email verificatie, document upload)

3. **Verified gyms:**
   - Krijgen badge in app
   - Kunnen leden beheren
   - Toegang tot CRM dashboard

---

## UI/UX Design

### Referentie: ClubPlanner App

![ClubPlanner Screenshot](../../assets/clubplanner-reference.png)

**Wat we overnemen:**
- Dark theme (past bij martial arts)
- Bottom navigation (5 tabs)
- QR code centraal en prominent
- Profielfoto met ring/badge

**Wat we verbeteren:**
- Duidelijkere tab namen
- Gordel-kleur als profielfoto ring
- FightFlow Feed als sociale hub

### Bottom Navigation (5 tabs)

```
┌─────────────────────────────────────────────────────┐
│  Rooster  │  FightFlow  │  QR Code  │  Zoek  │  Profiel  │
│     📅    │     🎬      │    ⬛     │   🔍   │    👤     │
└─────────────────────────────────────────────────────┘
```

| Tab | Functie | Prioriteit |
|-----|---------|------------|
| **Rooster** | Lessenrooster, reserveren | P0 |
| **FightFlow** | Social feed met video's | P1 |
| **QR Code** | Deurtoegang (centraal!) | P0 |
| **Zoek** | Fighters, gyms, moves zoeken | P2 |
| **Profiel** | Instellingen, account, gordels | P0 |

### Scherm Wireframes

#### 1. QR Code Scherm (Home/Centraal)

```
┌────────────────────────────────┐
│ ← FightFlow          [Avatar] │
│                                │
│    ┌──────────────────────┐   │
│    │                      │   │
│    │     [QR CODE]        │   │
│    │                      │   │
│    │                      │   │
│    └──────────────────────┘   │
│                                │
│   "Scan voor toegang"          │
│                                │
│      [ 🔄 Vernieuw ]          │
│                                │
│   ─────────────────────────   │
│   Volgende les: BJJ 19:00     │
│   [Bekijk rooster →]          │
│                                │
└────────────────────────────────┘
```

#### 2. Rooster Scherm

```
┌────────────────────────────────┐
│ ← Rooster            [Filter] │
│                                │
│  Ma 20  Di 21  Wo 22  Do 23   │
│  ────   ════   ────   ────    │
│                                │
│  ┌────────────────────────┐   │
│  │ 🥋 BJJ Fundamentals    │   │
│  │ 19:00 - 20:30          │   │
│  │ Coach: Mehdi           │   │
│  │ [Reserveer]            │   │
│  └────────────────────────┘   │
│                                │
│  ┌────────────────────────┐   │
│  │ 🥊 MMA                 │   │
│  │ 20:30 - 22:00          │   │
│  │ Coach: Kevin           │   │
│  │ [✓ Gereserveerd]       │   │
│  └────────────────────────┘   │
│                                │
└────────────────────────────────┘
```

#### 3. Profiel Scherm

```
┌────────────────────────────────┐
│         Profiel         [⚙️]  │
│                                │
│        ┌──────────┐           │
│        │  [Foto]  │ ← Gordel  │
│        │          │   ring    │
│        └──────────┘           │
│        Mehdi Michiels         │
│        @mehdi · 🥋 Zwart      │
│        Reconnect Academy      │
│                                │
│  ─────────────────────────────│
│                                │
│  📊 Statistieken              │
│  ├─ 156 trainingen dit jaar   │
│  ├─ 12 maanden streak         │
│  └─ Top 5% aanwezigheid       │
│                                │
│  🎖️ Gordels                   │
│  ├─ BJJ: Zwart (2 stripes)    │
│  └─ Judo: Bruin               │
│                                │
│  ⚙️ Instellingen              │
│  ├─ Account bewerken          │
│  ├─ Wachtwoord wijzigen       │
│  ├─ Lidmaatschap              │
│  └─ Uitloggen                 │
│                                │
└────────────────────────────────┘
```

#### 4. FightFlow Feed (P1)

```
┌────────────────────────────────┐
│ FightFlow              [Post] │
│                                │
│  ┌────────────────────────┐   │
│  │ @kevin · Reconnect     │   │
│  │ ────────────────────── │   │
│  │ [YouTube Short Embed]  │   │
│  │     15 sec video       │   │
│  │ ────────────────────── │   │
│  │ Armbar setup vanuit    │   │
│  │ closed guard 🔥        │   │
│  │ ❤️ 24  💬 3  🔗 Share  │   │
│  └────────────────────────┘   │
│                                │
│  ┌────────────────────────┐   │
│  │ @sarah · Alliance BJJ  │   │
│  │ ...                    │   │
│  └────────────────────────┘   │
│                                │
└────────────────────────────────┘
```

---

## Database Uitbreiding

### Nieuwe Tabellen (MVP)

```sql
-- =============================================
-- GYMS: Multi-tenant foundation
-- =============================================
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  city VARCHAR(255),
  country VARCHAR(100) DEFAULT 'Belgium',
  address TEXT,
  status VARCHAR(50) DEFAULT 'unverified',
  claimed_by UUID REFERENCES members(id),
  verified_at TIMESTAMP,
  logo_url TEXT,
  website VARCHAR(255),
  disciplines TEXT[],
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- MEMBER GYM AFFILIATIE
-- =============================================
ALTER TABLE members ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS gym_role VARCHAR(50) DEFAULT 'member';

-- =============================================
-- QR TOKENS: Veilige QR codes
-- =============================================
CREATE TABLE qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qr_tokens_token ON qr_tokens(token);
CREATE INDEX idx_qr_tokens_member ON qr_tokens(member_id);
```

### Nieuwe Tabellen (FightFlow - P1)

```sql
-- =============================================
-- FIGHTFLOW POSTS: Video content
-- =============================================
CREATE TABLE fightflow_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES members(id) ON DELETE CASCADE,

  -- Content
  youtube_url VARCHAR(500) NOT NULL,
  youtube_video_id VARCHAR(50),
  caption TEXT,

  -- Categorisatie
  discipline_id UUID REFERENCES disciplines(id),
  move_type VARCHAR(100), -- 'submission', 'takedown', 'sweep', 'strike', etc.

  -- Stats
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- Visibility
  is_public BOOLEAN DEFAULT true,
  gym_id UUID REFERENCES gyms(id), -- NULL = public to all

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- SOCIAL: Likes & Comments
-- =============================================
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES fightflow_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES fightflow_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES post_comments(id), -- Voor replies
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- FOLLOWS
-- =============================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES members(id) ON DELETE CASCADE,
  following_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(follower_id, following_id)
);
```

---

## Implementatie Roadmap

### Fase 0: Setup (Week 1)
- [ ] Expo project initialiseren in `apps/mobile/`
- [ ] Supabase client configureren voor React Native
- [ ] Basic navigation setup (bottom tabs)
- [ ] Auth flow (login/register met Supabase)

### Fase 1: Core MVP (Week 2-3)
- [ ] QR Code scherm
  - [ ] QR token generatie (backend)
  - [ ] QR display component
  - [ ] Token refresh functionaliteit
- [ ] Profiel scherm
  - [ ] Basis profiel weergave
  - [ ] Gordel display
  - [ ] Instellingen menu
- [ ] Rooster scherm
  - [ ] Lessen ophalen van Supabase
  - [ ] Week navigatie
  - [ ] Reserveren functionaliteit

### Fase 2: Account & Settings (Week 4)
- [ ] Profiel foto upload
- [ ] Account gegevens bewerken
- [ ] Wachtwoord wijzigen
- [ ] Lidmaatschap status/link

### Fase 3: FightFlow Feed (Week 5-6)
- [ ] Database migratie (posts, likes, comments)
- [ ] YouTube embed component
- [ ] Feed UI
- [ ] Post maken (YouTube URL + caption)
- [ ] Like/comment functionaliteit

### Fase 4: Multi-tenant & Polish (Week 7-8)
- [ ] Gym registratie systeem
- [ ] Gym search/select bij onboarding
- [ ] Push notifications
- [ ] TestFlight / APK distributie

---

## QR Code Systeem - Technisch Detail

### Hoe werkt het?

1. **Token Generatie:**
   - App vraagt token aan via API
   - Backend genereert unieke token + expiry (5 min)
   - Token bevat: `member_id`, `timestamp`, `signature`

2. **QR Code Display:**
   - Token wordt geëncodeerd in QR
   - QR ververst automatisch elke 4 minuten
   - "Vernieuw" knop voor handmatige refresh

3. **Scanning (Gym kant):**
   - Scanner (ESP32 of tablet) leest QR
   - Backend valideert token
   - Checkt: geldig? niet expired? lid actief? abonnement OK?
   - Deur gaat open / entry gelogd

### Token Format

```typescript
interface QRToken {
  memberId: string;
  gymId: string;
  issuedAt: number;      // Unix timestamp
  expiresAt: number;     // Unix timestamp
  signature: string;     // HMAC-SHA256
}

// Encoded als: base64(JSON.stringify(token))
```

### Security

- Tokens zijn kort geldig (5 min max)
- Signature voorkomt manipulatie
- Rate limiting op token requests
- Tokens zijn single-use (optioneel)

---

## Open Punten

1. **Package naam / URL:** Mehdi moet beschikbaarheid checken
   - Suggesties: `com.fightflow.app`, `app.fightflow`, `io.fightflow`

2. **Scanner hardware:** ESP32 QR scanner of tablet app?

3. **Lidmaatschap koppeling:** Hoe linken we Stripe/Mollie subscriptions aan app accounts?

---

## Sessie Log

### 9 januari 2026 - Originele brainstorm
- Visie bepaald: community-driven app
- Technische stack gekozen
- PC crash, deel verloren

### 11 januari 2026 - Herstel
- Document hersteld uit sessie logs
- Open vragen genoteerd

### 18 januari 2026 - Beslissingen
- App naam: FightFlow
- Monorepo: later migreren
- Video hosting: YouTube Shorts
- Gym systeem: hybride (vrij + verified)
- MVP scope: QR + Rooster + Profiel eerst
- UI referentie: ClubPlanner analyse

---

*Document aangemaakt: 11 januari 2026*
*Laatste update: 18 januari 2026*
