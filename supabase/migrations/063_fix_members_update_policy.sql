-- =============================================
-- Migration 063: Fix Members UPDATE Policy
-- =============================================
-- Probleem: "Cannot coerce the result to a single JSON object" error
-- bij member updates.
--
-- Oorzaak: Migration 056 dropte "Authenticated users can update members"
-- en verving het met "Staff can update any member" die een subquery
-- naar members bevat, wat RLS recursie veroorzaakt.
-- Migration 060 dropte de oude recursieve policies maar niet deze.
--
-- Oplossing:
-- 1. Drop de problematische "Staff can update any member" policy
-- 2. Herstel de simpele "Authenticated users can update members" policy
-- 3. Houd de prevent_role_escalation trigger voor security
-- =============================================

-- Drop de problematische policy die recursie veroorzaakt
DROP POLICY IF EXISTS "Staff can update any member" ON members;

-- Drop ook "Users can update own profile" als die nog bestaat
DROP POLICY IF EXISTS "Users can update own profile" ON members;

-- Herstel de simpele update policy (geen subquery = geen recursie)
DROP POLICY IF EXISTS "Authenticated users can update members" ON members;
CREATE POLICY "Authenticated users can update members"
  ON members
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- SECURITY NOTE:
-- =============================================
-- Role-based permissies worden nu afgedwongen via:
-- 1. De prevent_role_escalation TRIGGER (migration 056) - voorkomt dat
--    non-admins roles kunnen wijzigen
-- 2. Applicatie-laag checks in usePermissions hook
--
-- Dit is veiliger dan RLS subqueries die recursie veroorzaken.
-- =============================================

COMMENT ON POLICY "Authenticated users can update members" ON members IS
  'All authenticated users can update members. Role changes are protected by prevent_role_escalation trigger.';
