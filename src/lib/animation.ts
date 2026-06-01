// Animation System - Smooth UX transitions
// UX/UI Pack #7: Fade, slide, scale, spring animations

const cssKeyframes = (strings: TemplateStringsArray, ...values: Array<string | number>) => {
  return strings.reduce((result, string, i) => result + string + (values[i] || ''), '')
}

// Keyframes definitions
const fadeInKf = cssKeyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const fadeOutKf = cssKeyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`

const slideUpKf = cssKeyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`

const slideDownKf = cssKeyframes`
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`

const scaleInKf = cssKeyframes`
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`

const pulseKf = cssKeyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`

const spinKf = cssKeyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const shakeKf = cssKeyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
`

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export const animations = {
  none: 'none',
  'fade-in': `${fadeInKf} 300ms ease-out`,
  'fade-in-fast': `${fadeInKf} 150ms ease-out`,
  'fade-in-slow': `${fadeInKf} 500ms ease-out`,
  'fade-out': `${fadeOutKf} 300ms ease-out`,
  'slide-up': `${slideUpKf} 300ms ease-out`,
  'slide-down': `${slideDownKf} 300ms ease-out`,
  'scale-in': `${scaleInKf} 200ms ease-out`,
  'pulse': `${pulseKf} 2s ease-in-out infinite`,
  'spin': `${spinKf} 1s linear infinite`,
  'shake': `${shakeKf} 500ms ease-in-out`,
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const transitions = {
  'fast': '150ms ease-out',
  'default': '200ms ease-out',
  'slow': '300ms ease-out',
  'spring': '400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'bounce': '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'

export function useAnimation(
  isVisible: boolean,
  enterDuration = 300,
  exitDuration = 200
): {
  state: 'entering' | 'entered' | 'exiting' | 'exited'
  isVisible: boolean
  style: React.CSSProperties
} {
  const [state, setState] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
    isVisible ? 'entering' : 'exited'
  )

  useEffect(() => {
    let stateTimer: ReturnType<typeof setTimeout> | undefined
    let phaseTimer: ReturnType<typeof setTimeout> | undefined

    if (isVisible) {
      stateTimer = setTimeout(() => setState((current) => (current === 'entered' ? current : 'entering')), 0)
      phaseTimer = setTimeout(() => setState('entered'), enterDuration)
    } else {
      stateTimer = setTimeout(() => setState((current) => (current === 'exited' ? current : 'exiting')), 0)
      phaseTimer = setTimeout(() => setState('exited'), exitDuration)
    }

    return () => {
      if (stateTimer) clearTimeout(stateTimer)
      if (phaseTimer) clearTimeout(phaseTimer)
    }
  }, [isVisible, enterDuration, exitDuration])

  const getStyle = useCallback((): React.CSSProperties => {
    switch (state) {
      case 'entering':
        return { opacity: 0, transform: 'scale(0.95)' }
      case 'entered':
        return { opacity: 1, transform: 'scale(1)' }
      case 'exiting':
        return { opacity: 0, transform: 'scale(0.95)', transition: `all ${exitDuration}ms ease-out` }
      case 'exited':
        return { display: 'none' }
    }
  }, [state, exitDuration])

  return {
    state,
    isVisible: state === 'entering' || state === 'entered',
    style: getStyle(),
  }
}

const animationExports = { animations, transitions, useAnimation }

export default animationExports
