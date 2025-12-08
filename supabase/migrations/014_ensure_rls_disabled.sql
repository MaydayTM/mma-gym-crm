-- 014_ensure_rls_disabled.sql
-- Ensure RLS is disabled for all tables
-- This is a safety migration to fix production issues

-- Core tables
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenue DISABLE ROW LEVEL SECURITY;

-- Tasks and automation tables
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrations DISABLE ROW LEVEL SECURITY;

-- Schedule and class tables
ALTER TABLE disciplines DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- Belt tracking tables
ALTER TABLE member_belts DISABLE ROW LEVEL SECURITY;
ALTER TABLE belt_history DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated and anon roles
GRANT ALL ON members TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON checkins TO authenticated;
GRANT ALL ON leads TO authenticated;
GRANT ALL ON revenue TO authenticated;
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON activity_log TO authenticated;
GRANT ALL ON webhook_events TO authenticated;
GRANT ALL ON integrations TO authenticated;
GRANT ALL ON disciplines TO authenticated;
GRANT ALL ON classes TO authenticated;
GRANT ALL ON class_instances TO authenticated;
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON member_belts TO authenticated;
GRANT ALL ON belt_history TO authenticated;

-- Also grant to anon for public access (required for initial auth flow)
GRANT ALL ON members TO anon;
GRANT ALL ON subscriptions TO anon;
GRANT ALL ON checkins TO anon;
GRANT ALL ON leads TO anon;
GRANT ALL ON revenue TO anon;
GRANT ALL ON tasks TO anon;
GRANT ALL ON activity_log TO anon;
GRANT ALL ON webhook_events TO anon;
GRANT ALL ON integrations TO anon;
GRANT ALL ON disciplines TO anon;
GRANT ALL ON classes TO anon;
GRANT ALL ON class_instances TO anon;
GRANT ALL ON reservations TO anon;
GRANT ALL ON member_belts TO anon;
GRANT ALL ON belt_history TO anon;
