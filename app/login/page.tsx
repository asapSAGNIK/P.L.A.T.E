"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useGuestMode } from "@/components/guest-mode-provider"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading, signInWithGoogle } = useAuth()
  const { clearGuestData } = useGuestMode()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      toast({ 
        title: "Welcome back, Chef! 👨‍🍳", 
        description: "Ready to cook something amazing!" 
      })
    } catch (error) {
      toast({ 
        title: 'Google login failed', 
        description: error instanceof Error ? error.message : 'An error occurred', 
        variant: 'destructive' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && user) {
      // Clear guest data when user signs in
      clearGuestData()
      
      // Check if there's a stored redirect path
      const redirectPath = typeof window !== 'undefined' ? sessionStorage.getItem('redirectAfterSignIn') : null
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterSignIn')
        router.push(redirectPath)
      } else {
        router.push("/find-recipes")
      }
    }
  }, [user, loading, router, clearGuestData])

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <ChefHat className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back, Chef!</CardTitle>
          <CardDescription>Ready to whip up something delicious? Let's get cooking! 🍳</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGoogleLogin} variant="outline" className="w-full" disabled={isLoading}>
            <Mail className="mr-2 h-4 w-4" />
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            New to the kitchen?{" "}
            <Link href="/register" className="text-orange-600 hover:underline font-medium">
              Join the crew
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
