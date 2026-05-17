'use client'

import type { CategoryScore, KPIGradeCode } from '@/lib/kpi-types'
import { mockKPIGrades } from '@/lib/mock-data-kpi'

interface Props {
  categoryScores: CategoryScore[]
  violationScore: number
  totalScore: number
  gradeCode: KPIGradeCode
}

export default function EvaluationScorePreview({
  categoryScores, violationScore, totalScore, gradeCode,
}: Props) {
  const grade = mockKPIGrades.find(g => g.code === gradeCode)

  return (
    <div className="card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>📊 Điểm dự kiến</span>
        <div className="flex-1" />
        <div className="text-2xl font-black" style={{ color: grade?.color || '#6b7280' }}>
          {totalScore}
        </div>
        {grade && (
          <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
            style={{ background: grade.color }}>
            {grade.name}
          </span>
        )}
      </div>

      {/* Category breakdown bars */}
      <div className="space-y-1.5">
        {categoryScores.map(cat => (
          <div key={cat.category_id} className="flex items-center gap-2">
            <span className="text-[10px] w-16 text-right truncate font-semibold"
              style={{ color: 'var(--text-secondary)' }}>
              {cat.category_name}
            </span>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{
                width: `${Math.min(cat.raw_score, 100)}%`,
                background: cat.raw_score >= 80 ? '#10b981' : cat.raw_score >= 60 ? '#f59e0b' : '#ef4444',
              }} />
            </div>
            <span className="text-[10px] font-bold w-6 text-right">{cat.weighted_score}</span>
          </div>
        ))}

        {/* Violation deduction */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-16 text-right truncate font-semibold"
            style={{ color: '#ef4444' }}>
            Vi phạm
          </span>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#fee2e2' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{
              width: `${violationScore}%`, background: '#ef4444',
            }} />
          </div>
          <span className="text-[10px] font-bold w-6 text-right">{violationScore}</span>
        </div>
      </div>

      <div className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
        Điểm tự động cập nhật khi bạn nhập
      </div>
    </div>
  )
}
