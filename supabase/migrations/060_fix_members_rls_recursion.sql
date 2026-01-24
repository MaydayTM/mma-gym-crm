-- =============================================
-- Migration 060: Fix Members RLS Infinite Recursion
-- =============================================
-- Probleem: get_my_role() functie leest van members tabel
-- terwijl het gebruikt wordt in RLS policies op members tabel
-- Dit veroorzaakt "infinite recursion detected in policy for relation members"
--
-- Oplossing:
-- 1. Drop alle oude policies die get_my_role() gebruiken (op ALLE tabellen)
-- 2. Drop get_my_role() functie
-- 3. De nieuwe policies uit migraties 047 en 051 blijven staan (die gebruiken USING(true))
-- =============================================

-- =============================================
-- STAP 1: Drop alle oude policies die get_my_role() gebruiken
-- =============================================

-- MEMBERS (problematische policies)
DROP POLICY IF EXISTS "Admins can do everything with members" ON members;
DROP POLICY IF EXISTS "Staff can view all members" ON members;
DROP POLICY IF EXISTS "Staff can update members" ON members;
DROP POLICY IF EXISTS "Users can view own profile" ON members;
DROP POLICY IF EXISTS "Users can update own profile" ON members;

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Admins can do everything with subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Staff can view subscriptions" ON subscriptions;

-- CHECKINS
DROP POLICY IF EXISTS "Admins can do everything with checkins" ON checkins;
DROP POLICY IF EXISTS "Staff can manage checkins" ON checkins;

-- LEADS
DROP POLICY IF EXISTS "Admins can do everything with leads" ON leads;
DROP POLICY IF EXISTS "Coaches can view assigned leads" ON leads;

-- REVENUE
DROP POLICY IF EXISTS "Admins can do everything with revenue" ON revenue;
DROP POLICY IF EXISTS "Staff can view revenue" ON revenue;

-- TASKS
DROP POLICY IF EXISTS "Admins can do everything with tasks" ON tasks;
DROP POLICY IF EXISTS "Staff can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Staff can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Coaches can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Coaches can update assigned tasks" ON tasks;

-- ACTIVITY_LOG
DROP POLICY IF EXISTS "Admins can do everything with activity_log" ON activity_log;
DROP POLICY IF EXISTS "Staff can view activity_log" ON activity_log;
DROP POLICY IF EXISTS "Staff can create activity_log entries" ON activity_log;

-- WEBHOOK_EVENTS
DROP POLICY IF EXISTS "Admins can do everything with webhook_events" ON webhook_events;

-- INTEGRATIONS
DROP POLICY IF EXISTS "Admins can do everything with integrations" ON integrations;
DROP POLICY IF EXISTS "Staff can view integration status" ON integrations;

-- DISCIPLINES
DROP POLICY IF EXISTS "Admins can manage disciplines" ON disciplines;

-- CLASSES
DROP POLICY IF EXISTS "Staff can view all classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
DROP POLICY IF EXISTS "Coordinators can manage classes" ON classes;

-- MEMBER_BELTS
DROP POLICY IF EXISTS "Staff can manage member belts" ON member_belts;

-- BELT_HISTORY
DROP POLICY IF EXISTS "Staff can create belt history" ON belt_history;

-- =============================================
-- STAP 2: Drop de problematische functie
-- =============================================
DROP FUNCTION IF EXISTS get_my_role();

-- =============================================
-- STAP 3: Voeg DELETE policy toe voor members
-- =============================================
-- De nieuwe policies uit migration 047 en 051 blijven staan:
-- - "Authenticated users can view all members" - USING (true)
-- - "Authenticated users can insert members" - WITH CHECK (true)
-- - "Authenticated users can update members" - USING (true) WITH CHECK (true)

DROP POLICY IF EXISTS "Authenticated users can delete members" ON members;
CREATE POLICY "Authenticated users can delete members"
  ON members
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DOCUMENTATIE
-- =============================================
-- De nieuwe RLS strategie is simpeler:
-- - Alle authenticated users kunnen alle data lezen en schrijven
-- - Rol-gebaseerde permissies worden afgedwongen in de applicatie laag
-- - Dit voorkomt RLS recursie problemen
--
-- Policies uit migration 051 blijven actief voor andere tabellen
-- =============================================
