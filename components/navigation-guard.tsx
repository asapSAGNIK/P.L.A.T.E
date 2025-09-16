"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useGuestMode } from '@/components/guest-mode-provider'

interface NavigationGuardProps {
  children: React.ReactNode
}

// Routes that are allowed in guest mode
const GUEST_ALLOWED_ROUTES = [
  '/',
  '/find-recipes',
  '/register'
]

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/saved',
  '/history',
  '/profile',
  '/settings',
  '/recipes'
]

export function NavigationGuard({ children }: NavigationGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, signInWithGoogle } = useAuth()
  const { isGuestMode, redirectToSignIn } = useGuestMode()

  useEffect(() => {
    // Don't redirect while auth is loading
    if (loading) return

    // If user is authenticated, clear guest mode and allow access to all routes
    if (user) {
      return
    }

    // If in guest mode, check if current route is allowed
    if (isGuestMode) {
      const isAllowedRoute = GUEST_ALLOWED_ROUTES.some(route => 
        pathname === route || pathname.startsWith(route + '/')
      )
      
      if (!isAllowedRoute) {
        // Directly trigger Google OAuth instead of redirecting to landing page
        signInWithGoogle().catch(error => {
          console.error('Error signing in:', error);
        })
        return
      }
    }

    // If not in guest mode and trying to access protected routes, redirect to login
    if (!isGuestMode && !user) {
      const isProtectedRoute = PROTECTED_ROUTES.some(route => 
        pathname === route || pathname.startsWith(route + '/')
      )
      
      if (isProtectedRoute) {
        router.push('/')
        return
      }
    }
  }, [user, loading, isGuestMode, pathname, router, redirectToSignIn, signInWithGoogle])

  return <>{children}</>
}
