"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { RecipeCard } from "@/components/recipe-card"
import { ChefHat, ArrowLeft, Loader2 } from "lucide-react"

// Mock recipe data - replace with actual API call
const mockRecipes = [
  {
    id: "1",
    title: "Creamy Garlic Pasta",
    image: "/placeholder.svg?height=200&width=300",
    cookingTime: 25,
    difficulty: "Easy",
    ingredients: ["pasta", "garlic", "cream", "parmesan"],
    description: "A rich and creamy pasta dish that's perfect for any night of the week.",
    rating: 4.8,
    servings: 2,
  },
  {
    id: "2",
    title: "Mediterranean Chicken Bowl",
    image: "/placeholder.svg?height=200&width=300",
    cookingTime: 35,
    difficulty: "Medium",
    ingredients: ["chicken", "tomatoes", "olives", "feta"],
    description: "Fresh and healthy Mediterranean flavors in a satisfying bowl.",
    rating: 4.6,
    servings: 2,
  },
  {
    id: "3",
    title: "Spicy Vegetable Stir Fry",
    image: "/placeholder.svg?height=200&width=300",
    cookingTime: 15,
    difficulty: "Easy",
    ingredients: ["bell peppers", "broccoli", "soy sauce", "ginger"],
    description: "Quick and flavorful vegetable stir fry with a spicy kick.",
    rating: 4.5,
    servings: 2,
  },
  {
    id: "4",
    title: "Classic Beef Tacos",
    image: "/placeholder.svg?height=200&width=300",
    cookingTime: 30,
    difficulty: "Easy",
    ingredients: ["ground beef", "tortillas", "lettuce", "cheese"],
    description: "Traditional beef tacos with all your favorite toppings.",
    rating: 4.7,
    servings: 4,
  },
  {
    id: "5",
    title: "Lemon Herb Salmon",
    image: "/placeholder.svg?height=200&width=300",
    cookingTime: 20,
    difficulty: "Medium",
    ingredients: ["salmon", "lemon", "herbs", "olive oil"],
    description: "Perfectly cooked salmon with bright lemon and herb flavors.",
    rating: 4.9,
    servings: 2,
  },
  {
    id: "6",
    title: "Chocolate Chip Cookies",
    image: "/placeholder.svg?height=200&width=300",
    cookingTime: 45,
    difficulty: "Easy",
    ingredients: ["flour", "chocolate chips", "butter", "sugar"],
    description: "Classic homemade chocolate chip cookies that are crispy outside, chewy inside.",
    rating: 4.8,
    servings: 12,
  },
]

function RecipesContent() {
  const searchParams = useSearchParams()
  const [recipes, setRecipes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchCriteria, setSearchCriteria] = useState<any>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true)
      try {
        console.log('🔧 RecipesPage: Fetching recipes via Supabase...')
        
        // Use Supabase to fetch recipes from the database
        const { createClient } = await import('../../lib/supabase/client')
        const supabase = createClient()
        
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (recipesError) {
          console.error('❌ RecipesPage: Error fetching recipes:', recipesError)
          throw new Error(recipesError.message || 'Failed to fetch recipes')
        }
        
        console.log('✅ RecipesPage: Recipes fetched successfully:', recipesData?.length || 0)
        setRecipes(recipesData || [])
      } catch (error: any) {
        console.error('❌ RecipesPage: Failed to load recipes:', error)
        setError('Failed to load recipes. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecipes()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <p className="text-lg font-medium text-gray-600">Cooking up some amazing recipes for you... 👨‍🍳</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <Card
        className={`${searchCriteria.mode === "fridge" ? "bg-orange-50 border-orange-200" : "bg-purple-50 border-purple-200"}`}
      >
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge
              variant="secondary"
              className={`${
                searchCriteria.mode === "fridge" ? "bg-orange-100 text-orange-800" : "bg-purple-100 text-purple-800"
              }`}
            >
              {searchCriteria.mode === "fridge" ? "🥘 Fridge Mode" : "✨ Explore Mode"}
            </Badge>

            {searchCriteria.mode === "fridge" ? (
              <>
                <span className="font-medium text-orange-900">Ingredients:</span>
                {searchCriteria.ingredients?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {searchCriteria.ingredients.map((ingredient: string) => (
                      <Badge key={ingredient} variant="secondary" className="bg-orange-100 text-orange-800">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                )}
                <Badge variant="outline">{searchCriteria.cookingTime} min</Badge>
              </>
            ) : (
              <>
                {searchCriteria.mood && (
                  <>
                    <span className="font-medium text-purple-900">Mood:</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {searchCriteria.mood}
                    </Badge>
                  </>
                )}
                {searchCriteria.cuisine !== "any" && <Badge variant="outline">{searchCriteria.cuisine}</Badge>}
              </>
            )}

            <Badge variant="outline">{searchCriteria.servings} servings</Badge>
            {searchCriteria.dietMode && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Dietary Friendly
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {searchCriteria.mode === "fridge"
            ? `Found ${recipes.length} delicious recipes! 🎉`
            : `${recipes.length} inspiring recipes for you! ✨`}
        </h2>
        <p className="text-gray-600">
          {searchCriteria.mode === "fridge"
            ? "Perfect matches for your ingredients"
            : "Curated for your mood and cravings"}
        </p>
      </div>

      {recipes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No recipes found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your ingredients or search criteria</p>
            <Link href="/find-recipes">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Search
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} desiredServings={2} referrer="recipes" />
          ))}
        </div>
      )}
    </div>
  )
}

export default function RecipesPage() {
  return (
    <div className="flex flex-col min-h-screen ">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <h1 className="text-xl font-bold text-gray-900">Recipe Results</h1>
          </div>
          <div className="ml-auto">
            <Link href="/find-recipes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                New Search
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              </div>
            }
          >
            <RecipesContent />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
