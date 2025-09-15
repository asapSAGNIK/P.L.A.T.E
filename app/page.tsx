"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, Utensils, Sparkles, ArrowRight, LogIn, Users, Clock, Heart } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function LandingPage() {
  const router = useRouter()
  const { user, loading, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Handle Google sign-in directly from landing page
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
      toast({ 
        title: "Welcome back, Chef! 👨‍🍳", 
        description: "Ready to cook something amazing!" 
      })
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">P.L.A.T.E</span>
          </div>
          {/* Top-right sign in button removed for cleaner header */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              <span className="block text-orange-600">Personalized Learning</span>
              <span className="block text-gray-900">And Assistance For</span>
              <span className="block text-orange-600">Taste Enhancement</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your ingredients into delicious recipes with our intelligent cooking assistant.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Guest Mode Button */}
            <Link href="/find-recipes?mode=guest" className="w-full">
              <Button size="lg" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 text-lg">
                <ChefHat className="mr-3 h-6 w-6" />
                Visit Kitchen
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>

            {/* Sign In Button */}
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-4 text-lg"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
            >
              <LogIn className="mr-3 h-6 w-6" />
              {isSigningIn ? "Signing in..." : "Sign In"}
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              Made with ❤️ for food lovers everywhere
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}