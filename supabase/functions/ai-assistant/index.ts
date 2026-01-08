import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Query type definitions
const QUERY_TYPES = {
  CHURN_RISK: 'churn_risk',
  TRAINING_LEADERBOARD: 'training_leaderboard',
  LEAD_FOLLOWUP: 'lead_followup',
  COMPARISON: 'comparison',
  GENERAL: 'general',
} as const

type QueryType = typeof QUERY_TYPES[keyof typeof QUERY_TYPES]

interface ChatRequest {
  question: string
  conversation_id?: string
}

// System prompt for Claude - Kitana persona
const SYSTEM_PROMPT = `Je bent Kitana, de AI assistent van Reconnect Academy, een MMA/BJJ gym in Aalst, België.
Je naam is geïnspireerd door het Mortal Kombat personage - je bent sterk, slim en altijd klaar om te helpen.
Je helpt gym eigenaren en coaches met inzichten over hun leden, leads en business.

Je hebt toegang tot de volgende data:
- Members: leden met hun check-in historie, abonnementen, gordels
- Leads: potentiële leden in de sales pipeline
- Check-ins: trainingsbezoeken per lid
- Subscriptions: abonnementen en prijzen

Persoonlijkheid:
- Je bent vriendelijk, behulpzaam en professioneel
- Je hebt passie voor martial arts en de gym community
- Je geeft concrete, actionable inzichten
- Je bent direct maar warm - geen onnodig lange teksten

Communicatie richtlijnen:
- Antwoord altijd in het Nederlands
- Gebruik emoji's spaarzaam (alleen voor belangrijke highlights: ⚠️ voor risico, 🏆 voor prestaties, 📞 voor follow-up)
- Bij lijsten, beperk tot top 10 tenzij anders gevraagd
- Noem specifieke namen en cijfers
- Als je geen data hebt, zeg dat eerlijk

Formatteer je antwoorden overzichtelijk met:
- Duidelijke kopjes waar nodig
- Bullet points voor lijsten
- Vetgedrukte tekst voor belangrijke namen of cijfers`

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get API keys from environment
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get auth user from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { question, conversation_id }: ChatRequest = await req.json()

    if (!question || typeof question !== 'string') {
      throw new Error('question is required')
    }

    // Step 1: Classify the question using Haiku (fast & cheap)
    const queryType = await classifyQuestion(question, anthropicApiKey)
    console.log(`Classified question as: ${queryType}`)

    // Step 2: Execute appropriate database query
    let queryResults: unknown = null
    let queryContext = ''

    switch (queryType) {
      case QUERY_TYPES.CHURN_RISK: {
        const { data, error } = await supabase.rpc('get_churn_risk_members')
        if (error) {
          console.error('Churn risk query error:', error)
          queryResults = []
        } else {
          queryResults = data
          queryContext = `Churn risk analyse - ${data?.length || 0} leden met verhoogd risico gevonden`
        }
        break
      }

      case QUERY_TYPES.TRAINING_LEADERBOARD: {
        const period = extractPeriod(question)
        const { data, error } = await supabase.rpc('get_training_leaderboard', {
          p_period: period,
          p_limit: 10,
        })
        if (error) {
          console.error('Leaderboard query error:', error)
          queryResults = []
        } else {
          queryResults = data
          queryContext = `Training leaderboard voor ${period === 'week' ? 'deze week' : period === 'year' ? 'dit jaar' : 'deze maand'}`
        }
        break
      }

      case QUERY_TYPES.LEAD_FOLLOWUP: {
        const { data, error } = await supabase.rpc('get_leads_needing_followup')
        if (error) {
          console.error('Lead followup query error:', error)
          queryResults = []
        } else {
          queryResults = data
          queryContext = `Leads die follow-up nodig hebben - ${data?.length || 0} gevonden`
        }
        break
      }

      case QUERY_TYPES.COMPARISON: {
        // Try to extract dates from question, otherwise use defaults (this month vs same month last year)
        const { data, error } = await supabase.rpc('get_period_comparison', {
          p_metric: extractMetric(question),
        })
        if (error) {
          console.error('Comparison query error:', error)
          queryResults = { period1_value: 0, period2_value: 0, change_absolute: 0, change_percentage: 0 }
        } else {
          queryResults = data?.[0] || { period1_value: 0, period2_value: 0, change_absolute: 0, change_percentage: 0 }
          queryContext = `Vergelijking tussen periodes`
        }
        break
      }

      default: {
        // General question - get overview stats
        const { data, error } = await supabase.rpc('get_gym_stats')
        if (error) {
          console.error('Stats query error:', error)
          queryResults = {}
        } else {
          queryResults = data?.[0] || {}
          queryContext = 'Algemene gym statistieken'
        }
      }
    }

    // Step 3: Generate response with Sonnet (better quality for user-facing responses)
    const response = await generateResponse(
      question,
      queryType,
      queryResults,
      queryContext,
      anthropicApiKey
    )

    // Step 4: Save conversation to database
    let convId = conversation_id
    if (!convId) {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: question.substring(0, 100),
        })
        .select('id')
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
      } else {
        convId = newConv.id
      }
    }

    // Save messages
    if (convId) {
      const { error: msgError } = await supabase.from('ai_messages').insert([
        {
          conversation_id: convId,
          role: 'user',
          content: question,
          query_type: queryType,
        },
        {
          conversation_id: convId,
          role: 'assistant',
          content: response,
          query_type: queryType,
          metadata: {
            results_count: Array.isArray(queryResults) ? queryResults.length : 1,
          },
        },
      ])

      if (msgError) {
        console.error('Error saving messages:', msgError)
      }
    }

    return new Response(
      JSON.stringify({
        response,
        conversation_id: convId,
        query_type: queryType,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in ai-assistant:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 400,
      }
    )
  }
})

/**
 * Classify the question into a query type using Claude Haiku
 */
async function classifyQuestion(question: string, apiKey: string): Promise<QueryType> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: `Classify this gym CRM question into ONE category. Reply with ONLY the category name, nothing else.

Categories:
- churn_risk: Questions about members at risk of leaving, inactive members, who might cancel, retention problems
- training_leaderboard: Questions about who trained most, attendance rankings, top performers, meest getraind
- lead_followup: Questions about leads, follow-ups needed, sales pipeline, potentiële leden
- comparison: Questions comparing two time periods, year-over-year, month comparisons
- general: Everything else (stats, overview, how many members, etc.)

Question: "${question}"`,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Classification API error:', await response.text())
      return QUERY_TYPES.GENERAL
    }

    const data = await response.json()
    const classification = data.content?.[0]?.text?.toLowerCase().trim()

    // Map to valid query type
    if (classification?.includes('churn')) return QUERY_TYPES.CHURN_RISK
    if (classification?.includes('leaderboard') || classification?.includes('training')) return QUERY_TYPES.TRAINING_LEADERBOARD
    if (classification?.includes('lead') || classification?.includes('followup')) return QUERY_TYPES.LEAD_FOLLOWUP
    if (classification?.includes('comparison')) return QUERY_TYPES.COMPARISON

    return QUERY_TYPES.GENERAL
  } catch (error) {
    console.error('Classification error:', error)
    return QUERY_TYPES.GENERAL
  }
}

/**
 * Extract time period from question
 */
function extractPeriod(question: string): 'week' | 'month' | 'year' {
  const q = question.toLowerCase()
  if (q.includes('week') || q.includes('7 dagen')) return 'week'
  if (q.includes('jaar') || q.includes('year') || q.includes('12 maanden')) return 'year'
  return 'month'
}

/**
 * Extract metric type from comparison question
 */
function extractMetric(question: string): 'signups' | 'cancellations' | 'checkins' {
  const q = question.toLowerCase()
  if (q.includes('opzeg') || q.includes('cancel') || q.includes('stop')) return 'cancellations'
  if (q.includes('checkin') || q.includes('bezoek') || q.includes('training')) return 'checkins'
  return 'signups' // Default to signups for "nieuwe leden", "inschrijvingen", etc.
}

/**
 * Generate natural language response using Claude Sonnet
 */
async function generateResponse(
  question: string,
  queryType: QueryType,
  results: unknown,
  context: string,
  apiKey: string
): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Vraag van de gebruiker: "${question}"

Query type: ${queryType}
Context: ${context}

Data uit de database:
${JSON.stringify(results, null, 2)}

Geef een duidelijk, actionable antwoord gebaseerd op deze data.
- Wees specifiek met namen en cijfers
- Als de data leeg is, geef aan dat er geen resultaten zijn en waarom dat positief of neutraal kan zijn
- Geef waar relevant een concrete aanbeveling`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Response generation error:', errorText)
      return 'Sorry, er ging iets mis bij het genereren van het antwoord. Probeer het opnieuw.'
    }

    const data = await response.json()
    return data.content?.[0]?.text || 'Geen antwoord gegenereerd.'
  } catch (error) {
    console.error('Generate response error:', error)
    return 'Sorry, er ging iets mis. Probeer het opnieuw.'
  }
}
