import React from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent' | 'primary'
  children?: React.ReactNode
  count?: number
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({
  variant = 'neutral',
  children,
  count,
  size = 'md',
  className = '',
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-success-light text-success',
    warning: 'bg-vanilla-100 text-dark-600',
    error: 'bg-error-light text-error',
    info: 'bg-primary-100 text-primary-700',
    neutral: 'bg-gray-100 text-gray-600',
    accent: 'bg-accent-100 text-accent-600',
    primary: 'bg-primary-100 text-primary-700',
  }

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 min-w-[18px] h-[18px]',
    md: 'text-xs px-2.5 py-1 min-w-[20px]',
  }

  const displayValue =
    count !== undefined ? (count > 9 ? '9+' : count.toString()) : children

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold ${variants[variant]} ${sizeStyles[size]} ${className}`}
    >
      {displayValue}
    </span>
  )
}

