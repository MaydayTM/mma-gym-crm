-- =============================================
-- Migration: 051_enable_rls_production.sql
-- Doel: Enable RLS op ALLE tabellen voor productie
-- Datum: 9 januari 2026
-- =============================================
--
-- Deze migratie volgt het principe van least privilege:
-- - Authenticated users (staff) krijgen toegang tot CRM data
-- - Anon users krijgen GEEN toegang tot gevoelige data
-- - Door/hardware interactie gaat via Edge Functions met service_role
--
-- =============================================

-- =============================================
-- DEEL 1: Core CRM Tabellen
-- Status: RLS was disabled in migratie 014
-- =============================================

-- SUBSCRIPTIONS
-- Wie mag: Authenticated staff
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view all subscriptions" ON subscriptions;
CREATE POLICY "Authenticated can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage subscriptions" ON subscriptions;
CREATE POLICY "Authenticated can manage subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Revoke anon access
REVOKE ALL ON subscriptions FROM anon;

-- CHECKINS
-- Wie mag: Authenticated staff
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view all checkins" ON checkins;
CREATE POLICY "Authenticated can view all checkins"
  ON checkins FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage checkins" ON checkins;
CREATE POLICY "Authenticated can manage checkins"
  ON checkins FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON checkins FROM anon;

-- LEADS
-- Wie mag: Alleen staff (geen fighters/fans)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all leads" ON leads;
CREATE POLICY "Staff can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator', 'coach')
    )
  );

DROP POLICY IF EXISTS "Staff can manage leads" ON leads;
CREATE POLICY "Staff can manage leads"
  ON leads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator', 'coach')
    )
  );

REVOKE ALL ON leads FROM anon;

-- REVENUE
-- Wie mag: Alleen admin en medewerker (financiele data)
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view revenue" ON revenue;
CREATE POLICY "Admin can view revenue"
  ON revenue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  );

DROP POLICY IF EXISTS "Admin can manage revenue" ON revenue;
CREATE POLICY "Admin can manage revenue"
  ON revenue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  );

REVOKE ALL ON revenue FROM anon;

-- =============================================
-- DEEL 2: Task & Automation Tabellen
-- Status: RLS was disabled in migratie 014
-- =============================================

-- TASKS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view tasks" ON tasks;
CREATE POLICY "Authenticated can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage tasks" ON tasks;
CREATE POLICY "Authenticated can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON tasks FROM anon;

-- ACTIVITY_LOG
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view activity log" ON activity_log;
CREATE POLICY "Staff can view activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator')
    )
  );

-- Activity log is read-only voor staff, inserts via triggers/functions
DROP POLICY IF EXISTS "System can insert activity" ON activity_log;
CREATE POLICY "System can insert activity"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

REVOKE ALL ON activity_log FROM anon;

-- WEBHOOK_EVENTS (alleen service_role)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- Geen policies voor anon/authenticated - alleen via service_role
REVOKE ALL ON webhook_events FROM anon;
REVOKE ALL ON webhook_events FROM authenticated;

-- INTEGRATIONS (alleen admin)
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage integrations" ON integrations;
CREATE POLICY "Admin can manage integrations"
  ON integrations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role = 'admin'
    )
  );

REVOKE ALL ON integrations FROM anon;

-- =============================================
-- DEEL 3: Schedule & Class Tabellen
-- Status: RLS was disabled in migraties 012, 013, 014
-- =============================================

-- DISCIPLINES (read-only voor iedereen, write voor staff)
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view disciplines" ON disciplines;
CREATE POLICY "Anyone can view disciplines"
  ON disciplines FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage disciplines" ON disciplines;
CREATE POLICY "Staff can manage disciplines"
  ON disciplines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator')
    )
  );

-- CLASSES (read voor authenticated, write voor staff)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view classes" ON classes;
CREATE POLICY "Authenticated can view classes"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

-- Anon kan ook lessen zien (voor GymScreen display)
DROP POLICY IF EXISTS "Anon can view active classes" ON classes;
CREATE POLICY "Anon can view active classes"
  ON classes FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Staff can manage classes" ON classes;
CREATE POLICY "Staff can manage classes"
  ON classes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator', 'coach')
    )
  );

-- CLASS_INSTANCES
ALTER TABLE class_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view class instances" ON class_instances;
CREATE POLICY "Authenticated can view class instances"
  ON class_instances FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage class instances" ON class_instances;
CREATE POLICY "Staff can manage class instances"
  ON class_instances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator', 'coach')
    )
  );

REVOKE ALL ON class_instances FROM anon;

-- RESERVATIONS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view reservations" ON reservations;
CREATE POLICY "Authenticated can view reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can create reservations" ON reservations;
CREATE POLICY "Authenticated can create reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage all reservations" ON reservations;
CREATE POLICY "Staff can manage all reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator', 'coach')
    )
  );

DROP POLICY IF EXISTS "Staff can delete reservations" ON reservations;
CREATE POLICY "Staff can delete reservations"
  ON reservations FOR DELETE
  TO authenticated
  USING (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator', 'coach')
    )
  );

REVOKE ALL ON reservations FROM anon;

-- =============================================
-- DEEL 4: Belt Tabellen
-- Status: RLS was disabled in migraties 012, 014
-- =============================================

-- MEMBER_BELTS
ALTER TABLE member_belts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view belts" ON member_belts;
CREATE POLICY "Authenticated can view belts"
  ON member_belts FOR SELECT
  TO authenticated
  USING (true);

-- Anon kan gordels zien (voor GymScreen Belt Wall)
DROP POLICY IF EXISTS "Anon can view belts" ON member_belts;
CREATE POLICY "Anon can view belts"
  ON member_belts FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Staff can manage belts" ON member_belts;
CREATE POLICY "Staff can manage belts"
  ON member_belts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator', 'coach')
    )
  );

-- BELT_HISTORY
ALTER TABLE belt_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view belt history" ON belt_history;
CREATE POLICY "Authenticated can view belt history"
  ON belt_history FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage belt history" ON belt_history;
CREATE POLICY "Staff can manage belt history"
  ON belt_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator', 'coach')
    )
  );

REVOKE ALL ON belt_history FROM anon;

-- =============================================
-- DEEL 5: GPT-5 Geïdentificeerde Tabellen
-- Kleinere tabellen zonder RLS
-- =============================================

-- CLASS_TRACKS (referentie data)
ALTER TABLE class_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view class tracks" ON class_tracks;
CREATE POLICY "Authenticated can view class tracks"
  ON class_tracks FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage class tracks" ON class_tracks;
CREATE POLICY "Staff can manage class tracks"
  ON class_tracks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator')
    )
  );

REVOKE ALL ON class_tracks FROM anon;

-- ROOMS (referentie data)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view rooms" ON rooms;
CREATE POLICY "Authenticated can view rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage rooms" ON rooms;
CREATE POLICY "Staff can manage rooms"
  ON rooms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker', 'coordinator')
    )
  );

REVOKE ALL ON rooms FROM anon;

-- DOORS (hardware configuratie - alleen service_role)
ALTER TABLE doors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view doors" ON doors;
CREATE POLICY "Admin can view doors"
  ON doors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- Geen INSERT/UPDATE/DELETE voor client - alleen via Edge Function
REVOKE ALL ON doors FROM anon;

-- DOOR_ACCESS_LOGS (security logs - alleen service_role schrijft)
ALTER TABLE door_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view door logs" ON door_access_logs;
CREATE POLICY "Admin can view door logs"
  ON door_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  );

-- Geen INSERT voor client - Edge Function gebruikt service_role
REVOKE ALL ON door_access_logs FROM anon;

-- =============================================
-- DEEL 6: Module Tabellen
-- Status: RLS was disabled in migratie 017
-- =============================================

-- MODULES (referentie data - read-only)
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view modules" ON modules;
CREATE POLICY "Anyone can view modules"
  ON modules FOR SELECT
  TO anon, authenticated
  USING (true);

-- Alleen admins kunnen modules beheren
DROP POLICY IF EXISTS "Admin can manage modules" ON modules;
CREATE POLICY "Admin can manage modules"
  ON modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- TENANT_MODULE_SUBSCRIPTIONS
ALTER TABLE tenant_module_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view tenant modules" ON tenant_module_subscriptions;
CREATE POLICY "Authenticated can view tenant modules"
  ON tenant_module_subscriptions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can manage tenant modules" ON tenant_module_subscriptions;
CREATE POLICY "Admin can manage tenant modules"
  ON tenant_module_subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role = 'admin'
    )
  );

REVOKE ALL ON tenant_module_subscriptions FROM anon;

-- =============================================
-- DEEL 7: Discount Tabellen
-- Status: RLS was disabled in migratie 018
-- =============================================

-- Check if tables exist before altering
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'discounts') THEN
    ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated can view discounts" ON discounts;
    CREATE POLICY "Authenticated can view discounts"
      ON discounts FOR SELECT
      TO authenticated
      USING (true);

    DROP POLICY IF EXISTS "Admin can manage discounts" ON discounts;
    CREATE POLICY "Admin can manage discounts"
      ON discounts FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM members m
          WHERE m.id = auth.uid()
          AND m.role IN ('admin', 'medewerker')
        )
      );

    REVOKE ALL ON discounts FROM anon;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'pricing_discounts') THEN
    ALTER TABLE pricing_discounts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated can view pricing discounts" ON pricing_discounts;
    CREATE POLICY "Authenticated can view pricing discounts"
      ON pricing_discounts FOR SELECT
      TO authenticated
      USING (true);

    REVOKE ALL ON pricing_discounts FROM anon;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'member_subscription_discounts') THEN
    ALTER TABLE member_subscription_discounts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated can view member discounts" ON member_subscription_discounts;
    CREATE POLICY "Authenticated can view member discounts"
      ON member_subscription_discounts FOR SELECT
      TO authenticated
      USING (true);

    REVOKE ALL ON member_subscription_discounts FROM anon;
  END IF;
END $$;

-- =============================================
-- DEEL 8: Discount Codes
-- Status: RLS was disabled in migratie 020
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'discount_codes') THEN
    ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

    -- Public kan codes valideren (voor checkout)
    DROP POLICY IF EXISTS "Anyone can validate discount codes" ON discount_codes;
    CREATE POLICY "Anyone can validate discount codes"
      ON discount_codes FOR SELECT
      TO anon, authenticated
      USING (is_active = true);

    -- Staff kan alle codes beheren
    DROP POLICY IF EXISTS "Staff can manage discount codes" ON discount_codes;
    CREATE POLICY "Staff can manage discount codes"
      ON discount_codes FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM members m
          WHERE m.id = auth.uid()
          AND m.role IN ('admin', 'medewerker')
        )
      );
  END IF;
END $$;

-- =============================================
-- DOCUMENTATIE
-- =============================================

COMMENT ON POLICY "Staff can view all leads" ON leads IS
  'Leads zijn alleen zichtbaar voor staff (admin, medewerker, coordinator, coach). Fighters en fans hebben geen toegang.';

COMMENT ON POLICY "Admin can view revenue" ON revenue IS
  'Financiele data is alleen zichtbaar voor admin en medewerker rollen.';

COMMENT ON POLICY "Admin can view door logs" ON door_access_logs IS
  'Door access logs zijn security-gevoelig en alleen zichtbaar voor admin/medewerker. Schrijven gebeurt via Edge Function.';

-- =============================================
-- VERIFICATIE QUERY (voor debugging)
-- =============================================
-- Run deze query in Supabase SQL Editor om te verifiëren:
--
-- SELECT
--   schemaname,
--   tablename,
--   rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Alle tabellen moeten rowsecurity = true hebben
-- =============================================
