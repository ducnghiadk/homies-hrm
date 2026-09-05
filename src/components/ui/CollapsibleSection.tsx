'use client'

import { useState, useRef, useCallback, useId, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  badge?: string | number
  defaultOpen?: boolean
  disabled?: boolean
  headerClassName?: string
  contentClassName?: string
  onToggle?: (isOpen: boolean) => void
  children: React.ReactNode
}

export default function CollapsibleSection({
  title,
  subtitle,
  icon,
  badge,
  defaultOpen = false,
  disabled = false,
  headerClassName = '',
  contentClassName = '',
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isAnimating, setIsAnimating] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const regionId = useId()
  const headerId = useId()

  // Measure content height whenever open state or children change
  useEffect(() => {
    if (isOpen && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [isOpen, children])

  const toggle = useCallback(() => {
    if (disabled) return
    setIsAnimating(true)
    setIsOpen(prev => {
      const next = !prev
      onToggle?.(next)
      return next
    })
  }, [disabled, onToggle])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    },
    [toggle]
  )

  const handleTransitionEnd = useCallback(() => {
    setIsAnimating(false)
  }, [])

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* Header button */}
      <button
        id={headerId}
        type="button"
        role="button"
        aria-expanded={isOpen}
        aria-controls={regionId}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center gap-3 px-4 py-3 text-left
          transition-colors duration-150
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-vanilla-50 cursor-pointer'}
          ${isOpen ? 'bg-vanilla-50' : 'bg-white'}
          ${headerClassName}
        `}
      >
        {/* Chevron */}
        <ChevronRight
          size={16}
          className={`
            text-gray-400 shrink-0 transition-transform
            ${isOpen ? 'rotate-90' : 'rotate-0'}
            motion-reduce:transition-none
          `}
          style={{ transitionDuration: '200ms' }}
        />

        {/* Icon */}
        {icon && <span className="shrink-0">{icon}</span>}

        {/* Title + Subtitle */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-700 truncate">{title}</div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</div>
          )}
        </div>

        {/* Badge */}
        {badge !== undefined && badge !== null && (
          <span className="shrink-0 bg-primary-50 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </button>

      {/* Content region */}
      <div
        id={regionId}
        role="region"
        aria-labelledby={headerId}
        ref={contentRef}
        onTransitionEnd={handleTransitionEnd}
        className={`
          overflow-hidden transition-all ease-out
          motion-reduce:transition-none
          ${contentClassName}
        `}
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : '0px',
          transitionDuration: '300ms',
          opacity: isOpen ? 1 : 0,
          willChange: isAnimating ? 'max-height, opacity' : 'auto',
        }}
      >
        <div className="px-4 pb-4 pt-2">{children}</div>
      </div>
    </div>
  )
}
