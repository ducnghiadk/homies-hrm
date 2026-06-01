import React from 'react'
import { cn } from '@/lib/utils'
import { Card } from './Card'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: string
  trendDown?: boolean
  iconColor?: string
  iconBg?: string
  onClick?: () => void
  className?: string
  valueClassName?: string
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendDown,
  iconColor = 'text-primary-600',
  iconBg = 'bg-primary-100',
  onClick,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'p-4 flex flex-col justify-between h-full min-h-[140px] border-accent-100',
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98] transition-all',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={cn('w-12 h-12 rounded-[14px] flex items-center justify-center', iconBg, iconColor)}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={cn('flex items-center text-xs font-bold', trendDown ? 'text-error' : 'text-success')}>
             {trendDown ? '↓' : '↑'} {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
        <p className={cn('text-2xl stat-value font-numeric text-dark-700', valueClassName)}>{value}</p>
      </div>
    </Card>
  )
}
