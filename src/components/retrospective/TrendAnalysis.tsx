'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { TrendData } from '@/lib/analytics/retrospective-calculator'

interface TrendAnalysisProps {
  data: TrendData
  metric: 'hours' | 'cost' | 'efficiency'
  label: string
}

function formatMetric(val: number, metric: string): string {
  if (metric === 'cost') {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}tr`
    return `${(val / 1_000).toFixed(0)}k`
  }
  if (metric === 'hours') return `${val.toFixed(0)}h`
  return `${val.toFixed(0)}%`
}

export default function TrendAnalysis({
  data,
  metric,
  label,
}: TrendAnalysisProps) {
  if (data.weeks.length === 0) return null

  const maxVal = Math.max(...data.weeks.map(w => w.value), 1)
  const minVal = Math.min(...data.weeks.map(w => w.value), 0)
  const range = maxVal - minVal || 1

  // Direction icon
  const DirIcon = data.direction === 'up' ? TrendingUp
    : data.direction === 'down' ? TrendingDown
    : Minus

  const dirColor = (() => {
    // For cost: down is good. For efficiency: up is good
    if (metric === 'cost') return data.direction === 'down' ? 'text-success-500' : data.direction === 'up' ? 'text-error-500' : 'text-gray-400'
    return data.direction === 'up' ? 'text-success-500' : data.direction === 'down' ? 'text-error-500' : 'text-gray-400'
  })()

  // SVG line chart points
  const chartWidth = 200
  const chartHeight = 60
  const points = data.weeks.map((w, i) => {
    const x = (i / Math.max(data.weeks.length - 1, 1)) * chartWidth
    const y = chartHeight - ((w.value - minVal) / range) * (chartHeight - 10) - 5
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800">{label}</h3>
        <div className={`flex items-center gap-1 text-xs font-medium ${dirColor}`}>
          <DirIcon size={14} />
          {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(0)}%
        </div>
      </div>

      {/* Line chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-16"
          preserveAspectRatio="none"
        >
          {/* Area fill */}
          <polygon
            points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
            fill="url(#trendGradient)"
            opacity="0.3"
          />
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="var(--color-primary, #6366f1)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dots */}
          {data.weeks.map((w, i) => {
            const x = (i / Math.max(data.weeks.length - 1, 1)) * chartWidth
            const y = chartHeight - ((w.value - minVal) / range) * (chartHeight - 10) - 5
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill="white"
                stroke="var(--color-primary, #6366f1)"
                strokeWidth="2"
              />
            )
          })}
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Week labels */}
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        {data.weeks.map((w, i) => (
          <span key={i}>{w.weekStart.slice(8, 10)}/{w.weekStart.slice(5, 7)}</span>
        ))}
      </div>

      {/* Latest value */}
      <div className="text-right mt-2">
        <span className="text-lg font-bold text-gray-800">
          {formatMetric(data.weeks[data.weeks.length - 1]?.value || 0, metric)}
        </span>
      </div>
    </div>
  )
}
