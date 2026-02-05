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
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

// Context exports are fine in React - used for dependency injection pattern
// eslint-disable-next-line react-refresh/only-export-components
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

  // Fetch member profile from members table with timeout
  // Tries auth_user_id first, then falls back to id (legacy)
  const fetchMemberProfile = useCallback(async (userId: string, userEmail?: string): Promise<Member | null> => {
    try {
      // Add timeout using Promise.race
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )

      // First try to find by auth_user_id
      const queryByAuthUserId = supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      const result = await Promise.race([queryByAuthUserId, timeoutPromise])

      // If timeout won, result is null
      if (result === null) {
        console.warn('[Auth] Member profile fetch timed out')
        return null
      }

      const { data, error } = result

      if (!error && data) {
        return data
      }

      // If not found by auth_user_id, try by id (legacy - member.id = auth.uid)
      if (error?.code === 'PGRST116') {
        const legacyResult = await supabase
          .from('members')
          .select('*')
          .eq('id', userId)
          .single()

        if (!legacyResult.error && legacyResult.data) {
          return legacyResult.data
        }

        // Last resort: try by email (for auto-linking unlinked members)
        // Only auto-link if this is the ONLY unlinked member with this email
        // to prevent accidentally linking to the wrong member record
        if (userEmail) {
          const emailResult = await supabase
            .from('members')
            .select('*')
            .eq('email', userEmail)
            .is('auth_user_id', null)  // Only unlinked members

          if (!emailResult.error && emailResult.data && emailResult.data.length === 1) {
            const memberToLink = emailResult.data[0]
            // Link the member to this auth user
            const { error: linkError } = await supabase
              .from('members')
              .update({ auth_user_id: userId })
              .eq('id', memberToLink.id)

            if (linkError) {
              console.error('[Auth] Error linking member:', linkError)
            } else {
              return { ...memberToLink, auth_user_id: userId }
            }
          } else if (emailResult.data && emailResult.data.length > 1) {
            console.warn('[Auth] Multiple unlinked members with same email, skipping auto-link')
          }
        }
      }

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Error fetching member profile:', error.message)
      }

      return null
    } catch (err) {
      if (err instanceof Error && err.message === 'Timeout') {
        console.warn('[Auth] Member profile fetch timed out')
      } else {
        console.error('[Auth] Error fetching member profile:', err)
      }
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let isMounted = true
    let authInitialized = false

    // Listen for auth changes - this handles login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return

      // Always update state on auth changes, regardless of timeout
      authInitialized = true

      // IMPORTANT: Set loading to false immediately with session info
      // Member profile is fetched separately to prevent blocking
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        session,
        isLoading: false,
      }))

      // Fetch member profile in background (non-blocking)
      if (session?.user && isMounted) {
        try {
          const member = await fetchMemberProfile(session.user.id, session.user.email)
          if (isMounted) {
            setState(prev => ({ ...prev, member }))
          }
        } catch (err) {
          console.error('[Auth] Error fetching member in onAuthStateChange:', err)
        }
      } else if (!session && isMounted) {
        setState(prev => ({ ...prev, member: null }))
      }
    })

    // Also call getSession as a fallback
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[Auth] Error getting session:', error)
        }

        // Only update if onAuthStateChange hasn't fired yet
        if (!isMounted || authInitialized) {
          return
        }

        authInitialized = true

        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session: session ?? null,
          isLoading: false,
        }))

        // Fetch member profile in background (non-blocking)
        if (session?.user && isMounted) {
          const member = await fetchMemberProfile(session.user.id, session.user.email)
          if (isMounted) {
            setState(prev => ({ ...prev, member }))
          }
        }
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
      if (isMounted && !authInitialized) {
        console.warn('[Auth] Timeout reached - forcing state update')
        authInitialized = true
        setState({
          user: null,
          session: null,
          member: null,
          isLoading: false,
        })
      }
    }, 5000) // 5 seconds timeout (reduced from 10)

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

  const signInWithGoogle = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      // Use production URL if in production, otherwise localhost
      const productionUrl = 'https://crm.mmagym.be'
      const redirectUrl = import.meta.env.PROD ? productionUrl : window.location.origin

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (err) {
      console.error('[Auth] Google sign-in error:', err)
      return {
        error: err instanceof Error ? err.message : 'Google sign-in failed',
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value: AuthContextType = {
    ...state,
    signIn,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!state.session,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
