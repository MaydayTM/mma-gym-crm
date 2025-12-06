# Training Tracking & Gordel Progressie - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Uitbreiden van RCN CRM met lesrooster, reservaties, training tracking per discipline, en gordel progressie met promotie historie.

**Architecture:** Database-first aanpak. Eerst migraties voor nieuwe tabellen (disciplines, classes, reservations, member_belts, belt_history), dan hooks en UI componenten. Bestaande MemberDetail pagina wordt uitgebreid met gordel progressie card.

**Tech Stack:** Supabase (PostgreSQL), React Query, React, TypeScript, Tailwind CSS

---

## Task 1: Database Migration - Disciplines

**Files:**
- Create: `supabase/migrations/006_disciplines.sql`

**Step 1: Create migration file**

```sql
-- 006_disciplines.sql
-- Disciplines tabel met seed data

CREATE TABLE IF NOT EXISTS disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  has_belt_system BOOLEAN DEFAULT true,
  color VARCHAR(7) DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disciplines_slug ON disciplines(slug);
CREATE INDEX IF NOT EXISTS idx_disciplines_active ON disciplines(is_active);

-- Trigger voor updated_at
CREATE TRIGGER update_disciplines_updated_at
  BEFORE UPDATE ON disciplines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data
INSERT INTO disciplines (name, slug, has_belt_system, color, sort_order) VALUES
  ('BJJ', 'bjj', true, '#1E40AF', 1),
  ('Judo', 'judo', true, '#DC2626', 2),
  ('Karate', 'karate', true, '#7C3AED', 3),
  ('Luta Livre', 'luta-livre', true, '#059669', 4),
  ('MMA', 'mma', false, '#EA580C', 5),
  ('Kickboxing', 'kickboxing', false, '#CA8A04', 6),
  ('Wrestling', 'wrestling', false, '#0891B2', 7),
  ('Kids BJJ', 'kids-bjj', true, '#EC4899', 8);

-- RLS
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view disciplines"
  ON disciplines FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage disciplines"
  ON disciplines FOR ALL
  USING (get_my_role() = 'admin');
```

**Step 2: Push migration to Supabase**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Generate updated types**

Run: `npx supabase gen types typescript --linked > src/types/database.types.ts`
Expected: File updated with `disciplines` table types

**Step 4: Commit**

```bash
git add supabase/migrations/006_disciplines.sql src/types/database.types.ts
git commit -m "feat(db): add disciplines table with seed data"
```

---

## Task 2: Database Migration - Classes

**Files:**
- Create: `supabase/migrations/007_classes.sql`

**Step 1: Create migration file**

```sql
-- 007_classes.sql
-- Classes tabel voor lesrooster

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES members(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER,
  room VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_day ON classes(day_of_week);
CREATE INDEX IF NOT EXISTS idx_classes_discipline ON classes(discipline_id);
CREATE INDEX IF NOT EXISTS idx_classes_coach ON classes(coach_id);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);

-- Trigger voor updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active classes"
  ON classes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can view all classes"
  ON classes FOR SELECT
  USING (get_my_role() IN ('admin', 'medewerker', 'coordinator', 'coach'));

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Coordinators can manage classes"
  ON classes FOR ALL
  USING (get_my_role() = 'coordinator');
```

**Step 2: Push migration**

Run: `npx supabase db push`

**Step 3: Generate types**

Run: `npx supabase gen types typescript --linked > src/types/database.types.ts`

**Step 4: Commit**

```bash
git add supabase/migrations/007_classes.sql src/types/database.types.ts
git commit -m "feat(db): add classes table for schedule"
```

---

## Task 3: Database Migration - Reservations

**Files:**
- Create: `supabase/migrations/008_reservations.sql`

**Step 1: Create migration file**

```sql
-- 008_reservations.sql
-- Reservations tabel voor les inschrijvingen

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'checked_in', 'no_show', 'cancelled')),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id, class_id, reservation_date)
);

CREATE INDEX IF NOT EXISTS idx_reservations_member ON reservations(member_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_class_date ON reservations(class_id, reservation_date);

-- RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create own reservations"
  ON reservations FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can cancel own reservations"
  ON reservations FOR UPDATE
  USING (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()))
  WITH CHECK (status = 'cancelled');

CREATE POLICY "Staff can manage all reservations"
  ON reservations FOR ALL
  USING (get_my_role() IN ('admin', 'medewerker', 'coordinator', 'coach'));
```

**Step 2: Push migration**

Run: `npx supabase db push`

**Step 3: Generate types**

Run: `npx supabase gen types typescript --linked > src/types/database.types.ts`

**Step 4: Commit**

```bash
git add supabase/migrations/008_reservations.sql src/types/database.types.ts
git commit -m "feat(db): add reservations table"
```

---

## Task 4: Database Migration - Member Belts & Belt History

**Files:**
- Create: `supabase/migrations/009_member_belts.sql`

**Step 1: Create migration file**

```sql
-- 009_member_belts.sql
-- Member belts (gordel per discipline) en belt history

-- Member belts - huidige gordel per discipline
CREATE TABLE IF NOT EXISTS member_belts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  belt_color VARCHAR(20) NOT NULL
    CHECK (belt_color IN ('white', 'yellow', 'green', 'blue', 'purple', 'brown', 'black')),
  stripes INTEGER DEFAULT 0 CHECK (stripes BETWEEN 0 AND 4),
  dan_grade INTEGER CHECK (dan_grade >= 1),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id, discipline_id)
);

CREATE INDEX IF NOT EXISTS idx_member_belts_member ON member_belts(member_id);
CREATE INDEX IF NOT EXISTS idx_member_belts_discipline ON member_belts(discipline_id);

-- Belt history - promotie historie
CREATE TABLE IF NOT EXISTS belt_history (
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
  trainings_at_promotion INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_belt_history_member ON belt_history(member_id);
CREATE INDEX IF NOT EXISTS idx_belt_history_discipline ON belt_history(discipline_id);
CREATE INDEX IF NOT EXISTS idx_belt_history_date ON belt_history(promoted_at);

-- Trigger voor member_belts updated_at
CREATE TRIGGER update_member_belts_updated_at
  BEFORE UPDATE ON member_belts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS voor member_belts
ALTER TABLE member_belts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view member belts"
  ON member_belts FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage member belts"
  ON member_belts FOR ALL
  USING (get_my_role() IN ('admin', 'medewerker', 'coordinator', 'coach'));

-- RLS voor belt_history
ALTER TABLE belt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view belt history"
  ON belt_history FOR SELECT
  USING (true);

CREATE POLICY "Staff can create belt history"
  ON belt_history FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'medewerker', 'coordinator', 'coach'));
```

**Step 2: Push migration**

Run: `npx supabase db push`

**Step 3: Generate types**

Run: `npx supabase gen types typescript --linked > src/types/database.types.ts`

**Step 4: Commit**

```bash
git add supabase/migrations/009_member_belts.sql src/types/database.types.ts
git commit -m "feat(db): add member_belts and belt_history tables"
```

---

## Task 5: Database Migration - Extend Members & Checkins

**Files:**
- Create: `supabase/migrations/010_extend_members_checkins.sql`

**Step 1: Create migration file**

```sql
-- 010_extend_members_checkins.sql
-- Uitbreiden members met legacy velden, checkins met class/discipline referenties

-- Members uitbreiden voor ClubPlanner import
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS clubplanner_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS legacy_checkin_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_members_clubplanner ON members(clubplanner_id);

-- Checkins uitbreiden met class en discipline referenties
ALTER TABLE checkins
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES disciplines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_checkins_class ON checkins(class_id);
CREATE INDEX IF NOT EXISTS idx_checkins_discipline ON checkins(discipline_id);
CREATE INDEX IF NOT EXISTS idx_checkins_reservation ON checkins(reservation_id);
```

**Step 2: Push migration**

Run: `npx supabase db push`

**Step 3: Generate types**

Run: `npx supabase gen types typescript --linked > src/types/database.types.ts`

**Step 4: Commit**

```bash
git add supabase/migrations/010_extend_members_checkins.sql src/types/database.types.ts
git commit -m "feat(db): extend members and checkins tables"
```

---

## Task 6: Database Migration - Training Count Functions

**Files:**
- Create: `supabase/migrations/011_training_functions.sql`

**Step 1: Create migration file**

```sql
-- 011_training_functions.sql
-- SQL functies voor training counts

-- Functie: tel trainingen voor een lid in een discipline
CREATE OR REPLACE FUNCTION get_training_count(
  p_member_id UUID,
  p_discipline_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  legacy_count INTEGER;
  checkin_count INTEGER;
BEGIN
  -- Legacy count van member
  SELECT COALESCE(legacy_checkin_count, 0) INTO legacy_count
  FROM members WHERE id = p_member_id;

  -- Als geen specifieke discipline, tel alle check-ins
  IF p_discipline_id IS NULL THEN
    SELECT COUNT(*) INTO checkin_count
    FROM reservations
    WHERE member_id = p_member_id
      AND status = 'checked_in';
  ELSE
    -- Tel check-ins voor specifieke discipline
    SELECT COUNT(*) INTO checkin_count
    FROM reservations r
    JOIN classes c ON r.class_id = c.id
    WHERE r.member_id = p_member_id
      AND r.status = 'checked_in'
      AND c.discipline_id = p_discipline_id;
  END IF;

  -- Voor legacy data: als geen discipline filter, tel legacy mee
  -- Anders alleen nieuwe check-ins (legacy is niet discipline-specifiek)
  IF p_discipline_id IS NULL THEN
    RETURN legacy_count + checkin_count;
  ELSE
    RETURN checkin_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Functie: trainingen sinds laatste promotie
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View voor member belt summary (handig voor queries)
CREATE OR REPLACE VIEW member_belt_summary AS
SELECT
  mb.member_id,
  mb.discipline_id,
  d.name as discipline_name,
  d.slug as discipline_slug,
  d.color as discipline_color,
  d.has_belt_system,
  mb.belt_color,
  mb.stripes,
  mb.dan_grade,
  mb.updated_at as belt_updated_at,
  get_training_count(mb.member_id, mb.discipline_id) as training_count,
  get_trainings_since_promotion(mb.member_id, mb.discipline_id) as trainings_since_promotion
FROM member_belts mb
JOIN disciplines d ON mb.discipline_id = d.id
WHERE d.is_active = true;
```

**Step 2: Push migration**

Run: `npx supabase db push`

**Step 3: Commit**

```bash
git add supabase/migrations/011_training_functions.sql
git commit -m "feat(db): add training count functions and views"
```

---

## Task 7: Hook - useDisciplines

**Files:**
- Create: `src/hooks/useDisciplines.ts`

**Step 1: Create hook file**

```typescript
// src/hooks/useDisciplines.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Discipline = Database['public']['Tables']['disciplines']['Row']

export function useDisciplines() {
  return useQuery({
    queryKey: ['disciplines'],
    queryFn: async (): Promise<Discipline[]> => {
      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 60, // 1 hour - disciplines change rarely
  })
}

export function useDiscipline(id: string | undefined) {
  return useQuery({
    queryKey: ['disciplines', id],
    queryFn: async (): Promise<Discipline | null> => {
      if (!id) return null

      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}
```

**Step 2: Commit**

```bash
git add src/hooks/useDisciplines.ts
git commit -m "feat: add useDisciplines hook"
```

---

## Task 8: Hook - useClasses

**Files:**
- Create: `src/hooks/useClasses.ts`

**Step 1: Create hook file**

```typescript
// src/hooks/useClasses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Class = Database['public']['Tables']['classes']['Row']
type ClassInsert = Database['public']['Tables']['classes']['Insert']
type ClassUpdate = Database['public']['Tables']['classes']['Update']

type ClassWithRelations = Class & {
  disciplines: { name: string; color: string; slug: string } | null
  coach: { first_name: string; last_name: string } | null
}

export function useClasses(dayOfWeek?: number) {
  return useQuery({
    queryKey: ['classes', { dayOfWeek }],
    queryFn: async (): Promise<ClassWithRelations[]> => {
      let query = supabase
        .from('classes')
        .select(`
          *,
          disciplines:discipline_id (name, color, slug),
          coach:coach_id (first_name, last_name)
        `)
        .eq('is_active', true)
        .order('start_time')

      if (dayOfWeek !== undefined) {
        query = query.eq('day_of_week', dayOfWeek)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ClassWithRelations[]
    },
  })
}

export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (classData: ClassInsert) => {
      const { data, error } = await supabase
        .from('classes')
        .insert(classData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useUpdateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ClassUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}
```

**Step 2: Commit**

```bash
git add src/hooks/useClasses.ts
git commit -m "feat: add useClasses hooks"
```

---

## Task 9: Hook - useReservations

**Files:**
- Create: `src/hooks/useReservations.ts`

**Step 1: Create hook file**

```typescript
// src/hooks/useReservations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Reservation = Database['public']['Tables']['reservations']['Row']
type ReservationInsert = Database['public']['Tables']['reservations']['Insert']

type ReservationWithClass = Reservation & {
  classes: {
    name: string
    start_time: string
    end_time: string
    room: string | null
    disciplines: { name: string; color: string } | null
    coach: { first_name: string; last_name: string } | null
  } | null
}

export function useReservations(memberId?: string, date?: string) {
  return useQuery({
    queryKey: ['reservations', { memberId, date }],
    queryFn: async (): Promise<ReservationWithClass[]> => {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          classes:class_id (
            name,
            start_time,
            end_time,
            room,
            disciplines:discipline_id (name, color),
            coach:coach_id (first_name, last_name)
          )
        `)
        .order('reservation_date', { ascending: true })

      if (memberId) {
        query = query.eq('member_id', memberId)
      }

      if (date) {
        query = query.eq('reservation_date', date)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ReservationWithClass[]
    },
    enabled: !!memberId || !!date,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reservation: ReservationInsert) => {
      const { data, error } = await supabase
        .from('reservations')
        .insert(reservation)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

export function useCheckInReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

// Get reservations for a specific class on a specific date (for capacity check)
export function useClassReservations(classId: string, date: string) {
  return useQuery({
    queryKey: ['reservations', 'class', classId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, member:member_id (first_name, last_name, profile_picture_url)')
        .eq('class_id', classId)
        .eq('reservation_date', date)
        .neq('status', 'cancelled')

      if (error) throw error
      return data
    },
    enabled: !!classId && !!date,
  })
}
```

**Step 2: Commit**

```bash
git add src/hooks/useReservations.ts
git commit -m "feat: add useReservations hooks"
```

---

## Task 10: Hook - useMemberBelts

**Files:**
- Create: `src/hooks/useMemberBelts.ts`

**Step 1: Create hook file**

```typescript
// src/hooks/useMemberBelts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type MemberBelt = Database['public']['Tables']['member_belts']['Row']
type MemberBeltInsert = Database['public']['Tables']['member_belts']['Insert']
type BeltHistoryInsert = Database['public']['Tables']['belt_history']['Insert']

type MemberBeltWithDetails = MemberBelt & {
  disciplines: {
    name: string
    color: string
    slug: string
    has_belt_system: boolean
  } | null
  training_count?: number
  trainings_since_promotion?: number
}

export function useMemberBelts(memberId: string | undefined) {
  return useQuery({
    queryKey: ['member-belts', memberId],
    queryFn: async (): Promise<MemberBeltWithDetails[]> => {
      if (!memberId) return []

      // Get belts with discipline info
      const { data: belts, error: beltsError } = await supabase
        .from('member_belts')
        .select(`
          *,
          disciplines:discipline_id (name, color, slug, has_belt_system)
        `)
        .eq('member_id', memberId)

      if (beltsError) throw beltsError

      // Get training counts using RPC
      const beltsWithCounts = await Promise.all(
        (belts || []).map(async (belt) => {
          const { data: trainingCount } = await supabase
            .rpc('get_training_count', {
              p_member_id: memberId,
              p_discipline_id: belt.discipline_id
            })

          const { data: trainingsSincePromo } = await supabase
            .rpc('get_trainings_since_promotion', {
              p_member_id: memberId,
              p_discipline_id: belt.discipline_id
            })

          return {
            ...belt,
            training_count: trainingCount || 0,
            trainings_since_promotion: trainingsSincePromo || 0,
          }
        })
      )

      return beltsWithCounts as MemberBeltWithDetails[]
    },
    enabled: !!memberId,
  })
}

export function useBeltHistory(memberId: string | undefined, disciplineId?: string) {
  return useQuery({
    queryKey: ['belt-history', memberId, disciplineId],
    queryFn: async () => {
      if (!memberId) return []

      let query = supabase
        .from('belt_history')
        .select(`
          *,
          disciplines:discipline_id (name, color),
          promoter:promoted_by (first_name, last_name)
        `)
        .eq('member_id', memberId)
        .order('promoted_at', { ascending: false })

      if (disciplineId) {
        query = query.eq('discipline_id', disciplineId)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!memberId,
  })
}

export function usePromoteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      memberId,
      disciplineId,
      fromBelt,
      fromStripes,
      toBelt,
      toStripes,
      toDan,
      promotedBy,
      trainingsAtPromotion,
      notes,
    }: {
      memberId: string
      disciplineId: string
      fromBelt?: string
      fromStripes?: number
      toBelt: string
      toStripes: number
      toDan?: number
      promotedBy?: string
      trainingsAtPromotion: number
      notes?: string
    }) => {
      // 1. Create belt history record
      const historyInsert: BeltHistoryInsert = {
        member_id: memberId,
        discipline_id: disciplineId,
        from_belt: fromBelt,
        from_stripes: fromStripes,
        to_belt: toBelt,
        to_stripes: toStripes,
        to_dan: toDan,
        promoted_by: promotedBy,
        trainings_at_promotion: trainingsAtPromotion,
        notes,
      }

      const { error: historyError } = await supabase
        .from('belt_history')
        .insert(historyInsert)

      if (historyError) throw historyError

      // 2. Upsert member belt (update or create)
      const beltUpsert: MemberBeltInsert = {
        member_id: memberId,
        discipline_id: disciplineId,
        belt_color: toBelt,
        stripes: toStripes,
        dan_grade: toDan,
      }

      const { error: beltError } = await supabase
        .from('member_belts')
        .upsert(beltUpsert, { onConflict: 'member_id,discipline_id' })

      if (beltError) throw beltError
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-belts', variables.memberId] })
      queryClient.invalidateQueries({ queryKey: ['belt-history', variables.memberId] })
    },
  })
}

export function useAddMemberBelt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (belt: MemberBeltInsert) => {
      const { data, error } = await supabase
        .from('member_belts')
        .insert(belt)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-belts', variables.member_id] })
    },
  })
}
```

**Step 2: Commit**

```bash
git add src/hooks/useMemberBelts.ts
git commit -m "feat: add useMemberBelts hooks with promotion"
```

---

## Task 11: Component - BeltProgressCard

**Files:**
- Create: `src/components/members/BeltProgressCard.tsx`

**Step 1: Create component file**

```typescript
// src/components/members/BeltProgressCard.tsx
import { useState } from 'react'
import { Award, Plus, ChevronRight, History } from 'lucide-react'
import { Modal } from '../ui'
import { useMemberBelts, useBeltHistory } from '../../hooks/useMemberBelts'
import { BeltPromotionModal } from './BeltPromotionModal'
import { AddBeltModal } from './AddBeltModal'

interface BeltProgressCardProps {
  memberId: string
  memberName: string
}

const BELT_COLORS: Record<string, string> = {
  white: 'bg-white',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  brown: 'bg-amber-700',
  black: 'bg-black',
}

const BELT_ORDER = ['white', 'yellow', 'green', 'blue', 'purple', 'brown', 'black']

export function BeltProgressCard({ memberId, memberName }: BeltProgressCardProps) {
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)
  const [isAddBeltModalOpen, setIsAddBeltModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null)

  const { data: belts, isLoading } = useMemberBelts(memberId)
  const { data: history } = useBeltHistory(memberId, selectedDisciplineId || undefined)

  const handleOpenPromotion = (disciplineId: string) => {
    setSelectedDisciplineId(disciplineId)
    setIsPromotionModalOpen(true)
  }

  const handleOpenHistory = (disciplineId: string) => {
    setSelectedDisciplineId(disciplineId)
    setIsHistoryModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded-xl" />
          <div className="h-16 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  const selectedBelt = belts?.find((b) => b.discipline_id === selectedDisciplineId)

  return (
    <>
      <div
        className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
        style={{
          position: 'relative',
          '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
          '--border-radius-before': '24px',
        } as React.CSSProperties}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="text-amber-300" size={20} strokeWidth={1.5} />
            <h2 className="text-[20px] font-medium text-neutral-50">Gordels</h2>
          </div>
          <button
            onClick={() => setIsAddBeltModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-[13px] text-amber-300 hover:text-amber-200 transition"
          >
            <Plus size={16} strokeWidth={1.5} />
            Toevoegen
          </button>
        </div>

        {belts && belts.length > 0 ? (
          <div className="divide-y divide-white/5">
            {belts.map((belt) => {
              const beltIndex = BELT_ORDER.indexOf(belt.belt_color)
              const progressPercent = ((beltIndex + 1) / BELT_ORDER.length) * 100

              return (
                <div
                  key={belt.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border border-white/20 ${
                          BELT_COLORS[belt.belt_color] || 'bg-gray-500'
                        }`}
                      />
                      <div>
                        <span
                          className="text-[14px] font-medium"
                          style={{ color: belt.disciplines?.color || '#fff' }}
                        >
                          {belt.disciplines?.name}
                        </span>
                        <span className="text-[14px] text-neutral-300 ml-2 capitalize">
                          {belt.belt_color}
                          {belt.stripes ? ` ${belt.stripes} stripe${belt.stripes > 1 ? 's' : ''}` : ''}
                          {belt.dan_grade ? ` ${belt.dan_grade}e dan` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenHistory(belt.discipline_id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition text-neutral-500 hover:text-neutral-300"
                        title="Geschiedenis"
                      >
                        <History size={16} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleOpenPromotion(belt.discipline_id)}
                        className="inline-flex items-center gap-1 text-[12px] text-amber-300 hover:text-amber-200 transition px-2 py-1 rounded-lg hover:bg-amber-500/10"
                      >
                        Promotie
                        <ChevronRight size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: belt.disciplines?.color || '#3B82F6',
                      }}
                    />
                  </div>

                  {/* Training count */}
                  <p className="text-[11px] text-neutral-500">
                    {belt.trainings_since_promotion} trainingen sinds laatste promotie
                    {belt.training_count ? ` (${belt.training_count} totaal)` : ''}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Award size={32} className="text-neutral-600 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-neutral-500">Geen gordels geregistreerd</p>
            <button
              onClick={() => setIsAddBeltModalOpen(true)}
              className="mt-4 text-[13px] text-amber-300 hover:text-amber-200"
            >
              Eerste gordel toevoegen
            </button>
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      {selectedBelt && (
        <BeltPromotionModal
          isOpen={isPromotionModalOpen}
          onClose={() => {
            setIsPromotionModalOpen(false)
            setSelectedDisciplineId(null)
          }}
          memberId={memberId}
          memberName={memberName}
          currentBelt={selectedBelt}
        />
      )}

      {/* Add Belt Modal */}
      <AddBeltModal
        isOpen={isAddBeltModalOpen}
        onClose={() => setIsAddBeltModalOpen(false)}
        memberId={memberId}
        existingDisciplineIds={belts?.map((b) => b.discipline_id) || []}
      />

      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false)
          setSelectedDisciplineId(null)
        }}
        title="Promotie Geschiedenis"
        size="md"
      >
        {history && history.length > 0 ? (
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-4 bg-white/5 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-4 h-4 rounded-full border border-white/20 ${
                      BELT_COLORS[h.to_belt] || 'bg-gray-500'
                    }`}
                  />
                  <span className="text-[14px] text-neutral-50 capitalize">
                    {h.from_belt ? `${h.from_belt} → ` : ''}{h.to_belt}
                    {h.to_stripes ? ` ${h.to_stripes} stripes` : ''}
                  </span>
                </div>
                <div className="text-[12px] text-neutral-500 space-y-1">
                  <p>{new Date(h.promoted_at!).toLocaleDateString('nl-BE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</p>
                  <p>{h.trainings_at_promotion} trainingen op moment van promotie</p>
                  {h.promoter && (
                    <p>Door: {h.promoter.first_name} {h.promoter.last_name}</p>
                  )}
                  {h.notes && <p className="italic">{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-neutral-500 text-center py-8">
            Geen promotie geschiedenis
          </p>
        )}
      </Modal>
    </>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/members/BeltProgressCard.tsx
git commit -m "feat: add BeltProgressCard component"
```

---

## Task 12: Component - BeltPromotionModal

**Files:**
- Create: `src/components/members/BeltPromotionModal.tsx`

**Step 1: Create component file**

```typescript
// src/components/members/BeltPromotionModal.tsx
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '../ui'
import { usePromoteMember } from '../../hooks/useMemberBelts'
import { useMembers } from '../../hooks/useMembers'

interface BeltPromotionModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
  currentBelt: {
    discipline_id: string
    disciplines: { name: string; color: string } | null
    belt_color: string
    stripes: number
    dan_grade: number | null
    training_count?: number
  }
}

const BELT_ORDER = ['white', 'yellow', 'green', 'blue', 'purple', 'brown', 'black']
const BELT_LABELS: Record<string, string> = {
  white: 'Wit',
  yellow: 'Geel',
  green: 'Groen',
  blue: 'Blauw',
  purple: 'Paars',
  brown: 'Bruin',
  black: 'Zwart',
}

export function BeltPromotionModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  currentBelt,
}: BeltPromotionModalProps) {
  const [toBelt, setToBelt] = useState(currentBelt.belt_color)
  const [toStripes, setToStripes] = useState(currentBelt.stripes)
  const [toDan, setToDan] = useState<number | undefined>(currentBelt.dan_grade || undefined)
  const [promotedBy, setPromotedBy] = useState<string>('')
  const [notes, setNotes] = useState('')

  const { mutate: promote, isPending } = usePromoteMember()
  const { data: coaches } = useMembers({ role: 'coach' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    promote(
      {
        memberId,
        disciplineId: currentBelt.discipline_id,
        fromBelt: currentBelt.belt_color,
        fromStripes: currentBelt.stripes,
        toBelt,
        toStripes,
        toDan: toBelt === 'black' ? toDan : undefined,
        promotedBy: promotedBy || undefined,
        trainingsAtPromotion: currentBelt.training_count || 0,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  const isBlackBelt = toBelt === 'black'
  const currentBeltIndex = BELT_ORDER.indexOf(currentBelt.belt_color)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gordel Promotie" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Member info */}
        <div className="p-4 bg-white/5 rounded-xl">
          <p className="text-[14px] text-neutral-300">
            <span className="text-neutral-500">Lid:</span> {memberName}
          </p>
          <p className="text-[14px] text-neutral-300 mt-1">
            <span className="text-neutral-500">Discipline:</span>{' '}
            <span style={{ color: currentBelt.disciplines?.color }}>
              {currentBelt.disciplines?.name}
            </span>
          </p>
          <p className="text-[14px] text-neutral-300 mt-1">
            <span className="text-neutral-500">Huidige gordel:</span>{' '}
            {BELT_LABELS[currentBelt.belt_color]} {currentBelt.stripes} stripes
          </p>
          <p className="text-[14px] text-neutral-300 mt-1">
            <span className="text-neutral-500">Trainingen:</span>{' '}
            {currentBelt.training_count || 0}
          </p>
        </div>

        {/* New belt selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Nieuwe Gordel
            </label>
            <select
              value={toBelt}
              onChange={(e) => {
                setToBelt(e.target.value)
                if (e.target.value !== 'black') setToDan(undefined)
              }}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            >
              {BELT_ORDER.slice(currentBeltIndex).map((belt) => (
                <option key={belt} value={belt}>
                  {BELT_LABELS[belt]}
                </option>
              ))}
            </select>
          </div>

          {isBlackBelt ? (
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Dan
              </label>
              <select
                value={toDan || 1}
                onChange={(e) => setToDan(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((dan) => (
                  <option key={dan} value={dan}>
                    {dan}e Dan
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Stripes
              </label>
              <select
                value={toStripes}
                onChange={(e) => setToStripes(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              >
                {[0, 1, 2, 3, 4].map((s) => (
                  <option key={s} value={s}>
                    {s} stripe{s !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Promoted by */}
        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Gepromoveerd door (optioneel)
          </label>
          <select
            value={promotedBy}
            onChange={(e) => setPromotedBy(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
          >
            <option value="">Selecteer coach...</option>
            {coaches?.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.first_name} {coach.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Notities (optioneel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Bijv. 'Gepromoveerd tijdens seminar'"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-3 text-[15px] text-neutral-300 hover:text-neutral-50 transition"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
          >
            {isPending && <Loader2 size={18} className="animate-spin" />}
            {isPending ? 'Opslaan...' : 'Promotie Registreren'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/members/BeltPromotionModal.tsx
git commit -m "feat: add BeltPromotionModal component"
```

---

## Task 13: Component - AddBeltModal

**Files:**
- Create: `src/components/members/AddBeltModal.tsx`

**Step 1: Create component file**

```typescript
// src/components/members/AddBeltModal.tsx
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '../ui'
import { useDisciplines } from '../../hooks/useDisciplines'
import { useAddMemberBelt } from '../../hooks/useMemberBelts'

interface AddBeltModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  existingDisciplineIds: string[]
}

const BELT_ORDER = ['white', 'yellow', 'green', 'blue', 'purple', 'brown', 'black']
const BELT_LABELS: Record<string, string> = {
  white: 'Wit',
  yellow: 'Geel',
  green: 'Groen',
  blue: 'Blauw',
  purple: 'Paars',
  brown: 'Bruin',
  black: 'Zwart',
}

export function AddBeltModal({
  isOpen,
  onClose,
  memberId,
  existingDisciplineIds,
}: AddBeltModalProps) {
  const [disciplineId, setDisciplineId] = useState('')
  const [beltColor, setBeltColor] = useState('white')
  const [stripes, setStripes] = useState(0)
  const [danGrade, setDanGrade] = useState<number | undefined>()

  const { data: disciplines } = useDisciplines()
  const { mutate: addBelt, isPending } = useAddMemberBelt()

  // Filter out disciplines that already have belts
  const availableDisciplines = disciplines?.filter(
    (d) => d.has_belt_system && !existingDisciplineIds.includes(d.id)
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!disciplineId) return

    addBelt(
      {
        member_id: memberId,
        discipline_id: disciplineId,
        belt_color: beltColor,
        stripes,
        dan_grade: beltColor === 'black' ? danGrade : null,
      },
      {
        onSuccess: () => {
          // Reset form
          setDisciplineId('')
          setBeltColor('white')
          setStripes(0)
          setDanGrade(undefined)
          onClose()
        },
      }
    )
  }

  const isBlackBelt = beltColor === 'black'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gordel Toevoegen" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {availableDisciplines && availableDisciplines.length > 0 ? (
          <>
            {/* Discipline selection */}
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Discipline
              </label>
              <select
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              >
                <option value="">Selecteer discipline...</option>
                {availableDisciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Belt selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                  Gordel
                </label>
                <select
                  value={beltColor}
                  onChange={(e) => {
                    setBeltColor(e.target.value)
                    if (e.target.value !== 'black') setDanGrade(undefined)
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
                >
                  {BELT_ORDER.map((belt) => (
                    <option key={belt} value={belt}>
                      {BELT_LABELS[belt]}
                    </option>
                  ))}
                </select>
              </div>

              {isBlackBelt ? (
                <div>
                  <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                    Dan
                  </label>
                  <select
                    value={danGrade || 1}
                    onChange={(e) => setDanGrade(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((dan) => (
                      <option key={dan} value={dan}>
                        {dan}e Dan
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                    Stripes
                  </label>
                  <select
                    value={stripes}
                    onChange={(e) => setStripes(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
                  >
                    {[0, 1, 2, 3, 4].map((s) => (
                      <option key={s} value={s}>
                        {s} stripe{s !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-6 py-3 text-[15px] text-neutral-300 hover:text-neutral-50 transition"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={isPending || !disciplineId}
                className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
              >
                {isPending && <Loader2 size={18} className="animate-spin" />}
                {isPending ? 'Opslaan...' : 'Toevoegen'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-[14px] text-neutral-500">
              Alle disciplines met gordelsysteem zijn al toegevoegd.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-[14px] text-amber-300 hover:text-amber-200"
            >
              Sluiten
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/members/AddBeltModal.tsx
git commit -m "feat: add AddBeltModal component"
```

---

## Task 14: Update MemberDetail Page

**Files:**
- Modify: `src/pages/MemberDetail.tsx`

**Step 1: Add BeltProgressCard import and component**

Add import at top of file (after line 17):

```typescript
import { BeltProgressCard } from '../components/members/BeltProgressCard'
```

Add BeltProgressCard component after Quick Stats section (after line 269, before Subscriptions):

```typescript
      {/* Belt Progress */}
      <BeltProgressCard
        memberId={member.id}
        memberName={`${member.first_name} ${member.last_name}`}
      />
```

**Step 2: Commit**

```bash
git add src/pages/MemberDetail.tsx
git commit -m "feat: add BeltProgressCard to MemberDetail page"
```

---

## Task 15: Schedule Page - Basic Implementation

**Files:**
- Modify: `src/pages/Schedule.tsx`

**Step 1: Replace placeholder with basic schedule grid**

Replace entire file content with:

```typescript
// src/pages/Schedule.tsx
import { useState } from 'react'
import { Plus, Calendar, Clock, Users, Loader2 } from 'lucide-react'
import { Modal } from '../components/ui'
import { useClasses, useCreateClass } from '../hooks/useClasses'
import { useDisciplines } from '../hooks/useDisciplines'
import { useMembers } from '../hooks/useMembers'

const DAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
const DAYS_SHORT = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']

export function Schedule() {
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false)
  const { data: classes, isLoading } = useClasses()

  // Group classes by day
  const classesByDay = DAYS.map((_, dayIndex) =>
    classes?.filter((c) => c.day_of_week === dayIndex) || []
  )

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Rooster</h1>
          <p className="text-[14px] text-neutral-400 mt-1">Lesrooster en planning</p>
        </div>
        <button
          onClick={() => setIsNewClassModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
        >
          <Plus size={18} strokeWidth={1.5} />
          <span>Nieuwe Les</span>
        </button>
      </div>

      {/* Schedule Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-neutral-500" size={32} />
        </div>
      ) : (
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
          style={{
            position: 'relative',
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          } as React.CSSProperties}
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {DAYS.map((day, i) => (
              <div
                key={day}
                className={`p-4 text-center border-r border-white/5 last:border-r-0 ${
                  i === new Date().getDay() ? 'bg-amber-500/10' : ''
                }`}
              >
                <span className="hidden md:inline text-[14px] font-medium text-neutral-300">
                  {day}
                </span>
                <span className="md:hidden text-[14px] font-medium text-neutral-300">
                  {DAYS_SHORT[i]}
                </span>
              </div>
            ))}
          </div>

          {/* Classes grid */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {classesByDay.map((dayClasses, dayIndex) => (
              <div
                key={dayIndex}
                className={`border-r border-white/5 last:border-r-0 p-2 space-y-2 ${
                  dayIndex === new Date().getDay() ? 'bg-amber-500/5' : ''
                }`}
              >
                {dayClasses
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3 rounded-xl cursor-pointer hover:ring-1 hover:ring-white/20 transition"
                      style={{ backgroundColor: `${cls.disciplines?.color}20` }}
                    >
                      <p
                        className="text-[12px] font-medium truncate"
                        style={{ color: cls.disciplines?.color }}
                      >
                        {cls.name}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                      </p>
                      {cls.coach && (
                        <p className="text-[10px] text-neutral-500 mt-1 truncate">
                          {cls.coach.first_name} {cls.coach.last_name}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {classes && classes.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {Array.from(new Set(classes.map((c) => c.disciplines?.name))).map((name) => {
            const discipline = classes.find((c) => c.disciplines?.name === name)?.disciplines
            if (!discipline) return null
            return (
              <div key={name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: discipline.color }}
                />
                <span className="text-[12px] text-neutral-400">{name}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* New Class Modal */}
      <NewClassModal
        isOpen={isNewClassModalOpen}
        onClose={() => setIsNewClassModalOpen(false)}
      />
    </div>
  )
}

function NewClassModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [disciplineId, setDisciplineId] = useState('')
  const [coachId, setCoachId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('20:00')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [room, setRoom] = useState('')

  const { data: disciplines } = useDisciplines()
  const { data: coaches } = useMembers({ role: 'coach' })
  const { mutate: createClass, isPending } = useCreateClass()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    createClass(
      {
        name,
        discipline_id: disciplineId,
        coach_id: coachId || null,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
        room: room || null,
      },
      {
        onSuccess: () => {
          // Reset form
          setName('')
          setDisciplineId('')
          setCoachId('')
          setDayOfWeek(1)
          setStartTime('19:00')
          setEndTime('20:00')
          setMaxCapacity('')
          setRoom('')
          onClose()
        },
      }
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nieuwe Les" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Naam *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="BJJ Fundamentals"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Discipline *
            </label>
            <select
              value={disciplineId}
              onChange={(e) => setDisciplineId(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            >
              <option value="">Selecteer...</option>
              {disciplines?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Coach
            </label>
            <select
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            >
              <option value="">Selecteer...</option>
              {coaches?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Dag *
          </label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
          >
            {DAYS.map((day, i) => (
              <option key={i} value={i}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Start tijd *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            />
          </div>
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Eind tijd *
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Max capaciteit
            </label>
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="Onbeperkt"
              min="1"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
            />
          </div>
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Zaal
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Zaal 1"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-3 text-[15px] text-neutral-300 hover:text-neutral-50 transition"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isPending || !name || !disciplineId}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
          >
            {isPending && <Loader2 size={18} className="animate-spin" />}
            {isPending ? 'Opslaan...' : 'Aanmaken'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

**Step 2: Commit**

```bash
git add src/pages/Schedule.tsx
git commit -m "feat: implement Schedule page with class management"
```

---

## Task 16: Update useMembers Hook for Role Filter

**Files:**
- Modify: `src/hooks/useMembers.ts`

**Step 1: Read current file to see structure**

Check current implementation and add role filter if needed.

**Step 2: Add role filter parameter**

Ensure the hook accepts a `role` filter option for filtering coaches.

**Step 3: Commit**

```bash
git add src/hooks/useMembers.ts
git commit -m "feat: add role filter to useMembers hook"
```

---

## Task 17: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update MVP Features section**

Update the "Should Have" and completed items to reflect new features.

**Step 2: Update Plan Volgende Sessie section**

Update with new priorities now that training tracking is implemented.

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with training tracking progress"
```

---

---

## Task 18: Schedule - Edit Class Modal

**Files:**
- Modify: `src/pages/Schedule.tsx`

**Step 1: Add EditClassModal component**

Create modal to edit existing class details:
- Name, discipline, coach
- Day of week, start/end time
- Max capacity, room
- Delete class option

**Step 2: Add click handler to class cards**

When clicking a class in the schedule, open EditClassModal.

**Step 3: Add useUpdateClass and useDeleteClass mutations**

Add to `useClasses.ts` hook.

**Step 4: Commit**

```bash
git add src/pages/Schedule.tsx src/hooks/useClasses.ts
git commit -m "feat: add edit/delete functionality to schedule classes"
```

---

## Task 19: Schedule - Recurring Classes (Bulk Create)

**Files:**
- Modify: `src/pages/Schedule.tsx`
- Create: `supabase/migrations/013_class_instances.sql`

**Step 1: Database - Class instances table**

```sql
-- Classes worden templates, instances zijn de daadwerkelijke lessen
CREATE TABLE IF NOT EXISTS class_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  coach_id UUID REFERENCES members(id) ON DELETE SET NULL,
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Step 2: Add recurrence options to NewClassModal**

- Checkbox: "Wekelijks herhalen"
- Date picker: "Herhalen tot en met"
- Generate instances for each week

**Step 3: Add useCreateRecurringClasses mutation**

Creates class template + all instances until end date.

**Step 4: Commit**

```bash
git add supabase/migrations/013_class_instances.sql src/pages/Schedule.tsx src/hooks/useClasses.ts
git commit -m "feat: add recurring class creation with bulk instances"
```

---

## Summary

This plan implements:
1. **6 database migrations** - disciplines, classes, reservations, member_belts, belt_history, extensions
2. **4 new hooks** - useDisciplines, useClasses, useReservations, useMemberBelts
3. **3 new components** - BeltProgressCard, BeltPromotionModal, AddBeltModal
4. **1 page update** - MemberDetail with belt progress
5. **1 page implementation** - Schedule with class management

**Added tasks:**
- Task 18: Edit/delete classes in schedule
- Task 19: Recurring classes (bulk create with end date)

**Not included (future tasks):**
- Reservations page (leden inschrijven)
- Check-in validation screen (QR scanner)
- CSV import met legacy training count
- Retentie score berekening
