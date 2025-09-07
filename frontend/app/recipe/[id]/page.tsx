"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChefHat, ArrowLeft, Clock, Users, Star, Bookmark, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthTokenForAPI, ensureAuthenticated } from '@/lib/simplified-auth'

export default function RecipeDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [recipe, setRecipe] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Determine where to go back based on referrer or default
  const getBackUrl = () => {
    const referrer = searchParams?.get('from')
    if (referrer === 'history') return '/history'
    if (referrer === 'saved') return '/saved'
    if (referrer === 'recipes') return '/recipes'
    // Default to history since most recipes come from generation
    return '/history'
  }
  
  const getBackText = () => {
    const referrer = searchParams?.get('from')
    if (referrer === 'history') return 'Back to Cooking History'
    if (referrer === 'saved') return 'Back to Saved Recipes'
    if (referrer === 'recipes') return 'Back to Recipes'
    // Default to history
    return 'Back to Cooking History'
  }

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('DEBUG: Fetching recipe with ID:', params?.id);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/${params?.id}`, {
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        console.log('DEBUG: Recipe response:', { status: response.status, ok: response.ok, data });
        
        if (!response.ok) {
          console.error('DEBUG: Recipe fetch failed:', data);
          if (response.status === 404) {
            throw new Error('Recipe not found. It may have been deleted or moved.')
          }
          throw new Error(data.error || 'Failed to fetch recipe from database')
        }
        
        console.log('DEBUG: Setting recipe data:', data);
        setRecipe(data)
      } catch (error) {
        console.error('DEBUG: Recipe fetch error:', error);
        setError(`Failed to load recipe: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecipe()
  }, [params?.id])

  const handleDeleteRecipe = async () => {
    try {
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        toast({
          title: "Authentication required",
          description: "Please log in to delete recipes",
          variant: "destructive",
        });
        return;
      }

      const token = await getAuthTokenForAPI();
      if (!token) {
        toast({
          title: "Authentication error",
          description: "Unable to get authentication token",
          variant: "destructive",
        });
        return;
      }

      setIsDeleting(true);

      // Delete saved recipe
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/saved/${recipe.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      toast({
        title: "Recipe deleted",
        description: "Recipe has been removed from your saved recipes",
      });

      // Redirect back to saved recipes page
      router.push('/saved');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: "Failed to delete recipe",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="flex h-16 items-center px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">Recipe Details</h1>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
            <p className="text-lg font-medium text-gray-600">Loading your recipe... 👨‍🍳</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="flex h-16 items-center px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">Recipe Error</h1>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Card className="text-center p-8">
            <CardContent>
              <ChefHat className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading recipe</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Link href={getBackUrl()}>
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {getBackText()}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="flex h-16 items-center px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">Recipe Not Found</h1>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Card className="text-center p-8">
            <CardContent>
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Recipe not found</h2>
              <p className="text-gray-600 mb-4">This recipe might have been moved or deleted.</p>
              <Link href={getBackUrl()}>
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {getBackText()}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <h1 className="text-xl font-bold text-gray-900">Recipe Details</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back Button */}
          <div className="flex justify-start">
            <Link href={getBackUrl()}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {getBackText()}
              </Button>
            </Link>
          </div>

          {/* Recipe Card - Same format as generated recipes */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
                  <p className="text-gray-600">{recipe.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {recipe.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    {recipe.rating}
                  </div>
                </div>
              </div>

              {/* Time and Servings */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span>{recipe.cookingTime} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span>{recipe.servings} servings</span>
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Ingredients:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {recipe.ingredients?.map((ingredient: any, idx: number) => (
                    <li key={idx}>
                      {typeof ingredient === 'string' ? ingredient : ingredient.item || ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Instructions:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  {Array.isArray(recipe.instructions) 
                    ? recipe.instructions.map((instruction: string, idx: number) => (
                        <li key={idx}>{instruction}</li>
                      ))
                    : recipe.instructions.split('\n').map((instruction: string, idx: number) => (
                        <li key={idx}>{instruction.trim()}</li>
                      ))
                  }
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteRecipe}
                  disabled={isDeleting}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Bookmark className="mr-2 h-4 w-4" />
                      Delete Recipe
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}