import { createContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Member } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  member: Member | null
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    member: null,
    isLoading: true,
  })

  // Fetch member profile from members table
  const fetchMemberProfile = useCallback(async (authUserId: string) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single()

    if (error) {
      console.error('Error fetching member profile:', error)
      return null
    }

    return data
  }, [])

  // Initialize auth state
  useEffect(() => {
    let isMounted = true
    let authInitialized = false

    console.log('[Auth] Starting initialization...')

    // Listen for auth changes - this handles login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] onAuthStateChange fired:', _event, !!session)
      if (!isMounted) return

      // Always update state on auth changes, regardless of timeout
      authInitialized = true

      let member = null
      if (session?.user) {
        try {
          member = await fetchMemberProfile(session.user.id)
          console.log('[Auth] Member profile fetched:', !!member)
        } catch (err) {
          console.error('[Auth] Error fetching member in onAuthStateChange:', err)
        }
      }

      console.log('[Auth] Setting state from onAuthStateChange, isLoading: false')
      setState({
        user: session?.user ?? null,
        session,
        member,
        isLoading: false,
      })
    })

    // Also call getSession as a fallback
    const initAuth = async () => {
      console.log('[Auth] Calling getSession...')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[Auth] getSession result:', !!session, error?.message)

        if (error) {
          console.error('[Auth] Error getting session:', error)
        }

        // Only update if onAuthStateChange hasn't fired yet
        if (!isMounted || authInitialized) {
          console.log('[Auth] Skipping getSession update (already initialized)')
          return
        }

        let member = null
        if (session?.user) {
          member = await fetchMemberProfile(session.user.id)
          console.log('[Auth] Member profile fetched from getSession:', !!member)
        }

        authInitialized = true
        console.log('[Auth] Setting state from getSession, isLoading: false')
        setState({
          user: session?.user ?? null,
          session: session ?? null,
          member,
          isLoading: false,
        })
      } catch (error) {
        console.error('[Auth] Auth initialization error:', error)
        if (isMounted && !authInitialized) {
          authInitialized = true
          setState({
            user: null,
            session: null,
            member: null,
            isLoading: false,
          })
        }
      }
    }

    initAuth()

    // Fallback timeout - only if nothing else worked
    const timeoutId = setTimeout(() => {
      console.log('[Auth] Timeout check - authInitialized:', authInitialized)
      if (isMounted && !authInitialized) {
        console.warn('[Auth] Timeout reached - forcing redirect to login')
        authInitialized = true
        setState({
          user: null,
          session: null,
          member: null,
          isLoading: false,
        })
      }
    }, 10000) // 10 seconds timeout

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [fetchMemberProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
    isAuthenticated: !!state.session,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
