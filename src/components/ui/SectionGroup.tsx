import { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface SectionGroupProps {
  title: string
  icon?: LucideIcon
  iconClassName?: string
  rightAction?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionGroup({
  title,
  icon: Icon,
  iconClassName = 'text-gray-400',
  rightAction,
  children,
  className = '',
}: SectionGroupProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={14} className={iconClassName} />}
          <h2 className="section-header text-gray-500">
            {title}
          </h2>
        </div>
        {rightAction}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
