# Mollie Payment Integration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Mollie payments into the subscription checkout flow, creating members automatically after successful payment.

**Architecture:**
- Frontend calls Supabase Edge Function to create Mollie payment
- Edge Function stores MOLLIE_API_KEY securely (never exposed to frontend)
- Mollie webhook calls Edge Function on payment completion
- Webhook handler creates member + subscription records

**Tech Stack:** Supabase Edge Functions (Deno), Mollie API v2, TypeScript, React

---

## Prerequisites

Before starting, the user must:

1. Add `MOLLIE_API_KEY` to Supabase Dashboard → Edge Functions → Secrets
2. Add `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions secrets (for webhook to write to DB)
3. Note the webhook URL format: `https://wiuzjpoizxeycrshsuqn.supabase.co/functions/v1/mollie-webhook`

---

## Task 1: Create Mollie Payment Edge Function

**Files:**
- Create: `supabase/functions/create-mollie-payment/index.ts`

**Step 1: Create the Edge Function directory and file**

```typescript
// supabase/functions/create-mollie-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePaymentRequest {
  checkout_session_id: string
  redirect_url: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')
    if (!MOLLIE_API_KEY) {
      throw new Error('MOLLIE_API_KEY not configured')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { checkout_session_id, redirect_url } = await req.json() as CreatePaymentRequest

    // Fetch checkout session from database
    const { data: session, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select(`
        *,
        age_groups (name),
        plan_types (name)
      `)
      .eq('id', checkout_session_id)
      .single()

    if (sessionError || !session) {
      throw new Error('Checkout session not found')
    }

    if (session.payment_status !== 'pending') {
      throw new Error('Checkout session already processed')
    }

    // Build payment description
    const planName = session.plan_types?.name || 'Abonnement'
    const ageName = session.age_groups?.name || ''
    const duration = session.duration_months === 1 ? '1 maand' :
                     session.duration_months === 3 ? '3 maanden' : '12 maanden'
    const description = `${planName} ${ageName} - ${duration}`

    // Webhook URL for Mollie to call after payment
    const webhookUrl = `${SUPABASE_URL}/functions/v1/mollie-webhook`

    // Create Mollie payment
    const mollieResponse = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: {
          currency: 'EUR',
          value: session.final_total.toFixed(2),
        },
        description,
        redirectUrl: `${redirect_url}?session_id=${checkout_session_id}`,
        webhookUrl,
        metadata: {
          checkout_session_id,
        },
      }),
    })

    if (!mollieResponse.ok) {
      const errorData = await mollieResponse.json()
      console.error('Mollie API error:', errorData)
      throw new Error(`Mollie API error: ${errorData.detail || 'Unknown error'}`)
    }

    const molliePayment = await mollieResponse.json()

    // Update checkout session with Mollie payment ID
    const { error: updateError } = await supabase
      .from('checkout_sessions')
      .update({
        payment_provider: 'mollie',
        external_checkout_id: molliePayment.id,
      })
      .eq('id', checkout_session_id)

    if (updateError) {
      console.error('Failed to update checkout session:', updateError)
    }

    // Return checkout URL for redirect
    return new Response(
      JSON.stringify({
        checkout_url: molliePayment._links.checkout.href,
        payment_id: molliePayment.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

**Step 2: Deploy the Edge Function**

Run: `npx supabase functions deploy create-mollie-payment --no-verify-jwt`

Expected: Function deployed successfully

**Step 3: Commit**

```bash
git add supabase/functions/create-mollie-payment/
git commit -m "feat: add Mollie payment creation Edge Function"
```

---

## Task 2: Create Mollie Webhook Handler Edge Function

**Files:**
- Create: `supabase/functions/mollie-webhook/index.ts`

**Step 1: Create the webhook handler**

```typescript
// supabase/functions/mollie-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!MOLLIE_API_KEY) {
      throw new Error('MOLLIE_API_KEY not configured')
    }

    // Mollie sends payment ID in form data
    const formData = await req.formData()
    const paymentId = formData.get('id') as string

    if (!paymentId) {
      throw new Error('No payment ID received')
    }

    console.log('Received webhook for payment:', paymentId)

    // Fetch payment details from Mollie
    const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
      },
    })

    if (!mollieResponse.ok) {
      throw new Error('Failed to fetch payment from Mollie')
    }

    const payment = await mollieResponse.json()
    console.log('Payment status:', payment.status)

    // Use service role key to bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get checkout session ID from metadata
    const checkoutSessionId = payment.metadata?.checkout_session_id
    if (!checkoutSessionId) {
      throw new Error('No checkout_session_id in payment metadata')
    }

    // Fetch checkout session
    const { data: session, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('id', checkoutSessionId)
      .single()

    if (sessionError || !session) {
      throw new Error('Checkout session not found')
    }

    // Handle payment status
    if (payment.status === 'paid') {
      console.log('Payment successful, creating member and subscription...')

      // Check if member already exists
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('email', session.email)
        .single()

      let memberId: string

      if (existingMember) {
        memberId = existingMember.id
        console.log('Using existing member:', memberId)
      } else {
        // Create new member
        const { data: newMember, error: memberError } = await supabase
          .from('members')
          .insert({
            first_name: session.first_name,
            last_name: session.last_name,
            email: session.email,
            phone: session.phone,
            birth_date: session.birth_date,
            role: 'fighter',
            status: 'active',
          })
          .select()
          .single()

        if (memberError) {
          console.error('Failed to create member:', memberError)
          throw new Error('Failed to create member')
        }

        memberId = newMember.id
        console.log('Created new member:', memberId)
      }

      // Calculate subscription dates
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + (session.duration_months || 1))

      // Create subscription
      const { data: subscription, error: subError } = await supabase
        .from('member_subscriptions')
        .insert({
          member_id: memberId,
          age_group_id: session.age_group_id,
          plan_type_id: session.plan_type_id,
          duration_months: session.duration_months,
          selected_discipline_id: session.selected_discipline_id,
          base_price: session.subtotal,
          family_discount: session.family_discount || 0,
          addon_total: session.addon_total || 0,
          final_price: session.final_total,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active',
          payment_provider: 'mollie',
          external_subscription_id: paymentId,
        })
        .select()
        .single()

      if (subError) {
        console.error('Failed to create subscription:', subError)
        throw new Error('Failed to create subscription')
      }

      console.log('Created subscription:', subscription.id)

      // Handle insurance addon if selected
      if (session.selected_addons?.includes('insurance') && session.addon_total > 0) {
        // Fetch insurance addon ID
        const { data: insuranceAddon } = await supabase
          .from('plan_addons')
          .select('id')
          .eq('slug', 'insurance')
          .single()

        if (insuranceAddon) {
          const insuranceEndDate = new Date()
          insuranceEndDate.setFullYear(insuranceEndDate.getFullYear() + 1)

          await supabase
            .from('subscription_addons')
            .insert({
              subscription_id: subscription.id,
              addon_id: insuranceAddon.id,
              price_paid: session.addon_total,
              start_date: startDate.toISOString().split('T')[0],
              end_date: insuranceEndDate.toISOString().split('T')[0],
            })
        }
      }

      // Update checkout session as completed
      await supabase
        .from('checkout_sessions')
        .update({
          payment_status: 'completed',
          completed_at: new Date().toISOString(),
          created_member_id: memberId,
          created_subscription_id: subscription.id,
        })
        .eq('id', checkoutSessionId)

      console.log('Checkout completed successfully!')

    } else if (payment.status === 'failed' || payment.status === 'canceled' || payment.status === 'expired') {
      // Update checkout session as failed
      await supabase
        .from('checkout_sessions')
        .update({
          payment_status: 'failed',
        })
        .eq('id', checkoutSessionId)

      console.log('Payment failed/canceled/expired')
    }
    // For 'open' or 'pending' status, we don't do anything yet

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    // Return 200 to prevent Mollie from retrying (we logged the error)
    return new Response('OK', { status: 200 })
  }
})
```

**Step 2: Deploy the webhook Edge Function**

Run: `npx supabase functions deploy mollie-webhook --no-verify-jwt`

Note: `--no-verify-jwt` is required because Mollie webhook doesn't send auth headers

Expected: Function deployed successfully

**Step 3: Commit**

```bash
git add supabase/functions/mollie-webhook/
git commit -m "feat: add Mollie webhook handler for payment completion"
```

---

## Task 3: Create Success and Cancel Pages

**Files:**
- Create: `src/pages/checkout/CheckoutSuccess.tsx`
- Create: `src/pages/checkout/CheckoutCancel.tsx`
- Modify: `src/App.tsx` (add routes)

**Step 1: Create CheckoutSuccess page**

```tsx
// src/pages/checkout/CheckoutSuccess.tsx
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Loader2, Mail, Calendar, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface CheckoutSession {
  id: string
  first_name: string
  last_name: string
  email: string
  payment_status: string
  final_total: number
  duration_months: number
  plan_types: { name: string } | null
  age_groups: { name: string } | null
}

export function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false)
      return
    }

    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('checkout_sessions')
        .select(`
          id,
          first_name,
          last_name,
          email,
          payment_status,
          final_total,
          duration_months,
          plan_types (name),
          age_groups (name)
        `)
        .eq('id', sessionId)
        .single()

      if (error) {
        console.error('Error fetching session:', error)
        setIsLoading(false)
        return
      }

      setSession(data)

      // If payment is still pending, poll for updates (webhook might not have fired yet)
      if (data.payment_status === 'pending' && pollCount < 10) {
        setTimeout(() => {
          setPollCount(prev => prev + 1)
        }, 2000)
      } else {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, pollCount])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-300 mx-auto mb-4" size={48} />
          <p className="text-neutral-400">Betaling verwerken...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-8 max-w-md text-center">
          <p className="text-rose-300 mb-4">Sessie niet gevonden</p>
          <Link to="/checkout/plans" className="text-amber-300 hover:underline">
            Terug naar abonnementen
          </Link>
        </div>
      </div>
    )
  }

  if (session.payment_status !== 'completed') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-8 max-w-md text-center">
          <Loader2 className="animate-spin text-amber-300 mx-auto mb-4" size={32} />
          <p className="text-amber-300 mb-4">Je betaling wordt nog verwerkt...</p>
          <p className="text-neutral-400 text-sm">
            Dit kan enkele seconden duren. Je ontvangt een bevestigingsmail zodra alles is afgerond.
          </p>
        </div>
      </div>
    )
  }

  const durationLabel = session.duration_months === 1 ? '1 maand' :
                        session.duration_months === 3 ? '3 maanden' : '12 maanden'

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 border border-white/10 text-center">
          <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="text-emerald-400" size={40} />
          </div>

          <h1 className="text-[28px] font-bold text-neutral-50 mb-2">
            Welkom bij Reconnect Academy!
          </h1>
          <p className="text-neutral-400 mb-8">
            Bedankt voor je inschrijving, {session.first_name}!
          </p>

          {/* Order Summary */}
          <div className="bg-white/5 rounded-2xl p-6 text-left mb-8">
            <h3 className="text-[14px] font-medium text-neutral-300 mb-4 uppercase tracking-wider">
              Samenvatting
            </h3>
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between">
                <span className="text-neutral-400">Abonnement</span>
                <span className="text-neutral-200">
                  {session.plan_types?.name} - {session.age_groups?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Looptijd</span>
                <span className="text-neutral-200">{durationLabel}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                <span className="text-neutral-300 font-medium">Betaald</span>
                <span className="text-amber-300 font-bold">€{session.final_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <Mail className="text-amber-300 mt-0.5" size={18} />
              <div>
                <p className="text-neutral-200 text-[14px]">
                  Bevestigingsmail verzonden naar
                </p>
                <p className="text-amber-300 text-[14px]">{session.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="text-amber-300 mt-0.5" size={18} />
              <div>
                <p className="text-neutral-200 text-[14px]">
                  Je kunt direct starten met trainen!
                </p>
                <p className="text-neutral-500 text-[13px]">
                  Bekijk ons lesrooster op de website
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link
            to="https://www.mmagym.be"
            className="mt-8 w-full inline-flex items-center justify-center gap-2 py-4 rounded-full bg-amber-300 text-neutral-950 font-medium text-[16px] hover:bg-amber-200 transition"
          >
            Naar de website
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Create CheckoutCancel page**

```tsx
// src/pages/checkout/CheckoutCancel.tsx
import { Link } from 'react-router-dom'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 border border-white/10 text-center">
          <div className="w-20 h-20 mx-auto bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
            <XCircle className="text-rose-400" size={40} />
          </div>

          <h1 className="text-[28px] font-bold text-neutral-50 mb-2">
            Betaling geannuleerd
          </h1>
          <p className="text-neutral-400 mb-8">
            Je betaling is niet voltooid. Er is niets in rekening gebracht.
          </p>

          <div className="space-y-3">
            <Link
              to="/checkout/plans"
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full bg-amber-300 text-neutral-950 font-medium text-[16px] hover:bg-amber-200 transition"
            >
              <RefreshCw size={18} />
              Opnieuw proberen
            </Link>

            <Link
              to="https://www.mmagym.be"
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full border border-white/20 text-neutral-300 font-medium text-[16px] hover:bg-white/5 transition"
            >
              <ArrowLeft size={18} />
              Terug naar website
            </Link>
          </div>

          <p className="text-neutral-500 text-[13px] mt-8">
            Vragen? Neem contact met ons op via{' '}
            <a href="mailto:info@mmagym.be" className="text-amber-300 hover:underline">
              info@mmagym.be
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Add routes to App.tsx**

Find the routes section in `src/App.tsx` and add:

```tsx
// Add these imports at the top
import { CheckoutSuccess } from './pages/checkout/CheckoutSuccess'
import { CheckoutCancel } from './pages/checkout/CheckoutCancel'

// Add these routes (public, no auth required)
<Route path="/checkout/success" element={<CheckoutSuccess />} />
<Route path="/checkout/cancel" element={<CheckoutCancel />} />
```

**Step 4: Commit**

```bash
git add src/pages/checkout/CheckoutSuccess.tsx src/pages/checkout/CheckoutCancel.tsx src/App.tsx
git commit -m "feat: add checkout success and cancel pages"
```

---

## Task 4: Update PlanCheckout to Call Mollie Edge Function

**Files:**
- Modify: `src/pages/checkout/PlanCheckout.tsx`

**Step 1: Update handleSubmit function**

Replace the handleSubmit function (around line 551-598) with:

```tsx
// Handle form submission
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!selectedAgeGroup || !selectedPlanType || !selectedDuration || !selectedPrice) return

  setIsSubmitting(true)

  try {
    // Create checkout session in database
    const { data: session, error } = await supabase
      .from('checkout_sessions')
      .insert({
        checkout_type: 'subscription',
        age_group_id: selectedAgeGroup.id,
        plan_type_id: selectedPlanType,
        duration_months: selectedDuration,
        selected_discipline_id: selectedDiscipline,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        birth_date: birthDate,
        selected_addons: wantsInsurance ? ['insurance'] : [],
        family_discount: hasFamilyMember ? familyDiscount : 0,
        subtotal,
        discount_total: totalDiscount,
        addon_total: insuranceCost,
        final_total: total,
        payment_status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Call Mollie Edge Function to create payment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/create-mollie-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_session_id: session.id,
        redirect_url: `${window.location.origin}/checkout/success`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Kon betaling niet aanmaken')
    }

    const { checkout_url } = await response.json()

    // Redirect to Mollie checkout
    window.location.href = checkout_url

  } catch (error) {
    console.error('Checkout error:', error)
    alert('Er ging iets mis. Probeer het opnieuw.')
    setIsSubmitting(false)
  }
}
```

**Step 2: Commit**

```bash
git add src/pages/checkout/PlanCheckout.tsx
git commit -m "feat: integrate Mollie payment in checkout flow"
```

---

## Task 5: Update Subscriptions Admin Page

**Files:**
- Modify: `src/pages/Subscriptions.tsx`
- Create: `src/hooks/useSubscriptions.ts`

**Step 1: Create useSubscriptions hook**

```typescript
// src/hooks/useSubscriptions.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface MemberSubscription {
  id: string
  member_id: string
  age_group_id: string | null
  plan_type_id: string | null
  duration_months: number | null
  base_price: number
  family_discount: number
  addon_total: number
  final_price: number
  start_date: string
  end_date: string | null
  status: string
  payment_provider: string | null
  created_at: string
  members: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile_picture_url: string | null
  } | null
  age_groups: {
    name: string
  } | null
  plan_types: {
    name: string
  } | null
}

export function useSubscriptions(status?: string) {
  return useQuery({
    queryKey: ['subscriptions', status],
    queryFn: async (): Promise<MemberSubscription[]> => {
      let query = supabase
        .from('member_subscriptions')
        .select(`
          *,
          members (
            id,
            first_name,
            last_name,
            email,
            profile_picture_url
          ),
          age_groups (name),
          plan_types (name)
        `)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
  })
}

export function useSubscriptionStats() {
  return useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_subscriptions')
        .select('status, final_price')

      if (error) throw error

      const stats = {
        active: 0,
        cancelled: 0,
        expired: 0,
        frozen: 0,
        total_mrr: 0,
      }

      data?.forEach((sub) => {
        if (sub.status === 'active') {
          stats.active++
          stats.total_mrr += sub.final_price || 0
        } else if (sub.status === 'cancelled') {
          stats.cancelled++
        } else if (sub.status === 'expired') {
          stats.expired++
        } else if (sub.status === 'frozen') {
          stats.frozen++
        }
      })

      return stats
    },
  })
}
```

**Step 2: Update Subscriptions page**

```tsx
// src/pages/Subscriptions.tsx
import { useState } from 'react'
import { Plus, CreditCard, Users, TrendingUp, Pause, XCircle, Search, Filter } from 'lucide-react'
import { useSubscriptions, useSubscriptionStats } from '../hooks/useSubscriptions'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export function Subscriptions() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: subscriptions, isLoading } = useSubscriptions(statusFilter)
  const { data: stats } = useSubscriptionStats()

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    if (!searchQuery) return true
    const fullName = `${sub.members?.first_name} ${sub.members?.last_name}`.toLowerCase()
    const email = sub.members?.email?.toLowerCase() || ''
    return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Abonnementen</h1>
          <p className="text-[14px] text-neutral-400 mt-1">Beheer lidmaatschappen en betalingen</p>
        </div>
        <a
          href="/checkout/plans"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
        >
          <Plus size={18} strokeWidth={1.5} />
          <span>Nieuw Abonnement</span>
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="text-emerald-300" size={20} />
            </div>
          </div>
          <p className="text-[28px] font-bold text-neutral-50">{stats?.active || 0}</p>
          <p className="text-[13px] text-neutral-500">Actieve abonnementen</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="text-amber-300" size={20} />
            </div>
          </div>
          <p className="text-[28px] font-bold text-neutral-50">
            €{((stats?.total_mrr || 0) / 12).toFixed(0)}
          </p>
          <p className="text-[13px] text-neutral-500">MRR (geschat)</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Pause className="text-blue-300" size={20} />
            </div>
          </div>
          <p className="text-[28px] font-bold text-neutral-50">{stats?.frozen || 0}</p>
          <p className="text-[13px] text-neutral-500">Gepauzeerd</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <XCircle className="text-rose-300" size={20} />
            </div>
          </div>
          <p className="text-[28px] font-bold text-neutral-50">{stats?.cancelled || 0}</p>
          <p className="text-[13px] text-neutral-500">Opgezegd</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Zoek op naam of email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-amber-300/50 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-neutral-500" />
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
          >
            <option value="">Alle statussen</option>
            <option value="active">Actief</option>
            <option value="frozen">Gepauzeerd</option>
            <option value="cancelled">Opgezegd</option>
            <option value="expired">Verlopen</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-amber-300 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : !filteredSubscriptions?.length ? (
          <div className="p-12 text-center">
            <CreditCard className="text-neutral-600 mx-auto mb-4" size={48} />
            <p className="text-neutral-400">Geen abonnementen gevonden</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Lid
                </th>
                <th className="text-left px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Abonnement
                </th>
                <th className="text-left px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Periode
                </th>
                <th className="text-left px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Prijs
                </th>
                <th className="text-left px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {sub.members?.profile_picture_url ? (
                        <img
                          src={sub.members.profile_picture_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-[14px] font-medium text-neutral-400">
                            {sub.members?.first_name?.[0]}{sub.members?.last_name?.[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-[14px] font-medium text-neutral-200">
                          {sub.members?.first_name} {sub.members?.last_name}
                        </p>
                        <p className="text-[12px] text-neutral-500">{sub.members?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] text-neutral-200">
                      {sub.plan_types?.name || '-'}
                    </p>
                    <p className="text-[12px] text-neutral-500">
                      {sub.age_groups?.name || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] text-neutral-200">
                      {format(new Date(sub.start_date), 'd MMM yyyy', { locale: nl })}
                    </p>
                    {sub.end_date && (
                      <p className="text-[12px] text-neutral-500">
                        tot {format(new Date(sub.end_date), 'd MMM yyyy', { locale: nl })}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] font-medium text-amber-300">
                      €{sub.final_price.toFixed(2)}
                    </p>
                    {sub.duration_months && (
                      <p className="text-[12px] text-neutral-500">
                        {sub.duration_months} maand{sub.duration_months > 1 ? 'en' : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium ${
                      sub.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : sub.status === 'frozen'
                        ? 'bg-blue-500/10 text-blue-300'
                        : sub.status === 'cancelled'
                        ? 'bg-rose-500/10 text-rose-300'
                        : 'bg-neutral-500/10 text-neutral-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        sub.status === 'active'
                          ? 'bg-emerald-400'
                          : sub.status === 'frozen'
                          ? 'bg-blue-400'
                          : sub.status === 'cancelled'
                          ? 'bg-rose-400'
                          : 'bg-neutral-400'
                      }`} />
                      {sub.status === 'active' ? 'Actief' :
                       sub.status === 'frozen' ? 'Gepauzeerd' :
                       sub.status === 'cancelled' ? 'Opgezegd' :
                       sub.status === 'expired' ? 'Verlopen' : sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/hooks/useSubscriptions.ts src/pages/Subscriptions.tsx
git commit -m "feat: implement subscriptions admin page with real data"
```

---

## Task 6: Configure Mollie Secrets in Supabase

**This task requires manual action by the user.**

**Step 1: Add secrets via Supabase Dashboard**

1. Go to https://supabase.com/dashboard/project/wiuzjpoizxeycrshsuqn/settings/functions
2. Click "Add new secret"
3. Add: `MOLLIE_API_KEY` = your Mollie API key (live_xxx or test_xxx)
4. Add: `SUPABASE_SERVICE_ROLE_KEY` = (copy from Project Settings → API → service_role)

**Step 2: Configure Mollie webhook URL**

1. Go to Mollie Dashboard → Developers → Webhooks
2. Add webhook URL: `https://wiuzjpoizxeycrshsuqn.supabase.co/functions/v1/mollie-webhook`

---

## Task 7: Test the Complete Flow

**Step 1: Test with Mollie test mode**

1. Ensure MOLLIE_API_KEY starts with `test_` for test mode
2. Go to `/checkout/plans`
3. Complete checkout form
4. Use Mollie test card: `3782 822463 10005`
5. Verify redirect to success page
6. Check member created in database

**Step 2: Verify webhook**

Run: `npx supabase functions logs mollie-webhook`

Expected: Logs showing payment processed, member created

---

## Summary

After completing all tasks:

1. Checkout flow creates Mollie payment via Edge Function
2. User redirected to Mollie hosted checkout
3. On payment success, webhook creates member + subscription
4. User sees success page with confirmation
5. Admin can view all subscriptions in CRM

**Webhook URL to configure in Mollie:**
`https://wiuzjpoizxeycrshsuqn.supabase.co/functions/v1/mollie-webhook`
