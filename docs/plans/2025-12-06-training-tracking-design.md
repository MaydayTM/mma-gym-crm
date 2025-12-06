# Training Tracking & Gordel Progressie - Design Document

**Datum:** 6 december 2025
**Status:** Goedgekeurd
**Auteur:** Claude + Mehdi

---

## Samenvatting

Dit document beschrijft de uitbreiding van RCN CRM met:
1. **Lesrooster** - Vast weekrooster met disciplines en coaches
2. **Reservaties** - Leden reserveren vooraf, check-in via QR-scan
3. **Training tracking** - Aantal trainingen per discipline bijhouden
4. **Gordel progressie** - Meerdere gordels per lid, promotie historie met trainingscount
5. **Legacy import** - ClubPlanner data migreren inclusief historische bezoeken

---

## Database Schema

### Nieuwe tabellen

#### 1. disciplines
Configureerbare lijst van disciplines.

```sql
CREATE TABLE disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,           -- 'BJJ', 'Judo', 'Karate'
  slug VARCHAR(50) NOT NULL UNIQUE,     -- 'bjj', 'judo', 'karate'
  has_belt_system BOOLEAN DEFAULT true, -- Muay Thai = false
  color VARCHAR(7) DEFAULT '#3B82F6',   -- Hex color voor UI
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. classes
Vast weekrooster met lessen.

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,           -- 'BJJ Fundamentals'
  discipline_id UUID NOT NULL REFERENCES disciplines(id),
  coach_id UUID REFERENCES members(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER,                 -- NULL = onbeperkt
  room VARCHAR(100),                    -- 'Zaal 1', 'Zaal 2'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_classes_day ON classes(day_of_week);
CREATE INDEX idx_classes_discipline ON classes(discipline_id);
```

#### 3. reservations
Vooraf inschrijven voor lessen.

```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,       -- Welke dag (2025-12-09)
  status VARCHAR(20) DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'checked_in', 'no_show', 'cancelled')),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id, class_id, reservation_date)
);

CREATE INDEX idx_reservations_member ON reservations(member_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_class_date ON reservations(class_id, reservation_date);
```

#### 4. member_belts
Gordel per discipline per lid.

```sql
CREATE TABLE member_belts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  belt_color VARCHAR(20) NOT NULL
    CHECK (belt_color IN ('white', 'yellow', 'green', 'blue', 'purple', 'brown', 'black')),
  stripes INTEGER DEFAULT 0 CHECK (stripes BETWEEN 0 AND 4),
  dan_grade INTEGER,                    -- Alleen voor zwarte band (1, 2, 3...)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id, discipline_id)
);

CREATE INDEX idx_member_belts_member ON member_belts(member_id);
```

#### 5. belt_history
Promotie historie met trainingscount.

```sql
CREATE TABLE belt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  from_belt VARCHAR(20),
  from_stripes INTEGER,
  to_belt VARCHAR(20) NOT NULL,
  to_stripes INTEGER DEFAULT 0,
  to_dan INTEGER,
  promoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  promoted_by UUID REFERENCES members(id) ON DELETE SET NULL,
  trainings_at_promotion INTEGER NOT NULL, -- Snapshot van trainingen op dit moment
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_belt_history_member ON belt_history(member_id);
CREATE INDEX idx_belt_history_discipline ON belt_history(discipline_id);
CREATE INDEX idx_belt_history_date ON belt_history(promoted_at);
```

### Aanpassingen bestaande tabellen

#### members (uitbreiden)
```sql
ALTER TABLE members
  ADD COLUMN clubplanner_id VARCHAR(50),
  ADD COLUMN legacy_checkin_count INTEGER DEFAULT 0;

-- Bestaande gordel velden blijven voor backwards compatibility
-- belt_color, belt_stripes worden DEPRECATED (gebruik member_belts)
```

#### checkins (uitbreiden)
```sql
ALTER TABLE checkins
  ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  ADD COLUMN discipline_id UUID REFERENCES disciplines(id) ON DELETE SET NULL,
  ADD COLUMN reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL;

CREATE INDEX idx_checkins_class ON checkins(class_id);
CREATE INDEX idx_checkins_discipline ON checkins(discipline_id);
```

---

## Training Count Berekening

### Per discipline (inclusief legacy)

```sql
-- Functie: tel trainingen voor een lid in een discipline
CREATE OR REPLACE FUNCTION get_training_count(
  p_member_id UUID,
  p_discipline_id UUID
) RETURNS INTEGER AS $$
DECLARE
  legacy_count INTEGER;
  reservation_count INTEGER;
BEGIN
  -- Legacy count (alleen als discipline_id NULL, dan algemeen)
  SELECT COALESCE(legacy_checkin_count, 0) INTO legacy_count
  FROM members WHERE id = p_member_id;

  -- Nieuwe reservaties met check-in
  SELECT COUNT(*) INTO reservation_count
  FROM reservations r
  JOIN classes c ON r.class_id = c.id
  WHERE r.member_id = p_member_id
    AND r.status = 'checked_in'
    AND c.discipline_id = p_discipline_id;

  RETURN legacy_count + reservation_count;
END;
$$ LANGUAGE plpgsql;
```

### Trainingen sinds laatste promotie

```sql
CREATE OR REPLACE FUNCTION get_trainings_since_promotion(
  p_member_id UUID,
  p_discipline_id UUID
) RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  last_promotion_count INTEGER;
BEGIN
  current_count := get_training_count(p_member_id, p_discipline_id);

  SELECT trainings_at_promotion INTO last_promotion_count
  FROM belt_history
  WHERE member_id = p_member_id AND discipline_id = p_discipline_id
  ORDER BY promoted_at DESC
  LIMIT 1;

  RETURN current_count - COALESCE(last_promotion_count, 0);
END;
$$ LANGUAGE plpgsql;
```

---

## Flows

### Reservatie + Check-in Flow

```
1. Lid opent app → ziet weekrooster
2. Klikt op les → maakt reservatie (status: 'reserved')
3. Bij aankomst: scant QR-code
4. Systeem valideert:
   - Heeft lid reservatie voor HUIDIGE les?
   - Is reservatie voor VANDAAG?
5a. JA → Update status naar 'checked_in', vul checked_in_at
    → Toon groen scherm met naam + gordel + training nummer
5b. NEE → Toon rood scherm "Geen reservatie gevonden"
```

### Gordel Promotie Flow

```
1. Coach/admin opent Member Detail
2. Klikt "Promotie registreren"
3. Selecteert discipline
4. Systeem toont huidige gordel + trainingscount
5. Coach selecteert nieuwe gordel/stripes
6. Systeem:
   - Maakt belt_history record met trainings_at_promotion
   - Update member_belts met nieuwe gordel
```

### Legacy Import Flow

```
1. Admin uploadt ClubPlanner CSV
2. Systeem parsed met ; delimiter
3. Per rij:
   - Map velden naar members tabel
   - Aantal bezoeken → legacy_checkin_count
   - Retentiestatus → status mapping
4. Skip duplicates (email check)
5. Toon rapport: X geïmporteerd, Y overgeslagen, Z fouten
```

---

## UI Componenten

### Nieuwe pagina's
- `/schedule` - Weekrooster beheer (admin)
- `/reservations` - Reserveren (leden)
- `/check-in` - QR scanner scherm

### Nieuwe componenten
- `ScheduleGrid` - Weekrooster visualisatie
- `ReservationCard` - Les met reserveer knop
- `BeltProgressCard` - Gordel per discipline met trainingscount
- `BeltPromotionModal` - Nieuwe promotie registreren
- `CheckInScreen` - Succes/fout na QR scan
- `CSVImporter` - ClubPlanner import tool

### Aanpassingen
- `MemberDetail` - Toevoegen BeltProgressCard per discipline
- `Sidebar` - Toevoegen Schedule en Reservations links

---

## Gordelsysteem

### Universeel (bijna alle disciplines)

| Volgorde | Kleur | Max Stripes |
|----------|-------|-------------|
| 1 | Wit | 4 |
| 2 | Geel | 4 |
| 3 | Groen | 4 |
| 4 | Blauw | 4 |
| 5 | Paars | 4 |
| 6 | Bruin | 4 |
| 7 | Zwart | Dan-graden |

### Uitzondering
- **Muay Thai**: `has_belt_system = false` (later apart systeem)

---

## Seed Data

### Disciplines

```sql
INSERT INTO disciplines (name, slug, has_belt_system, color, sort_order) VALUES
  ('BJJ', 'bjj', true, '#1E40AF', 1),
  ('Judo', 'judo', true, '#DC2626', 2),
  ('Karate', 'karate', true, '#7C3AED', 3),
  ('Luta Livre', 'luta-livre', true, '#059669', 4),
  ('MMA', 'mma', false, '#EA580C', 5),
  ('Kickboxing', 'kickboxing', false, '#CA8A04', 6),
  ('Wrestling', 'wrestling', false, '#0891B2', 7),
  ('Kids BJJ', 'kids-bjj', true, '#EC4899', 8);
```

---

## Migratie Volgorde

1. `006_disciplines.sql` - Disciplines tabel + seed data
2. `007_classes.sql` - Classes tabel
3. `008_reservations.sql` - Reservations tabel
4. `009_member_belts.sql` - Member belts + belt history
5. `010_extend_members.sql` - Legacy velden toevoegen
6. `011_extend_checkins.sql` - Checkins uitbreiden
7. `012_training_functions.sql` - SQL functies voor counts

---

## Niet in scope (later)

- Wachtlijst functionaliteit
- Push notificaties bij beschikbare plek
- Automatische no-show detectie
- Muay Thai specifiek gordelsysteem
- QR-code generator/scanner implementatie
- Stripe koppeling voor reservaties
