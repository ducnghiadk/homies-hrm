'use client'

import TrendIndicator from '@/components/kpi/TrendIndicator'

interface MyPositionCardProps {
  rank: number
  total: number
  score: number
  gapToTop3: number
  prevRank?: number
}

export default function MyPositionCard({ rank, total, score, gapToTop3, prevRank }: MyPositionCardProps) {
  const rankChange = prevRank ? prevRank - rank : 0

  return (
    <div className="card-elevated p-4 text-center animate-fade-in" style={{
      background: rank <= 3 ? 'linear-gradient(135deg, #fef9c3, #fef3c7)' : undefined,
    }}>
      <div className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
        📍 Vị trí của bạn
      </div>

      <div className="flex items-center justify-center gap-3 mb-2">
        <div>
          <span className="text-3xl font-black" style={{
            color: rank <= 3 ? '#eab308' : 'var(--primary)',
          }}>#{rank}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            {' '}/ {total}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-[11px]">
        <span>Điểm: <b>{score}</b></span>
        {rank > 3 && <span>Cách Top 3: <b style={{ color: '#f59e0b' }}>{gapToTop3} điểm</b></span>}
        {rank <= 3 && <span style={{ color: '#10b981' }}>🏆 Top 3!</span>}
      </div>

      {prevRank !== undefined && rankChange !== 0 && (
        <div className="mt-2 text-[11px] font-bold flex items-center justify-center gap-1">
          {rankChange > 0 ? '💪' : '😅'} Tháng trước: #{prevRank}
          <TrendIndicator value={rankChange} />
          <span>bậc</span>
        </div>
      )}
    </div>
  )
}
