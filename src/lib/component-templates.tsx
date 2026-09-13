// Component Templates - Pre-built UI components
// UX/UI Pack #9: Button, Card, Input, Badge templates

import React, { useId } from 'react'
import { cn } from '@/lib/utils'

// ─── BUTTON ───
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', isLoading = false, children, className = '', disabled, ...props }: ButtonProps) {
  const variants = { primary: 'bg-primary-500 text-white hover:bg-primary-600', secondary: 'bg-secondary-500 text-white hover:bg-secondary-600', outline: 'border-2 border-gray-300 bg-transparent hover:bg-vanilla-50', ghost: 'bg-transparent hover:bg-primary-50', destructive: 'bg-error-500 text-white hover:bg-error-600' }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-base', lg: 'px-6 py-3 text-lg' }
  return (
    <button className={cn('inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50', variants[variant], sizes[size], className)} disabled={disabled || isLoading} {...props}>
      {isLoading ? <span className="animate-spin mr-2">&#9696;</span> : null}
      {children}
    </button>
  )
}

// ─── CARD ───
interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

export function Card({ children, variant = 'default', padding = 'md', className = '', onClick }: CardProps) {
  const variants = { default: 'bg-white border border-gray-200 shadow-sm', elevated: 'bg-white shadow-lg', outlined: 'bg-transparent border-2 border-gray-200' }
  const paddings = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }
  return <div className={cn('rounded-xl', variants[variant], paddings[padding], onClick && 'cursor-pointer hover:shadow-md', className)} onClick={onClick}>{children}</div>
}

// ─── INPUT ───
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Input({ label, error, size = 'md', className = '', id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id || generatedId
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-base', lg: 'px-5 py-3 text-lg' }
  return (
    <div className="space-y-1">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>}
      <input id={inputId} className={cn('w-full rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500', sizes[size], error ? 'border-error-500' : 'border-gray-300', className)} {...props} />
      {error && <p className="text-sm text-error-500">{error}</p>}
    </div>
  )
}

// ─── BADGE ───
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  const variants = { default: 'bg-primary-50 text-gray-700', success: 'bg-success-100 text-success-700', warning: 'bg-warning-100 text-warning-700', error: 'bg-error-100 text-error-700', info: 'bg-primary-100 text-primary-700' }
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-sm' }
  return <span className={cn('inline-flex items-center rounded-full border font-medium', variants[variant], sizes[size], className)}>{children}</span>
}

// ─── SKELETON ───
interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  className?: string
}

export function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
  const variantClass = variant === 'text' ? 'h-4 rounded' : variant === 'circular' ? 'rounded-full' : 'rounded-lg'
  return <div className={cn('bg-gray-200 animate-pulse', variantClass, className)} style={{ width: width || '100%', height: height || (variant === 'text' ? '1rem' : '3rem') }} />
}

// ─── ALERT ───
interface AlertProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  className?: string
}

export function Alert({ children, variant = 'info', title, className = '' }: AlertProps) {
  const variants = { success: 'bg-success-50 border-success-200 text-success-800', warning: 'bg-warning-50 border-warning-200 text-warning-800', error: 'bg-error-50 border-error-200 text-error-800', info: 'bg-primary-50 border-primary-200 text-primary-800' }
  return (
    <div className={cn('p-4 rounded-xl border', variants[variant], className)}>
      <div className="flex items-start gap-3">
        <span>{variant === 'success' ? '&#10003;' : variant === 'error' ? '&#10007;' : variant === 'warning' ? '&#9888;' : '&#8505;'}</span>
        <div>
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}

const componentTemplateExports = { Button, Card, Input, Badge, Skeleton, Alert }

export default componentTemplateExports
