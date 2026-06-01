'use client'

import { ReactNode, useRef, useState, useCallback, useEffect } from 'react'
import { LucideIcon } from 'lucide-react'

interface SwipeAction {
  icon: LucideIcon
  label: string
  color: string
  bgColor: string
  onAction: () => void
}

interface SwipeableCardProps {
  children: ReactNode
  leftAction?: SwipeAction
  rightAction?: SwipeAction
  onTap?: () => void
  disabled?: boolean
  className?: string
}

const REVEAL_THRESHOLD = 80
const TRIGGER_THRESHOLD = 150

export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  onTap,
  disabled = false,
  className = '',
}: SwipeableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontalSwipe = useRef<boolean | null>(null)
  const hasMoved = useRef(false)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      isHorizontalSwipe.current = null
      hasMoved.current = false
      setIsDragging(true)
    },
    [disabled]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || disabled) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const deltaX = currentX - startX.current
      const deltaY = currentY - startY.current

      // Determine swipe direction
      if (
        isHorizontalSwipe.current === null &&
        (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)
      ) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY)
      }

      if (isHorizontalSwipe.current !== true) return

      hasMoved.current = true

      // Calculate new offset with limits
      let newOffset = deltaX
      if (newOffset > 0 && !rightAction) newOffset = 0
      if (newOffset < 0 && !leftAction) newOffset = 0
      newOffset = Math.max(
        -TRIGGER_THRESHOLD,
        Math.min(TRIGGER_THRESHOLD, newOffset)
      )

      setOffsetX(newOffset)
    },
    [isDragging, disabled, leftAction, rightAction]
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)

    if (offsetX >= TRIGGER_THRESHOLD && rightAction) {
      rightAction.onAction()
      setOffsetX(0)
      return
    }
    if (offsetX <= -TRIGGER_THRESHOLD && leftAction) {
      leftAction.onAction()
      setOffsetX(0)
      return
    }

    // Snap logic
    if (Math.abs(offsetX) >= REVEAL_THRESHOLD) {
      setOffsetX(offsetX > 0 ? REVEAL_THRESHOLD : -REVEAL_THRESHOLD)
    } else {
      setOffsetX(0)
    }
  }, [offsetX, leftAction, rightAction])

  const handleClick = useCallback(() => {
    if (hasMoved.current) return

    if (offsetX !== 0) {
      setOffsetX(0)
    } else if (onTap) {
      onTap()
    }
  }, [offsetX, onTap])

  // Reset on outside click
  useEffect(() => {
    if (offsetX === 0) return

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOffsetX(0)
      }
    }

    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [offsetX])

  const showLeftAction = offsetX <= -REVEAL_THRESHOLD && leftAction
  const showRightAction = offsetX >= REVEAL_THRESHOLD && rightAction

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Right action (revealed when swiping right) */}
      {rightAction && (
        <div
          className={`
            absolute inset-y-0 left-0
            flex items-center justify-start pl-4
            transition-opacity duration-150
            ${rightAction.bgColor}
            ${showRightAction ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ width: Math.max(0, offsetX) }}
        >
          <button
            onClick={() => {
              rightAction.onAction()
              setOffsetX(0)
            }}
            className="flex items-center gap-2"
            aria-label={rightAction.label}
          >
            <rightAction.icon size={20} className={rightAction.color} />
            <span className={`text-sm font-medium ${rightAction.color}`}>
              {rightAction.label}
            </span>
          </button>
        </div>
      )}

      {/* Left action (revealed when swiping left) */}
      {leftAction && (
        <div
          className={`
            absolute inset-y-0 right-0
            flex items-center justify-end pr-4
            transition-opacity duration-150
            ${leftAction.bgColor}
            ${showLeftAction ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ width: Math.max(0, -offsetX) }}
        >
          <button
            onClick={() => {
              leftAction.onAction()
              setOffsetX(0)
            }}
            className="flex items-center gap-2"
            aria-label={leftAction.label}
          >
            <span className={`text-sm font-medium ${leftAction.color}`}>
              {leftAction.label}
            </span>
            <leftAction.icon size={20} className={leftAction.color} />
          </button>
        </div>
      )}

      {/* Main content */}
      <div
        className={`
          relative bg-white
          ${isDragging ? '' : 'transition-transform duration-200 ease-out'}
          ${disabled ? 'opacity-60' : ''}
        `}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  )
}
