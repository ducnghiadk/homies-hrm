'use client'

import { compareStores } from '@/lib/kpi-report-service'
import { useMemo } from 'react'

interface Props {
  period: string
}

export default function StoreComparisonChart({ period }: Props) {
  const data = useMemo(() => compareStores(period), [period])

  if (!data || data.length === 0) {
    return (
      <div className="card p-4 text-center text-xs animate-fade-in" style={{ color: 'var(--text-muted)' }}>
        Không có dữ liệu so sánh cửa hàng
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.average_score - a.average_score)
  const maxScore = Math.max(...sorted.map(s => s.average_score), 100)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="card p-4 space-y-3 animate-fade-in">
      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        📊 So sánh cửa hàng — T{period.slice(5)}/{period.slice(0, 4)}
      </h3>

      {/* Bar chart */}
      <div className="space-y-2">
        {sorted.map((store, i) => {
          const pct = (store.average_score / maxScore) * 100
          const change = store.average_score - 80 // simplified trend
          return (
            <div key={store.store_id} className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-4 text-center">{i < 3 ? medals[i] : `${i + 1}.`}</span>
                <span className="flex-1 font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {store.store_name}
                </span>
                <span className="font-bold text-xs" style={{ color: 'var(--primary)' }}>{Math.round(store.average_score)}</span>
                <span className="text-[10px] font-bold" style={{
                  color: change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#9ca3af',
                }}>
                  {change > 0 ? `+${change.toFixed(0)} ↑` : change < 0 ? `${change.toFixed(0)} ↓` : '—'}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${pct}%`,
                  background: i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : i === 2 ? '#f59e0b' : 'var(--gray-400)',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Insights */}
      {sorted.length >= 2 && (
        <div className="text-[11px] px-3 py-2 rounded-lg" style={{ background: '#f0fdf4', color: '#166534' }}>
          💡 {sorted[0].store_name} dẫn đầu với {Math.round(sorted[0].average_score)} điểm.
          {sorted.length >= 3 && ` Chênh lệch giữa top 1 và top 3: ${Math.round(sorted[0].average_score - sorted[2].average_score)} điểm.`}
        </div>
      )}
    </div>
  )
}
