import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface MemberProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  profile_picture_url: string | null;
  role: 'admin' | 'medewerker' | 'coordinator' | 'coach' | 'fighter' | 'fan';
  status: string;
  belt_color: string | null;
  belt_stripes: number;
  disciplines: string[] | null;
  created_at: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: MemberProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchProfile(session.user.id, session);
        } else {
          setState({
            session: null,
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, session: Session) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // User might not have a member profile yet
        setState({
          session,
          user: session.user,
          profile: null,
          isLoading: false,
          isAuthenticated: true,
        });
        return;
      }

      setState({
        session,
        user: session.user,
        profile: data as MemberProfile,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (state.user?.id) {
      await fetchProfile(state.user.id, state.session!);
    }
  };

  return {
    ...state,
    signOut,
    refreshProfile,
    isAdmin: state.profile?.role === 'admin',
    isCoach: state.profile?.role === 'coach' || state.profile?.role === 'admin',
    isStaff: ['admin', 'medewerker', 'coordinator', 'coach'].includes(state.profile?.role || ''),
  };
}
