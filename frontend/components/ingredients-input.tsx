"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
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
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Handle input changes and fetch suggestions
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (inputValue.trim()) {
      setIsLoading(true)
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const fetchedSuggestions = await fetchIngredientSuggestions(inputValue)
          const filtered = fetchedSuggestions.filter(
            (suggestion: string) => !ingredients.includes(suggestion.toLowerCase()),
          )
          setSuggestions(filtered)
          setShowSuggestions(true)
        } catch (error) {
          console.error('Error fetching suggestions:', error)
          setSuggestions([])
          setShowSuggestions(false)
        } finally {
          setIsLoading(false)
        }
      }, 300) // 300ms debounce time
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setIsLoading(false)
    }
  }, [inputValue, ingredients])

  const addIngredient = useCallback((ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase()
    if (trimmed && !ingredients.includes(trimmed)) {
      onIngredientsChange([...ingredients, trimmed])
      setInputValue("")
      setSuggestions([])
      setShowSuggestions(false)
      setIsLoading(false)
      // Clear any pending debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      inputRef.current?.focus()
    }
  }, [ingredients, onIngredientsChange])

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
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0 && inputValue.trim()) {
      setShowSuggestions(true)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative" ref={containerRef}>
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
            onFocus={handleInputFocus}
            placeholder={
              ingredients.length === 0 ? "Type an ingredient (e.g., chicken, tomatoes)..." : "Add another ingredient..."
            }
            className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[200px]"
          />
        </div>

        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                Loading suggestions...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => addIngredient(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-orange-50 flex items-center gap-2 text-sm transition-colors"
                >
                  <Plus className="h-4 w-4 text-orange-600" />
                  {suggestion}
                </button>
              ))
            ) : inputValue.trim() ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No suggestions found for "{inputValue}"
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
