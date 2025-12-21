# GymScreen Module - Brainstorm & Design Document

**Datum:** 21 december 2025
**Status:** Brainstorm
**Module:** GymScreen Admin Dashboard

---

## 1. Context & Doel

De GymScreen is een TV-display systeem in de gym dat verschillende content toont aan bezoekers. Het CRM heeft een admin module nodig om bepaalde content te beheren die op de GymScreen verschijnt.

### Bestaande Modules in Dashboard
- **Shop Module** - Merchandise beheer (€29/maand)
- **Creative Fighter Studio** - Externe link naar creative.mmagym.be

### GymScreen Huidige Situatie
De GymScreen toont al:
1. **Belt Wall** - Automatisch uit CRM (nieuwe leden + promoties)
2. **Shop Items/Banners** - Automatisch uit Shop module
3. **Verjaardagen** - Moet gekoppeld worden aan CRM birth_date

---

## 2. Wat Moet NIET Beheerd Worden (Automatisch)

Deze content komt automatisch uit het CRM en hoeft geen admin:

| Content | Bron | Automatisch |
|---------|------|-------------|
| Belt Wall | `members` + `belt_history` tabellen | Nieuwe leden & promoties verschijnen automatisch |
| Shop Banners | `shop_banners` tabel | Bestaand in Shop module |
| Shop Items | `products` tabel | Beheerd via Shop admin |

---

## 3. Wat Moet WEL Beheerd Worden

### 3.1 Community Slideshow/Carousel

**Doel:** Foto's tonen van events, trainingen, community momenten

**Admin Features:**
- Foto's uploaden naar carousel
- Volgorde bepalen (drag & drop)
- Foto's activeren/deactiveren
- Caption toevoegen (optioneel)
- Weergaveduur per foto instellen
- Categorieën: `event`, `training`, `community`, `achievement`

**Database Schema:**
```sql
CREATE TABLE gymscreen_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  image_url TEXT NOT NULL,
  caption TEXT,
  category VARCHAR(50) CHECK (category IN ('event', 'training', 'community', 'achievement')),

  -- Weergave
  display_duration INTEGER DEFAULT 5, -- seconden
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Periode (optioneel voor tijdelijke content)
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,

  -- Metadata
  uploaded_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.2 Workout Display

**Doel:** Workout van de dag/week tonen op het scherm

**Admin Features:**
- Workout titel
- Oefeningen lijst (naam, sets, reps, rust)
- Workout type: `wod` (workout of the day), `warmup`, `conditioning`, `skill`
- Timer settings (voor AMRAP, EMOM, etc.)
- Scheduling: welke dag/tijd tonen

**Database Schema:**
```sql
CREATE TABLE gymscreen_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Workout info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  workout_type VARCHAR(50) CHECK (workout_type IN ('wod', 'warmup', 'conditioning', 'skill', 'custom')),

  -- Timer settings
  timer_type VARCHAR(50), -- 'amrap', 'emom', 'for_time', 'tabata', 'none'
  timer_duration INTEGER, -- in seconden
  timer_rounds INTEGER,

  -- Exercises (JSONB voor flexibiliteit)
  exercises JSONB DEFAULT '[]',
  -- Format: [{"name": "Burpees", "sets": 3, "reps": 10, "rest": "60s", "notes": ""}]

  -- Scheduling
  display_date DATE,
  display_time_start TIME,
  display_time_end TIME,
  is_recurring BOOLEAN DEFAULT false,
  recurring_days INTEGER[], -- [1,3,5] = ma, wo, vr

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.3 Verjaardagen Display

**Huidige Situatie:**
- `members.birth_date` bevat geboortedatum
- `members.profile_picture_url` bevat profielfoto
- GymScreen moet dit automatisch tonen

**Analyse Members Data:**
```sql
-- Check hoeveel leden een geboortedatum hebben
SELECT
  COUNT(*) as total,
  COUNT(birth_date) as with_birth_date,
  COUNT(profile_picture_url) as with_photo
FROM members
WHERE status = 'active';
```

**Optie A: Gebruik bestaande profielfoto**
- Simpelste optie
- Eén foto per lid
- Automatisch beschikbaar

**Optie B: Speciale verjaardagsfoto**
- Extra veld: `birthday_photo_url`
- Lid kan aparte "verjaardag" foto uploaden
- Fallback naar profile_picture_url

**Aanbeveling:** Start met Optie A, voeg later Optie B toe als feature request

**Database View voor Verjaardagen:**
```sql
CREATE OR REPLACE VIEW gymscreen_birthdays AS
SELECT
  id,
  first_name,
  last_name,
  birth_date,
  profile_picture_url,
  EXTRACT(MONTH FROM birth_date) as birth_month,
  EXTRACT(DAY FROM birth_date) as birth_day,
  -- Leeftijd berekening
  DATE_PART('year', AGE(birth_date)) as age
FROM members
WHERE
  status = 'active'
  AND birth_date IS NOT NULL
  -- Vandaag jarig
  AND EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM CURRENT_DATE);
```

---

## 4. GymScreen Admin Pagina Structuur

```
/gymscreen (GymScreen Admin)
├── Overzicht (Dashboard)
│   ├── Actieve slides count
│   ├── Workout van vandaag
│   ├── Jarigen van vandaag
│   └── Preview link naar GymScreen
├── Slideshow
│   ├── Upload nieuwe foto's
│   ├── Grid/lijst van slides
│   ├── Drag & drop ordening
│   └── Bulk activeren/deactiveren
├── Workouts
│   ├── Workout builder
│   ├── Templates library
│   ├── Planning/kalender
│   └── Timer configuratie
├── Verjaardagen (Optioneel tab)
│   ├── Vandaag jarig
│   ├── Deze week jarig
│   ├── Foto's review
│   └── Stuur felicitatie (future)
└── Instellingen
    ├── Slideshow timing
    ├── Welke secties tonen
    ├── Volgorde secties
    └── GymScreen URL/API key
```

---

## 5. Database Migrations Nodig

### Migration: 031_gymscreen_module.sql

```sql
-- 031_gymscreen_module.sql
-- GymScreen Module - Slideshow & Workouts
-- Datum: 21 december 2025

-- ============================================
-- GYMSCREEN SLIDES (Community foto's)
-- ============================================
CREATE TABLE IF NOT EXISTS gymscreen_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  category VARCHAR(50) DEFAULT 'community'
    CHECK (category IN ('event', 'training', 'community', 'achievement', 'promo')),
  display_duration INTEGER DEFAULT 5,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  uploaded_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gymscreen_slides_active ON gymscreen_slides(is_active);
CREATE INDEX idx_gymscreen_slides_order ON gymscreen_slides(sort_order);

-- ============================================
-- GYMSCREEN WORKOUTS
-- ============================================
CREATE TABLE IF NOT EXISTS gymscreen_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  workout_type VARCHAR(50) DEFAULT 'wod'
    CHECK (workout_type IN ('wod', 'warmup', 'conditioning', 'skill', 'strength', 'custom')),
  timer_type VARCHAR(50) CHECK (timer_type IN ('amrap', 'emom', 'for_time', 'tabata', 'countdown', 'none')),
  timer_duration INTEGER,
  timer_rounds INTEGER,
  exercises JSONB DEFAULT '[]',
  display_date DATE,
  display_time_start TIME,
  display_time_end TIME,
  is_recurring BOOLEAN DEFAULT false,
  recurring_days INTEGER[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gymscreen_workouts_date ON gymscreen_workouts(display_date);
CREATE INDEX idx_gymscreen_workouts_active ON gymscreen_workouts(is_active);

-- ============================================
-- GYMSCREEN SETTINGS (per tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS gymscreen_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(100) DEFAULT 'reconnect',

  -- Secties configuratie
  show_belt_wall BOOLEAN DEFAULT true,
  show_slideshow BOOLEAN DEFAULT true,
  show_workouts BOOLEAN DEFAULT true,
  show_birthdays BOOLEAN DEFAULT true,
  show_shop_banners BOOLEAN DEFAULT true,

  -- Timing
  slideshow_interval INTEGER DEFAULT 5, -- seconden
  section_rotation_interval INTEGER DEFAULT 30, -- seconden tussen secties

  -- Volgorde secties (array van section names)
  section_order TEXT[] DEFAULT ARRAY['belt_wall', 'slideshow', 'workouts', 'birthdays', 'shop'],

  -- API
  api_key VARCHAR(255),

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(tenant_id)
);

-- ============================================
-- VIEW: Vandaag jarig
-- ============================================
CREATE OR REPLACE VIEW gymscreen_birthdays_today AS
SELECT
  id,
  first_name,
  last_name,
  birth_date,
  profile_picture_url,
  DATE_PART('year', AGE(birth_date))::INTEGER as age
FROM members
WHERE
  status = 'active'
  AND birth_date IS NOT NULL
  AND EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM CURRENT_DATE);

-- ============================================
-- VIEW: Deze week jarig
-- ============================================
CREATE OR REPLACE VIEW gymscreen_birthdays_week AS
SELECT
  id,
  first_name,
  last_name,
  birth_date,
  profile_picture_url,
  DATE_PART('year', AGE(birth_date))::INTEGER as age,
  TO_CHAR(birth_date, 'DD/MM') as birthday_display
FROM members
WHERE
  status = 'active'
  AND birth_date IS NOT NULL
  AND (
    -- Verjaardag deze week
    MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      EXTRACT(MONTH FROM birth_date)::INTEGER,
      EXTRACT(DAY FROM birth_date)::INTEGER
    ) BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  );

-- ============================================
-- FUNCTION: Get active workout for now
-- ============================================
CREATE OR REPLACE FUNCTION get_current_workout()
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  description TEXT,
  workout_type VARCHAR(50),
  timer_type VARCHAR(50),
  timer_duration INTEGER,
  timer_rounds INTEGER,
  exercises JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.title,
    w.description,
    w.workout_type,
    w.timer_type,
    w.timer_duration,
    w.timer_rounds,
    w.exercises
  FROM gymscreen_workouts w
  WHERE
    w.is_active = true
    AND (
      -- Specifieke datum
      (w.display_date = CURRENT_DATE
       AND (w.display_time_start IS NULL OR CURRENT_TIME >= w.display_time_start)
       AND (w.display_time_end IS NULL OR CURRENT_TIME <= w.display_time_end))
      OR
      -- Recurring op deze dag
      (w.is_recurring = true
       AND EXTRACT(DOW FROM CURRENT_DATE)::INTEGER = ANY(w.recurring_days))
    )
  ORDER BY w.display_date DESC NULLS LAST, w.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_gymscreen_slides_updated_at
  BEFORE UPDATE ON gymscreen_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gymscreen_workouts_updated_at
  BEFORE UPDATE ON gymscreen_workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (disabled for development)
-- ============================================
ALTER TABLE gymscreen_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE gymscreen_workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE gymscreen_settings DISABLE ROW LEVEL SECURITY;

GRANT ALL ON gymscreen_slides TO authenticated, anon;
GRANT ALL ON gymscreen_workouts TO authenticated, anon;
GRANT ALL ON gymscreen_settings TO authenticated, anon;

-- ============================================
-- ADD MODULE TO MODULES TABLE
-- ============================================
INSERT INTO modules (slug, name, description, icon, price_monthly, price_yearly, is_core, sort_order, features)
VALUES (
  'gymscreen',
  'GymScreen',
  'Beheer content voor je gym TV-displays',
  'Monitor',
  0, -- Gratis module (of 15.00 voor premium)
  0,
  true, -- Core module (gratis)
  11,
  '["Slideshow beheer", "Workout display", "Verjaardagen", "Belt Wall", "Shop integratie"]'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features;

-- ============================================
-- SEED: Default settings voor Reconnect
-- ============================================
INSERT INTO gymscreen_settings (tenant_id, api_key)
VALUES ('reconnect', gen_random_uuid()::text)
ON CONFLICT (tenant_id) DO NOTHING;
```

---

## 6. Frontend Components Nodig

### Nieuwe Bestanden

```
src/
├── pages/
│   └── GymScreen.tsx              # Admin dashboard
├── hooks/
│   └── gymscreen/
│       ├── useSlides.ts           # CRUD slides
│       ├── useWorkouts.ts         # CRUD workouts
│       ├── useBirthdays.ts        # Verjaardagen queries
│       └── useGymScreenSettings.ts
├── components/
│   └── gymscreen/
│       ├── admin/
│       │   ├── SlidesManager.tsx  # Upload & manage slides
│       │   ├── SlideUploader.tsx  # Drag & drop upload
│       │   ├── WorkoutsManager.tsx
│       │   ├── WorkoutBuilder.tsx # Exercise editor
│       │   ├── BirthdaysPreview.tsx
│       │   └── GymScreenSettings.tsx
│       └── display/               # Voor de GymScreen zelf (later)
│           ├── SlideCarousel.tsx
│           ├── WorkoutDisplay.tsx
│           └── BirthdayCard.tsx
```

---

## 7. Sidebar Integratie

Toevoegen aan sidebar naast Shop en Creative Fighter Studio:

```tsx
// In Sidebar.tsx - modules sectie
{
  name: 'GymScreen',
  href: '/gymscreen',
  icon: Monitor,
  // Geen trial badge nodig als het core/gratis is
}
```

---

## 8. API Endpoints voor GymScreen Display

De GymScreen zelf (externe app/TV) haalt data op via deze endpoints:

```
GET /api/gymscreen/slides      → Actieve slides
GET /api/gymscreen/workout     → Huidige workout
GET /api/gymscreen/birthdays   → Jarigen van vandaag
GET /api/gymscreen/settings    → Display configuratie
GET /api/gymscreen/all         → Alle data in één call
```

Dit kan via Supabase Edge Functions of direct Supabase queries met API key.

---

## 9. Verificatie: Members met Birth Date

Om te controleren hoeveel leden een geboortedatum hebben:

```sql
SELECT
  COUNT(*) as totaal_actief,
  COUNT(birth_date) as met_geboortedatum,
  ROUND(COUNT(birth_date)::numeric / COUNT(*)::numeric * 100, 1) as percentage,
  COUNT(profile_picture_url) as met_foto
FROM members
WHERE status = 'active';
```

---

## 10. Implementatie Prioriteiten

### Fase 1: Basis (Week 1)
1. Database migration uitvoeren
2. GymScreen pagina in sidebar
3. Basic overzicht dashboard
4. Verjaardagen widget (read-only)

### Fase 2: Slideshow (Week 2)
1. Slides upload functionaliteit
2. Grid view met activeren/deactiveren
3. Drag & drop ordening
4. Supabase Storage bucket voor uploads

### Fase 3: Workouts (Week 3)
1. Workout builder UI
2. Exercise toevoegen/verwijderen
3. Timer configuratie
4. Scheduling/kalender

### Fase 4: GymScreen Display Integration
1. API endpoints
2. Test met daadwerkelijke GymScreen
3. Real-time updates

---

## 11. Open Vragen

1. **Is GymScreen een core (gratis) of premium module?**
   - Aanbeveling: Core, want het verbetert de gym ervaring

2. **Moet de workout builder templates hebben?**
   - AMRAP 20, Tabata, EMOM presets

3. **Wil je een "verjaardag felicitatie" functie?**
   - Automatisch email/WhatsApp sturen

4. **Moet de GymScreen live preview in admin?**
   - Mini-preview van hoe het er op TV uitziet

5. **Hoeveel foto's max in slideshow?**
   - Storage limiet overwegen

---

*Document aangemaakt: 21 december 2025*
*Auteur: Claude Code Assistant*
