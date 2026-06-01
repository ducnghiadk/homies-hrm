'use client'

import { useState } from 'react'
import { X, AlertTriangle, CheckCircle, Trash2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data?: { reason?: string }) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'warning' | 'success'
  showReasonInput?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  reasonRequired?: boolean
  isLoading?: boolean
  initialReason?: string
}

const VARIANT_CONFIG = {
  default: {
    icon: Info,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    confirmBg: 'bg-primary-500 hover:bg-primary-600',
  },
  danger: {
    icon: Trash2,
    iconBg: 'bg-error-100',
    iconColor: 'text-error-600',
    confirmBg: 'bg-error-500 hover:bg-error-600',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning-100',
    iconColor: 'text-warning-600',
    confirmBg: 'bg-warning-500 hover:bg-warning-600',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    confirmBg: 'bg-success-500 hover:bg-success-600',
  },
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'default',
  showReasonInput = false,
  reasonLabel = 'Lý do',
  reasonPlaceholder = 'Nhập lý do...',
  reasonRequired = false,
  isLoading = false,
  initialReason = '',
}: ConfirmDialogProps) {
  const [reason, setReason] = useState(initialReason)
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  if (!isOpen) return null

  const handleConfirm = () => {
    if (showReasonInput && reasonRequired && !reason.trim()) return
    onConfirm(showReasonInput ? { reason: reason.trim() } : undefined)
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-[var(--shadow-float)] w-full max-w-sm animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center
              hover:bg-gray-200 transition-colors z-10"
          >
            <X size={14} className="text-gray-500" />
          </button>

          {/* Header */}
          <div className="p-5 text-center">
            <div className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4',
              config.iconBg,
            )}>
              <Icon className={cn('w-7 h-7', config.iconColor)} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>
            )}
          </div>

          {/* Reason input */}
          {showReasonInput && (
            <div className="px-5 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {reasonLabel}
                {reasonRequired && <span className="text-error-500 ml-1">*</span>}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200
                  focus:border-primary-400 resize-none transition-all"
                autoFocus
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t border-gray-100">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold
                bg-gray-100 text-gray-700 hover:bg-gray-200
                transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || (showReasonInput && reasonRequired && !reason.trim())}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white',
                'transition-all disabled:opacity-50 active:scale-[0.98]',
                config.confirmBg,
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
