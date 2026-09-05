'use client'

import { useEffect, useRef, useCallback, useId } from 'react'
import { X } from 'lucide-react'

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  snapPoints?: number[]   // fractions of viewport height, e.g. [0.5, 0.9]
  initialSnap?: number    // index into snapPoints (default 0)
  enableDrag?: boolean
  showFooter?: boolean
  footerContent?: React.ReactNode
}

export default function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.55, 0.92],
  initialSnap = 0,
  enableDrag = true,
  showFooter = false,
  footerContent,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const currentSnap = useRef(initialSnap)
  const titleId = useId()

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const getSnapHeight = useCallback((idx: number) => {
    const frac = snapPoints[Math.min(idx, snapPoints.length - 1)]
    return `${frac * 100}vh`
  }, [snapPoints])

  const handleDragStart = useCallback((e: React.TouchEvent) => {
    if (!enableDrag) return
    dragStartY.current = e.touches[0].clientY
  }, [enableDrag])

  const handleDragEnd = useCallback((e: React.TouchEvent) => {
    if (!enableDrag || !sheetRef.current) return
    const dy = e.changedTouches[0].clientY - dragStartY.current

    if (dy > 80) {
      // Drag down
      if (currentSnap.current > 0) {
        currentSnap.current--
        sheetRef.current.style.height = getSnapHeight(currentSnap.current)
      } else {
        onClose()
      }
    } else if (dy < -80) {
      // Drag up
      if (currentSnap.current < snapPoints.length - 1) {
        currentSnap.current++
        sheetRef.current.style.height = getSnapHeight(currentSnap.current)
      }
    }
  }, [enableDrag, snapPoints, getSnapHeight, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="
          fixed inset-x-0 bottom-0 z-50
          bg-white rounded-t-2xl shadow-2xl
          flex flex-col
          animate-in slide-in-from-bottom duration-300
          transition-[height] duration-300 ease-out
        "
        style={{ height: getSnapHeight(initialSnap) }}
      >
        {/* Drag handle */}
        {enableDrag && (
          <div
            className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
          <h2 id={titleId} className="font-bold text-gray-900 text-sm">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {showFooter && footerContent && (
          <div className="shrink-0 border-t border-gray-200 px-4 py-3 bg-vanilla-50">
            {footerContent}
          </div>
        )}
      </div>
    </>
  )
}
