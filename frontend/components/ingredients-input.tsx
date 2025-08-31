"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { fetchIngredientSuggestions } from "@/lib/spoonacular"

interface IngredientsInputProps {
  ingredients: string[]
  onIngredientsChange: (ingredients: string[]) => void
}

export function IngredientsInput({ ingredients, onIngredientsChange }: IngredientsInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (inputValue.trim()) {
      debounceTimeoutRef.current = setTimeout(async () => {
        const fetchedSuggestions = await fetchIngredientSuggestions(inputValue)
        const filtered = fetchedSuggestions.filter(
          (suggestion: string) => !ingredients.includes(suggestion.toLowerCase()),
        )
        setSuggestions(filtered)
        setShowSuggestions(true)
      }, 300) // 300ms debounce time
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [inputValue, ingredients])

  const addIngredient = (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase()
    if (trimmed && !ingredients.includes(trimmed)) {
      onIngredientsChange([...ingredients, trimmed])
      setInputValue("")
      setSuggestions([]) // Clear suggestions after adding
      setShowSuggestions(false)
      inputRef.current?.focus()
    }
  }

  const removeIngredient = (ingredient: string) => {
    onIngredientsChange(ingredients.filter((item) => item !== ingredient))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (inputValue.trim()) {
        addIngredient(inputValue)
      } else if (suggestions.length > 0) {
        addIngredient(suggestions[0]) // Add the first suggestion if available
      }
    } else if (e.key === "Backspace" && !inputValue && ingredients.length > 0) {
      removeIngredient(ingredients[ingredients.length - 1])
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-white min-h-[48px] flex-wrap">
          {ingredients.map((ingredient) => (
            <Badge key={ingredient} variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">
              {ingredient}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0 hover:bg-orange-300"
                onClick={() => removeIngredient(ingredient)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              ingredients.length === 0 ? "Type an ingredient (e.g., chicken, tomatoes)..." : "Add another ingredient..."
            }
            className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[200px]"
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => addIngredient(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-orange-50 flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4 text-orange-600" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
