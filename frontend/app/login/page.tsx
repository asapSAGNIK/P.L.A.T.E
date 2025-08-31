"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { isUserAuthenticated } from '../../lib/simplified-auth'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) {
        toast({ title: 'Google login failed', description: error.message, variant: 'destructive' })
      }
      // Supabase will handle the redirect
    } catch (error) {
      toast({ title: 'Google login failed', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const authenticated = await isUserAuthenticated();
        if (authenticated) {
          router.push("/dashboard");
        }
      }
    })
    
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        toast({ 
          title: "Welcome back, Chef! 👨‍🍳", 
          description: "Ready to cook something amazing!" 
        });
        
        // Direct redirect on successful Google OAuth
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    })
    
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router, toast])

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
            Continue with Google
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
