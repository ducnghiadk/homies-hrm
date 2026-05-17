'use client'

import TrendIndicator from '@/components/kpi/TrendIndicator'
import { getInitials } from '@/lib/utils'

interface EmployeeMiniCardProps {
  name: string
  score: number
  subtitle?: string
  trend?: number
  avatar?: string
  highlight?: 'good' | 'warning' | 'danger'
  rank?: number
  onClick?: () => void
}

export default function EmployeeMiniCard({
  name, score, subtitle, trend, avatar, highlight, rank, onClick,
}: EmployeeMiniCardProps) {
  const bgMap = { good: '#dcfce7', warning: '#fef9c3', danger: '#fef2f2' }
  const colorMap = { good: '#166534', warning: '#854d0e', danger: '#991b1b' }

  return (
    <div
      className="card p-3 flex items-center gap-2.5 transition-all active:scale-[0.98]"
      style={{
        background: highlight ? bgMap[highlight] : undefined,
        cursor: onClick ? 'pointer' : undefined,
      }}
      onClick={onClick}
    >
      {rank !== undefined && (
        <span className="text-sm font-black w-6 text-center" style={{
          color: rank === 1 ? '#eab308' : rank === 2 ? '#9ca3af' : rank === 3 ? '#cd7f32' : 'var(--text-muted)',
        }}>{rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}</span>
      )}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ background: highlight ? colorMap[highlight] : 'var(--primary)' }}>
        {avatar || getInitials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold truncate">{name}</div>
        {subtitle && <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</div>}
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-black" style={{
          color: score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444',
        }}>{score}</div>
        {trend !== undefined && <TrendIndicator value={trend} size="sm" />}
      </div>
    </div>
  )
}
