import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getValidBackendToken, setToken, removeToken } from '../lib/auth';
import { useRouter } from 'next/navigation';

interface AuthState {
  user: any;
  session: any;
  backendToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    backendToken: null,
    loading: true,
    isAuthenticated: false,
  });
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Get Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase session error:', error);
          if (mounted) {
            setAuthState(prev => ({ ...prev, loading: false }));
          }
          return;
        }

        if (session) {
          // Get backend token
          const backendToken = await getValidBackendToken();
          
          if (mounted) {
            setAuthState({
              user: session.user,
              session,
              backendToken,
              loading: false,
              isAuthenticated: !!backendToken,
            });
          }
        } else {
          if (mounted) {
            setAuthState({
              user: null,
              session: null,
              backendToken: null,
              loading: false,
              isAuthenticated: false,
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session) {
          // User signed in, get backend token
          const backendToken = await getValidBackendToken();
          setAuthState({
            user: session.user,
            session,
            backendToken,
            loading: false,
            isAuthenticated: !!backendToken,
          });
        } else if (event === 'SIGNED_OUT') {
          // User signed out, clear tokens
          removeToken();
          setAuthState({
            user: null,
            session: null,
            backendToken: null,
            loading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      removeToken();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const refreshBackendToken = async (): Promise<string | null> => {
    const token = await getValidBackendToken();
    setAuthState(prev => ({
      ...prev,
      backendToken: token,
      isAuthenticated: !!token,
    }));
    return token;
  };

  return {
    ...authState,
    signOut,
    refreshBackendToken,
  };
}
