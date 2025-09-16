"use client";
import React, { useEffect, useState } from 'react'
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabaseAPI } from '@/lib/supabase/api'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChefHat, Clock, Users, Star, Refrigerator, Compass, Loader2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RecipeGenerationHistoryEntry {
  id: string;
  recipe_data: {
    id: string;
    title: string;
    description: string;
    cookingTime: number;
    difficulty: string;
    ingredients: string[];
    rating: number;
    servings: number;
    instructions: string;
    isAIGenerated: boolean;
  };
  mode: 'fridge' | 'explore';
  ingredients_used: string[];
  query_used?: string;
  filters?: any;
  generated_at: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<RecipeGenerationHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      try {
        console.log('Loading recipe history...')
        const data = await supabaseAPI.getRecipeHistory()
        console.log('Loaded recipe history:', data)
        
        // Handle both Edge Function response format and direct array format
        const history = data.history || data || []
        setHistory(history)
      } catch (error) {
        console.error('Error fetching history:', error);
        setError('Failed to load recipe history. Please try again.')
        toast({
          title: "Error",
          description: "Failed to load cooking history",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [toast])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/")
      }
    })
  }, [router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModeIcon = (mode: 'fridge' | 'explore') => {
    return mode === 'fridge' ? <Refrigerator className="h-4 w-4" /> : <Compass className="h-4 w-4" />;
  };

  const getModeColor = (mode: 'fridge' | 'explore') => {
    return mode === 'fridge' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const getModeLabel = (mode: 'fridge' | 'explore') => {
    return mode === 'fridge' ? 'Fridge Mode' : 'Explore Mode';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen ">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex h-16 items-center px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">Cooking History</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
                <p className="text-lg font-medium text-gray-600">Loading your cooking history... 👨‍🍳</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen ">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex h-16 items-center px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">Cooking History</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <ChefHat className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading history</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen ">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Cooking History</span>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No cooking history yet</h2>
              <p className="text-gray-600 mb-4">Start generating recipes to see your cooking history here!</p>
              <Link href="/find-recipes">
                <Button>
                  <ChefHat className="mr-2 h-4 w-4" />
                  Generate Recipes
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Your Recipe Generation History</h1>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {history.length} recipes generated
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {history.map((entry) => (
                  <Card key={entry.id} className="bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{entry.recipe_data.title}</h3>
                            <Badge className={getModeColor(entry.mode)}>
                              {getModeIcon(entry.mode)}
                              <span className="ml-1">{getModeLabel(entry.mode)}</span>
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{entry.recipe_data.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{entry.recipe_data.cookingTime} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{entry.recipe_data.servings} servings</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-current text-yellow-400" />
                              <span>{entry.recipe_data.rating}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {entry.recipe_data.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-gray-500">{formatDate(entry.generated_at)}</span>
                          <Link href={`/recipe/${entry.recipe_data.id}?from=history`}>
                            <Button size="sm" variant="outline">
                              <Eye className="mr-2 h-4 w-4" />
                              View Recipe
                            </Button>
                          </Link>
                        </div>
                      </div>
                      
                      {entry.mode === 'fridge' && entry.ingredients_used.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Generated from ingredients:</p>
                          <div className="flex flex-wrap gap-1">
                            {entry.ingredients_used.slice(0, 5).map((ingredient, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {ingredient}
                              </Badge>
                            ))}
                            {entry.ingredients_used.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{entry.ingredients_used.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {entry.mode === 'explore' && entry.query_used && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Generated from mood:</p>
                          <Badge variant="secondary" className="text-xs">
                            {entry.query_used}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
