import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getToken } from './auth'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getAuthHeader() {
  const { getAuthTokenForAPI } = await import('./auth-utils');
  const token = await getAuthTokenForAPI();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
