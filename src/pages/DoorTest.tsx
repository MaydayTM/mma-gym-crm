// src/pages/DoorTest.tsx
// Simple test page for door access validation
import { useState } from 'react'
import { QrCode, Check, X, Loader2, User, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { RoleGuard } from '../components/auth/RoleGuard'

type ValidationResult = {
  allowed: boolean
  member?: {
    id: string
    first_name: string
    last_name: string
    status: string | null
  }
  subscription?: {
    name: string
    end_date: string
    status: string | null
  }
  reason: string
}

export function DoorTest() {
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)

  async function validateAccess(inputCode: string) {
    if (!inputCode.trim()) return

    setIsValidating(true)
    setResult(null)

    try {
      // Try to find member by ID, email, or qr_token
      let member = null

      // Check if it's a UUID (member ID)
      if (inputCode.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { data } = await supabase
          .from('members')
          .select('id, first_name, last_name, status, email')
          .eq('id', inputCode)
          .single()
        member = data
      } else if (inputCode.includes('@')) {
        // Try email
        const { data } = await supabase
          .from('members')
          .select('id, first_name, last_name, status, email')
          .eq('email', inputCode.toLowerCase())
          .single()
        member = data
      } else {
        // Try as numeric code (for ESP32 Wiegand codes)
        // First try to find by qr_token
        const { data } = await supabase
          .from('members')
          .select('id, first_name, last_name, status, email')
          .eq('door_access_code', inputCode)
          .single()
        member = data
      }

      if (!member) {
        setResult({
          allowed: false,
          reason: 'Lid niet gevonden'
        })
        return
      }

      // Check member status
      if (member.status !== 'active') {
        setResult({
          allowed: false,
          member,
          reason: `Lid status is "${member.status}" (niet actief)`
        })
        return
      }

      // Check for active subscription
      const today = new Date().toISOString().split('T')[0]
      const { data: subscription } = await supabase
        .from('member_subscriptions')
        .select(`
          id,
          status,
          start_date,
          end_date,
          plan_types (name)
        `)
        .eq('member_id', member.id)
        .eq('status', 'active')
        .gte('end_date', today)
        .order('end_date', { ascending: false })
        .limit(1)
        .single()

      if (!subscription) {
        setResult({
          allowed: false,
          member,
          reason: 'Geen actief abonnement gevonden'
        })
        return
      }

      // ACCESS GRANTED!
      setResult({
        allowed: true,
        member,
        subscription: {
          name: (subscription.plan_types as { name: string } | null)?.name || 'Onbekend',
          end_date: subscription.end_date || '',
          status: subscription.status || ''
        },
        reason: 'Toegang verleend!'
      })

      // Log the access attempt (table might not exist yet)
      try {
        await supabase.from('door_access_logs').insert({
          member_id: member.id,
          qr_token: inputCode.substring(0, 50),
          allowed: true,
          door_location: 'main'
        })
      } catch {
        // Ignore if table doesn't exist
      }

    } catch (error) {
      console.error('Validation error:', error)
      setResult({
        allowed: false,
        reason: error instanceof Error ? error.message : 'Validatie fout'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    validateAccess(code)
  }

  return (
    <RoleGuard requiredRole="admin">
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">
            Door Access Test
          </h1>
          <p className="text-[14px] text-neutral-400 mt-1">
            Test of een lid toegang krijgt tot de gym (simuleert ESP32 validatie)
          </p>
        </div>

      {/* Test Form */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-6 border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Member ID, Email, of QR Code
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Voer member ID of email in..."
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
                disabled={isValidating}
              />
              <button
                type="submit"
                disabled={isValidating || !code.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 text-neutral-950 px-6 py-3 text-[14px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
              >
                {isValidating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <QrCode size={18} />
                )}
                Valideer
              </button>
            </div>
          </div>
        </form>

        {/* Result */}
        {result && (
          <div
            className={`mt-6 p-6 rounded-2xl ${
              result.allowed
                ? 'bg-emerald-500/20 border border-emerald-500/40'
                : 'bg-rose-500/20 border border-rose-500/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  result.allowed ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              >
                {result.allowed ? (
                  <Check size={28} className="text-white" strokeWidth={2} />
                ) : (
                  <X size={28} className="text-white" strokeWidth={2} />
                )}
              </div>

              <div className="flex-1">
                <h3 className={`text-[20px] font-semibold ${
                  result.allowed ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {result.allowed ? 'DEUR OPEN' : 'TOEGANG GEWEIGERD'}
                </h3>

                <p className={`text-[14px] mt-1 ${
                  result.allowed ? 'text-emerald-200' : 'text-rose-200'
                }`}>
                  {result.reason}
                </p>

                {result.member && (
                  <div className="mt-4 p-3 bg-white/10 rounded-xl">
                    <div className="flex items-center gap-2 text-neutral-200">
                      <User size={16} />
                      <span className="font-medium">
                        {result.member.first_name} {result.member.last_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        result.member.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {result.member.status}
                      </span>
                    </div>
                  </div>
                )}

                {result.subscription && (
                  <div className="mt-2 p-3 bg-white/10 rounded-xl">
                    <div className="flex items-center gap-2 text-neutral-200">
                      <CreditCard size={16} />
                      <span>{result.subscription.name}</span>
                      <span className="text-neutral-500 text-[12px]">
                        tot {new Date(result.subscription.end_date).toLocaleDateString('nl-BE')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-6 border border-white/10">
        <h2 className="text-[16px] font-medium text-neutral-50 mb-4">Test Scenario's</h2>
        <div className="space-y-3 text-[13px]">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Check size={14} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-neutral-200 font-medium">Lid met actief abonnement</p>
              <p className="text-neutral-500">Status = active + abonnement niet verlopen → DEUR OPEN</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
              <X size={14} className="text-rose-400" />
            </div>
            <div>
              <p className="text-neutral-200 font-medium">Lid zonder abonnement</p>
              <p className="text-neutral-500">Geen actief abonnement → TOEGANG GEWEIGERD</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
              <X size={14} className="text-rose-400" />
            </div>
            <div>
              <p className="text-neutral-200 font-medium">Inactief lid</p>
              <p className="text-neutral-500">Status = cancelled/frozen → TOEGANG GEWEIGERD</p>
            </div>
          </div>
        </div>
      </div>

      {/* ESP32 Integration Info */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
        <h3 className="text-[14px] font-medium text-amber-300 mb-2">ESP32 Integratie</h3>
        <p className="text-[13px] text-amber-200/80">
          Deze pagina simuleert wat de ESP32 straks zal doen via een API call.
          Volgende stap: Edge Function maken die dezelfde logica uitvoert en
          {"{"}"allowed": true/false{"}"} teruggeeft aan de ESP32.
        </p>
      </div>
      </div>
    </RoleGuard>
  )
}
