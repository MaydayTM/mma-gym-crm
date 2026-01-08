# AI Gym Assistant - Phase 1 MVP Implementation Plan

> **Doel:** Een "AI medewerker" bouwen die in de CRM leeft en gym owners/coaches helpt met inzichten
> **Geschatte effort:** 25-30 uur
> **Datum:** 8 januari 2025

---

## 🎯 MVP Scope

### Core Features
1. **AI Chat Panel** - Zijpaneel in CRM waar je vragen kunt stellen
2. **3 "Wow" Query Types:**
   - Churn risk analyse ("Wie dreigt af te haken?")
   - Training leaderboard ("Wie heeft het meest getraind?")
   - Lead follow-up ("Welke leads moeten opgevolgd worden?")
3. **Conversation History** - Eerdere gesprekken bewaren

### Bewust NIET in MVP
- Scheduled reports (Phase 2)
- Proactieve notifications (Phase 2)
- Cohort analysis (Phase 3)
- Custom alerts (Phase 4)

---

## 🏗️ Architectuur

```
┌─────────────────────────────────────────────────────────────┐
│                        CRM Frontend                          │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Normal Pages  │    │      AI Assistant Panel         │ │
│  │   (Dashboard,   │    │  ┌─────────────────────────┐   │ │
│  │    Members,     │    │  │  💬 Conversation History │   │ │
│  │    etc.)        │    │  ├─────────────────────────┤   │ │
│  │                 │    │  │  [User question...]     │   │ │
│  │                 │    │  │  [AI response...]       │   │ │
│  │                 │    │  ├─────────────────────────┤   │ │
│  │                 │    │  │  📝 Type a question...  │   │ │
│  └─────────────────┘    │  └─────────────────────────┘   │ │
│                         └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Function: ai-assistant            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. Receive question                                      ││
│  │ 2. Determine query type (Claude classification)          ││
│  │ 3. Execute appropriate SQL query                         ││
│  │ 4. Format results with Claude                            ││
│  │ 5. Return natural language response                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              ┌──────────┐   ┌──────────┐   ┌──────────┐
              │ Supabase │   │  Claude  │   │ Supabase │
              │    DB    │   │   API    │   │  Storage │
              └──────────┘   └──────────┘   └──────────┘
```

### Waarom Edge Function?
1. **Security**: Claude API key blijft server-side
2. **Performance**: Geen extra latency op normale CRM pages
3. **Cost control**: Rate limiting en caching mogelijk
4. **Flexibility**: Query logic aanpassen zonder frontend deploy

---

## 📊 Database Schema

### Nieuwe tabellen

```sql
-- Conversation threads
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),  -- Auto-generated from first question
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual messages in conversations
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
  content TEXT NOT NULL,
  query_type VARCHAR(50),     -- 'churn_risk', 'training_leaderboard', 'lead_followup', 'general'
  metadata JSONB,             -- Store query results, tokens used, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);

-- RLS Policies
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users view own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own messages" ON ai_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );
```

### Helper Functions voor AI Queries

```sql
-- Churn risk scoring function
CREATE OR REPLACE FUNCTION get_churn_risk_members()
RETURNS TABLE (
  member_id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  last_checkin DATE,
  days_since_checkin INTEGER,
  total_checkins_last_90_days INTEGER,
  avg_checkins_per_week NUMERIC,
  subscription_status VARCHAR,
  risk_score INTEGER,  -- 0-100
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
    ms.id,
    ms.first_name,
    ms.last_name,
    ms.email,
    ms.last_checkin,
    ms.days_since::INTEGER,
    ms.checkins_90d::INTEGER,
    ms.avg_per_week,
    COALESCE(ms.sub_status, 'none'),
    -- Risk score calculation
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
    -- Risk factors
    ARRAY_REMOVE(ARRAY[
      CASE WHEN ms.days_since > 14 THEN 'Niet getraind in ' || ms.days_since || ' dagen' END,
      CASE WHEN ms.avg_per_week < 1 THEN 'Laag trainingsgemiddelde (' || ms.avg_per_week || '/week)' END,
      CASE WHEN ms.sub_status IS NULL THEN 'Geen actief abonnement' END
    ], NULL)
  FROM member_stats ms
  WHERE ms.days_since > 7 OR ms.avg_per_week < 2
  ORDER BY risk_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Training leaderboard function
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
  start_date TIMESTAMP;
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
    m.id,
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

-- Leads needing follow-up
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
  urgency VARCHAR  -- 'high', 'medium', 'low'
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.first_name,
    l.last_name,
    l.email,
    l.phone,
    l.source,
    l.status,
    (CURRENT_DATE - l.created_at::DATE)::INTEGER as days_created,
    (CURRENT_DATE - COALESCE(l.updated_at, l.created_at)::DATE)::INTEGER as days_contact,
    l.interested_in,
    CASE
      WHEN l.status = 'new' AND (CURRENT_DATE - l.created_at::DATE) > 3 THEN 'high'
      WHEN l.status = 'contacted' AND (CURRENT_DATE - l.updated_at::DATE) > 7 THEN 'high'
      WHEN l.status = 'trial_scheduled' AND l.trial_date < NOW() THEN 'high'
      WHEN l.status = 'new' THEN 'medium'
      ELSE 'low'
    END as urgency
  FROM leads l
  WHERE l.status NOT IN ('converted', 'lost')
    AND (
      (l.status = 'new' AND (CURRENT_DATE - l.created_at::DATE) > 1) OR
      (l.status = 'contacted' AND (CURRENT_DATE - l.updated_at::DATE) > 5) OR
      (l.status = 'trial_scheduled' AND l.trial_date < NOW() + INTERVAL '2 days') OR
      (l.status = 'trial_done' AND (CURRENT_DATE - l.updated_at::DATE) > 2)
    )
  ORDER BY
    CASE urgency WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    days_created DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔧 Edge Function: ai-assistant

### File: `supabase/functions/ai-assistant/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Query type definitions
const QUERY_TYPES = {
  CHURN_RISK: 'churn_risk',
  TRAINING_LEADERBOARD: 'training_leaderboard',
  LEAD_FOLLOWUP: 'lead_followup',
  GENERAL: 'general'
}

// System prompt for Claude
const SYSTEM_PROMPT = `Je bent de AI Assistent van Reconnect Academy, een MMA/BJJ gym in Aalst, België.
Je helpt gym eigenaren en coaches met inzichten over hun leden, leads en business.

Je hebt toegang tot de volgende data:
- Members: leden met hun check-in historie, abonnementen, gordels
- Leads: potentiële leden in de sales pipeline
- Check-ins: trainingsbezoeken per lid
- Revenue: omzet data

Communiceer in het Nederlands, vriendelijk maar professioneel.
Geef concrete, actionable inzichten.
Gebruik emoji's spaarzaam (alleen voor belangrijke highlights).
Bij lijsten, beperk tot top 5-10 tenzij anders gevraagd.`

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question, conversation_id } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get auth user from request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Step 1: Classify the question
    const queryType = await classifyQuestion(question, claudeApiKey)

    // Step 2: Execute appropriate query
    let queryResults = null
    switch (queryType) {
      case QUERY_TYPES.CHURN_RISK:
        const { data: churnData } = await supabase.rpc('get_churn_risk_members')
        queryResults = churnData
        break
      case QUERY_TYPES.TRAINING_LEADERBOARD:
        const period = extractPeriod(question)
        const { data: leaderboardData } = await supabase.rpc('get_training_leaderboard', {
          p_period: period,
          p_limit: 10
        })
        queryResults = leaderboardData
        break
      case QUERY_TYPES.LEAD_FOLLOWUP:
        const { data: leadsData } = await supabase.rpc('get_leads_needing_followup')
        queryResults = leadsData
        break
      default:
        // General question - get context data
        queryResults = await getGeneralContext(supabase)
    }

    // Step 3: Generate response with Claude
    const response = await generateResponse(question, queryType, queryResults, claudeApiKey)

    // Step 4: Save conversation
    let convId = conversation_id
    if (!convId) {
      const { data: newConv } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user.id, title: question.substring(0, 100) })
        .select()
        .single()
      convId = newConv.id
    }

    // Save messages
    await supabase.from('ai_messages').insert([
      { conversation_id: convId, role: 'user', content: question, query_type: queryType },
      { conversation_id: convId, role: 'assistant', content: response, query_type: queryType, metadata: { results_count: queryResults?.length } }
    ])

    return new Response(
      JSON.stringify({ response, conversation_id: convId, query_type: queryType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function classifyQuestion(question: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Classify this gym CRM question into one category. Reply with ONLY the category name.

Categories:
- churn_risk: Questions about members at risk of leaving, inactive members, retention
- training_leaderboard: Questions about who trained most, attendance rankings, top performers
- lead_followup: Questions about leads, follow-ups needed, sales pipeline
- general: Everything else

Question: "${question}"`
      }]
    })
  })

  const data = await response.json()
  const classification = data.content[0].text.toLowerCase().trim()

  if (Object.values(QUERY_TYPES).includes(classification)) {
    return classification
  }
  return QUERY_TYPES.GENERAL
}

function extractPeriod(question: string): string {
  const q = question.toLowerCase()
  if (q.includes('week')) return 'week'
  if (q.includes('jaar') || q.includes('year')) return 'year'
  return 'month'
}

async function getGeneralContext(supabase: any) {
  const [members, leads, checkins] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).not('status', 'in', '("converted","lost")'),
    supabase.from('checkins').select('*', { count: 'exact', head: true }).gte('checkin_at', new Date(Date.now() - 30*24*60*60*1000).toISOString())
  ])

  return {
    active_members: members.count,
    open_leads: leads.count,
    checkins_last_30_days: checkins.count
  }
}

async function generateResponse(question: string, queryType: string, results: any, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Vraag van de gebruiker: "${question}"

Query type: ${queryType}

Data uit de database:
${JSON.stringify(results, null, 2)}

Geef een duidelijk, actionable antwoord gebaseerd op deze data. Wees specifiek met namen en cijfers.`
      }]
    })
  })

  const data = await response.json()
  return data.content[0].text
}
```

---

## 🖥️ Frontend Components

### 1. AI Chat Panel (`src/components/ai/AIChatPanel.tsx`)

Een slide-over panel dat vanuit de rechterkant opent:

```typescript
// Features:
// - Floating action button (rechtsonder) om panel te openen
// - Conversation history list
// - Chat interface met message bubbles
// - Input field met send button
// - Loading states met typing indicator
// - Suggested questions voor nieuwe users
```

### 2. AI Chat Hook (`src/hooks/useAIChat.ts`)

```typescript
// Features:
// - Send question to Edge Function
// - Manage conversation state
// - Load conversation history
// - Optimistic updates voor snelle UX
```

### 3. Integration Points

- **Floating button** op alle pagina's (rechterkant, boven)
- **Quick actions** in Dashboard (cards met AI suggestions)
- **Member detail** - "Vraag AI over dit lid" button

---

## 📱 UI/UX Design

### Chat Panel Design

```
┌─────────────────────────────────────┐
│  🤖 AI Assistent          [X Close] │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ Eerdere gesprekken:          │  │
│  │ • Churn analyse (vandaag)    │  │
│  │ • Training stats (gisteren)  │  │
│  │ + Nieuw gesprek              │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Wie heeft het meest      │   │
│  │    getraind deze maand?     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🤖 Top 5 trainers december: │   │
│  │                             │   │
│  │ 1. Thomas V. - 24 sessies   │   │
│  │ 2. Sarah M. - 22 sessies    │   │
│  │ 3. Kevin D. - 20 sessies    │   │
│  │ ...                         │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  Suggesties:                        │
│  [Churn risk] [Top trainers] [Leads]│
├─────────────────────────────────────┤
│  ┌─────────────────────────┐ [Send] │
│  │ Stel een vraag...       │        │
│  └─────────────────────────┘        │
└─────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### Stap 1: Database Setup (30 min)
1. Create migration file for ai_conversations and ai_messages tables
2. Create SQL functions for churn risk, leaderboard, lead followup
3. Run `npx supabase db push`
4. Regenerate types

### Stap 2: Edge Function (2 uur)
1. Create `supabase/functions/ai-assistant/index.ts`
2. Add CLAUDE_API_KEY to Supabase secrets
3. Test locally with `npx supabase functions serve`
4. Deploy with `npx supabase functions deploy ai-assistant`

### Stap 3: Frontend Hook (1 uur)
1. Create `useAIChat.ts` hook
2. Handle conversation state
3. Error handling and loading states

### Stap 4: Chat Panel UI (2-3 uur)
1. Create AIChatPanel component
2. Add floating action button
3. Style chat bubbles
4. Add suggested questions
5. Integrate in main layout

### Stap 5: Testing & Polish (1 uur)
1. Test all 3 query types
2. Test edge cases (no data, errors)
3. Mobile responsive check
4. Deploy to production

---

## 💰 Cost Estimate

### Claude API Usage (per month)
- **Classification** (Haiku): ~$0.50 (1000 questions × $0.0005)
- **Response generation** (Sonnet): ~$15 (1000 questions × $0.015)
- **Total**: ~$15-20/month voor actief gebruik

### Supabase
- Edge Functions: Included in free tier (500K invocations)
- Database: No additional cost

---

## ✅ Success Criteria

MVP is succesvol als:
1. [ ] User kan vraag stellen in natural language
2. [ ] AI geeft correct antwoord voor alle 3 query types
3. [ ] Responses binnen 5 seconden
4. [ ] Conversation history werkt
5. [ ] Panel werkt op desktop en mobile
6. [ ] Kosten blijven onder €25/maand

---

## 🔮 Phase 2 Preview

Na succesvolle MVP:
- **Scheduled reports**: Wekelijkse digest email
- **Proactive alerts**: Push notifications voor urgente items
- **More query types**: Revenue analysis, class optimization
- **Context awareness**: "Vertel me meer over deze persoon" vanuit member detail

---

*Plan gemaakt: 8 januari 2025*
*Status: Ready for implementation*
