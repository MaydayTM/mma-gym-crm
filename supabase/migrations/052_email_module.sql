-- ============================================
-- Email Module - Complete Email Marketing System
-- ============================================
-- Supports:
-- - Email templates met variabelen
-- - Campaigns (bulk mailing)
-- - Individual sends tracking
-- - Delivery/open/click tracking via webhooks
-- ============================================

-- 1. Email Templates
-- Herbruikbare templates met variabele placeholders
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(500) NOT NULL,

  -- Content
  body_html TEXT NOT NULL,           -- Full HTML content
  body_text TEXT,                    -- Plain text fallback

  -- Preview
  preview_text VARCHAR(200),         -- Email preview snippet

  -- Variables die gebruikt kunnen worden (voor UI hints)
  -- Bijv: ['first_name', 'last_name', 'subscription_name']
  available_variables TEXT[] DEFAULT ARRAY['first_name', 'last_name', 'email'],

  -- Categorisatie
  category VARCHAR(100) DEFAULT 'general',  -- 'welcome', 'reminder', 'promotion', 'newsletter', 'transactional'

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor snelle lookups
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

-- 2. Email Campaigns
-- Een campaign is een geplande of verzonden bulk mailing
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Campaign info
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Template koppeling (optioneel - kan ook custom content zijn)
  template_id UUID REFERENCES email_templates(id),

  -- Content (als geen template gebruikt)
  subject VARCHAR(500),
  body_html TEXT,
  body_text TEXT,

  -- Audience targeting
  -- Filter criteria als JSON: {"status": ["active"], "disciplines": ["bjj"]}
  audience_filter JSONB DEFAULT '{}',
  audience_count INTEGER DEFAULT 0,    -- Cached count

  -- Scheduling
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'scheduled', 'sending', 'sent', 'cancelled'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Stats (updated via webhooks)
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_complained INTEGER DEFAULT 0,  -- Spam complaints
  total_unsubscribed INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_at) WHERE status = 'scheduled';

-- 3. Email Sends
-- Individual email verzendingen (voor tracking)
CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Koppelingen
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- Recipient info (bewaard voor als member verwijderd wordt)
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),

  -- External provider tracking
  provider VARCHAR(50) DEFAULT 'resend',  -- 'resend', 'sendgrid', etc.
  provider_message_id VARCHAR(255),       -- ID van provider voor tracking

  -- Status
  status VARCHAR(50) DEFAULT 'pending',   -- 'pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed'

  -- Timing
  queued_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  first_opened_at TIMESTAMP WITH TIME ZONE,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  first_clicked_at TIMESTAMP WITH TIME ZONE,

  -- Tracking counts
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  -- Error info
  error_message TEXT,
  error_code VARCHAR(100),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes voor tracking lookups
CREATE INDEX idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX idx_email_sends_member ON email_sends(member_id);
CREATE INDEX idx_email_sends_provider_id ON email_sends(provider_message_id);
CREATE INDEX idx_email_sends_status ON email_sends(status);
CREATE INDEX idx_email_sends_sent_at ON email_sends(sent_at);

-- 4. Email Events
-- Detailed event log voor analytics
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  send_id UUID REFERENCES email_sends(id) ON DELETE CASCADE,

  -- Event info
  event_type VARCHAR(50) NOT NULL,  -- 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed'

  -- Click tracking
  clicked_url TEXT,

  -- Technical details
  user_agent TEXT,
  ip_address INET,

  -- Provider webhook data (raw)
  raw_payload JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_events_send ON email_events(send_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_created ON email_events(created_at);

-- 5. Email Unsubscribes
-- Leden die zich hebben uitgeschreven (wettelijk verplicht!)
CREATE TABLE email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email VARCHAR(255) NOT NULL UNIQUE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- Reden
  reason VARCHAR(255),

  -- Context
  unsubscribed_from_campaign_id UUID REFERENCES email_campaigns(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_unsubscribes_email ON email_unsubscribes(email);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Policies: Alleen admins en medewerkers kunnen email module gebruiken
CREATE POLICY "email_templates_admin_access" ON email_templates
  FOR ALL USING (true);  -- Voor nu open, later role-based

CREATE POLICY "email_campaigns_admin_access" ON email_campaigns
  FOR ALL USING (true);

CREATE POLICY "email_sends_admin_access" ON email_sends
  FOR ALL USING (true);

CREATE POLICY "email_events_admin_access" ON email_events
  FOR ALL USING (true);

CREATE POLICY "email_unsubscribes_admin_access" ON email_unsubscribes
  FOR ALL USING (true);

-- ============================================
-- Helper Functions
-- ============================================

-- Function: Check if email is unsubscribed
CREATE OR REPLACE FUNCTION is_email_unsubscribed(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_unsubscribes WHERE email = LOWER(check_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get campaign audience based on filters
CREATE OR REPLACE FUNCTION get_campaign_audience(filter_json JSONB)
RETURNS TABLE (
  member_id UUID,
  email VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as member_id,
    m.email,
    m.first_name,
    m.last_name
  FROM members m
  WHERE
    m.email IS NOT NULL
    AND m.email != ''
    AND NOT is_email_unsubscribed(m.email)
    -- Status filter
    AND (
      filter_json->>'status' IS NULL
      OR m.status = ANY(ARRAY(SELECT jsonb_array_elements_text(filter_json->'status')))
    )
    -- Role filter
    AND (
      filter_json->>'role' IS NULL
      OR m.role = ANY(ARRAY(SELECT jsonb_array_elements_text(filter_json->'role')))
    )
    -- Disciplines filter (any match)
    AND (
      filter_json->>'disciplines' IS NULL
      OR m.disciplines && ARRAY(SELECT jsonb_array_elements_text(filter_json->'disciplines'))
    )
  ORDER BY m.last_name, m.first_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update campaign stats (called by webhook handler)
CREATE OR REPLACE FUNCTION update_campaign_stats(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE email_campaigns
  SET
    total_sent = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = p_campaign_id AND status != 'pending'),
    total_delivered = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = p_campaign_id AND status IN ('delivered', 'opened', 'clicked')),
    total_opened = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = p_campaign_id AND first_opened_at IS NOT NULL),
    total_clicked = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = p_campaign_id AND first_clicked_at IS NOT NULL),
    total_bounced = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = p_campaign_id AND status = 'bounced'),
    total_complained = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = p_campaign_id AND status = 'complained'),
    updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Seed: Default Templates
-- ============================================

INSERT INTO email_templates (name, description, subject, body_html, category, available_variables) VALUES
(
  'Welkom Nieuw Lid',
  'Automatische welkomstmail voor nieuwe leden',
  'Welkom bij Reconnect Academy, {{first_name}}!',
  '<p>Welkom bij de Reconnect Academy familie!</p>
<p>We zijn super blij dat je hebt besloten om deel uit te maken van onze community. Of je nu komt voor BJJ, MMA, of kickboxing - je bent op de juiste plek.</p>
<p><strong>Wat je nu kunt doen:</strong></p>
<ul>
  <li>Download de app om lessen te reserveren</li>
  <li>Check het lesrooster op onze website</li>
  <li>Volg ons op Instagram voor tips en updates</li>
</ul>
<p>Heb je vragen? Stuur ons gerust een bericht of spreek een van de coaches aan!</p>',
  'welcome',
  ARRAY['first_name', 'last_name', 'email']
),
(
  'Betalingsherinnering',
  'Herinnering voor openstaande betalingen',
  'Herinnering: Je betaling voor {{subscription_name}}',
  '<p>We willen je er even aan herinneren dat je betaling voor <strong>{{subscription_name}}</strong> nog openstaat.</p>
<p>Geen zorgen, dit kan gebeuren! Je kunt je betaling eenvoudig afronden via onderstaande knop.</p>',
  'reminder',
  ARRAY['first_name', 'last_name', 'subscription_name', 'amount', 'due_date']
),
(
  'Gordel Promotie',
  'Felicitatie bij gordel promotie',
  'Gefeliciteerd met je {{belt_color}} gordel, {{first_name}}! 🥋',
  '<p>WAT EEN MILESTONE! 🎉</p>
<p>Je hebt officieel je <strong>{{belt_color}} gordel</strong> behaald in {{discipline}}!</p>
<p>Dit is het resultaat van al je harde werk, doorzettingsvermogen en toewijding. We zijn super trots op je!</p>
<p>Blijf zo doorgaan - de reis is nog lang niet voorbij. OSS! 🤙</p>',
  'transactional',
  ARRAY['first_name', 'last_name', 'belt_color', 'discipline', 'stripes']
),
(
  'Nieuwsbrief Template',
  'Basis template voor maandelijkse nieuwsbrief',
  '{{newsletter_title}} - Reconnect Academy',
  '<p>{{newsletter_content}}</p>',
  'newsletter',
  ARRAY['first_name', 'newsletter_title', 'newsletter_content']
),
(
  'Proefles Reminder',
  'Herinnering voor geplande proefles',
  'Je proefles morgen bij Reconnect Academy',
  '<p>Reminder: morgen is het zover! 💪</p>
<p>Je hebt een proefles gepland op <strong>{{trial_date}}</strong> voor <strong>{{discipline}}</strong>.</p>
<p><strong>Wat moet je meenemen?</strong></p>
<ul>
  <li>Sportkleding (korte broek en t-shirt)</li>
  <li>Handdoek</li>
  <li>Water</li>
  <li>Slippers voor in de gym</li>
</ul>
<p>Tot morgen!</p>',
  'reminder',
  ARRAY['first_name', 'trial_date', 'discipline', 'coach_name']
);

-- ============================================
-- Email module entry in modules table
-- ============================================

INSERT INTO modules (slug, name, description, icon, price_monthly, is_core)
VALUES (
  'email',
  'Email Marketing',
  'Professionele email campaigns versturen naar leden en leads',
  'Mail',
  19.00,
  false
) ON CONFLICT (slug) DO NOTHING;

-- Grant Reconnect 30-day trial for Email module
INSERT INTO tenant_module_subscriptions (tenant_id, module_id, status, trial_ends_at)
SELECT
  'reconnect',
  m.id,
  'trial',
  NOW() + INTERVAL '30 days'
FROM modules m
WHERE m.slug = 'email'
ON CONFLICT (tenant_id, module_id) DO NOTHING;
