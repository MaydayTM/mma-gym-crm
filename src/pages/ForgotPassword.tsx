import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle, AlertCircle, Loader2, Mail, ArrowLeft } from 'lucide-react'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      setSuccess(true)
    } catch (err) {
      console.error('Forgot password error:', err)
      setError(err instanceof Error ? err.message : 'Er ging iets mis bij het verzenden van de reset email')
    } finally {
      setIsLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-neutral-50 mb-2">Check je email!</h1>
            <p className="text-neutral-400 mb-2">
              We hebben een reset link gestuurd naar:
            </p>
            <p className="text-amber-300 font-medium mb-6">{email}</p>
            <p className="text-neutral-500 text-sm mb-6">
              Klik op de link in de email om je wachtwoord te resetten. De link is 1 uur geldig.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-amber-300 hover:bg-amber-200 text-neutral-950 font-medium rounded-full transition-all"
            >
              Terug naar login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Forgot Password Card */}
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8"
          style={{
            position: 'relative',
            // @ts-expect-error CSS custom properties
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          }}
        >
          {/* Back link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Terug naar login
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-[24px] font-semibold text-neutral-50 tracking-tight">Wachtwoord vergeten?</h1>
            <p className="text-[13px] text-neutral-500 mt-2">
              Vul je email in en we sturen je een link om je wachtwoord te resetten.
            </p>
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
              <label htmlFor="email" className="block text-[13px] font-medium text-neutral-400 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-[14px]"
                placeholder="jouw@email.be"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-amber-300 hover:bg-amber-200 disabled:bg-amber-300/50 text-neutral-950 font-medium rounded-full transition-all shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:shadow-[0_20px_45px_rgba(251,191,36,0.7)] focus:outline-none text-[15px] flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Verzenden...' : 'Verstuur reset link'}
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
