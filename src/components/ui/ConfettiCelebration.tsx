'use client'

import { useReducer, useEffect } from 'react'

interface Particle {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
  rotation: number
}

interface ConfettiCelebrationProps {
  isActive: boolean
  duration?: number
  particleCount?: number
  onComplete?: () => void
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#34D399', '#F472B6', '#60A5FA', '#FBBF24']

interface ConfettiState {
  visible: boolean
  particles: Particle[]
  endRotation: number
}

type ConfettiAction =
  | { type: 'ACTIVATE'; particles: Particle[]; endRotation: number }
  | { type: 'DEACTIVATE' }

function confettiReducer(_state: ConfettiState, action: ConfettiAction): ConfettiState {
  switch (action.type) {
    case 'ACTIVATE':
      return { visible: true, particles: action.particles, endRotation: action.endRotation }
    case 'DEACTIVATE':
      return { visible: false, particles: [], endRotation: 720 }
  }
}

const initialState: ConfettiState = { visible: false, particles: [], endRotation: 720 }

export default function ConfettiCelebration({
  isActive,
  duration = 3000,
  particleCount = 50,
  onComplete,
}: ConfettiCelebrationProps) {
  const [state, dispatch] = useReducer(confettiReducer, initialState)

  useEffect(() => {
    if (!isActive) {
      dispatch({ type: 'DEACTIVATE' })
      return
    }

    const generated = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 600,
      duration: 1500 + Math.random() * 1500,
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 720,
    }))

    dispatch({
      type: 'ACTIVATE',
      particles: generated,
      endRotation: 720 + Math.random() * 360,
    })

    const timer = setTimeout(() => {
      dispatch({ type: 'DEACTIVATE' })
      onComplete?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [isActive, duration, particleCount, onComplete])

  // Respect reduced motion
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return null
  }

  if (!state.visible || state.particles.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {state.particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 1.5,
            backgroundColor: p.color,
            borderRadius: p.size > 8 ? '50%' : '2px',
            animation: `confetti-fall ${p.duration}ms ease-in ${p.delay}ms forwards`,
          }}
        />
      ))}

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(105vh) rotate(${state.endRotation}deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
