"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChefCommentary } from "@/components/chef-commentary"
import { CreativeTwist } from "@/components/creative-twist"
import { ChefHat, ArrowLeft, Clock, Users, Star, Heart, Play, Bookmark, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock recipe data - replace with actual API call
const mockRecipeDetails = {
  "1": {
    id: "1",
    title: "Creamy Garlic Pasta",
    image: "/placeholder.svg?height=400&width=600",
    cookingTime: 25,
    difficulty: "Easy",
    rating: 4.8,
    servings: 2,
    description:
      "A rich and creamy pasta dish that's perfect for any night of the week. This restaurant-quality meal comes together in just 25 minutes!",
    ingredients: [
      { item: "8 oz pasta (penne or fettuccine)", amount: "8 oz" },
      { item: "garlic cloves, minced", amount: "4 cloves" },
      { item: "heavy cream", amount: "1 cup" },
      { item: "parmesan cheese, grated", amount: "1/2 cup" },
      { item: "butter", amount: "2 tbsp" },
      { item: "olive oil", amount: "2 tbsp" },
      { item: "salt and pepper", amount: "to taste" },
      { item: "fresh parsley, chopped", amount: "2 tbsp" },
    ],
    instructions: [
      "Bring a large pot of salted water to boil. Cook pasta according to package directions until al dente.",
      "While pasta cooks, heat olive oil and butter in a large skillet over medium heat.",
      "Add minced garlic and sauté for 1-2 minutes until fragrant (don't let it burn!).",
      "Pour in heavy cream and bring to a gentle simmer. Let it reduce slightly, about 3-4 minutes.",
      "Add grated parmesan cheese and whisk until melted and smooth.",
      "Drain pasta, reserving 1/2 cup pasta water.",
      "Add pasta to the cream sauce and toss to combine. Add pasta water if needed for consistency.",
      "Season with salt and pepper to taste.",
      "Garnish with fresh parsley and extra parmesan. Serve immediately!",
    ],
    tips: [
      "Don't let the garlic burn - it will make the dish bitter!",
      "Save some pasta water - the starch helps bind the sauce",
      "Serve immediately while hot for the best texture",
    ],
  },
}

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [recipe, setRecipe] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [isStartingCook, setIsStartingCook] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [desiredServings, setDesiredServings] = useState(0)

  const scaleIngredients = (originalIngredients: any[], originalServings: number, targetServings: number) => {
    if (!originalIngredients || !originalServings || !targetServings || originalServings === 0) {
      return originalIngredients;
    }

    const scalingFactor = targetServings / originalServings;

    return originalIngredients.map((ingredient) => {
      const amountMatch = ingredient.amount.match(/([\d\.]+)\s*([a-zA-Z%]+)?/);
      if (amountMatch) {
        const originalAmount = parseFloat(amountMatch[1]);
        const unit = amountMatch[2] || '';
        const scaledAmount = originalAmount * scalingFactor;

        const displayAmount = scaledAmount % 1 === 0 ? scaledAmount.toFixed(0) : scaledAmount.toFixed(2);

        return { ...ingredient, amount: `${displayAmount} ${unit}`.trim() };
      } else if (typeof ingredient.amount === 'number') {
        const scaledAmount = ingredient.amount * scalingFactor;
        const displayAmount = scaledAmount % 1 === 0 ? scaledAmount.toFixed(0) : scaledAmount.toFixed(2);
        return { ...ingredient, amount: displayAmount };
      }
      return ingredient;
    });
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      setIsLoading(true)
      try {
        const servingsFromUrl = searchParams.get('servings');
        if (servingsFromUrl) {
          setDesiredServings(parseInt(servingsFromUrl, 10));
        }

        // Use backend endpoint for fetching recipe details
        console.log('DEBUG: Fetching recipe with ID:', params.id);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/${params.id}`, {
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        console.log('DEBUG: Recipe response:', { status: response.status, ok: response.ok, data });
        
        if (!response.ok) {
          console.error('DEBUG: Recipe fetch failed:', data);
          throw new Error(data.error || 'Failed to fetch recipe')
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
  }, [params.id, searchParams])

  const handleSaveRecipe = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/recipes/save', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ recipeId: recipe.id })
      // })

      setIsSaved(!isSaved)
      toast({
        title: isSaved ? "Recipe removed from favorites" : "Recipe saved! 📖",
        description: isSaved ? "Removed from your collection" : "Added to your recipe collection",
      })
    } catch (error) {
      toast({
        title: "Failed to save recipe",
        variant: "destructive",
      })
    }
  }

  const handleStartCooking = async () => {
    setIsStartingCook(true)
    try {
      // TODO: Replace with actual cooking mode or timer functionality
      toast({
        title: "Let's get cooking! 👨‍🍳",
        description: "Time to create something amazing!",
      })

      // Could redirect to a cooking mode page or start a timer
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      toast({
        title: "Failed to start cooking mode",
        variant: "destructive",
      })
    } finally {
      setIsStartingCook(false)
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
              <Link href="/find-recipes">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Search
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
              <Link href="/find-recipes">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Search
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
          <div className="ml-auto">
            <Link href="/recipes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Results
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Recipe Header */}
          <Card className="overflow-hidden shadow-lg">
            <div className="relative">
              <img
                src={recipe.image || "/placeholder.svg"}
                alt={recipe.title}
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{recipe.title}</h1>
                <p className="text-lg opacity-90">{recipe.description}</p>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">{recipe.cookingTime} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">{desiredServings > 0 ? desiredServings : recipe.servings} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-medium">{recipe.rating}</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {recipe.difficulty}
                </Badge>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleStartCooking}
                  disabled={isStartingCook}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 flex-1"
                >
                  {isStartingCook ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Cooking!
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSaveRecipe}
                  variant="outline"
                  className={isSaved ? "bg-red-50 border-red-200 text-red-700" : ""}
                >
                  {isSaved ? <Heart className="h-4 w-4 fill-current" /> : <Bookmark className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Ingredients */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-orange-600" />
                  Ingredients
                </CardTitle>
                <CardDescription>Everything you need for this recipe</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(desiredServings > 0 && recipe.extendedIngredients
                    ? scaleIngredients(recipe.extendedIngredients, recipe.servings, desiredServings)
                    : recipe.extendedIngredients || []
                  ).map((ingredient: any, index: number) => (
                    <li key={index} className="flex justify-between items-start">
                      <span className="text-sm">{ingredient.originalName || ingredient.name}</span>
                      <span className="text-sm font-medium text-orange-600 ml-2">{ingredient.amount} {ingredient.unit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
                <CardDescription>Follow these steps to create your masterpiece</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {recipe.instructions.map((step: string, index: number) => (
                    <li key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-relaxed pt-1">{step}</p>
                    </li>
                  ))}
                </ol>

                {recipe.tips && recipe.tips.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                        <ChefHat className="h-4 w-4" />
                        Chef's Pro Tips
                      </h4>
                      <ul className="space-y-2">
                        {recipe.tips.map((tip: string, index: number) => (
                          <li key={index} className="text-sm text-orange-800 flex items-start gap-2">
                            <span className="text-orange-600 mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <ChefCommentary recipeId={recipe.id} />
            <CreativeTwist recipeId={recipe.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
