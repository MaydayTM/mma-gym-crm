-- RCN CRM Database Schema
-- Migration: 003_tasks_and_automation
-- Adds: tasks, activity_log, webhook_events, integrations

-- ============================================
-- TASKS TABLE
-- Handmatige taken voor personeel
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Wat
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN (
    'call_lead', 'call_member', 'send_reminder', 'follow_up',
    'payment_reminder', 'trial_follow_up', 'retention_call', 'manual'
  )),

  -- Gekoppeld aan (minstens één moet ingevuld zijn, of beide NULL voor algemene taak)
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Wie & wanneer
  assigned_to UUID REFERENCES members(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'snoozed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES members(id) ON DELETE SET NULL,
  result_notes TEXT,

  -- Snooze functionaliteit
  snoozed_until TIMESTAMP WITH TIME ZONE,

  -- Automatisering context
  triggered_by VARCHAR(100),  -- 'payment_failed', 'new_lead', 'manual', 'member_at_risk', etc.
  workflow_id VARCHAR(100),   -- Reference naar n8n workflow ID

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes voor tasks
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tasks_member ON tasks(member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority) WHERE status = 'pending';

-- ============================================
-- ACTIVITY_LOG TABLE
-- Audit trail voor members en leads
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gekoppeld aan
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  -- Wat gebeurde
  action VARCHAR(100) NOT NULL,
  description TEXT,

  -- Details (flexibel JSON voor extra context)
  metadata JSONB DEFAULT '{}',

  -- Wie deed het
  performed_by UUID REFERENCES members(id) ON DELETE SET NULL,  -- NULL = systeem/automatisering
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN (
    'manual', 'n8n', 'stripe_webhook', 'system', 'cron', 'api'
  )),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes voor activity_log
CREATE INDEX IF NOT EXISTS idx_activity_member ON activity_log(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_lead ON activity_log(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at DESC);

-- ============================================
-- WEBHOOK_EVENTS TABLE
-- Log voor uitgaande webhooks naar n8n
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identificatie
  event_type VARCHAR(100) NOT NULL,

  -- Payload die gestuurd werd
  payload JSONB NOT NULL,

  -- Delivery status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'sending', 'sent', 'failed', 'retrying'
  )),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Response van webhook endpoint
  response_status INTEGER,
  response_body TEXT,

  -- Timing
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes voor webhook_events
CREATE INDEX IF NOT EXISTS idx_webhook_status ON webhook_events(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_retry ON webhook_events(next_retry_at) WHERE status = 'retrying';

-- ============================================
-- INTEGRATIONS TABLE
-- Configuratie voor externe services
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Welke integratie
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  description TEXT,

  -- Status
  enabled BOOLEAN DEFAULT false,

  -- Config (gebruik Supabase Vault voor secrets in productie)
  config JSONB DEFAULT '{}',

  -- Health check
  last_health_check_at TIMESTAMP WITH TIME ZONE,
  health_status VARCHAR(50) DEFAULT 'unknown' CHECK (health_status IN (
    'unknown', 'healthy', 'degraded', 'unhealthy'
  )),

  -- Metadata
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-populate met bekende integraties
INSERT INTO integrations (name, display_name, description, enabled) VALUES
  ('stripe', 'Stripe', 'Betalingen en abonnementen', false),
  ('n8n', 'n8n', 'Workflow automatisering', false),
  ('resend', 'Resend', 'Transactionele emails', false),
  ('whatsapp', 'WhatsApp Business', 'WhatsApp berichten', false)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger voor tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger voor integrations
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- TASKS policies
CREATE POLICY "Admins can do everything with tasks"
  ON tasks FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Staff can view all tasks"
  ON tasks FOR SELECT
  USING (get_my_role() IN ('medewerker', 'coordinator', 'coach'));

CREATE POLICY "Staff can manage tasks"
  ON tasks FOR ALL
  USING (get_my_role() IN ('medewerker', 'coordinator'));

CREATE POLICY "Coaches can view assigned tasks"
  ON tasks FOR SELECT
  USING (
    get_my_role() = 'coach' AND
    assigned_to IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Coaches can update assigned tasks"
  ON tasks FOR UPDATE
  USING (
    get_my_role() = 'coach' AND
    assigned_to IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
  );

-- ACTIVITY_LOG policies
CREATE POLICY "Admins can do everything with activity_log"
  ON activity_log FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Staff can view activity_log"
  ON activity_log FOR SELECT
  USING (get_my_role() IN ('medewerker', 'coordinator', 'coach'));

CREATE POLICY "Staff can create activity_log entries"
  ON activity_log FOR INSERT
  WITH CHECK (get_my_role() IN ('medewerker', 'coordinator', 'coach'));

-- WEBHOOK_EVENTS policies (admin only - sensitive debugging info)
CREATE POLICY "Admins can do everything with webhook_events"
  ON webhook_events FOR ALL
  USING (get_my_role() = 'admin');

-- INTEGRATIONS policies (admin only - contains API keys)
CREATE POLICY "Admins can do everything with integrations"
  ON integrations FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Staff can view integration status"
  ON integrations FOR SELECT
  USING (get_my_role() IN ('medewerker', 'coordinator'));

-- ============================================
-- VIEWS
-- ============================================

-- Pending tasks view voor dashboard
CREATE OR REPLACE VIEW pending_tasks_summary AS
SELECT
  assigned_to,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
  COUNT(*) FILTER (WHERE priority = 'high') as high_count,
  COUNT(*) FILTER (WHERE priority = 'normal') as normal_count,
  COUNT(*) FILTER (WHERE priority = 'low') as low_count,
  COUNT(*) as total_count,
  MIN(due_date) as earliest_due
FROM tasks
WHERE status = 'pending'
GROUP BY assigned_to;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT
  al.id,
  al.action,
  al.description,
  al.metadata,
  al.source,
  al.created_at,
  COALESCE(m.first_name || ' ' || m.last_name, l.first_name || ' ' || l.last_name) as subject_name,
  CASE
    WHEN al.member_id IS NOT NULL THEN 'member'
    WHEN al.lead_id IS NOT NULL THEN 'lead'
    ELSE 'system'
  END as subject_type,
  COALESCE(al.member_id, al.lead_id) as subject_id,
  p.first_name || ' ' || p.last_name as performed_by_name
FROM activity_log al
LEFT JOIN members m ON al.member_id = m.id
LEFT JOIN leads l ON al.lead_id = l.id
LEFT JOIN members p ON al.performed_by = p.id
ORDER BY al.created_at DESC;
