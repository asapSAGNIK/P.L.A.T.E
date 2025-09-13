"use client"

import { useEffect, useState } from "react"

interface GuidancePopupProps {
  message: string
  isVisible: boolean
  onDismiss: () => void
  duration?: number // Auto-dismiss duration in ms
}

export function GuidancePopup({
  message,
  isVisible,
  onDismiss,
  duration = 3000
}: GuidancePopupProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onDismiss, 200) // Wait for animation to complete
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
    }
  }, [isVisible, duration, onDismiss])

  if (!isVisible && !isAnimating) return null

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex justify-center">
      <div
        className={`bg-white/90 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg px-4 py-2 transition-all duration-300 ease-in-out ${
          isAnimating
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2'
        }`}
      >
        <p className="text-sm text-gray-700 font-medium">
          {message}
        </p>
      </div>
    </div>
  )
}