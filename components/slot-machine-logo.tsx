"use client"

import { useEffect, useState } from "react"
import { ForkKnife, CookingPot, Pizza, Hamburger, Cookie } from "phosphor-react"

interface SlotMachineLogoProps {
  className?: string
  reelSizePx?: number // size of each reel square in pixels
  letterSizeClass?: string // tailwind text size class for final letters
  gapClass?: string // tailwind space-x-* for gap between reels
  showDots?: boolean
}

export function SlotMachineLogo({ className = "", reelSizePx = 32, letterSizeClass = "text-2xl", gapClass = "space-x-2", showDots = true }: SlotMachineLogoProps) {
  const [animationPhase, setAnimationPhase] = useState<'spinning' | 'stopping' | 'revealing'>('spinning')
  const [stoppedReels, setStoppedReels] = useState<boolean[]>([false, false, false, false, false])
  const [revealedLetters, setRevealedLetters] = useState<boolean[]>([false, false, false, false, false])

  // The 5 food icons to cycle through
  const foodIcons = [
    ForkKnife,
    CookingPot, 
    Pizza,
    Hamburger,
    Cookie
  ]

  // The final letters to reveal
  const finalLetters = ['P', 'L', 'A', 'T', 'E']

  useEffect(() => {
    // Start the slot machine animation sequence
    const startAnimation = () => {
      // Phase 1: Spinning (1 second)
      setTimeout(() => {
        setAnimationPhase('stopping')
        
        // Stop each reel with 500ms delay between them (slower)
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            setStoppedReels(prev => {
              const newStopped = [...prev]
              newStopped[i] = true
              return newStopped
            })
            
            // Start revealing letter after 0.5s pause
            setTimeout(() => {
              setAnimationPhase('revealing')
              setRevealedLetters(prev => {
                const newRevealed = [...prev]
                newRevealed[i] = true
                return newRevealed
              })
            }, 500) // 0.5 second pause after reel stops
          }, i * 500)
        }

      }, 1000) // 1 second initial spinning
    }

    startAnimation()
  }, [])

  return (
    <>
      {/* Add custom CSS for slot machine animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slot-machine-spin {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-320px); }
          }
          
          @keyframes letter-reveal {
            0% { 
              transform: translateY(32px);
              opacity: 0;
            }
            100% { 
              transform: translateY(0px);
              opacity: 1;
            }
          }
          
          .slot-reel {
            animation: slot-machine-spin 0.55s linear infinite; /* slower icon scroll */
          }
          
          .slot-reel.stopped {
            animation: none;
          }
          
          .letter-reveal {
            animation: letter-reveal 0.4s ease-out forwards;
          }
        `
      }} />
      
      <div className={`flex items-center ${className}`}>
        <div className={`flex items-center ${gapClass}`}>
          {finalLetters.map((letter, index) => {
            const isStopped = stoppedReels[index]
            const isRevealed = revealedLetters[index]
            const isRevealing = animationPhase === 'revealing'

            return (
              <div key={index} className="flex items-center">
                {/* Slot reel container */}
                <div className="relative overflow-hidden" style={{ width: reelSizePx, height: reelSizePx }}>
                  {isRevealed ? (
                    // Show final letter with animation
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`${letterSizeClass} font-bold text-orange-600 leading-none letter-reveal`}>
                        {letter}
                      </span>
                    </div>
                  ) : (
                    // Show slot machine reel
                    <div className="absolute inset-0">
                      {/* Multiple icons stacked for slot machine effect */}
                      {[...Array(12)].map((_, iconIndex) => {
                        const IconComponent = foodIcons[iconIndex % foodIcons.length]
                        const isActive = isStopped && iconIndex === index
                        
                        return (
                          <div
                            key={iconIndex}
                            className={`
                              absolute w-full h-full flex items-center justify-center
                              transition-transform duration-500 ease-out
                              ${!isStopped ? 'slot-reel' : 'slot-reel stopped'}
                            `}
                            style={{
                              transform: !isStopped 
                                ? `translateY(${-iconIndex * reelSizePx}px)` 
                                : isActive 
                                  ? 'translateY(0px)' 
                                  : `translateY(${(iconIndex - index) * reelSizePx}px)`,
                              animationDelay: `${iconIndex * 40}ms`
                            }}
                          >
                            <IconComponent 
                              size={Math.max(20, Math.round(reelSizePx * 0.65))} 
                              className="text-orange-600"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                
                {/* Dot separator between letters (not after last letter) */}
                {showDots && index < 4 && (
                  <span className={`${letterSizeClass} font-bold text-orange-600 mx-1 leading-none`}>
                    .
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
