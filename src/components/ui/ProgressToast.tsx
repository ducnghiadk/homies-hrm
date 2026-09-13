'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ProgressToastProps {
  message: string
  progress: number
  status: 'loading' | 'success' | 'error'
  onCancel?: () => void
  onClose?: () => void
  autoClose?: number
}

export default function ProgressToast({
  message,
  progress,
  status,
  onCancel,
  onClose,
  autoClose = 3000,
}: ProgressToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, autoClose)
      return () => clearTimeout(timer)
    }
  }, [status, autoClose, onClose])

  if (!visible) return null

  const icon = {
    loading: <Loader2 size={16} className="animate-spin text-primary" />,
    success: <CheckCircle size={16} className="text-success-500" />,
    error: <AlertCircle size={16} className="text-error-500" />,
  }[status]

  const barColor = {
    loading: 'bg-primary',
    success: 'bg-success-500',
    error: 'bg-error-500',
  }[status]

  return (
    <div
      className="
        fixed bottom-24 right-4 z-50 w-80
        bg-white rounded-xl shadow-xl border border-gray-200
        animate-in slide-in-from-right-5 duration-300
        overflow-hidden
      "
      role="alert"
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            {icon}
            {message}
          </div>
          <button
            onClick={() => { setVisible(false); onClose?.() }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Đóng"
          >
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-primary-50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
          {status === 'loading' && onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-gray-500 hover:text-error-500 font-medium"
            >
              Hủy
            </button>
          )}
          {status === 'success' && (
            <span className="text-xs text-success-500 font-medium">✓ Hoàn thành</span>
          )}
        </div>
      </div>
    </div>
  )
}
