"use client"

import { Button } from "@/components/ui/button"
import { Coffee, Sun, Moon, Cookie, IceCream } from "lucide-react"

const mealTypes = [
  { value: "breakfast", label: "Breakfast", icon: Coffee, emoji: "🌅" },
  { value: "lunch", label: "Lunch", icon: Sun, emoji: "☀️" },
  { value: "dinner", label: "Dinner", icon: Moon, emoji: "🌙" },
  { value: "snack", label: "Snack", icon: Cookie, emoji: "🍪" },
  { value: "dessert", label: "Dessert", icon: IceCream, emoji: "🍰" },
]

interface MealTypeSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function MealTypeSelector({ value, onValueChange }: MealTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {mealTypes.map((type) => {
        const Icon = type.icon
        const isSelected = value === type.value

        return (
          <Button
            key={type.value}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onValueChange(isSelected ? "" : type.value)}
            className={`h-auto p-3 flex flex-col items-center gap-2 ${
              isSelected ? "bg-orange-600 hover:bg-orange-700 text-white" : "hover:bg-orange-50 hover:border-orange-200"
            }`}
          >
            <span className="text-lg">{type.emoji}</span>
            <span className="text-xs font-medium">{type.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
