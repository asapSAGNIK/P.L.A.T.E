"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChefHat, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from '../../lib/supabase/client'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Removed custom registration - using Google OAuth only

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) {
        toast({ 
          title: 'Google sign-in failed', 
          description: error.message, 
          variant: 'destructive' 
        })
      }
      // Supabase will handle the redirect automatically
    } catch (error) {
      toast({ 
        title: 'Google sign-in failed', 
        description: 'Please try again',
        variant: 'destructive' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/dashboard")
      }
    })
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        router.push("/dashboard")
      }
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <ChefHat className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Join the Kitchen!</CardTitle>
          <CardDescription>Ready to become a culinary master? Let's get you started! 🔥</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={isLoading}>
            <Mail className="mr-2 h-4 w-4" />
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            Already a chef?{" "}
            <Link href="/login" className="text-orange-600 hover:underline font-medium">
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
