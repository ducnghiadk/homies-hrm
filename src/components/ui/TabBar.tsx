'use client'

import { ReactNode, useRef, useEffect, useState } from 'react'

interface Tab {
  key: string
  label: string
  icon?: ReactNode
  badge?: number
  disabled?: boolean
}

interface TabBarProps {
  tabs: Tab[]
  activeTab: string
  onChange: (key: string) => void
  variant?: 'underline' | 'pill'
  size?: 'sm' | 'md'
  fullWidth?: boolean
  className?: string
}

export function TabBar({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className = '',
}: TabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3 text-sm',
  }

  useEffect(() => {
    if (variant !== 'underline') return

    const container = containerRef.current
    if (!container) return

    const activeElement = container.querySelector(
      `[data-tab="${activeTab}"]`
    ) as HTMLElement
    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      })
    }
  }, [activeTab, variant, tabs])

  if (variant === 'pill') {
    return (
      <div
        className={`
          flex gap-1 p-1
          bg-gray-100 rounded-lg
          ${fullWidth ? 'w-full' : 'inline-flex'}
          ${className}
        `}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && onChange(tab.key)}
            disabled={tab.disabled}
            className={`
              flex items-center justify-center gap-2
              ${sizeClasses[size]} rounded-md
              font-medium whitespace-nowrap
              transition-all duration-150
              ${fullWidth ? 'flex-1' : ''}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  // Underline variant (default)
  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            data-tab={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.key)}
            className={`
              flex items-center justify-center gap-2
              ${sizeClasses[size]}
              font-medium whitespace-nowrap
              transition-colors duration-150
              ${fullWidth ? 'flex-1' : ''}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${
                activeTab === tab.key
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Underline indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200">
        <div
          className="absolute h-0.5 bg-blue-600 transition-all duration-200 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>
    </div>
  )
}
