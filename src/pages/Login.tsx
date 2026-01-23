import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const { signIn, signInWithGoogle, isAuthenticated } = useAuth()
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

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsGoogleLoading(true)

    const { error } = await signInWithGoogle()

    if (error) {
      setError(error)
      setIsGoogleLoading(false)
    }
    // If successful, the page will redirect to Google
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
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-[13px] font-medium text-neutral-400">
                  Wachtwoord
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Wachtwoord vergeten?
                </Link>
              </div>
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
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 px-4 bg-amber-300 hover:bg-amber-200 disabled:bg-amber-300/50 text-neutral-950 font-medium rounded-full transition-all shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:shadow-[0_20px_45px_rgba(251,191,36,0.7)] focus:outline-none text-[15px]"
            >
              {isLoading ? 'Inloggen...' : 'Inloggen'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-neutral-500">of</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-neutral-100 disabled:bg-neutral-200 text-neutral-900 font-medium rounded-full transition-all border border-neutral-200 flex items-center justify-center gap-3"
          >
            {isGoogleLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin text-neutral-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verbinden...
              </>
            ) : (
              <>
                {/* Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Doorgaan met Google
              </>
            )}
          </button>

          {/* Claim account link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-neutral-500 text-[13px]">
              Nieuw lid van Reconnect?{' '}
              <Link to="/claim-account" className="text-amber-400 hover:text-amber-300 transition-colors">
                Activeer je account
              </Link>
            </p>
          </div>
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
