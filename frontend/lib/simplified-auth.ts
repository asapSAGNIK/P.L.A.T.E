import { supabase } from './supabaseClient'

/**
 * Get the current authentication token for API calls
 */
export async function getAuthTokenForAPI(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Ensure user is authenticated, redirect to login if not
 */
export async function ensureAuthenticated(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

