"use client"
import React, { useEffect, useState } from 'react'
import { supabaseAPI } from '../lib/supabase/api'

const RecipeList: React.FC = () => {
  const [recipes, setRecipes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true)
      try {
        console.log('🔧 RecipeList: Fetching recipes via Supabase...')
        
        // Use Supabase to fetch recipes from the database
        const { createClient } = await import('../lib/supabase/client')
        const supabase = createClient()
        
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (recipesError) {
          console.error('❌ RecipeList: Error fetching recipes:', recipesError)
          throw new Error(recipesError.message || 'Failed to fetch recipes')
        }
        
        console.log('✅ RecipeList: Recipes fetched successfully:', recipesData?.length || 0)
        setRecipes(recipesData || [])
      } catch (error: any) {
        console.error('❌ RecipeList: Failed to load recipes:', error)
        setError('Failed to load recipes. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecipes()
  }, [])

  return (
    <div>
      {/* Render your recipes here */}
    </div>
  )
}

export default RecipeList 