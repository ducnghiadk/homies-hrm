'use client'

import { useState } from 'react'
import RiskBadge from '@/components/kpi/RiskBadge'
import type { StoreKPISummary } from '@/lib/kpi-report-service'
import Link from 'next/link'

interface TeamGridProps {
  summary: StoreKPISummary
}

export default function TeamGrid({ summary }: TeamGridProps) {
  const [showAll, setShowAll] = useState(false)
  const topSlice = showAll ? summary.top_performers : summary.top_performers.slice(0, 4)

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
          👥 Team ({summary.total_employees} người)
        </h3>
        <Link href="/kpi/leaderboard" className="text-[10px] font-bold no-underline" style={{ color: 'var(--primary)' }}>
          Xem BXH →
        </Link>
      </div>

      {/* Top performers visual grid */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {topSlice.map((t, i) => (
          <div key={t.employee_id} className="shrink-0 text-center animate-slide-up"
            style={{ animationDelay: `${i * 50}ms`, minWidth: 70 }}>
            <div className="relative mx-auto w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white mb-1"
              style={{
                background: i === 0 ? 'linear-gradient(135deg, #eab308, #F6C85F)' :
                  i === 1 ? 'linear-gradient(135deg, #9ca3af, #6b7280)' :
                  i === 2 ? 'linear-gradient(135deg, #cd7f32, #b8860b)' : 'var(--primary)',
              }}>
              {t.name.split(' ').slice(-1)[0].charAt(0)}
              {i < 3 && (
                <span className="absolute -top-1.5 -right-1.5 text-sm">
                  {['🥇', '🥈', '🥉'][i]}
                </span>
              )}
            </div>
            <div className="text-[10px] font-semibold truncate max-w-[70px]">
              {t.name.split(' ').slice(-1)[0]}
            </div>
            <div className="text-xs font-black" style={{
              color: t.score >= 85 ? '#1E9E57' : t.score >= 70 ? '#F6C85F' : '#D9381E',
            }}>{t.score}</div>
            <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
              {t.trend === 'up' ? '↑' : t.trend === 'down' ? '↓' : '→'}
            </div>
          </div>
        ))}
      </div>

      {summary.top_performers.length > 4 && !showAll && (
        <button onClick={() => setShowAll(true)}
          className="w-full text-[10px] font-bold py-1.5 rounded-xl"
          style={{ background: 'var(--gray-50)', color: 'var(--primary)' }}>
          Xem tất cả {summary.top_performers.length} người →
        </button>
      )}

      {/* Need attention */}
      {summary.need_attention.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold flex items-center gap-1" style={{ color: '#dc2626' }}>
            ⚠️ Cần chú ý
          </h4>
          {summary.need_attention.map(emp => (
            <div key={emp.employee_id} className="card p-2.5 space-y-1" style={{ background: '#fef2f2' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{emp.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black" style={{ color: '#D9381E' }}>{emp.score}</span>
                  <RiskBadge level={emp.risk_level} />
                </div>
              </div>
              {emp.issues.length > 0 && (
                <div className="text-[10px]" style={{ color: '#991b1b' }}>
                  {emp.issues.join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
