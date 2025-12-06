import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the page they tried to visit before being redirected to login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    console.log('[Login] useEffect - isAuthenticated:', isAuthenticated)
    if (isAuthenticated) {
      console.log('[Login] Redirecting to:', from)
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        console.error('Login error:', error)
        setError(error.message)
        setIsLoading(false)
      }
      // Don't navigate here - the useEffect above will handle it when isAuthenticated becomes true
    } catch (err) {
      console.error('Unexpected login error:', err)
      setError('Er ging iets mis bij het inloggen')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card with glassmorphism */}
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8"
          style={{
            position: 'relative',
            // @ts-expect-error CSS custom properties
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          }}
        >
          {/* Gradient border pseudo-element handled by global CSS */}

          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Roster</h1>
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 mt-2">Reconnect Academy</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl">
              <p className="text-rose-300 text-[13px]">{error}</p>
            </div>
          )}

          {/* Login form */}
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

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-neutral-400 mb-2">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-[14px]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-amber-300 hover:bg-amber-200 disabled:bg-amber-300/50 text-neutral-950 font-medium rounded-full transition-all shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:shadow-[0_20px_45px_rgba(251,191,36,0.7)] focus:outline-none text-[15px]"
            >
              {isLoading ? 'Inloggen...' : 'Inloggen'}
            </button>
          </form>
        </div>

        {/* Footer with live indicator */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]"></span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Roster CRM v0.1</span>
        </div>
      </div>
    </div>
  )
}
