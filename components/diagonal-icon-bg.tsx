"use client"

import { useMemo } from "react"
import { ForkKnife, CookingPot, Pizza, Hamburger, Cookie } from "phosphor-react"

interface DiagonalIconBgProps {
  className?: string
}

export function DiagonalIconBg({ className = "" }: DiagonalIconBgProps) {
  const icons = useMemo(() => [ForkKnife, CookingPot, Pizza, Hamburger, Cookie], [])

  // Build 12 columns, alternating animation directions
  const columns = new Array(12).fill(0).map((_, i) => ({ index: i }))

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes diag-up {
            0% { transform: translate(-10%, 10%) rotate(-12deg); }
            100% { transform: translate(10%, -10%) rotate(-12deg); }
          }
          @keyframes diag-down {
            0% { transform: translate(10%, -10%) rotate(-12deg); }
            100% { transform: translate(-10%, 10%) rotate(-12deg); }
          }
        `
      }} />

      <div className="absolute inset-0" style={{ transform: "rotate(-25deg)" }}>
        <div className="flex h-full w-[200%] -ml-[30%]">
          {columns.map((col) => {
            const directionUp = col.index % 2 === 0
            return (
              <div key={col.index} className="relative flex-1 flex items-center justify-center">
                <div
                  className="opacity-10"
                  style={{
                    animation: `${directionUp ? "diag-up" : "diag-down"} ${32 + col.index * 1.5}s linear infinite`,
                  }}
                >
                  <div className="flex flex-col items-center gap-10">
                    {new Array(10).fill(0).map((_, row) => {
                      const Icon = icons[(col.index + row) % icons.length]
                      return <Icon key={row} size={96} className="text-orange-600" />
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


