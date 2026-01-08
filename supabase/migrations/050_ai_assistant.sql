-- AI Assistant Module
-- Adds conversation history and helper functions for AI queries

-- ============================================
-- TABLES
-- ============================================

-- Conversation threads
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),  -- Auto-generated from first question
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual messages in conversations
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  query_type VARCHAR(50),  -- 'churn_risk', 'training_leaderboard', 'lead_followup', 'general'
  metadata JSONB,          -- Store query results, tokens used, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated ON ai_conversations(updated_at DESC);
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created ON ai_messages(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- For now, disable RLS (consistent with rest of development setup)
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated users full access to ai_conversations" ON ai_conversations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to ai_messages" ON ai_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS FOR AI QUERIES
-- ============================================

-- 1. CHURN RISK SCORING
-- Returns members at risk of churning with a risk score 0-100
CREATE OR REPLACE FUNCTION get_churn_risk_members()
RETURNS TABLE (
  member_id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  last_checkin DATE,
  days_since_checkin INTEGER,
  total_checkins_last_90_days BIGINT,
  avg_checkins_per_week NUMERIC,
  subscription_status VARCHAR,
  risk_score INTEGER,
  risk_factors TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH member_stats AS (
    SELECT
      m.id,
      m.first_name,
      m.last_name,
      m.email,
      m.last_checkin_at::DATE as last_checkin,
      COALESCE(CURRENT_DATE - m.last_checkin_at::DATE, 999) as days_since,
      COUNT(c.id) FILTER (WHERE c.checkin_at > NOW() - INTERVAL '90 days') as checkins_90d,
      ROUND(COUNT(c.id) FILTER (WHERE c.checkin_at > NOW() - INTERVAL '90 days')::NUMERIC / 13, 1) as avg_per_week,
      ms.status as sub_status
    FROM members m
    LEFT JOIN checkins c ON c.member_id = m.id
    LEFT JOIN member_subscriptions ms ON ms.member_id = m.id AND ms.status = 'active'
    WHERE m.status = 'active' AND m.role = 'fighter'
    GROUP BY m.id, m.first_name, m.last_name, m.email, m.last_checkin_at, ms.status
  )
  SELECT
    ms.id as member_id,
    ms.first_name,
    ms.last_name,
    ms.email,
    ms.last_checkin,
    ms.days_since::INTEGER as days_since_checkin,
    ms.checkins_90d as total_checkins_last_90_days,
    ms.avg_per_week as avg_checkins_per_week,
    COALESCE(ms.sub_status, 'none')::VARCHAR as subscription_status,
    -- Risk score calculation (0-100)
    LEAST(100, (
      CASE WHEN ms.days_since > 30 THEN 50
           WHEN ms.days_since > 14 THEN 30
           WHEN ms.days_since > 7 THEN 15
           ELSE 0 END +
      CASE WHEN ms.avg_per_week < 1 THEN 30
           WHEN ms.avg_per_week < 2 THEN 15
           ELSE 0 END +
      CASE WHEN ms.sub_status IS NULL THEN 20 ELSE 0 END
    ))::INTEGER as risk_score,
    -- Risk factors as array
    ARRAY_REMOVE(ARRAY[
      CASE WHEN ms.days_since > 14 THEN 'Niet getraind in ' || ms.days_since || ' dagen' END,
      CASE WHEN ms.avg_per_week < 1 THEN 'Laag trainingsgemiddelde (' || ms.avg_per_week || '/week)' END,
      CASE WHEN ms.sub_status IS NULL THEN 'Geen actief abonnement' END
    ], NULL) as risk_factors
  FROM member_stats ms
  WHERE ms.days_since > 7 OR ms.avg_per_week < 2 OR ms.sub_status IS NULL
  ORDER BY risk_score DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TRAINING LEADERBOARD
-- Returns top trainers for a given period
CREATE OR REPLACE FUNCTION get_training_leaderboard(
  p_period VARCHAR DEFAULT 'month',  -- 'week', 'month', 'year'
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  rank INTEGER,
  member_id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  total_checkins BIGINT,
  disciplines TEXT[]
) AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  start_date := CASE p_period
    WHEN 'week' THEN NOW() - INTERVAL '7 days'
    WHEN 'month' THEN NOW() - INTERVAL '30 days'
    WHEN 'year' THEN NOW() - INTERVAL '365 days'
    ELSE NOW() - INTERVAL '30 days'
  END;

  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(c.id) DESC)::INTEGER as rank,
    m.id as member_id,
    m.first_name,
    m.last_name,
    COUNT(c.id) as total_checkins,
    m.disciplines
  FROM members m
  JOIN checkins c ON c.member_id = m.id
  WHERE c.checkin_at >= start_date
    AND m.role = 'fighter'
  GROUP BY m.id, m.first_name, m.last_name, m.disciplines
  ORDER BY total_checkins DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. LEADS NEEDING FOLLOW-UP
-- Returns leads that need attention with urgency levels
CREATE OR REPLACE FUNCTION get_leads_needing_followup()
RETURNS TABLE (
  lead_id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  source VARCHAR,
  status VARCHAR,
  days_since_created INTEGER,
  days_since_last_contact INTEGER,
  interested_in TEXT[],
  urgency VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id as lead_id,
    l.first_name,
    l.last_name,
    l.email,
    l.phone,
    l.source,
    l.status,
    (CURRENT_DATE - l.created_at::DATE)::INTEGER as days_since_created,
    (CURRENT_DATE - COALESCE(l.updated_at, l.created_at)::DATE)::INTEGER as days_since_last_contact,
    l.interested_in,
    CASE
      WHEN l.status = 'new' AND (CURRENT_DATE - l.created_at::DATE) > 3 THEN 'high'
      WHEN l.status = 'contacted' AND (CURRENT_DATE - l.updated_at::DATE) > 7 THEN 'high'
      WHEN l.status = 'trial_scheduled' AND l.trial_date < NOW() THEN 'high'
      WHEN l.status = 'new' THEN 'medium'
      ELSE 'low'
    END::VARCHAR as urgency
  FROM leads l
  WHERE l.status NOT IN ('converted', 'lost')
    AND (
      (l.status = 'new' AND (CURRENT_DATE - l.created_at::DATE) >= 1) OR
      (l.status = 'contacted' AND (CURRENT_DATE - l.updated_at::DATE) >= 5) OR
      (l.status = 'trial_scheduled' AND l.trial_date < NOW() + INTERVAL '2 days') OR
      (l.status = 'trial_done' AND (CURRENT_DATE - l.updated_at::DATE) >= 2)
    )
  ORDER BY
    CASE
      WHEN l.status = 'new' AND (CURRENT_DATE - l.created_at::DATE) > 3 THEN 1
      WHEN l.status = 'contacted' AND (CURRENT_DATE - l.updated_at::DATE) > 7 THEN 1
      WHEN l.status = 'trial_scheduled' AND l.trial_date < NOW() THEN 1
      WHEN l.status = 'new' THEN 2
      ELSE 3
    END,
    l.created_at DESC
  LIMIT 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GENERAL STATS
-- Returns high-level stats for context
CREATE OR REPLACE FUNCTION get_gym_stats()
RETURNS TABLE (
  active_members BIGINT,
  new_members_this_month BIGINT,
  cancelled_this_month BIGINT,
  open_leads BIGINT,
  checkins_this_month BIGINT,
  checkins_last_month BIGINT,
  avg_checkins_per_member NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM members WHERE status = 'active' AND role = 'fighter') as active_members,
    (SELECT COUNT(*) FROM members WHERE status = 'active' AND created_at >= DATE_TRUNC('month', NOW())) as new_members_this_month,
    (SELECT COUNT(*) FROM members WHERE status = 'cancelled' AND updated_at >= DATE_TRUNC('month', NOW())) as cancelled_this_month,
    (SELECT COUNT(*) FROM leads WHERE status NOT IN ('converted', 'lost')) as open_leads,
    (SELECT COUNT(*) FROM checkins WHERE checkin_at >= DATE_TRUNC('month', NOW())) as checkins_this_month,
    (SELECT COUNT(*) FROM checkins WHERE checkin_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND checkin_at < DATE_TRUNC('month', NOW())) as checkins_last_month,
    (SELECT ROUND(COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM members WHERE status = 'active' AND role = 'fighter'), 0), 1) FROM checkins WHERE checkin_at >= DATE_TRUNC('month', NOW())) as avg_checkins_per_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. MEMBER COMPARISON (year over year)
-- Compare stats between two time periods
CREATE OR REPLACE FUNCTION get_period_comparison(
  p_metric VARCHAR DEFAULT 'signups',  -- 'signups', 'cancellations', 'checkins', 'revenue'
  p_period1_start DATE DEFAULT NULL,
  p_period1_end DATE DEFAULT NULL,
  p_period2_start DATE DEFAULT NULL,
  p_period2_end DATE DEFAULT NULL
)
RETURNS TABLE (
  period1_value BIGINT,
  period2_value BIGINT,
  change_absolute BIGINT,
  change_percentage NUMERIC
) AS $$
DECLARE
  v_period1_start DATE := COALESCE(p_period1_start, (DATE_TRUNC('month', NOW()) - INTERVAL '1 year')::DATE);
  v_period1_end DATE := COALESCE(p_period1_end, ((DATE_TRUNC('month', NOW()) - INTERVAL '1 year') + INTERVAL '1 month' - INTERVAL '1 day')::DATE);
  v_period2_start DATE := COALESCE(p_period2_start, DATE_TRUNC('month', NOW())::DATE);
  v_period2_end DATE := COALESCE(p_period2_end, (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day')::DATE);
  v_period1 BIGINT;
  v_period2 BIGINT;
BEGIN
  IF p_metric = 'signups' THEN
    SELECT COUNT(*) INTO v_period1 FROM members WHERE created_at::DATE BETWEEN v_period1_start AND v_period1_end;
    SELECT COUNT(*) INTO v_period2 FROM members WHERE created_at::DATE BETWEEN v_period2_start AND v_period2_end;
  ELSIF p_metric = 'cancellations' THEN
    SELECT COUNT(*) INTO v_period1 FROM members WHERE status = 'cancelled' AND updated_at::DATE BETWEEN v_period1_start AND v_period1_end;
    SELECT COUNT(*) INTO v_period2 FROM members WHERE status = 'cancelled' AND updated_at::DATE BETWEEN v_period2_start AND v_period2_end;
  ELSIF p_metric = 'checkins' THEN
    SELECT COUNT(*) INTO v_period1 FROM checkins WHERE checkin_at::DATE BETWEEN v_period1_start AND v_period1_end;
    SELECT COUNT(*) INTO v_period2 FROM checkins WHERE checkin_at::DATE BETWEEN v_period2_start AND v_period2_end;
  ELSE
    v_period1 := 0;
    v_period2 := 0;
  END IF;

  RETURN QUERY
  SELECT
    v_period1 as period1_value,
    v_period2 as period2_value,
    (v_period2 - v_period1) as change_absolute,
    CASE WHEN v_period1 > 0 THEN ROUND(((v_period2 - v_period1)::NUMERIC / v_period1) * 100, 1) ELSE 0 END as change_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_ai_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_conversation_timestamp
AFTER INSERT ON ai_messages
FOR EACH ROW EXECUTE FUNCTION update_ai_conversation_timestamp();
