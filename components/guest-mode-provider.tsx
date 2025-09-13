"use client"

import React, { createContext, useContext, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface GuestFormData {
  ingredients: string[]
  cookingTime: number
  cuisine: string
  dietMode: boolean
  mealType: string
  servings: number
  mode: "fridge" | "explore"
  mood: string
}

interface GuestModeContextType {
  isGuestMode: boolean
  guestFormData: GuestFormData | null
  setGuestFormData: (data: GuestFormData) => void
  clearGuestData: () => void
  redirectToSignIn: (preserveData?: boolean) => void
}

const GuestModeContext = createContext<GuestModeContextType>({
  isGuestMode: false,
  guestFormData: null,
  setGuestFormData: () => {},
  clearGuestData: () => {},
  redirectToSignIn: () => {},
})

function GuestModeProviderContent({ children }: { children: React.ReactNode }) {
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [guestFormData, setGuestFormDataState] = useState<GuestFormData | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if we're in guest mode from URL params
  useEffect(() => {
    const mode = searchParams?.get('mode')
    setIsGuestMode(mode === 'guest')
  }, [searchParams])

  const setGuestFormData = (data: GuestFormData) => {
    setGuestFormDataState(data)
    // Store in sessionStorage for persistence across page reloads
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('guestFormData', JSON.stringify(data))
    }
  }

  const clearGuestData = () => {
    setGuestFormDataState(null)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('guestFormData')
    }
  }

  const redirectToSignIn = (preserveData = true) => {
    if (preserveData && guestFormData) {
      // Store form data in sessionStorage before redirecting
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('guestFormData', JSON.stringify(guestFormData))
        sessionStorage.setItem('redirectAfterSignIn', '/find-recipes')
      }
    }
    router.push('/login')
  }

  // Load guest form data from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('guestFormData')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setGuestFormDataState(parsed)
        } catch (error) {
          console.error('Error parsing stored guest form data:', error)
          sessionStorage.removeItem('guestFormData')
        }
      }
    }
  }, [])

  return (
    <GuestModeContext.Provider
      value={{
        isGuestMode,
        guestFormData,
        setGuestFormData,
        clearGuestData,
        redirectToSignIn,
      }}
    >
      {children}
    </GuestModeContext.Provider>
  )
}

export const GuestModeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={
      <GuestModeContext.Provider
        value={{
          isGuestMode: false,
          guestFormData: null,
          setGuestFormData: () => {},
          clearGuestData: () => {},
          redirectToSignIn: () => {},
        }}
      >
        {children}
      </GuestModeContext.Provider>
    }>
      <GuestModeProviderContent>
        {children}
      </GuestModeProviderContent>
    </Suspense>
  )
}

export const useGuestMode = () => {
  const context = useContext(GuestModeContext)
  if (!context) {
    throw new Error('useGuestMode must be used within a GuestModeProvider')
  }
  return context
}
