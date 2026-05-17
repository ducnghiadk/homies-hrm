'use client'

import type { EvaluationScore } from '@/lib/kpi-types'

interface Props {
  criteriaId: string
  criteriaName: string
  selfScore?: number
  managerScore?: number
  maxValue: number
}

export default function ScoreComparison({
  criteriaName, selfScore, managerScore, maxValue,
}: Props) {
  const selfPct = selfScore !== undefined ? Math.round((selfScore / maxValue) * 100) : 0
  const mgrPct = managerScore !== undefined ? Math.round((managerScore / maxValue) * 100) : 0
  const diff = (managerScore ?? 0) - (selfScore ?? 0)

  return (
    <div className="py-1.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-semibold flex-1 truncate">{criteriaName}</span>
        {diff !== 0 && selfScore !== undefined && managerScore !== undefined && (
          <span className="text-[10px] font-bold" style={{
            color: diff > 0 ? '#10b981' : '#ef4444',
          }}>
            {diff > 0 ? '↑' : '↓'}{Math.abs(diff)}
          </span>
        )}
      </div>
      <div className="flex gap-1 items-center">
        {/* Self bar */}
        <div className="flex-1 relative">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#dbeafe' }}>
            <div className="h-full rounded-full" style={{
              width: `${selfPct}%`, background: '#3b82f6',
            }} />
          </div>
          <span className="text-[8px] font-bold absolute right-0 -top-3" style={{ color: '#3b82f6' }}>
            {selfScore ?? '–'}
          </span>
        </div>
        <div className="w-px h-4 mx-1" style={{ background: 'var(--gray-200)' }} />
        {/* Manager bar */}
        <div className="flex-1 relative">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#ede9fe' }}>
            <div className="h-full rounded-full" style={{
              width: `${mgrPct}%`, background: '#7c3aed',
            }} />
          </div>
          <span className="text-[8px] font-bold absolute right-0 -top-3" style={{ color: '#7c3aed' }}>
            {managerScore ?? '–'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function ScoreComparisonLegend() {
  return (
    <div className="flex gap-4 text-[10px]">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
        <span style={{ color: 'var(--text-muted)' }}>Tự đánh giá</span>
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full" style={{ background: '#7c3aed' }} />
        <span style={{ color: 'var(--text-muted)' }}>Manager</span>
      </span>
    </div>
  )
}
