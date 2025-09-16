"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/")
      }
    })
  }, [router])

  return (
    <div className="flex flex-col min-h-screen ">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-16 items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">Profile</span>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Profile settings coming soon!</p>
        </div>
      </main>
    </div>
  )
}
