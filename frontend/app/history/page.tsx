"use client";
import React, { useEffect, useState } from 'react'
import { useRouter } from "next/navigation"
import { supabase } from '../../lib/supabaseClient'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      try {
        // Use backend endpoint for fetching recipe history
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/history`, {
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to fetch recipe history')
        setHistory(data)
      } catch (error) {
        setError('Failed to load recipe history. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login")
      }
    })
  }, [router])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-16 items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">Cooking History</span>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Your cooking history will appear here!</p>
        </div>
      </main>
    </div>
  )
}
