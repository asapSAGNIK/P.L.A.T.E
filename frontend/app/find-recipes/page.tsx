"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { IngredientsInput } from "@/components/ingredients-input"
import { MealTypeSelector } from "@/components/meal-type-selector"
import { MoodSelector } from "@/components/mood-selector"
import { ChefHat, Clock, Users, Sparkles, Refrigerator, Compass, Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RecipeCard } from "@/components/recipe-card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { getAuthTokenForAPI, ensureAuthenticated } from '@/lib/simplified-auth'

function FindRecipesContent() {
  const searchParams = useSearchParams()
  const [ingredients, setIngredients] = useState<string[]>([])
  const [cookingTime, setCookingTime] = useState([30])
  const [cuisine, setCuisine] = useState("")
  const [dietMode, setDietMode] = useState(false)
  const [mealType, setMealType] = useState("")
  const [servings, setServings] = useState([2])
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<"fridge" | "explore">("fridge")
  const [mood, setMood] = useState("")
  const [recipes, setRecipes] = useState([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set())
  const [savingRecipe, setSavingRecipe] = useState<string | null>(null)

  // Load saved recipes on component mount
  useEffect(() => {
    const loadSavedRecipes = async () => {
      try {
        const token = await getAuthTokenForAPI();
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/saved`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Handle different response formats
          if (Array.isArray(data)) {
            const savedRecipeIds = new Set<string>(data.map((item: any) => item.recipe_id));
            setSavedRecipes(savedRecipeIds);
            console.log('Loaded saved recipes:', savedRecipeIds.size, 'recipes');
          } else if (data && Array.isArray(data.recipes)) {
            const savedRecipeIds = new Set<string>(data.recipes.map((item: any) => item.recipe_id));
            setSavedRecipes(savedRecipeIds);
            console.log('Loaded saved recipes:', savedRecipeIds.size, 'recipes');
          } else if (data && typeof data === 'object') {
            // Handle case where data is an object but not in expected format
            console.warn('Unexpected saved recipes response format:', data);
            setSavedRecipes(new Set());
          } else {
            console.warn('Invalid saved recipes response:', data);
            setSavedRecipes(new Set());
          }
        } else {
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            errorData = { error: 'Unknown error' };
          }
          console.error('Failed to load saved recipes:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          // Don't show error to user for saved recipes loading - it's not critical
        }
      } catch (error) {
        console.error('Error loading saved recipes:', error);
      }
    };

    loadSavedRecipes();
  }, []);
  const { user } = useAuth()

  const handleSaveRecipe = async (recipe: any) => {
    setSavingRecipe(recipe.id)
    
    try {
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        toast({
          title: "Authentication required",
          description: "Please log in to save recipes",
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

      const isCurrentlySaved = savedRecipes.has(recipe.id);

      if (isCurrentlySaved) {
        // Remove saved recipe
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/saved/${recipe.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to remove saved recipe');
        }

        setSavedRecipes(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipe.id);
          return newSet;
        });

        toast({
          title: "Recipe removed",
          description: "Recipe has been removed from your saved recipes",
        });
      } else {
        // Save recipe - Transform AI recipe data to match backend expectations
        const recipeData = {
          title: recipe.title,
          description: recipe.description,
          cook_time_minutes: recipe.cookingTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          source: 'Gemini',
          original_recipe_id: recipe.id, // AI recipe ID for tracking
          instructions: Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : recipe.instructions,
          ingredients: recipe.ingredients, // Will be converted to JSONB in backend
          rating: recipe.rating
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipeData),
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorData = { error: 'Unknown error - unable to parse response' };
          }
          
          console.error('Save recipe error:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            recipeTitle: recipe.title
          });
          
          // Provide more specific error messages
          let errorMessage = 'Failed to save recipe';
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (response.status === 400) {
            errorMessage = errorData.error || 'Invalid recipe data. Please try again.';
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = `Failed to save recipe (${response.status})`;
          }
          
          throw new Error(errorMessage);
        }

        setSavedRecipes(prev => new Set(prev).add(recipe.id));

        toast({
          title: "Recipe saved!",
          description: "Recipe has been added to your saved recipes",
        });
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingRecipe(null);
    }
  }

  // Define mood to filter mappings
  const moodMappings: { [key: string]: { cuisine?: string; mealType?: string; maxTime?: number; query?: string; diet?: string; includeIngredients?: string; } } = {
    "cozy-warm": { query: "comfort food", maxTime: 60, mealType: "main course" },
    "light-healthy": { diet: "vegetarian", maxTime: 45, query: "salad,soup,healthy" },
    "adventurous": { cuisine: "thai,indian,mexican", query: "spicy,exotic" },
    "quick-easy": { maxTime: 30, query: "quick,easy" },
    "indulgent": { query: "dessert,rich", mealType: "dessert" },
    "fresh-vibrant": { query: "fresh,vibrant", includeIngredients: "lemon,herbs,vegetables", diet: "vegan" },
  };

  // Set initial mode from URL params
  useEffect(() => {
    const urlMode = searchParams?.get("mode")
    if (urlMode === "explore" || urlMode === "fridge") {
      setMode(urlMode)
    }
  }, [searchParams])

  // Add this useEffect after the existing useEffect
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0)
  }, [])

  const handleSearch = async () => {
    // Validate input based on mode
    if (mode === "fridge" && !ingredients.length) {
      toast({
        title: "Missing Ingredients",
        description: "Please add some ingredients for Fridge Mode.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "explore" && !mood.trim()) {
      toast({
        title: "Missing Mood",
        description: "Please select a mood for Explore Mode.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecipes([]);

    try {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to search recipes.",
          variant: "destructive",
        });
        return;
      }

      // Get the access token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Access Token Required",
          description: "Please try logging in again.",
          variant: "destructive",
        });
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/find-by-ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ingredients: mode === "fridge" && ingredients.length > 0 ? ingredients : undefined,
          query: mode === "explore" && mood.trim() ? mood.trim() : undefined,
          mode: mode, // Send the current mode
          filters: {
            maxTime: cookingTime[0],
            servings: servings[0],
            cuisine: cuisine,
            diet: dietMode ? 'vegetarian' : undefined,
            mealType: mealType
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle rate limit errors specifically
        if (response.status === 429) {
          setError(`Daily limit exceeded: ${errorData.message}`);
          toast({
            title: "Rate Limit Exceeded",
            description: errorData.message,
            variant: "destructive",
          });
        } else {
          setError(errorData.error || 'Failed to search recipes');
          toast({
            title: "Error",
            description: errorData.error || 'Failed to search recipes',
            variant: "destructive",
          });
        }
        return;
      }

      const data = await response.json();
      
      // Handle new response format with rate limit info
      const recipesData = data.recipes || data;
      const rateLimitInfo = data.rateLimit;
      
      setRecipes(recipesData);
      
      // Show rate limit info if available
      if (rateLimitInfo) {
        toast({
          title: "Recipes Generated!",
          description: `Generated ${recipesData.length} recipes. ${rateLimitInfo.remaining} searches remaining today.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Recipes Generated!",
          description: `Generated ${recipesData.length} recipes.`,
          variant: "default",
        });
      }

      // Auto-scroll to results
      setTimeout(() => {
        const resultsSection = document.getElementById('recipe-results');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search recipes. Please try again.');
      toast({
        title: "Error",
        description: "Failed to search recipes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <h1 className="text-xl font-bold text-gray-900">Find Recipes</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-4xl font-bold text-gray-900">Let's Find Your Perfect Recipe! 👨‍🍳</h2>
          <p className="text-xl text-gray-600">
            Choose your cooking style and let me help you create something amazing!
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border">
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant={mode === "fridge" ? "default" : "ghost"}
                onClick={() => setMode("fridge")}
                className={`justify-center ${
                  mode === "fridge"
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "hover:bg-orange-50 text-gray-700"
                }`}
              >
                <Refrigerator className="mr-2 h-4 w-4" />
                Fridge Mode
              </Button>
              <Button
                variant={mode === "explore" ? "default" : "ghost"}
                onClick={() => setMode("explore")}
                className={`justify-center ${
                  mode === "explore"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "hover:bg-purple-50 text-gray-700"
                }`}
              >
                <Compass className="mr-2 h-4 w-4" />
                Explore Mode
              </Button>
            </div>
          </div>

          {/* Mode Description */}
          <div className="text-center mt-4 p-4 rounded-lg bg-white/60">
            {mode === "fridge" ? (
              <p className="text-gray-600">
                🥘 <strong>Fridge Mode:</strong> Tell me what ingredients you have, and I'll create magic with them!
              </p>
            ) : (
              <p className="text-gray-600">
                ✨ <strong>Explore Mode:</strong> Not sure what to cook? Let me inspire you based on your mood and
                cravings!
              </p>
            )}
          </div>
        </div>

        {/* Main Search Card */}
        <Card className="max-w-4xl mx-auto shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              {mode === "fridge" ? (
                <>
                  <Refrigerator className="h-6 w-6 text-orange-600" />
                  What's in your fridge?
                </>
              ) : (
                <>
                  <Compass className="h-6 w-6 text-purple-600" />
                  What are you in the mood for?
                </>
              )}
            </CardTitle>
            <CardDescription className="text-base">
              {mode === "fridge"
                ? "Tell me what ingredients you have, and I'll help you create something amazing! 🔥"
                : "Let me inspire you with recipes that match your cravings and mood! 🌟"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {mode === "fridge" ? (
              // Fridge Mode Content
              <>
                {/* Ingredients Input */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Your Ingredients</Label>
                  <IngredientsInput ingredients={ingredients} onIngredientsChange={setIngredients} />
                  <p className="text-sm text-gray-500">
                    💡 <strong>Pro tip:</strong> The more ingredients you add, the more creative I can get!
                  </p>
                </div>

                <Separator />

                {/* Cooking Time and Serving Size */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <Label className="text-base font-semibold">
                        Cooking Time (minutes)
                      </Label>
                    </div>
                    <Input
                      type="number"
                      value={cookingTime[0]}
                      onChange={(e) => setCookingTime([Number(e.target.value)])}
                      placeholder="e.g., 30"
                      min={10}
                      max={120}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500">
                      Enter time in minutes (10 - 120)
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      <Label className="text-base font-semibold">
                        Serving size
                      </Label>
                    </div>
                    <Input
                      type="number"
                      value={servings[0]}
                      onChange={(e) => setServings([Number(e.target.value)])}
                      placeholder="e.g., 2"
                      min={1}
                      max={12}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500">
                      Enter number of people (1 - 12+)!
                    </p>
                  </div>
                </div>
              </>
            ) : (
              // Explore Mode Content
              <>
                {/* Mood/Craving Selector */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">What's your mood?</Label>
                  <MoodSelector value={mood} onValueChange={setMood} />
                  <p className="text-sm text-gray-500">
                    🎯 <strong>Chef's tip:</strong> Pick what speaks to your soul right now!
                  </p>
                </div>

                <Separator />

                {/* Cuisine Style */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Any cuisine preference?</Label>
                  <Select value={cuisine} onValueChange={setCuisine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Surprise me with anything! 🌍" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="italian">Italian 🇮🇹</SelectItem>
                      <SelectItem value="asian">Asian 🥢</SelectItem>
                      <SelectItem value="mexican">Mexican 🌮</SelectItem>
                      <SelectItem value="indian">Indian 🍛</SelectItem>
                      <SelectItem value="mediterranean">Mediterranean 🫒</SelectItem>
                      <SelectItem value="american">American 🍔</SelectItem>
                      <SelectItem value="french">French 🥖</SelectItem>
                      <SelectItem value="japanese">Japanese 🍣</SelectItem>
                      <SelectItem value="thai">Thai 🌶️</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Separator />

            {/* Common sections for both modes */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">What kind of meal?</Label>
                <MealTypeSelector value={mealType} onValueChange={setMealType} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Dietary Restrictions</Label>
                  <Switch checked={dietMode} onCheckedChange={setDietMode} />
                </div>
                {dietMode && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Vegetarian 🥬</Badge>
                    <Badge variant="secondary">Vegan 🌱</Badge>
                    <Badge variant="secondary">Gluten-Free 🌾</Badge>
                  </div>
                )}
                <p className="text-sm text-gray-500">Toggle on to filter for dietary needs</p>
              </div>
            </div>

            <Separator />

            {/* Search Button */}
            <div className="text-center pt-4">
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                size="lg"
                className={`px-8 py-3 text-lg font-semibold shadow-lg ${
                  mode === "fridge"
                    ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                } text-white`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    {mode === "fridge" ? "Cooking up ideas..." : "Finding inspiration..."}
                  </>
                ) : (
                  <>
                    {mode === "fridge" ? (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Find My Perfect Recipe!
                      </>
                    ) : (
                      <>
                        <Compass className="mr-2 h-5 w-5" />
                        Inspire Me!
                      </>
                    )}
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                {mode === "fridge" ? "Let's create some culinary magic! ✨" : "Let's discover something amazing! 🌟"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card
          className={`max-w-4xl mx-auto ${
            mode === "fridge" ? "bg-orange-50 border-orange-200" : "bg-purple-50 border-purple-200"
          }`}
        >
          <CardContent className="pt-6">
            <h3
              className={`font-semibold mb-3 flex items-center gap-2 ${
                mode === "fridge" ? "text-orange-900" : "text-purple-900"
              }`}
            >
              <ChefHat className="h-5 w-5" />
              {mode === "fridge" ? "Chef's Tips for Fridge Cooking" : "Chef's Tips for Food Exploration"}
            </h3>
            <div
              className={`grid md:grid-cols-2 gap-4 text-sm ${
                mode === "fridge" ? "text-orange-800" : "text-purple-800"
              }`}
            >
              {mode === "fridge" ? (
                <>
                  <div>• Use what you have - creativity over perfection</div>
                  <div>• Don't be afraid to substitute ingredients</div>
                  <div>• Taste as you go - trust your palate</div>
                  <div>• Save leftovers for tomorrow's inspiration</div>
                </>
              ) : (
                <>
                  <div>• Follow your cravings - they know what you need</div>
                  <div>• Try new cuisines to expand your palate</div>
                  <div>• Cooking is an adventure - embrace the journey</div>
                  <div>• Every meal is a chance to discover something new</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recipe Results Section */}
        <div id="recipe-results">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
              <p className="text-lg text-gray-600">
                {mode === "fridge" ? "Cooking up some delicious ideas..." : "Finding your perfect recipe..."}
              </p>
              <p className="text-sm text-gray-500 mt-2">This might take a few moments</p>
            </div>
          ) : (
            <>
              {recipes.length > 0 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                    🎉 Your AI-Generated Recipes
                  </h2>
                  {recipes.map((recipe: any, index: number) => (
                    <Card key={recipe.id} className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm relative">
                      <CardContent className="pt-6">
                        <div className="prose prose-lg max-w-none">
                          {/* Save Recipe Button - Top Right */}
                          <div className="absolute top-4 right-4 z-10">
                            <Button
                              onClick={() => handleSaveRecipe(recipe)}
                              disabled={savingRecipe === recipe.id}
                              size="sm"
                              variant={savedRecipes.has(recipe.id) ? "default" : "secondary"}
                              className={`h-10 w-10 p-0 rounded-full shadow-md hover:shadow-lg transition-all duration-200 ${savedRecipes.has(recipe.id) ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white/95 hover:bg-white border border-gray-200 hover:border-gray-300'}`}
                            >
                              {savingRecipe === recipe.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : savedRecipes.has(recipe.id) ? (
                                <BookmarkCheck className="h-5 w-5 fill-current" />
                              ) : (
                                <Bookmark className="h-5 w-5 text-gray-600" />
                              )}
                            </Button>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 pr-20">
                            {index + 1}. {recipe.title}
                          </h3>
                          <p className="text-gray-600 mb-4">{recipe.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span><strong>Cooking Time:</strong> {recipe.cookingTime} minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-orange-600" />
                              <span><strong>Servings:</strong> {recipe.servings}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ChefHat className="h-4 w-4 text-orange-600" />
                              <span><strong>Difficulty:</strong> {recipe.difficulty}</span>
                            </div>

                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Ingredients:</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                              {recipe.ingredients.map((ingredient: string, idx: number) => (
                                <li key={idx}>{ingredient}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Instructions:</h4>
                            <ol className="list-decimal list-inside space-y-2 text-gray-700">
                              {recipe.instructions.split('\n').map((instruction: string, idx: number) => (
                                <li key={idx}>{instruction.trim()}</li>
                              ))}
                            </ol>
                          </div>

                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {recipes.length === 0 && !error && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No recipes found. Please try:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Adding more ingredients</li>
                    <li>• Adjusting cooking time</li>
                    <li>• Changing meal type</li>
                    <li>• Exploring different cuisines</li>
                  </ul>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-2">{error}</p>
                  <p className="text-sm text-gray-600">Please try again or contact support if the issue persists.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function FindRecipesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FindRecipesContent />
    </Suspense>
  )
}