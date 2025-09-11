import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getAuthTokenForAPI } from './simplified-auth'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getAuthHeader(): Promise<{ Authorization: string } | {}> {
  try {
    const token = await getAuthTokenForAPI();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    console.error('Error getting auth header:', error);
    return {};
  }
}
