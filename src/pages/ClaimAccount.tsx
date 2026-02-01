import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function ClaimAccount() {
  const [identifier, setIdentifier] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error: fnError } = await supabase.functions.invoke('request-claim-email', {
        body: { identifier: identifier.trim() },
      })

      if (fnError) {
        throw fnError
      }

      // Always show success (security: don't reveal if account exists)
      setSubmitted(true)
    } catch (err) {
      console.error('Claim request error:', err)
      setError('Er ging iets mis. Probeer het later opnieuw.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Account Activeren</h1>
            <p className="text-[13px] text-neutral-400 mt-2">
              Vul je lidnummer of e-mailadres in om je account te activeren
            </p>
          </div>

          {submitted ? (
            // Success state
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-50 mb-2">Check je inbox</h2>
              <p className="text-neutral-400 text-[14px] mb-6">
                Als er een account bestaat met deze gegevens, ontvang je binnen enkele minuten een e-mail met een activatielink.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setIdentifier('')
                  }}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 font-medium rounded-full transition-all text-[14px]"
                >
                  Probeer opnieuw
                </button>
                <Link
                  to="/login"
                  className="block w-full py-3 px-4 text-center text-amber-400 hover:text-amber-300 font-medium transition-colors text-[14px]"
                >
                  Terug naar inloggen
                </Link>
              </div>
            </div>
          ) : (
            // Form state
            <>
              {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl">
                  <p className="text-rose-300 text-[13px]">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="identifier" className="block text-[13px] font-medium text-neutral-400 mb-2">
                    Lidnummer of e-mailadres
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-[14px]"
                    placeholder="2134 of jouw@email.be"
                  />
                  <p className="mt-2 text-[12px] text-neutral-500">
                    Je lidnummer staat op je ClubPlanner account of op je welkomstmail.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !identifier.trim()}
                  className="w-full py-3 px-4 bg-amber-300 hover:bg-amber-200 disabled:bg-amber-300/50 disabled:cursor-not-allowed text-neutral-950 font-medium rounded-full transition-all shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:shadow-[0_20px_45px_rgba(251,191,36,0.7)] focus:outline-none text-[15px]"
                >
                  {isLoading ? 'Versturen...' : 'Verstuur activatielink'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-neutral-500 text-[13px]">
                  Al een account?{' '}
                  <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
                    Inloggen
                  </Link>
                </p>
              </div>
            </>
          )}
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
