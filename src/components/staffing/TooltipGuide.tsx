'use client'

import { useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface TooltipGuideProps {
  id: string
  title: string
  body: string
  step?: { current: number; total: number }
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  showArrow?: boolean
  onDismiss: () => void
}

export default function TooltipGuide({
  title, body, step, position = 'center', showArrow = false, onDismiss
}: TooltipGuideProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Click outside to dismiss
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
      onDismiss()
    }
  }, [onDismiss])

  // Escape to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onDismiss])

  // Auto-dismiss after 30s
  useEffect(() => {
    const timer = setTimeout(onDismiss, 30000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  // Position classes
  const positionClass = position === 'center'
    ? 'fixed inset-0 flex items-center justify-center z-50'
    : 'absolute z-50'

  return (
    <div
      className={positionClass}
      onClick={handleBackdropClick}
      role="dialog"
      aria-label={title}
    >
      {/* Subtle backdrop for centered tooltips */}
      {position === 'center' && (
        <div className="absolute inset-0 bg-black/10" />
      )}

      <div
        ref={tooltipRef}
        className={`
          relative bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100
          max-w-sm w-full
          animate-in fade-in zoom-in-95 duration-300
          ${position === 'center' ? 'mx-4' : ''}
        `}
      >
        {/* Arrow */}
        {showArrow && position === 'bottom' && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white border-l border-t border-gray-100" />
        )}
        {showArrow && position === 'top' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white border-r border-b border-gray-100" />
        )}

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 rounded-full hover:bg-primary-50 transition-colors"
          aria-label="Đóng"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="p-5">
          <h4 className="text-sm font-bold text-gray-900 mb-2">{title}</h4>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {body}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            Hiểu rồi
          </button>

          {step && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">{step.current}/{step.total}</span>
              <div className="flex gap-1">
                {Array.from({ length: step.total }, (_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i < step.current ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
