'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  rightActions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  showBack = true,
  onBack,
  rightActions,
  className = '',
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <header
      className={`
        sticky top-0 z-40
        h-14 px-4
        bg-white border-b border-gray-100
        flex items-center justify-between
        ${className}
      `}
    >
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button
            onClick={handleBack}
            className="
              w-11 h-11 -ml-2
              flex items-center justify-center
              rounded-full
              hover:bg-primary-50
              active:scale-95
              transition-all duration-100
            "
            aria-label="Quay lại"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 tracking-tight truncate">
          {title}
        </h1>
      </div>

      {rightActions && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {rightActions}
        </div>
      )}
    </header>
  )
}
