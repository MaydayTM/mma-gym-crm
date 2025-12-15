import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  productName: string
  category: string
  colors?: string
  sizes?: string
  generateTitle?: boolean
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

    const { productName, category, colors, sizes, generateTitle }: GenerateRequest = await req.json()

    if (!productName) {
      throw new Error('productName is required')
    }

    // Build context about the product
    const categoryLabel = category === 'clothing' ? 'Kleding' : category === 'gear' ? 'Fight Gear' : 'Accessoires'
    const productInfo = [
      `Product: ${productName}`,
      `Categorie: ${categoryLabel}`,
      colors ? `Kleuren: ${colors}` : null,
      sizes ? `Maten: ${sizes}` : null,
    ].filter(Boolean).join('\n')

    // Build prompt based on whether we need title too
    const prompt = generateTitle
      ? `Je bent een copywriter voor een MMA/BJJ gym webshop (Reconnect Academy).

Maak een professionele productnaam EN beschrijving in Venum-stijl.

Stijl voorbeelden voor titels:
- "Reconnect Academy T-Shirt - Black/Gold"
- "Reconnect Pro Rashguard Long Sleeve - Black"
- "Reconnect Competition BJJ Gi - White"
- "Reconnect Training Shorts - Grey/Red"

${productInfo}

BELANGRIJK: Antwoord EXACT in dit JSON format:
{
  "title": "De geoptimaliseerde productnaam in Venum-stijl",
  "description": "Korte beschrijving van 2-3 zinnen in het Nederlands. Focus op kwaliteit en training."
}

Alleen JSON, geen extra tekst.`
      : `Je bent een copywriter voor een MMA/BJJ gym webshop (Reconnect Academy).
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

Schrijf alleen de beschrijving, geen titel of extra tekst.`

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
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      throw new Error('Failed to generate content')
    }

    const data = await response.json()
    const content = data.content[0]?.text || ''

    // Parse response based on mode
    if (generateTitle) {
      try {
        // Try to parse JSON response
        const parsed = JSON.parse(content.trim())
        return new Response(
          JSON.stringify({
            title: parsed.title?.trim() || null,
            description: parsed.description?.trim() || null,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } catch {
        // If JSON parsing fails, return just description
        return new Response(
          JSON.stringify({ description: content.trim() }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ description: content.trim() }),
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
