-- 012_disable_rls_new_tables.sql
-- TIJDELIJK: Disable RLS voor nieuwe tabellen voor development
-- TODO: Re-enable voor productie!

-- Disable RLS op nieuwe tabellen
ALTER TABLE disciplines DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_belts DISABLE ROW LEVEL SECURITY;
ALTER TABLE belt_history DISABLE ROW LEVEL SECURITY;

-- Grant public access voor anon key
GRANT ALL ON disciplines TO anon;
GRANT ALL ON classes TO anon;
GRANT ALL ON reservations TO anon;
GRANT ALL ON member_belts TO anon;
GRANT ALL ON belt_history TO anon;
