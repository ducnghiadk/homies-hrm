'use client'

import { mockKPIGrades } from '@/lib/mock-data-kpi'
import type { KPIGradeCode } from '@/lib/kpi-types'

interface GradeBadgeProps {
  gradeCode: KPIGradeCode
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export default function GradeBadge({ gradeCode, size = 'sm', showIcon = true }: GradeBadgeProps) {
  const grade = mockKPIGrades.find(g => g.code === gradeCode)
  if (!grade) return null

  const px = size === 'sm' ? 'px-1.5 py-0.5' : size === 'md' ? 'px-2 py-1' : 'px-3 py-1.5'
  const text = size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'

  return (
    <span className={`inline-flex items-center gap-1 ${px} ${text} rounded-full font-bold text-white`}
      style={{ background: grade.color }}>
      {showIcon && <span>{grade.icon}</span>}
      {grade.name}
    </span>
  )
}
