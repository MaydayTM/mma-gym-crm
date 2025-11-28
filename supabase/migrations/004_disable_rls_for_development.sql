-- RCN CRM Database Schema
-- Migration: 004_disable_rls_for_development
-- TIJDELIJK: Disable RLS voor development/testing
-- TODO: Re-enable voor productie!

-- Disable RLS op alle tabellen
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenue DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrations DISABLE ROW LEVEL SECURITY;

-- Grant public access voor anon key
GRANT ALL ON members TO anon;
GRANT ALL ON subscriptions TO anon;
GRANT ALL ON checkins TO anon;
GRANT ALL ON leads TO anon;
GRANT ALL ON revenue TO anon;
GRANT ALL ON tasks TO anon;
GRANT ALL ON activity_log TO anon;
GRANT ALL ON webhook_events TO anon;
GRANT ALL ON integrations TO anon;
