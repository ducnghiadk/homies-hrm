'use client'

import { LucideIcon, ChevronRight } from 'lucide-react'

interface UrgentBannerProps {
  icon: LucideIcon
  count: number
  message: string
  actionLabel?: string
  onClick: () => void
  variant?: 'error' | 'warning' | 'info' | 'success'
  className?: string
}

const variantStyles = {
  error: {
    bg: 'bg-error-50',
    border: 'border-error-200',
    iconBg: 'bg-error-100',
    icon: 'text-error-600',
    text: 'text-error-800',
    action: 'text-error-600',
  },
  warning: {
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    iconBg: 'bg-warning-100',
    icon: 'text-warning-600',
    text: 'text-warning-800',
    action: 'text-warning-600',
  },
  info: {
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    iconBg: 'bg-primary-100',
    icon: 'text-primary-600',
    text: 'text-primary-800',
    action: 'text-primary-600',
  },
  success: {
    bg: 'bg-success-50',
    border: 'border-success-200',
    iconBg: 'bg-success-100',
    icon: 'text-success-600',
    text: 'text-success-800',
    action: 'text-success-600',
  },
}

export function UrgentBanner({
  icon: Icon,
  count,
  message,
  actionLabel = 'Xem',
  onClick,
  variant = 'error',
  className = '',
}: UrgentBannerProps) {
  const styles = variantStyles[variant]

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl border
        flex items-center justify-between gap-3
        active:scale-[0.99]
        transition-all duration-150
        ${styles.bg} ${styles.border}
        ${className}
      `}
      aria-label={`${count} ${message}, nhấn để xem`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`
          w-10 h-10 rounded-full flex-shrink-0
          flex items-center justify-center
          ${styles.iconBg}
        `}
        >
          <Icon size={20} className={styles.icon} />
        </div>
        <span className={`font-medium truncate ${styles.text}`}>
          <span className="font-bold">{count}</span> {message}
        </span>
      </div>
      <div
        className={`flex items-center gap-1 flex-shrink-0 ${styles.action}`}
      >
        <span className="text-sm font-medium">{actionLabel}</span>
        <ChevronRight size={18} />
      </div>
    </button>
  )
}
