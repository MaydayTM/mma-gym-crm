# AI Lead Agent - Design Document

**Datum:** 27 december 2025
**Status:** Brainstorm / Planning
**Auteur:** Claude AI + Mehdi

---

## 1. Executive Summary

Een AI-gestuurde Lead Agent die automatisch leads opvolgt, kwalificeert, en door de sales funnel begeleidt. De agent combineert rule-based automation voor voorspelbare flows met AI voor natuurlijke conversaties en intelligente beslissingen.

### Kernfunctionaliteit
- Automatische opvolging van leads via email en WhatsApp
- Intelligente intent detection en response generation
- Automatische status updates in de CRM pipeline
- Human handoff wanneer nodig
- Integratie met bestaande N8N workflows

### Geschatte Impact
- **Kosten:** ~€22/maand
- **Extra omzet:** +€138/maand (door betere conversie)
- **Tijdsbesparing:** 5-10 uur/maand

---

## 2. Probleemstelling

### Huidige Situatie
- Leads komen binnen via website contactformulier
- N8N workflow stuurt automatisch een AI-gegenereerd antwoord
- Verdere opvolging is handmatig
- Leads kunnen "verdwijnen" in de pipeline zonder follow-up
- Geen systematische tracking van conversaties

### Gewenste Situatie
- Volledige automatische opvolging tot conversie of verlies
- AI die natuurlijk communiceert en vragen beantwoordt
- Automatische pipeline updates op basis van acties
- Duidelijke escalatie naar mens wanneer nodig
- Complete audit trail van alle interacties

---

## 3. Architectuur Overzicht

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TRIGGER SOURCES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Website Form]  [WhatsApp]  [Email Reply]  [Stripe]  [Scheduled Jobs]      │
│        │              │            │           │              │              │
│        └──────────────┴────────────┴───────────┴──────────────┘              │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         N8N ORCHESTRATION                            │    │
│  │  - Webhook ontvangen                                                 │    │
│  │  - Data normalisatie                                                 │    │
│  │  - Routing naar juiste endpoint                                      │    │
│  │  - Error handling & retries                                          │    │
│  │  - Scheduled job triggers                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SUPABASE EDGE FUNCTIONS                           │    │
│  │                                                                      │    │
│  │  /lead-intake        - Nieuwe leads verwerken                        │    │
│  │  /agent-message      - Berichten verwerken + AI response             │    │
│  │  /agent-action       - Geplande acties uitvoeren                     │    │
│  │  /webhook-stripe     - Betalingen verwerken                          │    │
│  │  /webhook-whatsapp   - WhatsApp callbacks                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         SUPABASE DATABASE                            │    │
│  │                                                                      │    │
│  │  leads                 - Lead informatie                             │    │
│  │  lead_conversations    - Chat historie                               │    │
│  │  lead_agent_goals      - Doelstellingen per lead                     │    │
│  │  lead_agent_actions    - Geplande/uitgevoerde acties                 │    │
│  │  lead_agent_events     - Audit log                                   │    │
│  │  lead_agent_prompts    - AI prompt templates                         │    │
│  │  lead_agent_settings   - Configuratie                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      EXTERNAL SERVICES                               │    │
│  │                                                                      │    │
│  │  [OpenAI API]     - Intent detection + Response generation           │    │
│  │  [Resend]         - Email verzending                                 │    │
│  │  [Twilio/360d]    - WhatsApp Business API                            │    │
│  │  [Stripe]         - Payment processing                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Lead Lifecycle & Pipeline

### Pipeline Statussen

```
┌──────────┐    ┌───────────┐    ┌─────────────────┐    ┌────────────┐    ┌───────────┐
│   NEW    │───▶│ CONTACTED │───▶│ TRIAL_SCHEDULED │───▶│ TRIAL_DONE │───▶│ CONVERTED │
└──────────┘    └───────────┘    └─────────────────┘    └────────────┘    └───────────┘
     │               │                   │                    │
     │               │                   │                    │
     ▼               ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                                 LOST                                      │
│  (geen response na X dagen, expliciet niet geïnteresseerd, etc.)         │
└──────────────────────────────────────────────────────────────────────────┘
```

### Triggers voor Status Wijzigingen

| Van | Naar | Trigger |
|-----|------|---------|
| NEW | CONTACTED | Eerste bericht verstuurd (auto of handmatig) |
| CONTACTED | TRIAL_SCHEDULED | Proefles geboekt via booking link |
| TRIAL_SCHEDULED | TRIAL_DONE | Check-in geregistreerd of datum verstreken |
| TRIAL_DONE | CONVERTED | Abonnement gekocht (Stripe webhook) |
| * | LOST | 30 dagen geen activiteit OF expliciet "niet geïnteresseerd" |

---

## 5. AI vs Rule-Based Beslissingsmatrix

### Rule-Based (Geen AI nodig)

| Scenario | Actie |
|----------|-------|
| Nieuwe lead binnenkomt | Welkomstbericht sturen (template) |
| Geen response na 24u | Follow-up #1 sturen |
| Geen response na 72u | Follow-up #2 sturen |
| Proefles geboekt | Bevestiging + reminder sturen |
| Stripe betaling ontvangen | Lead → Member conversie |
| 30 dagen geen activiteit | Lead → Lost |

### AI-Gestuurd

| Scenario | AI Taak |
|----------|---------|
| Lead stelt vraag | Intent detecteren + passend antwoord genereren |
| Lead heeft bezwaar | Bezwaar herkennen + overtuigend antwoorden |
| Onduidelijk bericht | Verduidelijkingsvraag stellen |
| Complex verzoek | Escaleren naar mens met context |
| Lead vraagt om mens | Direct doorverbinden |

---

## 6. Database Schema

### Nieuwe Tabellen

```sql
-- ============================================
-- LEAD CONVERSATIONS (Chat historie)
-- ============================================
CREATE TABLE lead_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Bericht details
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms', 'website_chat')),

  -- Content
  message_content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',

  -- AI metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_model VARCHAR(50),
  ai_confidence DECIMAL(3, 2),

  -- Status tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- External IDs
  external_message_id VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LEAD AGENT GOALS (Doelstellingen per lead)
-- ============================================
CREATE TABLE lead_agent_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Goal definitie
  goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN (
    'qualify',           -- Lead kwalificeren
    'book_trial',        -- Proefles inplannen
    'complete_trial',    -- Proefles afgerond
    'close_sale',        -- Abonnement verkopen
    'reactivate'         -- Verloren lead reactiveren
  )),

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'paused')),

  -- Progress
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LEAD AGENT ACTIONS (Geplande acties)
-- ============================================
CREATE TABLE lead_agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES lead_agent_goals(id),

  -- Actie definitie
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'send_message',
    'update_status',
    'schedule_follow_up',
    'assign_to_human',
    'send_booking_link',
    'send_checkout_link'
  )),

  -- Parameters (JSON)
  parameters JSONB DEFAULT '{}',

  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Execution
  status VARCHAR(20) DEFAULT 'pending',
  executed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LEAD AGENT EVENTS (Audit log)
-- ============================================
CREATE TABLE lead_agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  source VARCHAR(50) NOT NULL,  -- 'webhook', 'agent', 'n8n', 'manual'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROMPT TEMPLATES
-- ============================================
CREATE TABLE lead_agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),  -- 'welcome', 'follow_up', 'objection', 'booking'

  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,

  model VARCHAR(50) DEFAULT 'gpt-4o-mini',
  temperature DECIMAL(2, 1) DEFAULT 0.7,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AGENT SETTINGS
-- ============================================
CREATE TABLE lead_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agent_enabled BOOLEAN DEFAULT true,
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '21:00',
  timezone VARCHAR(50) DEFAULT 'Europe/Brussels',

  follow_up_delay_hours INTEGER DEFAULT 24,
  max_follow_ups INTEGER DEFAULT 3,
  days_until_lead_lost INTEGER DEFAULT 30,

  preferred_channel VARCHAR(20) DEFAULT 'whatsapp',
  default_model VARCHAR(50) DEFAULT 'gpt-4o-mini',
  escalation_threshold DECIMAL(3, 2) DEFAULT 0.6,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- UITBREIDING LEADS TABEL
-- ============================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS agent_enabled BOOLEAN DEFAULT true;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_channel VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_agent_contact_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS human_takeover BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS human_takeover_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_score INTEGER;
```

---

## 7. AI Prompt Engineering

### System Prompt (Basis)

```markdown
Je bent de virtuele assistent van Reconnect Academy, een MMA en BJJ gym in Aalst, België.

## Over Reconnect Academy
- Disciplines: BJJ (Brazilian Jiu-Jitsu), MMA, Kickboksen, Boksen, Muay Thai
- Head coach: Mehdi (BJJ zwarte band)
- Sfeer: Professioneel maar toegankelijk, voor beginners tot competitie-niveau

## Jouw rol
- Je helpt potentiële leden met informatie over de gym
- Je beantwoordt vragen over lessen, prijzen, en proeflessen
- Je doel is om geïnteresseerden te helpen een proefles te boeken
- Je bent vriendelijk, behulpzaam, en enthousiast over martial arts

## Richtlijnen
- Antwoord in het Nederlands (tenzij de lead in een andere taal schrijft)
- Houd antwoorden kort en to-the-point (max 3-4 zinnen)
- Eindig met een duidelijke call-to-action of vraag
- Als je iets niet zeker weet, zeg dat je het navraagt
- Noem jezelf NIET "AI" of "bot" - je bent "het team van Reconnect"

## Wat je NIET doet
- Geen medisch advies geven
- Geen exacte prijzen noemen (verwijs naar website of proefles)
- Geen beloftes maken over resultaten
- Geen negatieve uitspraken over andere gyms
```

### Intent Detection Prompt

```markdown
Analyseer het volgende bericht en bepaal de intentie.

## Mogelijke intenties
1. QUESTION - Vraagt informatie
2. BOOK_TRIAL - Wil proefles boeken
3. OBJECTION - Heeft bezwaar of twijfel
4. READY_TO_BUY - Wil direct lid worden
5. NOT_INTERESTED - Niet geïnteresseerd
6. REQUEST_HUMAN - Vraagt om persoon
7. UNCLEAR - Intentie onduidelijk

## Output (JSON)
{
  "intent": "BOOK_TRIAL",
  "confidence": 0.85,
  "entities": { "preferred_day": "maandag" },
  "suggested_action": "send_booking_link"
}
```

---

## 8. N8N Workflow Integratie

### Bestaande Flow (Behouden)
```
[Website Form] → [N8N] → [OpenAI] → [Email Response]
```

### Nieuwe Flows

#### Flow 1: Lead Intake
```
[Website Form] → [N8N: Normalize] → [POST /lead-intake] → [Welcome Message]
```

#### Flow 2: Inbound Messages
```
[WhatsApp/Email Webhook] → [N8N] → [POST /agent-message] → [AI Response]
```

#### Flow 3: Stripe Events
```
[Stripe Webhook] → [N8N: Filter] → [POST /webhook-stripe] → [Lead → Member]
```

#### Flow 4: Scheduled Jobs
```
[N8N Schedule: 15min] → [GET /agent/pending-actions] → [Execute Actions]
```

---

## 9. Gefaseerde Implementatie

### Fase 0: Voorbereiding (1-2 dagen)
- [ ] Database migratie uitvoeren
- [ ] Types regenereren
- [ ] Bestaande N8N flows documenteren
- [ ] 5 basis prompt templates schrijven

### Fase 1: Rule-Based Foundation (1 week)
**Wat werkt na deze fase:**
- Lead aanmaken via webhook
- Automatische welcome email
- Follow-up emails na X uur
- Stripe → Lead conversie
- Lead → Lost na 30 dagen

**Deliverables:**
- [ ] `/lead-intake` Edge Function
- [ ] `/webhook-stripe` Edge Function
- [ ] N8N workflow: Lead intake
- [ ] N8N workflow: Scheduled follow-ups
- [ ] Email templates in Resend

### Fase 2: AI Response Generation (1-2 weken)
**Wat werkt na deze fase:**
- AI analyseert inkomende berichten
- AI genereert natuurlijke antwoorden
- Automatische escalatie bij lage confidence
- Conversation log in CRM

**Deliverables:**
- [ ] `/agent-message` Edge Function met OpenAI
- [ ] Intent detection implementatie
- [ ] Response generation per scenario
- [ ] Escalation notifications
- [ ] CRM: Conversation panel in Lead Detail

### Fase 3: WhatsApp Integratie (1 week)
**Deliverables:**
- [ ] Twilio/360dialog account
- [ ] WhatsApp Business templates
- [ ] `/webhook-whatsapp` Edge Function
- [ ] Channel preference in lead profile

### Fase 4: Intelligence Layer (2 weken)
**Deliverables:**
- [ ] Lead qualification scoring
- [ ] Optimal send time calculation
- [ ] Prompt A/B testing
- [ ] Agent performance dashboard

### Fase 5: Optimization (Ongoing)
- Voice AI
- Instagram/Facebook DM
- Reactivatie campaigns
- Referral automation

---

## 10. Risico's en Mitigatie

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| AI stuurt ongepast bericht | Hoog | Confidence threshold, human review queue |
| WhatsApp Business ban | Hoog | Strict template usage, opt-in compliance |
| Klant voelt zich "ge-bot" | Medium | Duidelijke disclosure, snelle human handoff |
| Hoge AI kosten | Medium | GPT-4o-mini voor routine, caching |
| Foutieve lead matching | Medium | Strikte matching op email+phone |

### Safety Guardrails

```typescript
// Escalatie logic
async function shouldEscalate(intent, context) {
  if (intent.confidence < 0.6) return { escalate: true, reason: 'low_confidence' };
  if (['complaint', 'injury', 'refund'].includes(intent.type)) return { escalate: true, reason: 'sensitive' };
  if (context.failedAttempts >= 2) return { escalate: true, reason: 'repeated_failures' };
  if (intent.type === 'request_human') return { escalate: true, reason: 'user_requested' };
  return { escalate: false };
}
```

---

## 11. Kosten Schatting

### Maandelijks (bij 50 leads/maand)

| Service | Gebruik | Kosten |
|---------|---------|--------|
| OpenAI GPT-4o-mini | ~500 requests | ~€5 |
| OpenAI GPT-4o (escalaties) | ~50 requests | ~€2 |
| Resend Email | ~200 emails | Gratis |
| Twilio WhatsApp | ~300 messages | ~€15 |
| **Totaal** | | **~€22/maand** |

### ROI Berekening

```
Huidige situatie:
- 50 leads/maand × 10% conversie = 5 nieuwe leden
- 5 × €79 = €395/maand nieuwe omzet

Met AI Agent (+35% conversie uplift):
- 50 leads/maand × 13.5% conversie = 6.75 nieuwe leden
- Extra: 1.75 leden × €79 = €138/maand

Netto: €138 - €22 = €116/maand winst
+ Tijdsbesparing: 5-10 uur/maand
```

---

## 12. CRM UI Uitbreidingen

### Lead Detail Pagina

```tsx
<Tabs>
  <Tab label="Overzicht">
    {/* Bestaande lead info */}
  </Tab>

  <Tab label="Conversatie">
    <LeadConversationPanel leadId={lead.id} />
    <TakeOverButton onTakeOver={handleHumanTakeOver} />
    <ManualMessageInput onSend={handleManualMessage} />
  </Tab>

  <Tab label="Agent Goals">
    <AgentGoalTracker leadId={lead.id} />
  </Tab>

  <Tab label="Events">
    <LeadEventTimeline leadId={lead.id} />
  </Tab>
</Tabs>
```

### Agent Dashboard (Nieuw)
- Actieve leads met agent
- Pending actions queue
- Escalaties die aandacht nodig hebben
- Performance metrics (response time, conversie rate)

---

## 13. Benodigde Input

Voordat we starten, hebben we nodig:

1. **Prijsinformatie** - Wat mag de agent wel/niet delen?
2. **Proefles booking** - Is er al een booking systeem? URL?
3. **WhatsApp nummer** - Zakelijk nummer beschikbaar?
4. **Tone of voice** - Voorbeelden van huidige communicatie
5. **N8N access** - Kunnen we bestaande flows bekijken?

---

## 14. Volgende Stappen

### Deze Week
1. Review dit document
2. Beantwoord open vragen (sectie 13)
3. N8N flows auditen

### Volgende Sessie
1. Database migratie deployen
2. Fase 1 starten: Rule-based foundation

---

*Document gegenereerd: 27 december 2025*
*Laatste update: 27 december 2025*
