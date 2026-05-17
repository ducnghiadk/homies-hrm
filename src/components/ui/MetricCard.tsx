'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type MetricVariant = 'default' | 'highlight' | 'success' | 'warning' | 'compact'

interface MetricTrend {
  direction: 'up' | 'down' | 'neutral'
  value: string // "+15%", "-2tr"
}

interface MetricCardProps {
  icon: React.ReactNode
  value: string
  label: string
  sublabel?: string
  variant?: MetricVariant
  trend?: MetricTrend
  onClick?: () => void
}

const variantStyles: Record<MetricVariant, { container: string; value: string }> = {
  default: {
    container: 'bg-white border border-gray-200',
    value: 'text-gray-900',
  },
  highlight: {
    container: 'bg-primary/5 border border-primary/20',
    value: 'text-primary',
  },
  success: {
    container: 'bg-green-50 border border-green-200',
    value: 'text-green-700',
  },
  warning: {
    container: 'bg-yellow-50 border border-yellow-200',
    value: 'text-yellow-700',
  },
  compact: {
    container: 'bg-white border border-gray-200',
    value: 'text-gray-900',
  },
}

const TrendIcon = ({ direction }: { direction: MetricTrend['direction'] }) => {
  switch (direction) {
    case 'up':
      return <TrendingUp size={12} className="text-green-500" />
    case 'down':
      return <TrendingDown size={12} className="text-red-500" />
    default:
      return <Minus size={12} className="text-gray-400" />
  }
}

export default function MetricCard({
  icon,
  value,
  label,
  sublabel,
  variant = 'default',
  trend,
  onClick,
}: MetricCardProps) {
  const styles = variantStyles[variant]
  const isCompact = variant === 'compact'

  return (
    <div
      className={`
        rounded-xl transition-all duration-200
        ${styles.container}
        ${isCompact ? 'p-3' : 'p-4'}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/30' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {/* Icon */}
      <div className={`${isCompact ? 'text-lg mb-1' : 'text-2xl mb-2'}`}>{icon}</div>

      {/* Value */}
      <div
        className={`
        font-bold ${styles.value}
        ${isCompact ? 'text-lg' : 'text-2xl'}
      `}
      >
        {value}
      </div>

      {/* Label */}
      <div
        className={`
        font-medium text-gray-500 uppercase tracking-wide
        ${isCompact ? 'text-xs' : 'text-sm'}
      `}
      >
        {label}
      </div>

      {/* Sublabel */}
      {sublabel && (
        <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>
      )}

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1 mt-1.5">
          <TrendIcon direction={trend.direction} />
          <span
            className={`text-xs font-medium ${
              trend.direction === 'up'
                ? 'text-green-600'
                : trend.direction === 'down'
                  ? 'text-red-600'
                  : 'text-gray-500'
            }`}
          >
            {trend.value}
          </span>
        </div>
      )}
    </div>
  )
}
