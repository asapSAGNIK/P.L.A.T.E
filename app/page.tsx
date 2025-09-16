"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, Utensils, Sparkles, ArrowRight, LogIn, Users, Clock, Heart } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { SlotMachineLogo } from "@/components/slot-machine-logo"
import { HeroIllustration } from "@/components/hero-illustration"
import { DiagonalIconBg } from "@/components/diagonal-icon-bg"

export default function LandingPage() {
  const router = useRouter()
  const { user, loading, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [showWelcomeText, setShowWelcomeText] = useState(false)

  // Handle Google sign-in directly from landing page
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
      // Removed welcome toast - direct redirect to OAuth
    } catch (error) {
      toast({ 
        title: 'Google sign-in failed', 
        description: error instanceof Error ? error.message : 'An error occurred', 
        variant: 'destructive' 
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  // If user is already authenticated, redirect to find-recipes
  useEffect(() => {
    if (!loading && user) {
      router.replace("/find-recipes")
    }
  }, [user, loading, router])

  // Show welcome text after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeText(true)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])

  // Show loading while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your kitchen...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, don't render the landing page
  if (user) {
    return null
  }

  return (
    <div className="relative min-h-screen">
      <DiagonalIconBg />
      {/* Header removed per request */}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start relative z-10">
          {/* Left: Title (slot), subtitle, and actions below */}
          <div className="w-full max-w-2xl text-left justify-self-center lg:justify-self-start bg-gradient-to-br from-white/90 to-pink-50/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200/50 relative overflow-hidden">
            {/* Miami diner decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-yellow-400 to-pink-400 rounded-full translate-y-8 -translate-x-8 opacity-20"></div>
            <div className="mb-4">
              <SlotMachineLogo reelSizePx={56} letterSizeClass="text-6xl" gapClass="space-x-4" />
            </div>
            <p className="mt-2 mx-auto text-base font-medium tracking-wide text-black-700/90 text-center">
              Personalized Learning And Assistance For Taste Enhancement.
            </p>

            {/* Actions moved under the left content */}
            <div className="mt-8 space-y-5 max-w-sm mx-auto">
              <Link href="/find-recipes?mode=guest" className="w-full block">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-base">
                <ChefHat className="mr-3 h-6 w-6" />
                Visit Kitchen
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>

              <Button
                variant="outline"
                className="w-full font-semibold py-3 text-base flex items-center justify-center gap-3"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
              >
                {/* Google logo SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" className="h-5 w-5" aria-hidden="true">
                  <path fill="#EA4335" d="M488 261.8c0-17.7-1.6-35-4.7-51.8H250v98.1h134.3c-5.8 31.3-23.5 57.8-50.1 75.5v62.7h81.1c47.5-43.7 72.7-108.1 72.7-184.5z"/>
                  <path fill="#34A853" d="M250 500c67.5 0 124.1-22.4 165.4-60.6l-81.1-62.7c-22.5 15.1-51.3 24-84.3 24-64.9 0-120-43.8-139.6-102.7H27.8v64.5C68.8 447.1 153.6 500 250 500z"/>
                  <path fill="#4A90E2" d="M110.4 298c-4.8-14.4-7.6-29.8-7.6-45.5s2.8-31.1 7.6-45.5V142.5H27.8C10 177.3 0 217.5 0 252.5s10 75.2 27.8 110l82.6-64.5z"/>
                  <path fill="#FBBC05" d="M250 99.1c36.7 0 69.6 12.6 95.5 37.4l71.6-71.6C374.1 25.4 317.5 2.5 250 2.5 153.6 2.5 68.8 55.4 27.8 142.5l82.6 64.5C130 142.9 185.1 99.1 250 99.1z"/>
                </svg>
                {isSigningIn ? "Signing in..." : "Continue with Google"}
              </Button>
            </div>

            {/* Welcome text below the left card, within the left column */}
            <div className="w-full max-w-2xl mx-auto lg:mx-0 mt-6">
              <div 
                className={`font-yatra-one transition-all duration-1000 ease-out transform ${
                  showWelcomeText 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-8 opacity-0'
                }`}
              >
                <p className="text-lg text-pink-700/80 text-center leading-relaxed">
                  Hello people, P.L.A.T.E is purposed to serve your stomach and tastebuds, while making sure your culinary experience is made easy ~ SAGNIK
                </p>
              </div>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="w-full max-w-xl justify-self-center lg:justify-self-end">
            <HeroIllustration className="mx-auto lg:ml-auto" height={560} width={560} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Made with ❤️ for food lovers everywhere
          </p>
        </div>
      </main>
    </div>
  )
}