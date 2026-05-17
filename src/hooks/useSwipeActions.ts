'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

interface SwipeActionsConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number       // px to trigger action (default 80)
  deleteThreshold?: number // px for delete trigger (default 200)
  onSwipeProgress?: (progress: number, direction: 'left' | 'right') => void
  enabled?: boolean
}

interface SwipeState {
  offsetX: number
  isSwiping: boolean
  revealed: boolean
}

export function useSwipeActions(
  config: SwipeActionsConfig
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 80,
    deleteThreshold = 200,
    onSwipeProgress,
    enabled = true,
  } = config

  const [state, setState] = useState<SwipeState>({
    offsetX: 0,
    isSwiping: false,
    revealed: false,
  })

  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontal = useRef<boolean | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return
    const touch = e.touches[0]
    startX.current = touch.clientX
    startY.current = touch.clientY
    isHorizontal.current = null
    setState(prev => ({ ...prev, isSwiping: true }))
  }, [enabled])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !state.isSwiping) return
    const touch = e.touches[0]
    const dx = touch.clientX - startX.current
    const dy = touch.clientY - startY.current

    // Determine direction on first significant move
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy)
      }
      return
    }

    if (!isHorizontal.current) return

    e.preventDefault()

    // Clamp: allow left swipe freely, right swipe only to reset
    const clampedDx = state.revealed
      ? Math.min(0, Math.max(-deleteThreshold * 1.2, dx))
      : Math.min(threshold * 0.5, Math.max(-deleteThreshold * 1.2, dx))

    setState(prev => ({ ...prev, offsetX: clampedDx }))

    const progress = Math.abs(clampedDx) / threshold
    const direction = clampedDx < 0 ? 'left' : 'right'
    onSwipeProgress?.(Math.min(progress, 1), direction)
  }, [enabled, state.isSwiping, state.revealed, threshold, deleteThreshold, onSwipeProgress])

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return

    const absOffset = Math.abs(state.offsetX)
    const isLeft = state.offsetX < 0

    if (isLeft && absOffset >= deleteThreshold) {
      // Far swipe → delete trigger
      onSwipeLeft?.()
      setState({ offsetX: 0, isSwiping: false, revealed: false })
    } else if (isLeft && absOffset >= threshold) {
      // Reveal actions
      setState({ offsetX: -threshold, isSwiping: false, revealed: true })
    } else if (!isLeft && state.revealed) {
      // Swipe right to close
      setState({ offsetX: 0, isSwiping: false, revealed: false })
      onSwipeRight?.()
    } else {
      // Reset
      setState({ offsetX: 0, isSwiping: false, revealed: false })
    }
  }, [enabled, state.offsetX, state.revealed, threshold, deleteThreshold, onSwipeLeft, onSwipeRight])

  const reset = useCallback(() => {
    setState({ offsetX: 0, isSwiping: false, revealed: false })
  }, [])

  return {
    ref: elementRef,
    state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    reset,
  }
}
