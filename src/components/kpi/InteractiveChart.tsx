'use client'

import { useState } from 'react'
import type { EmployeeKPITrend, StoreKPISummary } from '@/lib/kpi-report-service'
import GradeBadge from '@/components/kpi/GradeBadge'

// === TREND LINE CHART ===
interface TrendChartProps {
  trend: EmployeeKPITrend | null
  storeAvg?: { period: string; avg: number }[]
}

export function TrendChart({ trend, storeAvg }: TrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  if (!trend || !trend.months.length) return <div className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>

  const data = trend.months
  const maxScore = 100
  const w = 320
  const h = 150
  const px = 30 // left padding for labels
  const py = 20
  const chartW = w - px - 10
  const chartH = h - py - 20

  const points = data.map((d, i) => ({
    x: px + (chartW / Math.max(data.length - 1, 1)) * i,
    y: py + chartH - (d.score / maxScore) * chartH,
    ...d,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="card p-3 animate-fade-in">
      <h4 className="text-xs font-bold mb-2">📊 Xu hướng KPI</h4>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: w }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y2 = py + chartH - (v / maxScore) * chartH
          return (
            <g key={v}>
              <line x1={px} y1={y2} x2={w - 10} y2={y2} stroke="var(--gray-100)" strokeWidth={0.5} />
              <text x={px - 4} y={y2 + 3} textAnchor="end" fontSize={8} fill="var(--text-muted)">{v}</text>
            </g>
          )
        })}
        {/* Line */}
        <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: 'pointer' }}>
            <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 5 : 3.5}
              fill={p.score >= 85 ? '#10b981' : p.score >= 70 ? '#3b82f6' : '#ef4444'}
              stroke="white" strokeWidth={1.5} />
            {/* Month label */}
            <text x={p.x} y={h - 4} textAnchor="middle" fontSize={7} fill="var(--text-muted)">
              T{p.period.slice(5)}
            </text>
            {/* Hover tooltip */}
            {hoveredIdx === i && (
              <>
                <rect x={p.x - 20} y={p.y - 22} width={40} height={16} rx={4}
                  fill="var(--gray-900)" opacity={0.85} />
                <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize={8} fill="white" fontWeight="bold">
                  {p.score} điểm
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

// === CATEGORY RADAR / BAR CHART ===
interface CategoryBarChartProps {
  categories: StoreKPISummary['category_performance']
}

export function CategoryBarChart({ categories }: CategoryBarChartProps) {
  return (
    <div className="card p-3 animate-fade-in">
      <h4 className="text-xs font-bold mb-3">📈 Phân tích theo Category</h4>
      <div className="space-y-2.5">
        {categories.map(cat => (
          <div key={cat.category_id}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="font-semibold flex items-center gap-1">
                {cat.name}
                {cat.weakest_area && <span className="px-1 py-0.5 rounded text-[8px] font-black" style={{ background: '#fef2f2', color: '#dc2626' }}>Yếu nhất</span>}
              </span>
              <span className="font-bold" style={{
                color: cat.average >= 80 ? '#10b981' : cat.average >= 65 ? '#f59e0b' : '#ef4444',
              }}>{cat.average}
                <span className="ml-1 text-[8px]">
                  {cat.trend === 'up' ? '↑' : cat.trend === 'down' ? '↓' : '→'}
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'var(--gray-100)' }}>
              <div className="h-full rounded-full transition-all" style={{
                width: `${cat.average}%`,
                background: cat.average >= 80 ? '#10b981' : cat.average >= 65 ? '#f59e0b' : '#ef4444',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// === GRADE DISTRIBUTION ===
interface GradeDistributionProps {
  distribution: Record<string, number>
}

export function GradeDistribution({ distribution }: GradeDistributionProps) {
  const grades = [
    { code: 'excellent' as const, label: 'Xuất sắc', color: '#10b981' },
    { code: 'good' as const, label: 'Tốt', color: '#3b82f6' },
    { code: 'fair' as const, label: 'Khá', color: '#8b5cf6' },
    { code: 'average' as const, label: 'TB', color: '#f59e0b' },
    { code: 'poor' as const, label: 'Yếu', color: '#ef4444' },
  ]
  const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="card p-3 animate-fade-in">
      <h4 className="text-xs font-bold mb-3">📊 Phân bố xếp loại</h4>
      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden h-4 mb-3">
        {grades.map(g => {
          const count = distribution[g.code] || 0
          const pct = (count / total) * 100
          if (pct === 0) return null
          return (
            <div key={g.code} style={{ width: `${pct}%`, background: g.color }}
              className="flex items-center justify-center text-[7px] font-bold text-white">
              {pct >= 12 ? count : ''}
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {grades.map(g => {
          const count = distribution[g.code] || 0
          return (
            <div key={g.code} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
              <span className="text-[10px]">{g.label}: <b>{count}</b></span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
