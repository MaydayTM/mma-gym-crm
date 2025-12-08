import { useState, useEffect } from 'react'
import { QrCode, Check, X, Loader2, User, Calendar, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

type CheckInResult = {
  success: boolean
  member?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
    status: string | null
  }
  reservation?: {
    id: string
    class_name: string
    start_time: string
    end_time: string
    discipline_name: string
    discipline_color: string
  }
  message: string
}

export function CheckIn() {
  const [manualCode, setManualCode] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [todayStats, setTodayStats] = useState({ checkins: 0, expected: 0 })

  // Load today's stats
  useEffect(() => {
    loadTodayStats()
    const interval = setInterval(loadTodayStats, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  async function loadTodayStats() {
    const today = new Date().toISOString().split('T')[0]

    // Get today's check-ins
    const { data: checkins } = await supabase
      .from('reservations')
      .select('id')
      .eq('reservation_date', today)
      .eq('status', 'checked_in')

    // Get today's reservations (expected)
    const { data: reservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('reservation_date', today)
      .in('status', ['reserved', 'checked_in'])

    setTodayStats({
      checkins: checkins?.length || 0,
      expected: reservations?.length || 0,
    })
  }

  async function handleCheckIn(code: string) {
    if (!code.trim()) return

    setIsProcessing(true)
    setResult(null)

    try {
      const today = new Date().toISOString().split('T')[0]

      // Parse the code - format: member_id or reservation_id
      // For simplicity, we'll try to match member email or member ID

      // First try to find member by ID or email
      let member = null

      // Check if it's a UUID (member ID)
      if (code.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { data } = await supabase
          .from('members')
          .select('id, first_name, last_name, profile_picture_url, status')
          .eq('id', code)
          .single()
        member = data
      } else {
        // Try email
        const { data } = await supabase
          .from('members')
          .select('id, first_name, last_name, profile_picture_url, status')
          .eq('email', code.toLowerCase())
          .single()
        member = data
      }

      if (!member) {
        setResult({
          success: false,
          message: 'Lid niet gevonden. Controleer de code.',
        })
        return
      }

      if (member.status !== 'active') {
        setResult({
          success: false,
          member,
          message: 'Dit lid is niet actief. Status: ' + member.status,
        })
        return
      }

      // Find today's reservation for this member
      const { data: reservation } = await supabase
        .from('reservations')
        .select(`
          id,
          status,
          classes:class_id (
            name,
            start_time,
            end_time,
            disciplines:discipline_id (name, color)
          )
        `)
        .eq('member_id', member.id)
        .eq('reservation_date', today)
        .eq('status', 'reserved')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (!reservation) {
        // No reservation found - offer to create walk-in check-in
        setResult({
          success: false,
          member,
          message: 'Geen reservatie gevonden voor vandaag. Maak een reservatie aan via de Reservaties pagina.',
        })
        return
      }

      // Check in the reservation
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', reservation.id)

      if (updateError) {
        throw updateError
      }

      // Success!
      const classData = reservation.classes as {
        name: string
        start_time: string
        end_time: string
        disciplines: { name: string; color: string } | null
      }

      setResult({
        success: true,
        member,
        reservation: {
          id: reservation.id,
          class_name: classData.name,
          start_time: classData.start_time,
          end_time: classData.end_time,
          discipline_name: classData.disciplines?.name || 'Onbekend',
          discipline_color: classData.disciplines?.color || '#3B82F6',
        },
        message: 'Check-in succesvol!',
      })

      // Refresh stats
      loadTodayStats()

      // Clear result after 5 seconds
      setTimeout(() => setResult(null), 5000)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Er ging iets mis',
      })
    } finally {
      setIsProcessing(false)
      setManualCode('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleCheckIn(manualCode)
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Header with stats */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-semibold text-neutral-50">Check-in</h1>
            <p className="text-[13px] text-neutral-500">
              Scan QR code of voer lidcode in
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-[28px] font-bold text-amber-300">{todayStats.checkins}</p>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Check-ins</p>
            </div>
            <div className="text-center">
              <p className="text-[28px] font-bold text-neutral-300">{todayStats.expected}</p>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Verwacht</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Result display */}
          {result && (
            <div
              className={`p-6 rounded-3xl ${
                result.success
                  ? 'bg-green-500/20 border border-green-500/40'
                  : 'bg-rose-500/20 border border-rose-500/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    result.success ? 'bg-green-500' : 'bg-rose-500'
                  }`}
                >
                  {result.success ? (
                    <Check size={24} className="text-white" strokeWidth={2} />
                  ) : (
                    <X size={24} className="text-white" strokeWidth={2} />
                  )}
                </div>

                <div className="flex-1">
                  {result.member && (
                    <div className="flex items-center gap-3 mb-2">
                      {result.member.profile_picture_url ? (
                        <img
                          src={result.member.profile_picture_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                          <User size={20} className="text-neutral-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-[16px] font-medium text-neutral-50">
                          {result.member.first_name} {result.member.last_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.reservation && (
                    <div className="mt-3 p-3 bg-white/10 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: result.reservation.discipline_color }}
                        />
                        <span
                          className="text-[13px] font-medium"
                          style={{ color: result.reservation.discipline_color }}
                        >
                          {result.reservation.discipline_name}
                        </span>
                      </div>
                      <p className="text-[14px] text-neutral-200">{result.reservation.class_name}</p>
                      <p className="text-[12px] text-neutral-400 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {result.reservation.start_time.slice(0, 5)} - {result.reservation.end_time.slice(0, 5)}
                      </p>
                    </div>
                  )}

                  <p
                    className={`text-[14px] mt-3 ${
                      result.success ? 'text-green-300' : 'text-rose-300'
                    }`}
                  >
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* QR Code placeholder / scanner area */}
          <div
            className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 text-center"
            style={{
              position: 'relative',
              '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
              '--border-radius-before': '24px',
            } as React.CSSProperties}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-neutral-800/50 flex items-center justify-center">
              <QrCode size={48} className="text-neutral-600" strokeWidth={1} />
            </div>
            <p className="text-[14px] text-neutral-400 mb-2">
              QR Scanner wordt binnenkort toegevoegd
            </p>
            <p className="text-[12px] text-neutral-600">
              Gebruik voorlopig de handmatige invoer hieronder
            </p>
          </div>

          {/* Manual code input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Lid-ID of Email
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Voer lid-ID of email in..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-4 text-[16px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70 text-center"
                disabled={isProcessing}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !manualCode.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-4 text-[16px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.4)] hover:bg-amber-200 transition disabled:opacity-50 disabled:shadow-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Verwerken...
                </>
              ) : (
                <>
                  <Check size={20} strokeWidth={1.5} />
                  Check-in
                </>
              )}
            </button>
          </form>

          {/* Quick help */}
          <div className="text-center">
            <p className="text-[12px] text-neutral-600">
              Problemen met check-in?{' '}
              <a href="/reservations" className="text-amber-300 hover:text-amber-200">
                Ga naar Reservaties
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 border-t border-white/10 px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-[12px] text-neutral-500">
          <span>
            <Calendar size={14} className="inline mr-1" />
            {new Date().toLocaleDateString('nl-BE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <span>
            {new Date().toLocaleTimeString('nl-BE', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
