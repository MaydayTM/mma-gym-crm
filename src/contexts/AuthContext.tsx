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

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
        }

        if (!isMounted) return

        let member = null
        if (session?.user) {
          member = await fetchMemberProfile(session.user.id)
        }

        setState({
          user: session?.user ?? null,
          session: session ?? null,
          member,
          isLoading: false,
        })
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (isMounted) {
          setState({
            user: null,
            session: null,
            member: null,
            isLoading: false,
          })
        }
      }
    }

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setState(prev => {
          if (prev.isLoading) {
            console.warn('Auth initialization timed out')
            return {
              user: null,
              session: null,
              member: null,
              isLoading: false,
            }
          }
          return prev
        })
      }
    }, 5000)

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return

      let member = null
      if (session?.user) {
        member = await fetchMemberProfile(session.user.id)
      }

      setState({
        user: session?.user ?? null,
        session,
        member,
        isLoading: false,
      })
    })

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
