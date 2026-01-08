import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle, AlertCircle, Loader2, Lock } from 'lucide-react'

export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  const navigate = useNavigate()

  // Check if we have a valid recovery session from the email link
  useEffect(() => {
    const checkSession = async () => {
      // Supabase automatically handles the recovery token from the URL hash
      const { data: { session } } = await supabase.auth.getSession()

      // Check URL for recovery type
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const type = hashParams.get('type')

      if (type === 'recovery' || session) {
        setIsValidSession(true)
      } else {
        setIsValidSession(false)
      }
    }

    // Listen for auth state changes (when Supabase processes the recovery token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true)
      }
    })

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      return
    }

    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 karakters zijn')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      console.error('Password reset error:', err)
      setError(err instanceof Error ? err.message : 'Er ging iets mis bij het resetten van je wachtwoord')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-4" />
          <p className="text-neutral-400">Even geduld...</p>
        </div>
      </div>
    )
  }

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-neutral-50 mb-2">Link verlopen</h1>
            <p className="text-neutral-400 mb-6">
              Deze reset link is ongeldig of verlopen. Vraag een nieuwe reset link aan.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-amber-300 hover:bg-amber-200 text-neutral-950 font-medium rounded-full transition-all"
            >
              Terug naar login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-neutral-50 mb-2">Wachtwoord gewijzigd!</h1>
            <p className="text-neutral-400 mb-6">
              Je wachtwoord is succesvol gewijzigd. Je wordt doorgestuurd naar de login pagina...
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-amber-300 hover:bg-amber-200 text-neutral-950 font-medium rounded-full transition-all"
            >
              Nu inloggen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Reset Password Card */}
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8"
          style={{
            position: 'relative',
            // @ts-expect-error CSS custom properties
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-[24px] font-semibold text-neutral-50 tracking-tight">Nieuw wachtwoord</h1>
            <p className="text-[13px] text-neutral-500 mt-2">Kies een nieuw wachtwoord voor je account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <p className="text-rose-300 text-[13px]">{error}</p>
            </div>
          )}

          {/* Form */}
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
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-[14px]"
                placeholder="Herhaal je wachtwoord"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-amber-300 hover:bg-amber-200 disabled:bg-amber-300/50 text-neutral-950 font-medium rounded-full transition-all shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:shadow-[0_20px_45px_rgba(251,191,36,0.7)] focus:outline-none text-[15px] flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Wachtwoord wijzigen...' : 'Wachtwoord wijzigen'}
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
