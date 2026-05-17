'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Zap } from 'lucide-react'
import QuickEstimateTab from './QuickEstimateTab'
import type { QuickEstimateResult, QuickEstimateState } from '@/lib/staffing/types'

interface QuickEstimateFABProps {
  onApplyResult?: (result: QuickEstimateResult) => void
  onAnalyzeDetail?: (input: QuickEstimateState) => void
}

export default function QuickEstimateFAB({
  onApplyResult,
  onAnalyzeDetail,
}: QuickEstimateFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastResult, setLastResult] = useState<number | null>(null)
  const lastScrollY = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Scroll hide: down → hide, up → show ──
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      setIsVisible(currentY < lastScrollY.current || currentY < 100)
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ── Keyboard shortcut: Ctrl/Cmd + K ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsExpanded(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Click outside to close ──
  useEffect(() => {
    if (!isExpanded) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
      }
    }
    // Delay to prevent the FAB click itself from closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [isExpanded])

  // ── Escape to close ──
  useEffect(() => {
    if (!isExpanded) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  // ── Body scroll lock when expanded on mobile ──
  useEffect(() => {
    if (isExpanded && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isExpanded])

  const handleApply = useCallback(
    (result: QuickEstimateResult) => {
      setLastResult(result.totalPerShift)
      setIsExpanded(false)
      onApplyResult?.(result)
    },
    [onApplyResult]
  )

  const handleAnalyze = useCallback(
    (input: QuickEstimateState) => {
      setIsExpanded(false)
      onAnalyzeDetail?.(input)
    },
    [onAnalyzeDetail]
  )

  // ── FAB button label ──
  const fabLabel = lastResult
    ? `${lastResult} người/ca`
    : 'Tính nhanh'

  return (
    <>
      {/* ═══════════ COLLAPSED FAB BUTTON ═══════════ */}
      {!isExpanded && (
        <div
          className={`
            fixed bottom-6 right-6 z-50
            transition-all duration-300 motion-reduce:transition-none
            ${isVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-20 opacity-0 pointer-events-none'
            }
          `}
        >
          <button
            onClick={() => setIsExpanded(true)}
            className="
              group flex items-center gap-2 px-5 py-3
              bg-primary text-white font-bold text-sm
              rounded-full shadow-lg
              hover:scale-105 hover:shadow-xl
              active:scale-95
              transition-all duration-200
            "
            title="Tính nhanh số nhân viên cần thiết (Ctrl+K)"
          >
            <Zap size={18} className="group-hover:animate-pulse" />
            <span>{fabLabel}</span>
          </button>

          {/* Keyboard hint (desktop only) */}
          <div className="hidden md:block absolute -top-8 right-0 text-xs text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ctrl+K
          </div>
        </div>
      )}

      {/* ═══════════ MOBILE: Full-screen bottom sheet ═══════════ */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />

          {/* Mobile panel */}
          <div
            ref={panelRef}
            className="
              fixed inset-x-0 bottom-0 top-[5vh] z-50
              bg-white rounded-t-2xl shadow-2xl
              flex flex-col
              md:hidden
              animate-in slide-in-from-bottom duration-300
            "
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Zap size={18} className="text-primary" />
                Tính nhanh định biên
              </h2>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <QuickEstimateTab
                onApplyToStaffing={handleApply}
                onAnalyzeDetail={handleAnalyze}
              />
            </div>
          </div>
        </>
      )}

      {/* ═══════════ DESKTOP: Popup card ═══════════ */}
      {isExpanded && (
        <div
          ref={panelRef}
          className="
            hidden md:flex md:flex-col
            fixed bottom-6 right-6 z-50
            w-[480px] max-h-[80vh]
            bg-white rounded-2xl shadow-2xl border border-gray-200
            animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
            origin-bottom-right
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              Tính nhanh định biên
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">Esc để đóng</span>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <QuickEstimateTab
              onApplyToStaffing={handleApply}
              onAnalyzeDetail={handleAnalyze}
            />
          </div>
        </div>
      )}
    </>
  )
}
