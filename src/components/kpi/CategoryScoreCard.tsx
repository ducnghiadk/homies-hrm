'use client'

import type { CategoryScore } from '@/lib/kpi-types'

interface Props {
  category: CategoryScore
  expanded?: boolean
  onToggle?: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  'cat-a1': '#3b82f6', 'cat-a2': '#10b981', 'cat-a3': '#f59e0b', 'cat-a4': '#ef4444',
  'cat-b1': '#3b82f6', 'cat-b2': '#10b981', 'cat-b3': '#f59e0b', 'cat-b4': '#ef4444', 'cat-b5': '#8b5cf6',
}

export default function CategoryScoreCard({ category, expanded, onToggle }: Props) {
  const color = CATEGORY_COLORS[category.category_id] || '#6b7280'
  const pct = Math.min(category.raw_score, 100)

  return (
    <div className="card overflow-hidden cursor-pointer" onClick={onToggle}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-xs font-bold flex-1">{category.category_name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: `${color}20`, color }}>
            ×{category.weight}%
          </span>
          <span className="text-sm font-black" style={{
            color: pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444',
          }}>{category.raw_score}</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${pct}%`, background: color,
          }} />
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Weighted: {category.weighted_score}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {category.scores.length} criteria
          </span>
        </div>
      </div>

      {expanded && category.scores.length > 0 && (
        <div className="px-3 pb-3 space-y-1 border-t" style={{ borderColor: 'var(--gray-100)' }}>
          {category.scores.map(s => (
            <div key={s.criteria_id} className="flex items-center justify-between py-1">
              <span className="text-[10px] truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
                {s.criteria_id}
              </span>
              <div className="flex gap-2 text-[10px]">
                {s.self_score !== undefined && (
                  <span style={{ color: '#3b82f6' }}>Self: {s.self_score}</span>
                )}
                {s.manager_score !== undefined && (
                  <span style={{ color: '#7c3aed' }}>Mgr: {s.manager_score}</span>
                )}
                <span className="font-bold" style={{
                  color: s.source === 'auto' ? '#1d4ed8' : 'var(--text-primary)',
                }}>→ {s.final_score}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
