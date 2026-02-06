// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Brand colors for email templates
const emailColors = {
  primary: '#F59E0B',
  dark: '#171717',
  darkGray: '#262626',
  gray: '#525252',
  lightGray: '#A3A3A3',
  white: '#FAFAFA',
}

/**
 * Generate HTML email with Reconnect Academy branding
 */
function generateEmailHtml(options: {
  recipientName?: string
  subject: string
  body: string
  ctaText?: string
  ctaUrl?: string
}): string {
  const { recipientName, subject, body, ctaText, ctaUrl } = options

  // Convert plain text body to HTML paragraphs
  const bodyHtml = body
    .split('\n\n')
    .map(paragraph => `<p style="color: ${emailColors.lightGray}; font-size: 15px; line-height: 26px; margin: 0 0 16px;">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')

  // Optional CTA button
  const ctaHtml = ctaText && ctaUrl ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
      <tr>
        <td style="background-color: ${emailColors.primary}; border-radius: 8px;">
          <a href="${ctaUrl}" style="display: inline-block; padding: 12px 24px; color: ${emailColors.dark}; font-size: 14px; font-weight: 600; text-decoration: none;">${ctaText}</a>
        </td>
      </tr>
    </table>
  ` : ''

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: ${emailColors.primary}; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 0 16px !important; }
      .content { padding: 24px !important; }
    }
  </style>
</head>
<body style="background-color: ${emailColors.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; margin: 0; padding: 40px 0;">

  <!-- Preview Text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${subject}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td class="container" style="background-color: ${emailColors.darkGray}; border-radius: 16px; overflow: hidden;">

        <!-- Header -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="background-color: ${emailColors.dark}; padding: 32px 40px; text-align: center;">
              <img src="https://mmagym.be/images/logo-reconnect.png" width="180" alt="Reconnect Academy" style="display: block; margin: 0 auto;">
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="content" style="padding: 40px;">

              ${recipientName ? `
              <!-- Greeting -->
              <p style="color: ${emailColors.white}; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                Hoi ${recipientName},
              </p>
              ` : ''}

              <!-- Body -->
              ${bodyHtml}

              <!-- CTA Button -->
              ${ctaHtml}

              <!-- Signature -->
              <p style="color: ${emailColors.lightGray}; font-size: 15px; line-height: 24px; margin-top: 32px;">
                Met sportieve groet,<br>
                <strong style="color: ${emailColors.white};">Team Reconnect Academy</strong>
              </p>

            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="border-top: 1px solid #404040;"></td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 32px 40px; text-align: center;">

              <!-- Company Info -->
              <p style="color: ${emailColors.gray}; font-size: 13px; line-height: 20px; margin: 0 0 16px;">
                Reconnect Academy | MMA & BJJ Gym<br>
                Aalst, België
              </p>

              <!-- Social Links -->
              <p style="margin: 0 0 16px;">
                <a href="https://instagram.com/reconnect.academy" style="color: ${emailColors.primary}; font-size: 13px;">Instagram</a>
                <span style="color: ${emailColors.gray}; margin: 0 8px;">•</span>
                <a href="https://facebook.com/reconnectacademy" style="color: ${emailColors.primary}; font-size: 13px;">Facebook</a>
                <span style="color: ${emailColors.gray}; margin: 0 8px;">•</span>
                <a href="https://mmagym.be" style="color: ${emailColors.primary}; font-size: 13px;">Website</a>
              </p>

              <!-- Legal -->
              <p style="color: ${emailColors.gray}; font-size: 11px; line-height: 18px; margin: 0;">
                Je ontvangt deze email omdat je lid bent van Reconnect Academy.<br>
                <a href="https://mmagym.be/uitschrijven" style="color: ${emailColors.gray}; text-decoration: underline;">Uitschrijven</a>
              </p>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`.trim()
}

// Query type definitions - now includes actions
const QUERY_TYPES = {
  CHURN_RISK: 'churn_risk',
  TRAINING_LEADERBOARD: 'training_leaderboard',
  LEAD_FOLLOWUP: 'lead_followup',
  COMPARISON: 'comparison',
  SCHEDULE: 'schedule',
  BOOK_CLASS: 'book_class',
  CANCEL_BOOKING: 'cancel_booking',
  SEND_EMAIL: 'send_email',
  GENERAL: 'general',
} as const

type QueryType = typeof QUERY_TYPES[keyof typeof QUERY_TYPES]

interface ChatRequest {
  question: string
  conversation_id?: string
}

// System prompt for Claude - Kitana persona with expanded capabilities
const SYSTEM_PROMPT = `Je bent Kitana, de AI assistent van Reconnect Academy, een MMA/BJJ gym in Aalst, België.
Je naam is geïnspireerd door het Mortal Kombat personage - je bent sterk, slim en altijd klaar om te helpen.
Je helpt gym eigenaren en coaches met inzichten over hun leden, leads en business.

Je hebt toegang tot de volgende data EN acties:

**DATA (read-only):**
- Members: leden met hun check-in historie, abonnementen, gordels
- Leads: potentiële leden in de sales pipeline
- Check-ins: trainingsbezoeken per lid
- Subscriptions: abonnementen en prijzen
- Classes: lesrooster met disciplines en coaches
- Reservations: boekingen voor lessen

**ACTIES (je kunt uitvoeren):**
- Lessen boeken voor leden (reservaties aanmaken)
- Reservaties annuleren
- Emails opstellen en verzenden naar leden

Persoonlijkheid:
- Je bent vriendelijk, behulpzaam en professioneel
- Je hebt passie voor martial arts en de gym community
- Je geeft concrete, actionable inzichten
- Je bent direct maar warm - geen onnodig lange teksten

Communicatie richtlijnen:
- Antwoord altijd in het Nederlands
- Gebruik emoji's spaarzaam (alleen voor highlights: ⚠️ risico, 🏆 prestaties, 📞 follow-up, 📅 rooster, ✉️ email)
- Bij lijsten, beperk tot top 10 tenzij anders gevraagd
- Noem specifieke namen en cijfers
- Als je geen data hebt, zeg dat eerlijk
- Bij acties: bevestig altijd wat je hebt gedaan

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
    console.log('=== AI Assistant Request Started ===')

    // Get API keys from environment
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    console.log('API Key exists:', !!anthropicApiKey)
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Service Key exists:', !!supabaseServiceKey)

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

    // Get user's member profile for context
    // NOTE: members.id != auth user id. Use auth_user_id column.
    const { data: userMember } = await supabase
      .from('members')
      .select('role, first_name, last_name')
      .eq('auth_user_id', user.id)
      .single()

    const isStaff = ['admin', 'medewerker', 'coordinator', 'coach'].includes(userMember?.role || '')

    // Parse request body
    const { question, conversation_id }: ChatRequest = await req.json()

    if (!question || typeof question !== 'string') {
      throw new Error('question is required')
    }

    // Step 1: Classify the question using Haiku (fast & cheap)
    const queryType = await classifyQuestion(question, anthropicApiKey)
    console.log(`Classified question as: ${queryType}`)

    // Step 2: Execute appropriate database query or action
    let queryResults: unknown = null
    let queryContext = ''
    let actionPerformed = false

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

      case QUERY_TYPES.SCHEDULE: {
        // Get upcoming classes
        const { data, error } = await supabase
          .from('classes')
          .select(`
            *,
            disciplines:discipline_id (name, color),
            coach:coach_id (first_name, last_name)
          `)
          .eq('is_active', true)
          .order('day_of_week')
          .order('start_time')

        if (error) {
          console.error('Schedule query error:', error)
          queryResults = []
        } else {
          queryResults = data
          queryContext = `Lesrooster - ${data?.length || 0} actieve lessen gevonden`
        }
        break
      }

      case QUERY_TYPES.BOOK_CLASS: {
        if (!isStaff) {
          queryResults = { error: 'Alleen staff kan lessen boeken via Kitana' }
          queryContext = 'Geen toestemming'
          break
        }

        // Parse the booking request
        const bookingInfo = await parseBookingRequest(question, supabase, anthropicApiKey)

        if (bookingInfo.error) {
          queryResults = { error: bookingInfo.error, availableClasses: bookingInfo.availableClasses, availableMembers: bookingInfo.availableMembers }
          queryContext = 'Kon boeking niet verwerken'
        } else if (bookingInfo.memberId && bookingInfo.classId && bookingInfo.date) {
          // Check if already booked
          const { data: existing } = await supabase
            .from('reservations')
            .select('id')
            .eq('member_id', bookingInfo.memberId)
            .eq('class_id', bookingInfo.classId)
            .eq('reservation_date', bookingInfo.date)
            .neq('status', 'cancelled')
            .single()

          if (existing) {
            queryResults = { error: 'Dit lid is al ingeschreven voor deze les', booking: null }
            queryContext = 'Dubbele boeking voorkomen'
          } else {
            // Create reservation
            const { data: reservation, error: bookError } = await supabase
              .from('reservations')
              .insert({
                member_id: bookingInfo.memberId,
                class_id: bookingInfo.classId,
                reservation_date: bookingInfo.date,
                status: 'reserved',
              })
              .select(`
                *,
                member:member_id (first_name, last_name),
                classes:class_id (name, start_time, disciplines:discipline_id (name))
              `)
              .single()

            if (bookError) {
              queryResults = { error: bookError.message }
              queryContext = 'Boeking mislukt'
            } else {
              queryResults = { success: true, reservation }
              queryContext = 'Boeking succesvol aangemaakt'
              actionPerformed = true
            }
          }
        }
        break
      }

      case QUERY_TYPES.CANCEL_BOOKING: {
        if (!isStaff) {
          queryResults = { error: 'Alleen staff kan reservaties annuleren via Kitana' }
          queryContext = 'Geen toestemming'
          break
        }

        // Parse cancellation request
        const cancelInfo = await parseCancelRequest(question, supabase, anthropicApiKey)

        if (cancelInfo.error) {
          queryResults = { error: cancelInfo.error, reservations: cancelInfo.reservations }
          queryContext = 'Kon annulering niet verwerken'
        } else if (cancelInfo.reservationId) {
          const { data, error: cancelError } = await supabase
            .from('reservations')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
            })
            .eq('id', cancelInfo.reservationId)
            .select(`
              *,
              member:member_id (first_name, last_name),
              classes:class_id (name, start_time)
            `)
            .single()

          if (cancelError) {
            queryResults = { error: cancelError.message }
            queryContext = 'Annulering mislukt'
          } else {
            queryResults = { success: true, cancelled: data }
            queryContext = 'Reservatie succesvol geannuleerd'
            actionPerformed = true
          }
        }
        break
      }

      case QUERY_TYPES.SEND_EMAIL: {
        if (!isStaff) {
          queryResults = { error: 'Alleen staff kan emails versturen via Kitana' }
          queryContext = 'Geen toestemming'
          break
        }

        if (!resendApiKey) {
          queryResults = { error: 'Email functionaliteit is niet geconfigureerd (RESEND_API_KEY ontbreekt)' }
          queryContext = 'Email niet beschikbaar'
          break
        }

        // Parse email request
        const emailInfo = await parseEmailRequest(question, supabase, anthropicApiKey)

        if (emailInfo.needsConfirmation) {
          // Return draft for approval
          queryResults = {
            draft: true,
            to: emailInfo.recipientEmail,
            recipientName: emailInfo.recipientName,
            subject: emailInfo.subject,
            body: emailInfo.body,
            instructions: 'Zeg "verstuur" of "verzend" om deze email te versturen, of geef aan wat je wilt aanpassen.'
          }
          queryContext = 'Email concept opgesteld - wacht op bevestiging'
        } else if (emailInfo.confirmed && emailInfo.recipientEmail) {
          // Send the email via Resend with HTML template
          const sendResult = await sendEmail(
            resendApiKey,
            emailInfo.recipientEmail,
            emailInfo.subject || 'Bericht van Reconnect Academy',
            emailInfo.body || '',
            emailInfo.recipientName // Pass recipient name for personalized greeting
          )

          if (sendResult.error) {
            queryResults = { error: sendResult.error }
            queryContext = 'Email verzenden mislukt'
          } else {
            queryResults = { success: true, sent: { to: emailInfo.recipientEmail, subject: emailInfo.subject } }
            queryContext = 'Email succesvol verzonden'
            actionPerformed = true
          }
        } else {
          queryResults = { error: emailInfo.error || 'Kon email niet verwerken' }
          queryContext = 'Email verwerking mislukt'
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

    // Step 3: Generate response with Sonnet
    const response = await generateResponse(
      question,
      queryType,
      queryResults,
      queryContext,
      actionPerformed,
      anthropicApiKey
    )

    // Step 4: Save conversation to database
    let convId = conversation_id
    if (!convId) {
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
            action_performed: actionPerformed,
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
        action_performed: actionPerformed,
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
    console.log('Classifying question:', question)

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
- churn_risk: Questions about members at risk of leaving, inactive members, who might cancel
- training_leaderboard: Questions about who trained most, attendance rankings, top performers
- lead_followup: Questions about leads, follow-ups needed, sales pipeline
- comparison: Questions comparing two time periods, year-over-year
- schedule: Questions about class schedule, rooster, what classes are when
- book_class: ACTIONS to book/reserve a class for someone (inschrijven, boeken, reserveren)
- cancel_booking: ACTIONS to cancel a reservation (annuleren, afmelden, uitschrijven)
- send_email: ACTIONS to compose or send an email (email, mail, bericht sturen)
- general: Everything else

Question: "${question}"`,
          },
        ],
      }),
    })

    console.log('Anthropic API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Classification API error:', response.status, errorText)
      return QUERY_TYPES.GENERAL
    }

    const data = await response.json()
    const classification = data.content?.[0]?.text?.toLowerCase().trim()

    // Map to valid query type
    if (classification?.includes('churn')) return QUERY_TYPES.CHURN_RISK
    if (classification?.includes('leaderboard') || classification?.includes('training_leaderboard')) return QUERY_TYPES.TRAINING_LEADERBOARD
    if (classification?.includes('lead')) return QUERY_TYPES.LEAD_FOLLOWUP
    if (classification?.includes('comparison')) return QUERY_TYPES.COMPARISON
    if (classification?.includes('schedule')) return QUERY_TYPES.SCHEDULE
    if (classification?.includes('book')) return QUERY_TYPES.BOOK_CLASS
    if (classification?.includes('cancel')) return QUERY_TYPES.CANCEL_BOOKING
    if (classification?.includes('email') || classification?.includes('send_email')) return QUERY_TYPES.SEND_EMAIL

    return QUERY_TYPES.GENERAL
  } catch (error) {
    console.error('Classification error:', error)
    return QUERY_TYPES.GENERAL
  }
}

/**
 * Parse booking request to extract member, class, and date
 */
async function parseBookingRequest(question: string, supabase: any, apiKey: string) {
  // Get available members and classes for context
  const [membersRes, classesRes] = await Promise.all([
    supabase.from('members').select('id, first_name, last_name, email').eq('status', 'active').limit(100),
    supabase.from('classes').select('id, name, day_of_week, start_time, disciplines:discipline_id (name)').eq('is_active', true),
  ])

  const members = membersRes.data || []
  const classes = classesRes.data || []

  // Use Claude to extract booking details
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Extract booking details from this request. Return ONLY valid JSON.

Request: "${question}"

Available members (name -> id):
${members.slice(0, 30).map((m: any) => `- ${m.first_name} ${m.last_name}: ${m.id}`).join('\n')}

Available classes (name -> id, day):
${classes.map((c: any) => `- ${c.name} (${c.disciplines?.name || 'onbekend'}): ${c.id}, dag ${c.day_of_week}`).join('\n')}

Today is: ${new Date().toISOString().split('T')[0]}

Return JSON format:
{
  "memberId": "uuid or null if unclear",
  "memberName": "name mentioned or null",
  "classId": "uuid or null if unclear",
  "className": "class name or null",
  "date": "YYYY-MM-DD or null if not specified",
  "error": "error message if cannot parse, null otherwise"
}`,
      }],
    }),
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}')

    // If no date specified, use next occurrence of the class day
    if (parsed.classId && !parsed.date) {
      const classInfo = classes.find((c: any) => c.id === parsed.classId)
      if (classInfo) {
        const today = new Date()
        const targetDay = classInfo.day_of_week
        const daysUntil = (targetDay - today.getDay() + 7) % 7 || 7
        const nextDate = new Date(today.getTime() + daysUntil * 24 * 60 * 60 * 1000)
        parsed.date = nextDate.toISOString().split('T')[0]
      }
    }

    return {
      ...parsed,
      availableClasses: classes.slice(0, 10),
      availableMembers: members.slice(0, 10),
    }
  } catch (e) {
    return { error: 'Kon de boeking niet verwerken. Specificeer het lid en de les duidelijker.', availableClasses: classes.slice(0, 10), availableMembers: members.slice(0, 10) }
  }
}

/**
 * Parse cancellation request
 */
async function parseCancelRequest(question: string, supabase: any, apiKey: string) {
  // Get recent reservations
  const today = new Date().toISOString().split('T')[0]
  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_date,
      member:member_id (first_name, last_name),
      classes:class_id (name, start_time)
    `)
    .gte('reservation_date', today)
    .neq('status', 'cancelled')
    .order('reservation_date')
    .limit(50)

  // Use Claude to find the reservation to cancel
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Find the reservation to cancel. Return ONLY valid JSON.

Request: "${question}"

Active reservations:
${(reservations || []).map((r: any) =>
  `- ${r.member?.first_name} ${r.member?.last_name} voor ${r.classes?.name} op ${r.reservation_date}: ${r.id}`
).join('\n')}

Return: {"reservationId": "uuid or null", "error": "message if unclear"}`,
      }],
    }),
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return { ...JSON.parse(jsonMatch ? jsonMatch[0] : '{}'), reservations }
  } catch {
    return { error: 'Kon de reservatie niet vinden.', reservations }
  }
}

/**
 * Parse email request
 */
async function parseEmailRequest(question: string, supabase: any, apiKey: string) {
  const lowerQ = question.toLowerCase()
  const isConfirmation = lowerQ.includes('verstuur') || lowerQ.includes('verzend') || lowerQ.includes('send')

  // Get members for recipient lookup
  const { data: members } = await supabase
    .from('members')
    .select('id, first_name, last_name, email')
    .eq('status', 'active')
    .not('email', 'is', null)
    .limit(100)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Parse this email request and compose the email. Return ONLY valid JSON.

Request: "${question}"

Available recipients:
${(members || []).slice(0, 30).map((m: any) => `- ${m.first_name} ${m.last_name}: ${m.email}`).join('\n')}

Return JSON:
{
  "recipientEmail": "email@example.com or null",
  "recipientName": "First name of recipient or null",
  "subject": "Email subject line",
  "body": "Main email body text in Dutch, professional but friendly. Do NOT include greeting (like 'Hoi X') or signature - those are added automatically by the email template.",
  "needsConfirmation": true,
  "error": "error if can't parse"
}

Write the body content only - no greeting or signature. Make it professional but warm, in Dutch.`,
      }],
    }),
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}')
    return { ...parsed, confirmed: isConfirmation && !parsed.needsConfirmation }
  } catch {
    return { error: 'Kon het email verzoek niet verwerken.' }
  }
}

/**
 * Send email via Resend with HTML template
 */
async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  body: string,
  recipientName?: string
) {
  try {
    // Generate branded HTML email
    const htmlContent = generateEmailHtml({
      recipientName,
      subject,
      body,
    })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Reconnect Academy <noreply@mmagym.be>',
        to: [to],
        subject: subject,
        html: htmlContent,
        text: body, // Plain text fallback
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { error: error.message || 'Email verzenden mislukt' }
    }

    return { success: true }
  } catch (e) {
    return { error: 'Email verzenden mislukt: ' + (e as Error).message }
  }
}

function extractPeriod(question: string): 'week' | 'month' | 'year' {
  const q = question.toLowerCase()
  if (q.includes('week') || q.includes('7 dagen')) return 'week'
  if (q.includes('jaar') || q.includes('year') || q.includes('12 maanden')) return 'year'
  return 'month'
}

function extractMetric(question: string): 'signups' | 'cancellations' | 'checkins' {
  const q = question.toLowerCase()
  if (q.includes('opzeg') || q.includes('cancel') || q.includes('stop')) return 'cancellations'
  if (q.includes('checkin') || q.includes('bezoek') || q.includes('training')) return 'checkins'
  return 'signups'
}

async function generateResponse(
  question: string,
  queryType: QueryType,
  results: unknown,
  context: string,
  actionPerformed: boolean,
  apiKey: string
): Promise<string> {
  try {
    const actionContext = actionPerformed
      ? '\n\nBELANGRIJK: Een actie is succesvol uitgevoerd. Bevestig dit duidelijk aan de gebruiker.'
      : ''

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Vraag van de gebruiker: "${question}"

Query type: ${queryType}
Context: ${context}${actionContext}

Data/resultaat:
${JSON.stringify(results, null, 2)}

Geef een duidelijk antwoord:
- Als het een actie was (boeking, annulering, email), bevestig wat er is gebeurd
- Als het een vraag was, geef informatief antwoord
- Als er een fout was, leg uit wat er mis ging en hoe het opgelost kan worden
- Wees specifiek met namen, datums en tijden`,
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
