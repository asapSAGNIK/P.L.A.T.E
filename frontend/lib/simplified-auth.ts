// Simplified auth specifically for Google OAuth + Recipe Generation
// Re-export from comprehensive auth utilities for backward compatibility
export {
  getSupabaseSession,
  isUserAuthenticated,
  getSupabaseToken,
  getUserInfo,
  setToken,
  getToken,
  removeToken,
  getAuthTokenForAPI,
  ensureAuthenticated,
  signOut
} from './auth-utils';
