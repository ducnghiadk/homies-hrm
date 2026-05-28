'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import AnimatedPodium from '@/components/kpi/AnimatedPodium'
import MyPositionCard from '@/components/kpi/MyPositionCard'
import MoversCard from '@/components/kpi/MoversCard'
import StreaksCard from '@/components/kpi/StreaksCard'
import GradeBadge from '@/components/kpi/GradeBadge'
import TrendIndicator from '@/components/kpi/TrendIndicator'
import { getLeaderboard } from '@/lib/kpi-report-service'
import { getCurrentPeriod, getPreviousPeriodsHelper } from '@/lib/mock-data-kpi'

export default function LeaderboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [scope, setScope] = useState<'store' | 'all'>('store')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const period = getCurrentPeriod()
  const prevPeriod = getPreviousPeriodsHelper(2)[1]
  const storeId = scope === 'store' ? user.store_id : undefined
  const lb = getLeaderboard(storeId, period)
  const prevLb = getLeaderboard(storeId, prevPeriod)
  const myEntry = lb.current.find(e => e.employee_id === user.id)
  const myPrevEntry = prevLb.current.find(e => e.employee_id === user.id)

  return (
    <AppShell title="🏆 Bảng xếp hạng KPI" backHref="/kpi">
      <div className="space-y-4">
        {/* Scope Toggle */}
        <div className="flex gap-2 animate-fade-in">
          {[
            { k: 'store' as const, l: 'Store' },
            { k: 'all' as const, l: 'Công ty' },
          ].map(({ k, l }) => (
            <button key={k} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: scope === k ? 'var(--primary)' : 'var(--gray-50)',
                color: scope === k ? 'white' : 'var(--text-secondary)',
              }}
              onClick={() => setScope(k)}>
              {l}
            </button>
          ))}
        </div>

        {/* Podium */}
        {lb.current.length >= 3 && <AnimatedPodium top3={lb.current.slice(0, 3)} />}

        {/* My Position */}
        {myEntry && (
          <MyPositionCard
            rank={myEntry.rank}
            total={lb.current.length}
            score={myEntry.score}
            gapToTop3={lb.current.length >= 3 ? lb.current[2].score - myEntry.score : 0}
            prevRank={myPrevEntry?.rank}
          />
        )}

        {/* Movers */}
        <MoversCard gainer={lb.movers.biggest_gainer} dropper={lb.movers.biggest_drop} />

        {/* Full Ranking */}
        <div className="space-y-1.5 animate-fade-in">
          <h3 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
            📋 Xếp hạng đầy đủ
          </h3>
          {lb.current.map(entry => (
            <div key={entry.employee_id}
              className="card p-2.5 flex items-center gap-2"
              style={{
                background: entry.employee_id === user.id ? '#eff6ff' : undefined,
                border: entry.employee_id === user.id ? '2px solid var(--primary)' : undefined,
              }}>
              <span className="text-xs font-black w-7 text-center" style={{
                color: entry.rank <= 3 ? '#eab308' : 'var(--text-muted)',
              }}>
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate flex items-center gap-1">
                  {entry.name}
                  {entry.employee_id === user.id && (
                    <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: 'var(--primary)', color: 'white' }}>Bạn</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <GradeBadge gradeCode={entry.grade_code} size="sm" showIcon={false} />
                <div className="text-sm font-black" style={{
                  color: entry.score >= 85 ? '#1E9E57' : entry.score >= 70 ? '#F6C85F' : '#D9381E',
                }}>{entry.score}</div>
                {entry.change !== 0 && <TrendIndicator value={entry.change} size="sm" />}
              </div>
            </div>
          ))}
        </div>

        {/* Streaks */}
        {lb.streaks.length > 0 && <StreaksCard streaks={lb.streaks} />}
      </div>
    </AppShell>
  )
}
