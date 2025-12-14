import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  productName: string
  category: string
  colors?: string
  size?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const { productName, category, colors, size }: GenerateRequest = await req.json()

    if (!productName) {
      throw new Error('productName is required')
    }

    // Build context about the product
    const productInfo = [
      `Product: ${productName}`,
      `Categorie: ${category === 'clothing' ? 'Kleding' : category === 'gear' ? 'Fight Gear' : 'Accessoires'}`,
      colors ? `Kleuren: ${colors}` : null,
      size ? `Maten: ${size}` : null,
    ].filter(Boolean).join('\n')

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Je bent een copywriter voor een MMA/BJJ gym webshop (Reconnect Academy).
Schrijf een ZEER korte productbeschrijving in het Nederlands.

Stijl voorbeelden (Venum-stijl):
- "Venum Kontact Shinguards - Royal Blue/Silver"
- "Venum x TEKKEN 8 Long Sleeve Rashguard - Yoshimitsu - Black/Orange"
- "BJJ Gi - White/Red"

Regels:
- Maximaal 2-3 zinnen
- Kort en krachtig
- Focus op kwaliteit en geschiktheid voor training
- Geen overdreven marketingtaal
- Nederlands

${productInfo}

Schrijf alleen de beschrijving, geen titel of extra tekst.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      throw new Error('Failed to generate description')
    }

    const data = await response.json()
    const description = data.content[0]?.text || ''

    return new Response(
      JSON.stringify({ description: description.trim() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
