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
import { setToken } from '../../lib/auth'
import { supabase } from '../../lib/supabaseClient'

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match!",
        description: "Make sure both passwords are identical.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Use backend endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        toast({
          title: "Account created!",
          description: "Welcome to Plate!",
        })
        const data = await response.json()
        setToken(data.token)
        router.push("/dashboard")
      } else {
        throw new Error("Registration failed")
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) {
        toast({ title: 'Google registration failed', description: error.message, variant: 'destructive' })
      }
      // Supabase will handle the redirect
    } catch (error) {
      toast({ title: 'Google registration failed', variant: 'destructive' })
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
          <Button onClick={handleGoogleRegister} variant="outline" className="w-full" disabled={isLoading}>
            <Mail className="mr-2 h-4 w-4" />
            Continue with Google
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
