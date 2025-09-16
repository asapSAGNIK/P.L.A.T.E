"use client"

import { DotLottieReact } from "@lottiefiles/dotlottie-react"

interface HeroIllustrationProps {
  className?: string
  height?: number
  width?: number
  src?: string
}

export function HeroIllustration({ className = "", height = 320, width = 320, src }: HeroIllustrationProps) {
  const defaultSrc = "https://lottie.host/f90e5298-98ee-4046-92c9-5fd7294992c5/RlHgFsiDzq.lottie"
  return (
    <div className={className} style={{ backgroundColor: 'transparent' }}>
      <DotLottieReact
        src={src || defaultSrc}
        loop
        autoplay
        style={{ 
          height: `${height}px`, 
          width: `${width}px`,
          backgroundColor: 'transparent',
          mixBlendMode: 'multiply'
        }}
      />
    </div>
  )
}


