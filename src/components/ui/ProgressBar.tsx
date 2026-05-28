interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  valueFormat?: (value: number, max: number) => string
  color?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  className?: string
}

const colorStyles = {
  default: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  valueFormat,
  color = 'default',
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const heightClass = size === 'sm' ? 'h-1' : 'h-2'

  const displayValue = valueFormat
    ? valueFormat(value, max)
    : `${value}/${max}`

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm text-gray-700">{label}</span>
          )}
          {showValue && (
            <span className="text-xs font-medium text-gray-600">
              {displayValue}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full ${heightClass} bg-gray-200 rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `${percentage.toFixed(0)}%`}
      >
        <div
          className={`
            ${heightClass} ${colorStyles[color]}
            rounded-full
            transition-all duration-300 ease-out
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
