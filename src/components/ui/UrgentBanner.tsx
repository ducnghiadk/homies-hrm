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
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    icon: 'text-red-600',
    text: 'text-red-800',
    action: 'text-red-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    icon: 'text-amber-600',
    text: 'text-amber-800',
    action: 'text-amber-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    icon: 'text-blue-600',
    text: 'text-blue-800',
    action: 'text-blue-600',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
    icon: 'text-green-600',
    text: 'text-green-800',
    action: 'text-green-600',
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
