import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Loader2, Mail, Calendar, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface CheckoutSession {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  payment_status: string | null
  final_total: number | null
  duration_months: number | null
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

  // Handle pending or non-completed payment status
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
                        session.duration_months === 3 ? '3 maanden' :
                        session.duration_months === 12 ? '12 maanden' : `${session.duration_months || 1} maanden`

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
            Bedankt voor je inschrijving{session.first_name ? `, ${session.first_name}` : ''}!
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
                <span className="text-amber-300 font-bold">€{(session.final_total || 0).toFixed(2)}</span>
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
                <p className="text-amber-300 text-[14px]">{session.email || ''}</p>
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
