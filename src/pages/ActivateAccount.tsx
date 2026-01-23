import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface MemberPreview {
  id: string
  first_name: string
  last_name: string
  email: string
  member_number: number | null
  profile_picture_url: string | null
}

type PageState = 'loading' | 'invalid' | 'ready' | 'submitting' | 'success' | 'error'

export function ActivateAccount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [pageState, setPageState] = useState<PageState>('loading')
  const [member, setMember] = useState<MemberPreview | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setPageState('invalid')
      setError('Geen activatietoken gevonden. Vraag een nieuwe link aan.')
      return
    }

    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-claim-token', {
        body: { token },
      })

      if (fnError) {
        throw fnError
      }

      if (!data.valid) {
        setPageState('invalid')
        setError(data.error || 'Deze link is ongeldig of verlopen.')
        return
      }

      setMember(data.member)
      setPageState('ready')
    } catch (err) {
      console.error('Token verification error:', err)
      setPageState('invalid')
      setError('Kon de link niet verifiëren. Probeer het later opnieuw.')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords
    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 karakters zijn')
      return
    }

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      return
    }

    setPageState('submitting')

    try {
      const { data, error: fnError } = await supabase.functions.invoke('complete-claim', {
        body: { token, password },
      })

      if (fnError) {
        throw fnError
      }

      if (!data.success) {
        setError(data.error || 'Er ging iets mis bij het activeren.')
        setPageState('ready')
        return
      }

      // Success! Set session if provided
      if (data.session) {
        await supabase.auth.setSession(data.session)
      }

      setPageState('success')

      // Redirect after short delay
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 2000)
    } catch (err) {
      console.error('Activation error:', err)
      setError('Er ging iets mis. Probeer het later opnieuw.')
      setPageState('ready')
    }
  }

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Link verifiëren...</p>
        </div>
      </div>
    )
  }

  // Invalid/expired token
  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-50 mb-2">Link ongeldig</h2>
            <p className="text-neutral-400 text-[14px] mb-6">{error}</p>
            <Link
              to="/claim-account"
              className="inline-block py-3 px-6 bg-amber-300 hover:bg-amber-200 text-neutral-950 font-medium rounded-full transition-all text-[15px]"
            >
              Nieuwe link aanvragen
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-50 mb-2">Account geactiveerd!</h2>
            <p className="text-neutral-400 text-[14px]">Je wordt doorgestuurd naar het dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Ready state - show password form
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8">
          {/* Header with member info */}
          <div className="text-center mb-8">
            {member?.profile_picture_url ? (
              <img
                src={member.profile_picture_url}
                alt={member.first_name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-amber-400"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4 border-2 border-amber-400">
                <span className="text-2xl font-semibold text-neutral-400">
                  {member?.first_name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <h1 className="text-[24px] font-semibold text-neutral-50">
              Welkom terug, {member?.first_name}!
            </h1>
            <p className="text-[13px] text-neutral-400 mt-2">
              Stel een wachtwoord in om je account te activeren
            </p>
          </div>

          {/* Member details */}
          <div className="mb-6 p-4 bg-white/5 rounded-xl">
            <div className="flex justify-between text-[13px]">
              <span className="text-neutral-500">E-mail</span>
              <span className="text-neutral-200">{member?.email}</span>
            </div>
            {member?.member_number && (
              <div className="flex justify-between text-[13px] mt-2">
                <span className="text-neutral-500">Lidnummer</span>
                <span className="text-neutral-200">{member.member_number}</span>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl">
              <p className="text-rose-300 text-[13px]">{error}</p>
            </div>
          )}

          {/* Password form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-neutral-400 mb-2">
                Nieuw wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-[14px]"
                placeholder="Minimaal 8 karakters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-neutral-400 mb-2">
                Bevestig wachtwoord
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-[14px]"
                placeholder="Herhaal je wachtwoord"
              />
            </div>

            <button
              type="submit"
              disabled={pageState === 'submitting' || !password || !confirmPassword}
              className="w-full py-3 px-4 bg-amber-300 hover:bg-amber-200 disabled:bg-amber-300/50 disabled:cursor-not-allowed text-neutral-950 font-medium rounded-full transition-all shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:shadow-[0_20px_45px_rgba(251,191,36,0.7)] focus:outline-none text-[15px]"
            >
              {pageState === 'submitting' ? 'Activeren...' : 'Account activeren'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]"></span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Roster CRM v0.1</span>
        </div>
      </div>
    </div>
  )
}
