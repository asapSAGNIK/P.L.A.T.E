"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ChefHat, Home, Search, History, User, LogOut, Bookmark, Settings, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { useGuestMode } from "@/components/guest-mode-provider"
import { createClient } from "@/lib/supabase/client"

const menuItems = [
  {
    title: "Find Recipes",
    url: "/find-recipes",
    icon: Home,
  },
  {
    title: "Saved Recipes",
    url: "/saved",
    icon: Bookmark,
  },
  {
    title: "Cooking History",
    url: "/history",
    icon: History,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter() // Initialize useRouter
  const { user, loading } = useAuth()
  const { isGuestMode, redirectToSignIn } = useGuestMode()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut(); // Sign out from Supabase
      router.push('/'); // Redirect to landing page
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  const handleSignIn = () => {
    redirectToSignIn(false)
  }

  const getDisplayName = () => {
    if (loading || !user) return "Guest"
    return (
      (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
      user.email ||
      "Guest"
    )
  }

  const getDisplayEmail = () => {
    if (loading || !user) return ""
    return user.email || ""
  }

  const getInitials = () => {
    const displayName = getDisplayName()
    if (displayName === "Guest") return "G"
    return displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="bg-orange-100 p-2 rounded-lg">
            <ChefHat className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">P.L.A.T.E</h2>
            <p className="text-xs text-gray-500">Your AI Chef</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{getDisplayName()}</p>
                <p className="text-xs text-gray-500 truncate">{getDisplayEmail()}</p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {user && !isGuestMode ? (
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button
                onClick={handleSignIn}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
