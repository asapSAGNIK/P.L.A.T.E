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
import { ChefHat, Clock, Users, Sparkles, Refrigerator, Compass, Bookmark, BookmarkCheck, Loader2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RecipeCard } from "@/components/recipe-card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { useGuestMode } from "@/components/guest-mode-provider"
import { supabaseAPI } from "@/lib/supabase/api"
import { GuidancePopup } from "@/components/guidance-popup"
import { getRecipeGenerationGuidance, CompatibilityAnalysis } from "@/lib/ingredient-compatibility"
import { validateDifficulty, validateSource } from "@/lib/type-utils"

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
  const [hasSearched, setHasSearched] = useState(false)
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set())
  const [savingRecipe, setSavingRecipe] = useState<string | null>(null)
  const { user, loading } = useAuth()
  const { isGuestMode, guestFormData, setGuestFormData, redirectToSignIn } = useGuestMode()

  // Phase 1 & 2: Enhanced UI State Management with Compatibility Analysis
  const [uiState, setUiState] = useState<'empty' | 'insufficient' | 'analyzing' | 'ready' | 'incompatible'>('empty')
  const [showGuidancePopup, setShowGuidancePopup] = useState(false)
  const [guidanceMessage, setGuidanceMessage] = useState('')
  const [compatibilityAnalysis, setCompatibilityAnalysis] = useState<CompatibilityAnalysis | null>(null)
  const [compatibilityLoading, setCompatibilityLoading] = useState(false)
  const [fallbackRecipes, setFallbackRecipes] = useState<any[]>([])
  const [fallbackMessage, setFallbackMessage] = useState('')
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([])
  const [suggestionsMessage, setSuggestionsMessage] = useState('')

  // Load guest form data or saved recipes on component mount
  useEffect(() => {
    // If in guest mode and we have stored form data, restore it
    if (isGuestMode && guestFormData) {
      setIngredients(guestFormData.ingredients)
      setCookingTime([guestFormData.cookingTime])
      setCuisine(guestFormData.cuisine)
      setDietMode(guestFormData.dietMode)
      setMealType(guestFormData.mealType)
      setServings([guestFormData.servings])
      setMode(guestFormData.mode)
      setMood(guestFormData.mood)
    }

    const loadSavedRecipes = async () => {
      // Only load saved recipes if user is authenticated and not loading
      if (loading || !user || isGuestMode) {
        console.log('User not authenticated, still loading, or in guest mode - skipping saved recipes load');
        return;
      }

      try {
        console.log('Loading saved recipes for user:', user.id);
        const data = await supabaseAPI.getSavedRecipes('saved');
        
        if (data && data.savedRecipes && Array.isArray(data.savedRecipes)) {
          const savedRecipeIds = new Set<string>(data.savedRecipes.map((item: any) => item.recipe_id));
          setSavedRecipes(savedRecipeIds);
          console.log('Loaded saved recipes:', savedRecipeIds.size, 'recipes');
        } else if (Array.isArray(data)) {
          // Handle case where data is directly an array (fallback response)
          const savedRecipeIds = new Set<string>(data.map((item: any) => item.recipe_id));
          setSavedRecipes(savedRecipeIds);
          console.log('Loaded saved recipes (fallback format):', savedRecipeIds.size, 'recipes');
        } else {
          console.log('No saved recipes found or invalid response format:', data);
          setSavedRecipes(new Set());
        }
      } catch (error) {
        console.error('Error loading saved recipes:', error);
        setSavedRecipes(new Set());
      }
    };

    loadSavedRecipes();
  }, [user, loading, isGuestMode, guestFormData]) // Add guest mode dependencies

  const handleSaveRecipe = async (recipe: any) => {
    setSavingRecipe(recipe.id)
    
    try {
      if (!user || isGuestMode) {
        toast({
          title: "Authentication required",
          description: "Please log in to save recipes",
          variant: "destructive",
        });
        return;
      }

      const isCurrentlySaved = savedRecipes.has(recipe.id);

      if (isCurrentlySaved) {
        // Remove saved recipe
        await supabaseAPI.removeRecipe(recipe.id);
        
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
          cook_time_minutes: recipe.cook_time_minutes || recipe.cookingTime,
          prep_time_minutes: recipe.prep_time_minutes,
          servings: recipe.servings,
          difficulty: validateDifficulty(recipe.difficulty),
          source: validateSource('Gemini'),
          original_recipe_id: recipe.id, // AI recipe ID for tracking
          instructions: Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : recipe.instructions,
          ingredients: recipe.ingredients, // Will be converted to JSONB in backend
          rating: recipe.rating
        };

        await supabaseAPI.saveRecipe(recipeData);
        
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

  // Define mood to filter mappings (updated to match MoodSelector values)
  const moodMappings: { [key: string]: { cuisine?: string; mealType?: string; maxTime?: number; query?: string; diet?: string; includeIngredients?: string; } } = {
    "comfort": { query: "comfort food", maxTime: 60, mealType: "main course" },
    "healthy": { diet: "vegetarian", maxTime: 45, query: "salad,soup,healthy" },
    "spicy": { query: "spicy,exotic" },
    "quick": { maxTime: 30, query: "quick,easy" },
    "indulgent": { query: "dessert,rich", mealType: "dessert" },
    "exotic": { query: "exotic,unique,adventurous" }, // Removed cuisine override to respect user selection
    "light": { query: "fresh,light,bright", diet: "vegetarian" },
    "cozy": { query: "cozy,warm,comforting", maxTime: 60, mealType: "main course" },
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

  // Phase 2: Smart UI State Management with Optional Compatibility Analysis
  useEffect(() => {
    const updateUIState = () => {
      // Reset all states first
      setCompatibilityAnalysis(null)
      setFallbackRecipes([])
      setFallbackMessage('')
      setSmartSuggestions([])
      setSuggestionsMessage('')

      if (ingredients.length === 0) {
        setUiState('empty')
        setGuidanceMessage('')
        setShowGuidancePopup(false)
        return
      }

      if (ingredients.length < 3) {
        setUiState('insufficient')
        const message = ingredients.length === 1
          ? 'min. 3 ingredients required'
          : 'min. 3 ingredients required'
        
        setGuidanceMessage(message)
        setShowGuidancePopup(true)
        // Auto-dismiss popup after 3 seconds
        setTimeout(() => setShowGuidancePopup(false), 3000)
        return
      }

      // 3+ ingredients - basic ready state without AI analysis
      setUiState('ready')
      setGuidanceMessage('Ready to generate recipes!')

      // Only perform AI analysis if user explicitly requests it (when clicking generate)
      // This prevents errors when AI services are unavailable
    }

    updateUIState()
  }, [ingredients])

  // Get button state based on current conditions
  const getButtonState = () => {
    if (mode === "explore") {
      return {
        disabled: !mood.trim(),
        message: !mood.trim() ? "Enter what you're in the mood for" : "Find Recipes"
      }
    }

    // Fridge mode validation
    if (ingredients.length === 0) {
      return {
        disabled: true,
        message: "Add ingredients to get started"
      }
    }

    if (ingredients.length < 3) {
      return {
        disabled: true,
        message: `Add ${3 - ingredients.length} more ingredient${ingredients.length === 2 ? '' : 's'}`
      }
    }

    if (uiState === 'incompatible') {
      return {
        disabled: true,
        message: "Ingredients are incompatible"
      }
    }

    if (isLoading) {
      return {
        disabled: true,
        message: "Generating recipes..."
      }
    }

    return {
      disabled: false,
      message: "Find Recipes"
    }
  }

  const buttonState = getButtonState()

  // Smart suggestions based on current ingredients
  const getSmartSuggestions = (currentIngredients: string[]): string[] => {
    const suggestions: string[] = []
    const ing = currentIngredients.map(i => i.toLowerCase())

    // Check for missing categories
    if (!ing.some(i => /(chicken|beef|pork|fish|tofu|eggs|lentils|beans)/.test(i))) {
      suggestions.push('Add a protein (chicken, eggs, tofu)')
    }

    if (!ing.some(i => /(onion|garlic|tomato|potato|carrot|spinach)/.test(i))) {
      suggestions.push('Add vegetables (onion, garlic, tomato)')
    }

    if (!ing.some(i => /(rice|pasta|bread|flour|oats)/.test(i))) {
      suggestions.push('Add grains (rice, pasta, bread)')
    }

    if (!ing.some(i => /(milk|cheese|yogurt|butter|cream)/.test(i))) {
      suggestions.push('Add dairy (milk, cheese, yogurt)')
    }

    if (!ing.some(i => /(salt|pepper|cumin|paprika|oregano|thyme|basil)/.test(i))) {
      suggestions.push('Add seasonings (salt, pepper, herbs)')
    }

    // If we have sweet ingredients, suggest complementary items
    if (ing.some(i => /(apple|banana|orange|strawberry|mango)/.test(i))) {
      suggestions.push('Add dairy for smoothies (milk, yogurt)')
    }

    // If we have savory ingredients, suggest complementary items
    if (ing.some(i => /(chicken|beef|pork|fish|tofu)/.test(i))) {
      suggestions.push('Add vegetables for balance')
    }

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  const handleSearch = async () => {
    // Mark that a search has been attempted
    setHasSearched(true)
    
    // Basic validation
    if (mode === "fridge") {
      if (ingredients.length === 0) {
        toast({
          title: "Missing Ingredients",
          description: "Please add some ingredients for Fridge Mode.",
          variant: "destructive",
        });
        return;
      }

      if (ingredients.length < 3) {
        toast({
          title: "Need More Ingredients",
          description: "Add at least 3 ingredients to get started! 🥘",
          variant: "destructive",
        });
        return;
      }
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
      // Perform AI analysis only when generating recipes
      if (mode === "fridge" && ingredients.length >= 3) {
        setCompatibilityLoading(true)
        try {
          const guidance = await getRecipeGenerationGuidance(ingredients, user?.id)

          // Update UI based on compatibility analysis
          switch (guidance.compatibility) {
            case 'excellent':
              setGuidanceMessage('ingredients compatible')
              setCompatibilityAnalysis({ 
                level: 'excellent', 
                score: 90, 
                message: guidance.message,
                reasons: [guidance.message],
                suggestions: []
              })
              break

            case 'good':
              setGuidanceMessage('ingredients compatible')
              setCompatibilityAnalysis({ 
                level: 'good', 
                score: 75, 
                message: guidance.message,
                reasons: [guidance.message],
                suggestions: []
              })
              break

            case 'limited':
              setGuidanceMessage('ingredients limited')
              setCompatibilityAnalysis({ 
                level: 'limited', 
                score: 60, 
                message: guidance.message,
                reasons: [guidance.message],
                suggestions: []
              })
              break

            case 'incompatible':
              setGuidanceMessage('ingredients incompatible')
              setCompatibilityAnalysis({ 
                level: 'incompatible', 
                score: 20, 
                message: guidance.message,
                reasons: [guidance.message],
                suggestions: []
              })

              // Handle fallback recipes
              if (guidance.fallbackRecipes && guidance.fallbackRecipes.length > 0) {
                setFallbackRecipes(guidance.fallbackRecipes)
                setFallbackMessage(guidance.fallbackMessage || 'Here are some alternative recipes that work better:')
              } else {
                setFallbackRecipes([])
                setFallbackMessage('Consider adding complementary ingredients for better results.')
              }
              break

            default:
              setCompatibilityAnalysis({ 
                level: 'limited', 
                score: 50, 
                message: guidance.message,
                reasons: [guidance.message],
                suggestions: []
              })
          }

          setSmartSuggestions(guidance.smartSuggestions || [])
          setSuggestionsMessage('Here are some suggestions to improve your recipes:')

        } catch (aiError: any) {
          // Handle AI service unavailability gracefully
          if (aiError?.message === 'AI_SERVICE_UNAVAILABLE') {
            console.debug('AI services unavailable - proceeding with basic recipe generation')
            setCompatibilityAnalysis(null)
            setGuidanceMessage('Ready to generate recipes!')
          } else {
            console.error('AI analysis failed:', aiError)
            setCompatibilityAnalysis(null)
          }
        } finally {
          setCompatibilityLoading(false)
        }
      }

      // Store form data for guest mode
      if (isGuestMode) {
        setGuestFormData({
          ingredients,
          cookingTime: cookingTime[0],
          cuisine,
          dietMode,
          mealType,
          servings: servings[0],
          mode,
          mood
        })
      }

      // Authentication check for recipe generation
      if (!user || isGuestMode) {
        toast({
          title: "Sign in to Generate Recipes",
          description: "Please sign in to generate and save your recipes.",
          variant: "destructive",
        });
        redirectToSignIn(true);
        return;
      }

      // Use the new Supabase API
      console.log('Starting recipe generation for user:', user.id);
      console.log('Search parameters:', {
        ingredients: mode === "fridge" && ingredients.length > 0 ? ingredients : undefined,
        query: mode === "explore" && mood.trim() ? mood.trim() : undefined,
        mode: mode,
        filters: {
          maxTime: cookingTime[0],
          servings: servings[0],
          cuisine: cuisine,
          diet: dietMode ? 'vegetarian' : undefined,
          mealType: mealType
        }
      });
      
      // Get mood mapping for explore mode
      const moodMapping = mode === "explore" && mood.trim() ? moodMappings[mood] : null;
      const queryForAPI = mode === "explore" && mood.trim() ? (moodMapping?.query || mood.trim()) : undefined;
      
      const searchData = await supabaseAPI.generateRecipes({
        ingredients: mode === "fridge" && ingredients.length > 0 ? ingredients : undefined,
        query: queryForAPI,
        mode: mode,
        filters: {
          maxTime: moodMapping?.maxTime || cookingTime[0],
          servings: servings[0],
          cuisine: moodMapping?.cuisine || cuisine,
          diet: moodMapping?.diet || (dietMode ? 'vegetarian' : undefined),
          mealType: moodMapping?.mealType || mealType
        }
      });

      // Handle response from Supabase API
      if (searchData && searchData.recipes && Array.isArray(searchData.recipes)) {
        setRecipes(searchData.recipes);
        
        // Show rate limit info if available
        if (searchData.rateLimit) {
          toast({
            title: "Recipes Generated!",
            description: `Generated ${searchData.recipes.length} recipes. ${searchData.rateLimit.remaining} searches remaining today.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Recipes Generated!",
            description: `Generated ${searchData.recipes.length} recipes.`,
            variant: "default",
          });
        }
      } else {
        setError('No recipes found. Try adjusting your search criteria.');
        toast({
          title: "No Recipes Found",
          description: "Try adjusting your search criteria.",
          variant: "destructive",
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

        {/* Welcome Message for Authenticated Users */}
        {user && !isGuestMode && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              <ChefHat className="h-4 w-4" />
              Welcome back, {user.user_metadata?.full_name || user.email || 'Chef'}!
            </div>
          </div>
        )}

        {/* Guest Mode Indicator */}
        {isGuestMode && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-800 text-sm font-medium">
              <ChefHat className="h-4 w-4" />
              Guest Mode - Sign in to save recipes and unlock all features
            </div>
          </div>
        )}

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
                <div className="relative space-y-3">
                  <Label className="text-base font-semibold">Your Ingredients</Label>
                  <IngredientsInput ingredients={ingredients} onIngredientsChange={setIngredients} />
                  <p className="text-sm text-gray-500">
                    💡 <strong>Pro tip:</strong> The more ingredients you add, the more creative I can get!
                  </p>
                  
                  {/* Guidance Popup positioned above ingredients */}
                  <GuidancePopup
                    message={guidanceMessage}
                    isVisible={showGuidancePopup}
                    onDismiss={() => setShowGuidancePopup(false)}
                    duration={3000}
                  />
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
                disabled={buttonState.disabled}
                size="lg"
                className={`px-8 py-3 text-lg font-semibold shadow-lg ${
                  buttonState.disabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : mode === "fridge"
                    ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                } text-white`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    {buttonState.message}
                  </>
                ) : (
                  <>
                    {mode === "fridge" ? (
                      <Sparkles className="mr-2 h-5 w-5" />
                    ) : (
                      <Compass className="mr-2 h-5 w-5" />
                    )}
                    {buttonState.message}
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                {mode === "fridge" ? (
                  uiState === 'empty' ? "Start by adding some ingredients you have at home! 🏠" :
                  uiState === 'insufficient' ? "More ingredients = more creative recipes! 🎨" :
                  uiState === 'ready' ? "Let's create some culinary magic! ✨" :
                  "Let's create some culinary magic! ✨"
                ) : "Let's discover something amazing! 🌟"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Phase 3: Enhanced Fallback Recipes Display */}
        {fallbackRecipes.length > 0 && (
          <Card className="max-w-4xl mx-auto shadow-lg border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-orange-900 flex items-center gap-2">
                <ChefHat className="h-6 w-6" />
                Alternative Recipes
              </CardTitle>
              <CardDescription className="text-orange-800">
                {fallbackMessage}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {fallbackRecipes.map((recipe: any, index: number) => {
                // Separate user ingredients from required ingredients
                const userIngredients = recipe.ingredients.filter((ing: any) => 
                  typeof ing === 'object' ? !ing.required : true
                ).map((ing: any) => typeof ing === 'object' ? ing.name : ing)
                
                const requiredIngredients = recipe.ingredients.filter((ing: any) => 
                  typeof ing === 'object' ? ing.required : false
                ).map((ing: any) => ing.name)

                return (
                  <Card key={recipe.id} className="bg-white/80 border-orange-200">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {index + 1}. {recipe.title}
                            </h3>
                            <p className="text-gray-600 mb-3">{recipe.description}</p>
                          </div>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Fallback Recipe
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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

                        {/* Enhanced Ingredients Display */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-2">Ingredients:</h4>
                          
                          {/* Combined Ingredients List */}
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {userIngredients.map((ingredient: string, idx: number) => (
                              <li key={`user-${idx}`}>{ingredient}</li>
                            ))}
                            {requiredIngredients.map((ingredient: string, idx: number) => (
                              <li key={`required-${idx}`}>{ingredient} (required)</li>
                            ))}
                          </ul>

                          {/* Shopping List Button */}
                          {requiredIngredients.length > 0 && (
                            <div className="pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-700 border-orange-200 hover:bg-orange-50"
                                onClick={() => {
                                  const shoppingList = requiredIngredients.join('\n')
                                  navigator.clipboard.writeText(shoppingList).then(() => {
                                    toast({
                                      title: "Shopping list copied!",
                                      description: "Paste it in your notes app or shopping list",
                                      variant: "default",
                                    })
                                  })
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Copy Shopping List
                              </Button>
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Instructions:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
                            {recipe.instructions.split('\n').map((instruction: string, idx: number) => (
                              <li key={idx}>{instruction.trim()}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </CardContent>
          </Card>
        )}


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
                            
                            {/* Enhanced ingredient display for regular recipes */}
                            {recipe.ingredients.some((ing: any) => typeof ing === 'object' && ing.required) ? (
                              // New format with required ingredients marked in brackets
                              <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {recipe.ingredients.map((ingredient: any, idx: number) => (
                                  <li key={idx}>
                                    {typeof ingredient === 'object' 
                                      ? `${ingredient.name}${ingredient.required ? ' (required)' : ''}`
                                      : ingredient
                                    }
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              // Legacy format - simple list
                              <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {recipe.ingredients.map((ingredient: any, idx: number) => (
                                  <li key={idx}>
                                    {typeof ingredient === 'string'
                                      ? ingredient
                                      : `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name || ''}`.trim()
                                    }
                                  </li>
                                ))}
                              </ul>
                            )}
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

              {recipes.length === 0 && !error && !isLoading && hasSearched && (
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