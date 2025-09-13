"use client"
import { Toaster } from "@/components/ui/toaster"
import { NavigationGuard } from "@/components/navigation-guard"

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <NavigationGuard>
      {children}
      <Toaster />
    </NavigationGuard>
  )
} 