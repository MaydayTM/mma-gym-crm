import { useState, useEffect, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Loader2, RefreshCw, DoorOpen, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface DoorAccessCardProps {
  memberId: string
  memberStatus: string
  doorAccessEnabled?: boolean
}

interface AccessLog {
  id: string
  scanned_at: string | null
  allowed: boolean
  denial_reason: string | null
  door_location: string | null
}

export function DoorAccessCard({ memberId, memberStatus, doorAccessEnabled = true }: DoorAccessCardProps) {
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  // Fetch QR token
  const fetchQRToken = useCallback(async () => {
    if (memberStatus !== 'active' || !doorAccessEnabled) {
      setError('Lid heeft geen actief abonnement of toegang is uitgeschakeld')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get current session token for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Niet ingelogd')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/door-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ member_id: memberId })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kon QR code niet genereren')
      }

      setQrToken(data.qr_token)
      setExpiresAt(new Date(Date.now() + data.expires_in * 1000))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }, [memberId, memberStatus, doorAccessEnabled])

  // Fetch recent access logs
  const fetchAccessLogs = useCallback(async () => {
    setLoadingLogs(true)
    try {
      const { data, error } = await supabase
        .from('door_access_logs')
        .select('id, scanned_at, allowed, denial_reason, door_location')
        .eq('member_id', memberId)
        .order('scanned_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentLogs(data || [])
    } catch (err) {
      console.error('Failed to fetch access logs:', err)
    } finally {
      setLoadingLogs(false)
    }
  }, [memberId])

  // Initial load
  useEffect(() => {
    fetchQRToken()
    fetchAccessLogs()
  }, [fetchQRToken, fetchAccessLogs])

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return

    const updateTimer = () => {
      const now = new Date()
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Verlopen')
        setQrToken(null)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  // Auto-refresh before expiry
  useEffect(() => {
    if (!expiresAt) return

    const refreshTime = expiresAt.getTime() - 60000 // 1 minute before expiry
    const now = Date.now()

    if (refreshTime > now) {
      const timeout = setTimeout(fetchQRToken, refreshTime - now)
      return () => clearTimeout(timeout)
    }
  }, [expiresAt, fetchQRToken])

  const canGenerateQR = memberStatus === 'active' && doorAccessEnabled

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DoorOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-medium text-neutral-50">Deur Toegang</h3>
            <p className="text-[12px] text-neutral-500">QR code voor check-in</p>
          </div>
        </div>
        {canGenerateQR && (
          <button
            onClick={fetchQRToken}
            disabled={loading}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition disabled:opacity-50"
            title="Vernieuw QR code"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* QR Code Section */}
      <div className="p-6">
        {!canGenerateQR ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-[14px] text-neutral-400">
              {!doorAccessEnabled
                ? 'Deur toegang is uitgeschakeld voor dit lid'
                : 'Lid heeft geen actief abonnement'}
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-amber-300 mb-4" />
            <p className="text-[14px] text-neutral-400">QR code genereren...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-[14px] text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchQRToken}
              className="px-4 py-2 rounded-lg bg-white/10 text-neutral-200 text-[13px] hover:bg-white/20 transition"
            >
              Opnieuw proberen
            </button>
          </div>
        ) : qrToken ? (
          <div className="flex flex-col items-center">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-xl mb-4">
              <QRCodeSVG
                value={qrToken}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 text-[13px] text-neutral-400">
              <Clock size={14} />
              <span>Geldig nog: </span>
              <span className={`font-mono ${timeLeft === 'Verlopen' ? 'text-red-400' : 'text-emerald-400'}`}>
                {timeLeft}
              </span>
            </div>

            <p className="text-[12px] text-neutral-500 mt-2 text-center">
              Scan deze QR code bij de deur om binnen te komen
            </p>
          </div>
        ) : null}
      </div>

      {/* Recent Access Logs */}
      <div className="border-t border-white/5">
        <div className="p-4 border-b border-white/5">
          <h4 className="text-[13px] font-medium text-neutral-400">Recente toegang</h4>
        </div>
        {loadingLogs ? (
          <div className="p-4 flex justify-center">
            <Loader2 size={18} className="animate-spin text-neutral-500" />
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="p-4 text-center text-[13px] text-neutral-500">
            Geen toegangspogingen gevonden
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentLogs.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {log.allowed ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                  <div>
                    <p className="text-[13px] text-neutral-200">
                      {log.allowed ? 'Toegang verleend' : 'Toegang geweigerd'}
                    </p>
                    {log.denial_reason && (
                      <p className="text-[11px] text-neutral-500">
                        Reden: {formatDenialReason(log.denial_reason)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-neutral-400">
                    {formatDate(log.scanned_at)}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {log.door_location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatDenialReason(reason: string): string {
  const reasons: Record<string, string> = {
    invalid_token: 'Ongeldige QR code',
    token_expired: 'QR code verlopen',
    token_mismatch: 'QR code niet meer geldig',
    access_disabled: 'Toegang uitgeschakeld',
    member_inactive: 'Lidmaatschap inactief',
    no_active_subscription: 'Geen actief abonnement',
    member_not_found: 'Lid niet gevonden',
    system_error: 'Systeemfout'
  }
  return reasons[reason] || reason
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Onbekend'
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return 'Zojuist'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min geleden`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} uur geleden`

  return date.toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
