"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChefHat, Search, Bookmark, History, TrendingUp, Clock, Heart, Sparkles, ArrowRight, Settings, LogOut, User as UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from '../../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

// Mock data - replace with actual API calls
const mockStats = {
  recipesCooked: 12,
  weeklyGoal: 15,
  savedRecipes: 8,
  newSuggestions: 3,
}

const mockTips = [
  "🥕 You have carrots and chicken in your fridge - perfect for a hearty stew!",
  "✨ Try something new today! How about exploring Asian cuisine?",
  "🔥 You're on fire this week! Keep up the amazing cooking streak!",
]

export default function DashboardPage() {
  const [currentTip, setCurrentTip] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
        // First-time detection: if created_at is within 2 minutes of now
        const created = user.created_at ? new Date(user.created_at) : null
        const now = new Date()
        if (created && typeof created.getTime === 'function' && (now.getTime() - created.getTime() < 2 * 60 * 1000)) {
          setIsFirstTime(true)
        }
      }
    })
  }, [router])

  // Helper to get display name
  const getDisplayName = () => {
    if (!user) return "Chef"
    return (
      (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
      user.email ||
      "Chef"
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <h1 className="text-xl font-bold text-gray-900">Your Kitchen</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Avatar className="h-8 w-8">
              {/* Optionally use user picture if available */}
              <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg?height=32&width=32"} />
              <AvatarFallback>{getDisplayName().split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0,2)}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
              <p className="text-xs text-gray-500">Home Chef</p>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            {isFirstTime
              ? `Welcome to Plate, ${getDisplayName()}! 👋`
              : `Welcome back, ${getDisplayName()}! 👨‍🍳`}
          </h2>
          <p className="text-xl text-gray-600">
            {isFirstTime
              ? "We're excited to have you in the kitchen. Ready to start your culinary journey?"
              : "Ready to create something delicious today?"}
          </p>
        </div>

        {/* New Quick Action CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Primary CTA: Find Recipes (Fridge) */}
          <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <ChefHat className="h-16 w-16 mx-auto mb-4 text-orange-200" />
              <h3 className="text-2xl font-bold mb-2">What's in Your Fridge?</h3>
              <p className="text-orange-100 mb-6 text-lg">
                Tell us what you have, and we'll find the perfect recipe for you!
              </p>
              <Link href="/find-recipes">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-8 py-3">
                  <Search className="mr-2 h-5 w-5" />
                  Find Recipes
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* New CTA: Explore Recipes */}
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-purple-200" />
              <h3 className="text-2xl font-bold mb-2">Explore New Flavors!</h3>
              <p className="text-purple-100 mb-6 text-lg">
                Discover exciting recipes based on cuisines, moods, or dietary preferences.
              </p>
              <Link href="/find-recipes?mode=explore">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-8 py-3">
                  <Search className="mr-2 h-5 w-5" />
                  Explore Recipes
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats - Now Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/history">
            <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">This Week</p>
                    <p className="text-2xl font-bold">{mockStats.recipesCooked} Recipes</p>
                    <p className="text-orange-100 text-xs">Goal: {mockStats.weeklyGoal}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200 group-hover:scale-110 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/saved">
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Saved</p>
                    <p className="text-2xl font-bold">{mockStats.savedRecipes} Recipes</p>
                    <p className="text-purple-100 text-xs">Ready to cook</p>
                  </div>
                  <Bookmark className="h-8 w-8 text-purple-200 group-hover:scale-110 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Removed: Inspire Me - functionality moved to new CTA */}

              {/* Removed: Saved Recipes quick action card */}

              {/* Removed: Cooking History quick action card */}
            </div>
          </div>
          {/* Quick Access Section */}
          <div className="lg:col-span-3">
            {/* Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/profile">
                  <Button variant="ghost" className="w-full justify-start">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
