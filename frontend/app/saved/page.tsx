"use client";
import React, { useEffect, useState } from 'react'
import { useRouter } from "next/navigation"
import { supabase } from '../../lib/supabaseClient'
import { RecipeCard } from '@/components/recipe-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bookmark, ChefHat, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getAuthTokenForAPI } from '../../lib/simplified-auth'

interface SavedRecipe {
  id: string
  user_id: string
  recipe_id: string
  status: string
  notes?: string
  rating?: number
  last_cooked_at?: string
  created_at: string
  updated_at: string
  recipe: {
    id: string
    title: string
    description?: string
    prep_time_minutes?: number
    cook_time_minutes?: number
    servings?: number
    cuisine?: string
    difficulty?: string
    source: string
    image_url?: string
    instructions?: string
    ingredients?: any
    rating?: number
    created_at: string
  }
}

export default function SavedRecipesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      setIsLoading(true)
      try {
        const token = await getAuthTokenForAPI()
        if (!token) {
          setError('Authentication required')
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/saved`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch saved recipes')
        }
        
        const data = await response.json()
        setRecipes(data)
      } catch (error) {
        console.error('Error fetching saved recipes:', error)
        setError('Failed to load saved recipes. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSavedRecipes()
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login")
      }
    })
  }, [router])

  const convertSavedRecipeToRecipe = (savedRecipe: SavedRecipe) => {
    const recipe = savedRecipe.recipe
    return {
      id: recipe.id,
      title: recipe.title,
      cookingTime: recipe.cook_time_minutes || 30,
      difficulty: recipe.difficulty || 'Medium',
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      description: recipe.description || 'A delicious saved recipe',
      rating: recipe.rating || 4.0,
      servings: recipe.servings || 2,
      instructions: recipe.instructions || ''
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-16 items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Saved Recipes</span>
            {Array.isArray(recipes) && recipes.length > 0 && (
              <span className="text-sm text-gray-500">({recipes.length})</span>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your saved recipes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Recipes</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : !Array.isArray(recipes) || recipes.length === 0 ? (
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Recipes Yet</h3>
                <p className="text-gray-600 mb-4">Start exploring recipes and save your favorites!</p>
                <Link href="/find-recipes">
                  <Button className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Find Recipes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Saved Recipes ({Array.isArray(recipes) ? recipes.length : 0})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(recipes) && recipes.map((savedRecipe) => (
                <RecipeCard 
                  key={savedRecipe.id} 
                  recipe={convertSavedRecipeToRecipe(savedRecipe)} 
                  desiredServings={savedRecipe.recipe.servings || 2}
                  referrer="saved"
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
