// Comprehensive authentication utilities with backward compatibility
import { supabase } from './supabaseClient';

// Backward compatibility: Keep the old token management for any existing code
const TOKEN_KEY = 'plate_jwt_token';
const TOKEN_EXPIRY_KEY = 'plate_jwt_token_expiry';

// Legacy functions for backward compatibility
export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    const expiry = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (token && expiry && Date.now() > parseInt(expiry)) {
      removeToken();
      return null;
    }
    
    return token;
  }
  return null;
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
}

// New simplified functions for Google OAuth
export async function getSupabaseSession() {
  try {
    if (!supabase) {
      return { session: null, error: new Error('Supabase client not available') };
    }
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    console.error('Error getting session:', error);
    return { session: null, error };
  }
}

export async function isUserAuthenticated(): Promise<boolean> {
  const { session } = await getSupabaseSession();
  return !!session?.user;
}

export async function getSupabaseToken(): Promise<string | null> {
  const { session } = await getSupabaseSession();
  return session?.access_token || null;
}

export async function getUserInfo() {
  const { session } = await getSupabaseSession();
  return {
    userId: session?.user?.id || null,
    email: session?.user?.email || null,
    user: session?.user || null
  };
}

// Enhanced function for API calls - tries both methods
export async function getAuthTokenForAPI(): Promise<string | null> {
  // First try Supabase token (new method)
  const supabaseToken = await getSupabaseToken();
  if (supabaseToken) {
    return supabaseToken;
  }

  // Fallback to legacy token (backward compatibility)
  const legacyToken = getToken();
  if (legacyToken) {
    return legacyToken;
  }

  return null;
}

// Function to ensure user is authenticated
export async function ensureAuthenticated(): Promise<boolean> {
  const token = await getAuthTokenForAPI();
  return token !== null;
}

// Sign out function that clears both auth methods
export async function signOut() {
  try {
    if (supabase) {
      await supabase.auth.signOut();
    }
    removeToken(); // Clear legacy tokens too
  } catch (error) {
    console.error('Sign out error:', error);
  }
}
