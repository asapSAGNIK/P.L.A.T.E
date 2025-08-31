export const dynamic = 'force-dynamic'

"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from '../lib/supabaseClient'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      router.replace("/login")
      return
    }
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard")
      } else {
        router.replace("/login")
      }
      setLoading(false)
    })
  }, [router])

  // Optionally, show a loading spinner while checking session
  if (loading) return <div>Loading...</div>
  return null
}
