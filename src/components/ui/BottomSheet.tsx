'use client'

import { ReactNode, useEffect, useRef, useState, useCallback } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  snapPoints?: number[]
  showCloseButton?: boolean
  showDragHandle?: boolean
  className?: string
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.5, 0.9],
  showCloseButton = true,
  showDragHandle = true,
  className = '',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const startY = useRef(0)

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Small delay for enter animation
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      queueMicrotask(() => setIsVisible(false))
      const timer = setTimeout(() => {
        document.body.style.overflow = ''
      }, 200)
      return () => clearTimeout(timer)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true)
    startY.current = clientY
  }, [])

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return
      const delta = clientY - startY.current
      if (delta > 0) {
        setDragOffset(delta)
      }
    },
    [isDragging]
  )

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    if (dragOffset > 100) {
      onClose()
    }
    setDragOffset(0)
  }, [isDragging, dragOffset, onClose])

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) =>
    handleDragStart(e.touches[0].clientY)
  const onTouchMove = (e: React.TouchEvent) =>
    handleDragMove(e.touches[0].clientY)
  const onTouchEnd = () => handleDragEnd()

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientY)

  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY)
    const onMouseUp = () => handleDragEnd()

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  if (!isOpen && !isVisible) return null

  const maxHeight = snapPoints[snapPoints.length - 1] * 100

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0 bg-black/50
          transition-opacity duration-200
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bottom sheet'}
        className={`
          absolute bottom-0 left-0 right-0
          bg-white rounded-t-2xl
          shadow-[0_-4px_20px_rgba(0,0,0,0.15)]
          transition-transform duration-300 ease-out
          ${isDragging ? '!transition-none' : ''}
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          ${className}
        `}
        style={{
          maxHeight: `${maxHeight}vh`,
          transform: isVisible
            ? `translateY(${dragOffset}px)`
            : 'translateY(100%)',
        }}
      >
        {/* Drag handle */}
        {showDragHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              {title || ''}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  w-8 h-8 -mr-1
                  flex items-center justify-center
                  rounded-full hover:bg-primary-50
                  transition-colors
                "
                aria-label="Đóng"
              >
                <X size={20} className="text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: `calc(${maxHeight}vh - 100px)` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
