// Enhanced auth utilities with Supabase-Backend JWT bridge

import { supabase } from './supabaseClient';

const TOKEN_KEY = 'plate_jwt_token';
const TOKEN_EXPIRY_KEY = 'plate_jwt_token_expiry';

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    // Set expiry (24 hours from now)
    const expiry = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    // Check if token is expired
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

// Enhanced function to get valid backend token
export async function getValidBackendToken(): Promise<string | null> {
  // First check if we have a valid cached token
  const cachedToken = getToken();
  if (cachedToken) {
    return cachedToken;
  }

  // If no cached token, try to get one from Supabase session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.log('No valid Supabase session');
      return null;
    }

    // Exchange Supabase token for backend token
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/supabase-token-exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supabaseToken: session.access_token,
        userId: session.user.id,
        email: session.user.email
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setToken(data.token);
      return data.token;
    } else {
      console.error('Failed to exchange token:', await response.text());
      return null;
    }

  } catch (error) {
    console.error('Error getting backend token:', error);
    return null;
  }
}

// Function to ensure user is authenticated before API calls
export async function ensureAuthenticated(): Promise<boolean> {
  const token = await getValidBackendToken();
  return token !== null;
} 