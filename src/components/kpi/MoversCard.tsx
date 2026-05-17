'use client'

import type { LeaderboardEntry } from '@/lib/kpi-report-service'
import TrendIndicator from '@/components/kpi/TrendIndicator'

interface MoversCardProps {
  gainer: LeaderboardEntry | null
  dropper: LeaderboardEntry | null
}

export default function MoversCard({ gainer, dropper }: MoversCardProps) {
  if (!gainer && !dropper) return null

  return (
    <div className="grid grid-cols-2 gap-2 animate-fade-in">
      {gainer && (
        <div className="card p-3 text-center" style={{ background: '#ecfdf5' }}>
          <div className="text-lg mb-1">🚀</div>
          <div className="text-[10px] font-bold uppercase" style={{ color: '#059669' }}>Tiến bộ nhất</div>
          <div className="text-xs font-bold mt-1">{gainer.name.split(' ').slice(-2).join(' ')}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendIndicator value={gainer.change} />
            <span className="text-[10px]" style={{ color: '#059669' }}>điểm</span>
          </div>
        </div>
      )}
      {dropper && (
        <div className="card p-3 text-center" style={{ background: '#fef2f2' }}>
          <div className="text-lg mb-1">📉</div>
          <div className="text-[10px] font-bold uppercase" style={{ color: '#dc2626' }}>Cần cố gắng</div>
          <div className="text-xs font-bold mt-1">{dropper.name.split(' ').slice(-2).join(' ')}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendIndicator value={dropper.change} />
            <span className="text-[10px]" style={{ color: '#dc2626' }}>điểm</span>
          </div>
        </div>
      )}
    </div>
  )
}
