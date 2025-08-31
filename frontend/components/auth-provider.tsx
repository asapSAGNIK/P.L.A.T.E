"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side and after mounting
    if (typeof window === 'undefined' || !mounted) return;

    // Dynamically import supabase to avoid SSR issues
    import('../lib/supabaseClient').then(({ supabase }) => {
      // Check if supabase client is available
      if (!supabase) {
        console.warn('Supabase client not available');
        setLoading(false);
        return;
      }

      // Hydrate session on mount
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
      // Listen for auth state changes
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });
      return () => {
        listener?.subscription.unsubscribe();
      };
    }).catch((error) => {
      console.error('Failed to load Supabase client:', error);
      setLoading(false);
    });
  }, [mounted]);

  // Don't render children until mounted to avoid SSR issues
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 