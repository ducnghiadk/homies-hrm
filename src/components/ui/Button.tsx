import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  // Lean Inter font, rounded-xl (12px), smooth transitions
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl'
  
  const variants = {
    primary: 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-[var(--shadow-primary)] hover:brightness-105 hover:scale-[1.02]',
    secondary: 'bg-accent-400 text-dark-700 shadow-[var(--shadow-accent)] hover:bg-accent-500',
    outline: 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50',
    danger: 'bg-error-light text-error hover:bg-error-100',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
