import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  feature?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', feature = false, onClick }: CardProps) {
  // So Matcha: Rounded-2xl (16px+), varying shadows, border-accent-50
  const baseStyles = 'transition-all duration-300'
  
  // Feature Card: Primary Gradient (Blue)
  const featureStyles = 'bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-lg border-none p-6 rounded-[24px]'
  
  // Standard Card: White, Subtle Green Border
  const defaultStyles = 'bg-white border border-accent-100 shadow-md p-5 rounded-[18px] hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-200'
  
  return (
    <div 
      className={`${baseStyles} ${feature ? featureStyles : defaultStyles} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
