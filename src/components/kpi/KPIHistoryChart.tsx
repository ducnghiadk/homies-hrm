'use client'

import type { KPIEvaluation } from '@/lib/kpi-types'
import { mockKPIGrades } from '@/lib/mock-data-kpi'

interface Props {
  evaluations: KPIEvaluation[]
  currentPeriod?: string
}

export default function KPIHistoryChart({ evaluations, currentPeriod }: Props) {
  const sorted = [...evaluations]
    .filter(e => ['published', 'finalized'].includes(e.status))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-6) // last 6 months

  if (sorted.length === 0) {
    return (
      <div className="card p-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        📊 Chưa có dữ liệu lịch sử KPI
      </div>
    )
  }

  const maxScore = 100
  const chartHeight = 120
  const barWidth = 36

  return (
    <div className="card p-3">
      <h4 className="text-xs font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>
        📈 Lịch sử KPI ({sorted.length} tháng)
      </h4>

      {/* Chart */}
      <div className="flex items-end justify-center gap-2" style={{ height: chartHeight }}>
        {sorted.map(ev => {
          const grade = mockKPIGrades.find(g => g.code === ev.grade_code)
          const height = Math.max((ev.total_score / maxScore) * chartHeight, 8)
          const isCurrent = ev.period === currentPeriod

          return (
            <div key={ev.id} className="flex flex-col items-center gap-1" style={{ width: barWidth }}>
              {/* Score label */}
              <span className="text-[10px] font-black" style={{ color: grade?.color }}>
                {ev.total_score}
              </span>

              {/* Bar */}
              <div className="w-full rounded-t-lg transition-all duration-500 relative"
                style={{
                  height, background: grade?.color || '#6b7280',
                  opacity: isCurrent ? 1 : 0.7,
                  border: isCurrent ? '2px solid var(--text-primary)' : 'none',
                }}>
                {/* Grade emoji */}
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs">
                  {grade?.icon}
                </span>
              </div>

              {/* Period label */}
              <span className="text-[9px] font-semibold" style={{
                color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                T{ev.period.slice(5)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Trend line summary */}
      {sorted.length >= 2 && (() => {
        const first = sorted[0].total_score
        const last = sorted[sorted.length - 1].total_score
        const diff = last - first
        return (
          <div className="mt-3 pt-2 border-t text-center" style={{ borderColor: 'var(--gray-100)' }}>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Xu hướng: <span className="font-bold" style={{
                color: diff > 0 ? '#1E9E57' : diff < 0 ? '#D9381E' : '#6b7280',
              }}>
                {diff > 0 ? `↑ +${diff}` : diff < 0 ? `↓ ${diff}` : '→ ổn định'}
              </span>
            </span>
          </div>
        )
      })()}
    </div>
  )
}
