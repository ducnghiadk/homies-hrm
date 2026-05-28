'use client'

import { LucideIcon, ChevronRight } from 'lucide-react'
import { ReactNode } from 'react'

interface ListItemProps {
  icon?: LucideIcon
  iconBgColor?: string
  iconColor?: string
  avatar?: string
  avatarFallback?: string
  title: string
  subtitle?: string
  meta?: ReactNode
  rightContent?: ReactNode
  showChevron?: boolean
  onClick?: () => void
  className?: string
}

export function ListItem({
  icon: Icon,
  iconBgColor = 'bg-gray-100',
  iconColor = 'text-gray-600',
  avatar,
  avatarFallback,
  title,
  subtitle,
  meta,
  rightContent,
  showChevron = true,
  onClick,
  className = '',
}: ListItemProps) {
  const isClickable = !!onClick
  const initials = avatarFallback || title.slice(0, 2).toUpperCase()

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={`
        w-full px-4 py-3
        flex items-center gap-3
        ${
          isClickable
            ? `
          cursor-pointer
          hover:bg-gray-50
          active:bg-gray-100
          transition-colors duration-100
        `
            : ''
        }
        ${className}
      `}
    >
      {/* Icon or Avatar */}
      {(Icon || avatar !== undefined) && (
        <div className="flex-shrink-0">
          {avatar !== undefined ? (
            avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={title}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="
                w-10 h-10 rounded-full
                flex items-center justify-center
                bg-primary-100 text-primary-600
                text-sm font-medium
              "
              >
                {initials}
              </div>
            )
          ) : Icon ? (
            <div
              className={`
              w-10 h-10 rounded-full
              flex items-center justify-center
              ${iconBgColor}
            `}
            >
              <Icon size={20} className={iconColor} />
            </div>
          ) : null}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 truncate mt-0.5">
            {subtitle}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {meta && <span className="text-xs text-gray-400">{meta}</span>}
        {rightContent}
        {showChevron && isClickable && (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </div>
    </div>
  )
}
