'use client'

import { LucideIcon } from 'lucide-react'

interface QuickAction {
  icon: LucideIcon
  label: string
  onClick: () => void
  bgColor?: string
  iconColor?: string
  disabled?: boolean
}

interface QuickActionGridProps {
  actions: QuickAction[]
  columns?: 3 | 4 | 5
  size?: 'sm' | 'md'
  className?: string
}

export function QuickActionGrid({
  actions,
  columns = 4,
  size = 'md',
  className = '',
}: QuickActionGridProps) {
  const columnClasses = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  }

  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'w-9 h-9',
      iconSize: 18,
      text: 'text-[10px] mt-1',
    },
    md: {
      container: 'p-3',
      icon: 'w-11 h-11',
      iconSize: 22,
      text: 'text-xs mt-2',
    },
  }

  const styles = sizeClasses[size]

  return (
    <div className={`grid gap-2 ${columnClasses[columns]} ${className}`}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`
            flex flex-col items-center justify-center
            ${styles.container} rounded-xl
            bg-gray-50 hover:bg-gray-100
            active:scale-95
            transition-all duration-150
            ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label={action.label}
        >
          <div
            className={`
              ${styles.icon} rounded-full
              flex items-center justify-center
              ${action.bgColor || 'bg-blue-100'}
            `}
          >
            <action.icon
              size={styles.iconSize}
              className={action.iconColor || 'text-blue-600'}
            />
          </div>
          <span
            className={`${styles.text} font-medium text-gray-700 text-center leading-tight`}
          >
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}
