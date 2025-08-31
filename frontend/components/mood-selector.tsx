"use client"

import { Button } from "@/components/ui/button"
import { Heart, Zap, Leaf, Coffee, Cookie, Sparkles, Sun, Moon } from "lucide-react"

const moods = [
  { value: "comfort", label: "Comfort Food", icon: Heart, emoji: "🤗", description: "Warm, cozy, soul-soothing" },
  { value: "healthy", label: "Healthy & Fresh", icon: Leaf, emoji: "🥗", description: "Light, nutritious, energizing" },
  { value: "spicy", label: "Spicy & Bold", icon: Zap, emoji: "🌶️", description: "Hot, exciting, adventurous" },
  { value: "quick", label: "Quick Snack", icon: Coffee, emoji: "⚡", description: "Fast, easy, satisfying" },
  { value: "indulgent", label: "Indulgent Treat", icon: Cookie, emoji: "🍰", description: "Rich, decadent, special" },
  {
    value: "exotic",
    label: "Something New",
    icon: Sparkles,
    emoji: "🌍",
    description: "Unique, adventurous, different",
  },
  { value: "light", label: "Light & Bright", icon: Sun, emoji: "☀️", description: "Fresh, clean, uplifting" },
  { value: "cozy", label: "Cozy Evening", icon: Moon, emoji: "🌙", description: "Warm, intimate, relaxing" },
]

interface MoodSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function MoodSelector({ value, onValueChange }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {moods.map((mood) => {
        const Icon = mood.icon
        const isSelected = value === mood.value

        return (
          <Button
            key={mood.value}
            variant={isSelected ? "default" : "outline"}
            onClick={() => onValueChange(isSelected ? "" : mood.value)}
            className={`h-auto p-4 flex flex-col items-center gap-2 text-center ${
              isSelected
                ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                : "hover:bg-purple-50 hover:border-purple-200 border-gray-200"
            }`}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <div>
              <div className="font-medium text-sm">{mood.label}</div>
              <div className={`text-xs mt-1 ${isSelected ? "text-purple-100" : "text-gray-500"}`}>
                {mood.description}
              </div>
            </div>
          </Button>
        )
      })}
    </div>
  )
}
