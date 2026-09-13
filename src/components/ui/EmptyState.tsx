import {
  LucideIcon,
  Inbox,
  Search,
  AlertTriangle,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import { ReactNode } from 'react'

type EmptyStateVariant =
  | 'no-data'
  | 'no-results'
  | 'error'
  | 'success'
  | 'first-time'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  icon?: LucideIcon
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  children?: ReactNode
}

const variantDefaults: Record<
  EmptyStateVariant,
  {
    icon: LucideIcon
    title: string
    description: string
    iconColor: string
    iconBg: string
  }
> = {
  'no-data': {
    icon: Inbox,
    title: 'Chưa có dữ liệu',
    description: 'Bắt đầu bằng cách tạo mục đầu tiên',
    iconColor: 'text-gray-400',
    iconBg: 'bg-primary-50',
  },
  'no-results': {
    icon: Search,
    title: 'Không tìm thấy kết quả',
    description: 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm',
    iconColor: 'text-gray-400',
    iconBg: 'bg-primary-50',
  },
  error: {
    icon: AlertTriangle,
    title: 'Đã xảy ra lỗi',
    description: 'Vui lòng thử lại sau',
    iconColor: 'text-warning-500',
    iconBg: 'bg-warning-50',
  },
  success: {
    icon: CheckCircle,
    title: 'Hoàn tất!',
    description: 'Mọi thứ đã được xử lý',
    iconColor: 'text-success-500',
    iconBg: 'bg-success-50',
  },
  'first-time': {
    icon: Sparkles,
    title: 'Chào mừng!',
    description: 'Hãy bắt đầu hành trình của bạn',
    iconColor: 'text-primary-500',
    iconBg: 'bg-primary-50',
  },
}

export function EmptyState({
  variant = 'no-data',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  children,
}: EmptyStateProps) {
  const defaults = variantDefaults[variant]
  const IconComponent = icon || defaults.icon
  const displayTitle = title || defaults.title
  const displayDescription = description || defaults.description

  return (
    <div
      className={`
        flex flex-col items-center justify-center
        py-12 px-6 text-center
        ${className}
      `}
    >
      <div
        className={`
          w-16 h-16 rounded-full
          flex items-center justify-center
          ${defaults.iconBg}
          mb-4
        `}
      >
        <IconComponent size={32} className={defaults.iconColor} />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {displayTitle}
      </h3>

      <p className="text-sm text-gray-500 max-w-xs mb-6">
        {displayDescription}
      </p>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="
                px-4 py-2
                text-gray-700
                rounded-lg font-medium text-sm
                hover:bg-primary-50
                active:scale-[0.98]
                transition-all duration-150
              "
            >
              {secondaryAction.label}
            </button>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm
                active:scale-[0.98] transition-all duration-150
                ${
                  action.variant === 'secondary'
                    ? 'bg-primary-50 text-gray-700 hover:bg-gray-200'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }
              `}
            >
              {action.label}
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  )
}
