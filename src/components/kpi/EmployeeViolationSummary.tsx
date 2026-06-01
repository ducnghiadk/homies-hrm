'use client'

import type { ViolationSummary } from '@/lib/kpi-types'

interface Props {
  summary: ViolationSummary
}

export default function EmployeeViolationSummary({ summary }: Props) {
  const scoreColor = summary.violation_score >= 80 ? '#1E9E57'
    : summary.violation_score >= 60 ? '#F6C85F' : '#D9381E'
  const pct = summary.violation_score

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Điểm lỗi tháng</span>
        <span className="text-lg font-black" style={{ color: scoreColor }}>{summary.violation_score}/100</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: scoreColor }} />
      </div>

      {/* Stats */}
      <div className="flex gap-2 text-center">
        {[
          { label: 'Tổng lỗi', value: summary.total_violations, color: 'var(--text-primary)' },
          { label: 'Điểm trừ', value: summary.total_penalty_points, color: '#D9381E' },
          { label: 'Đang KN', value: summary.pending_appeals, color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} className="flex-1 py-1.5 rounded-lg" style={{ background: 'var(--gray-50)' }}>
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Severity breakdown */}
      <div className="flex gap-1">
        {[
          { key: 'minor', label: 'Nhẹ', color: '#2F6FA8' },
          { key: 'medium', label: 'TB', color: '#F6C85F' },
          { key: 'major', label: 'Nặng', color: '#f97316' },
          { key: 'critical', label: 'N.Trọng', color: '#D9381E' },
        ].map(s => (
          <div key={s.key} className="flex-1 text-center py-1 rounded-lg text-[10px] font-semibold"
            style={{ background: `${s.color}10`, color: s.color }}>
            {summary.by_severity[s.key as keyof typeof summary.by_severity]} {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}
