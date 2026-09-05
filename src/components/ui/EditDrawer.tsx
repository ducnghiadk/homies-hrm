'use client'

import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { X } from 'lucide-react'

type DrawerSize = 'sm' | 'md' | 'lg'

interface EditDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onSave?: () => void
  isSaving?: boolean
  size?: DrawerSize
  showFooter?: boolean
  footerContent?: React.ReactNode
  preventClose?: boolean
}

const sizeMap: Record<DrawerSize, string> = {
  sm: 'max-w-[320px]',
  md: 'max-w-[420px]',
  lg: 'max-w-[560px]',
}

export default function EditDrawer({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  isSaving = false,
  size = 'md',
  showFooter = true,
  footerContent,
  preventClose = false,
}: EditDrawerProps) {
  const [showDirtyWarning, setShowDirtyWarning] = useState(false)
  const [isMounted, setIsMounted] = useState(isOpen)
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  // Track mount for animation
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus the drawer after animation
      const timer = setTimeout(() => {
        drawerRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      // Return focus on close
      const timer = setTimeout(() => {
        setIsMounted(false)
        previousFocusRef.current?.focus()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  const attemptClose = useCallback(() => {
    if (preventClose) {
      setShowDirtyWarning(true)
    } else {
      onClose()
    }
  }, [preventClose, onClose])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        attemptClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, attemptClose])

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !drawerRef.current) return

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleTabKey)
    return () => window.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  if (!isMounted && !isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-50 bg-black/30 backdrop-blur-sm
          transition-opacity duration-300 motion-reduce:transition-none
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={attemptClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`
          fixed z-50 bg-white shadow-2xl flex flex-col outline-none
          transition-transform duration-300 ease-out motion-reduce:transition-none

          /* Mobile: bottom sheet */
          inset-x-0 bottom-0 top-[10vh] rounded-t-2xl
          /* Desktop: right drawer */
          md:inset-y-0 md:right-0 md:left-auto md:top-0 md:rounded-t-none md:rounded-l-2xl
          md:w-full ${sizeMap[size]}

          ${isOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={attemptClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-primary-50 rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="shrink-0 border-t border-gray-200 px-6 py-4 bg-vanilla-50">
            {footerContent || (
              <div className="flex gap-3 justify-end">
                <button
                  onClick={attemptClose}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-primary-50 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                {onSave && (
                  <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-xl shadow-md hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang lưu...
                      </span>
                    ) : (
                      'Lưu'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dirty warning dialog */}
      {showDirtyWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-gray-900 mb-2">Bạn có thay đổi chưa lưu</h3>
            <p className="text-sm text-gray-500 mb-5">
              Thay đổi sẽ bị mất nếu bạn đóng mà không lưu.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDirtyWarning(false)
                  onClose()
                }}
                className="px-4 py-2 text-sm font-medium text-error-600 hover:bg-error-50 rounded-xl transition-colors"
              >
                Hủy thay đổi
              </button>
              <button
                onClick={() => setShowDirtyWarning(false)}
                className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-xl shadow hover:bg-primary/90 transition-all"
              >
                Tiếp tục sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
