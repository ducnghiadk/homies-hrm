'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import SmartGreeting from '@/components/kpi/SmartGreeting'
import KPIScoreRing from '@/components/kpi/KPIScoreRing'
import InsightsFeed from '@/components/kpi/InsightsFeed'
import QuickActionsBar from '@/components/kpi/QuickActionsBar'
import TeamGrid from '@/components/kpi/TeamGrid'
import EvaluationTimeline from '@/components/kpi/EvaluationTimeline'
import SmartActionBanner from '@/components/kpi/SmartActionBanner'
import StoreComparisonChart from '@/components/kpi/StoreComparisonChart'
import { getSmartActions } from '@/lib/kpi-smart-actions'

import Link from 'next/link'
import {
  getStoreKPISummary, compareWithPeers, getEmployeeKPITrend,
  predictNextMonth,
} from '@/lib/kpi-report-service'
import { getInsightsForRole } from '@/lib/kpi-insights-engine'
import { getCurrentPeriod, getPreviousPeriodsHelper, mockEvaluations } from '@/lib/mock-data-kpi'
import type { KPIGradeCode } from '@/lib/kpi-types'

export default function KpiDashboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod())

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const period = selectedPeriod
  const month = period.slice(5)
  const year = period.slice(0, 4)
  const role = user.role as 'ceo' | 'store_manager' | 'shift_leader' | 'employee'
  const insights = getInsightsForRole(role, user.id, user.store_id)
  const urgentCount = insights.filter(i => i.priority === 'high').length
  const availablePeriods = getPreviousPeriodsHelper(6)
  const currentPeriod = getCurrentPeriod()

  // ── Common Quick Actions ──
  const pendingReviews = mockEvaluations.filter(e => e.period === period && e.status === 'self_submitted').length
  const quickActions = role === 'employee' ? [
    { icon: '📝', label: 'Tự đánh giá', href: '/kpi/evaluate', color: '#2F6FA8' },
    { icon: '📊', label: 'Kết quả', href: '/kpi/result', color: '#1E9E57' },
    { icon: '🏆', label: 'BXH', href: '/kpi/leaderboard', color: '#eab308' },
    { icon: '📈', label: 'Báo cáo', href: '/kpi/reports', color: '#001D3D' },
    { icon: '❌', label: 'Vi phạm', href: '/kpi/violations', color: '#D9381E' },
  ] : [
    { icon: '✅', label: 'Review', href: '/kpi/review', badge: pendingReviews, color: '#2F6FA8' },
    { icon: '📊', label: 'Báo cáo', href: '/kpi/reports', color: '#1E9E57' },
    { icon: '🏆', label: 'BXH', href: '/kpi/leaderboard', color: '#eab308' },
    { icon: '❌', label: 'Log lỗi', href: '/kpi/violations/log', color: '#D9381E' },
    { icon: '🎯', label: 'Thăng tiến', href: '/kpi/promotion', color: '#001D3D' },
    { icon: '⚙️', label: 'Cài đặt', href: '/kpi/settings', color: '#6b7280' },
  ]

  const smartActions = getSmartActions(user.id, role, user.store_id)

  return (
    <AppShell title="KPI & Hiệu suất">
      <div className="space-y-4">
        <SmartGreeting storeId={user.store_id} urgentCount={urgentCount} />

        {/* Smart Actions Banner */}
        <SmartActionBanner actions={smartActions} />

        {/* Period Selector */}
        <div className="flex items-center gap-2 animate-fade-in">
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold outline-none"
            style={{ border: '1px solid var(--gray-200)', background: 'white' }}>
            {availablePeriods.map(p => (
              <option key={p} value={p}>
                Tháng {p.slice(5)}/{p.slice(0, 4)} {p === currentPeriod ? '(Hiện tại)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Evaluation Timeline */}
        <EvaluationTimeline period={selectedPeriod} />

        {/* ══════════ CEO VIEW ══════════ */}
        {role === 'ceo' && <CEOView period={period} month={month} year={year} />}

        {/* ══════════ MANAGER VIEW ══════════ */}
        {(role === 'store_manager' || role === 'shift_leader') && (
          <ManagerView userId={user.id} storeId={user.store_id} period={period} month={month} year={year} />
        )}

        {/* ══════════ EMPLOYEE VIEW ══════════ */}
        {role === 'employee' && (
          <EmployeeView userId={user.id} storeId={user.store_id} period={period} />
        )}

        <QuickActionsBar actions={quickActions} />
        <InsightsFeed insights={insights} />
      </div>
    </AppShell>
  )
}

// ── CEO VIEW ──
function CEOView({ period, month, year }: { period: string; month: string; year: string }) {
  const allEvals = mockEvaluations.filter(e => e.period === period && ['published', 'finalized'].includes(e.status))
  const totalEmps = allEvals.length || 1
  const avgAll = Math.round(allEvals.reduce((a, e) => a + e.total_score, 0) / totalEmps)
  const pendingPromo = 2 // from mock
  const evaluatedPct = totalEmps > 0 ? Math.round((allEvals.length / 15) * 100) : 0

  return (
    <>
      {/* Summary Cards */}
      <div className="card-elevated p-4 animate-slide-up">
        <h3 className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          📊 Tổng quan công ty — T{month}/{year}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-black" style={{ color: avgAll >= 80 ? '#1E9E57' : '#F6C85F' }}>{avgAll}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Điểm TB</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black" style={{ color: '#2F6FA8' }}>{evaluatedPct}%</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Đã đánh giá</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black" style={{ color: '#001D3D' }}>{pendingPromo}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Chờ thăng tiến</div>
          </div>
        </div>
      </div>

      {/* Store Comparison Chart */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <StoreComparisonChart period={period} />
      </div>
    </>
  )
}

// ── MANAGER VIEW ──
function ManagerView({ storeId, period, month, year }: {
  userId: string; storeId: string; period: string; month: string; year: string
}) {
  const summary = getStoreKPISummary(storeId, period)
  const gradeCode = (
    summary.average_score >= 90 ? 'excellent' :
    summary.average_score >= 80 ? 'good' :
    summary.average_score >= 70 ? 'fair' :
    summary.average_score >= 60 ? 'average' : 'poor'
  ) as KPIGradeCode

  return (
    <>
      {/* Store Score Card */}
      <div className="card-elevated p-5 animate-slide-up">
        <h3 className="text-xs font-bold mb-3 text-center" style={{ color: 'var(--text-secondary)' }}>
          📊 KPI {summary.store_name} — T{month}/{year}
        </h3>
        <KPIScoreRing score={summary.average_score} gradeCode={gradeCode}
          change={summary.score_change} subtitle={`${summary.evaluated_count}/${summary.total_employees} đã đánh giá`} />

        <div className="flex justify-center gap-4 mt-3">
          {summary.top_performers[0] && (
            <span className="text-[10px]">⭐ Top: <b>{summary.top_performers[0].name.split(' ').slice(-1)[0]}</b> ({summary.top_performers[0].score})</span>
          )}
          {summary.need_attention[0] && (
            <span className="text-[10px]" style={{ color: '#D9381E' }}>⚠️ <b>{summary.need_attention[0].name.split(' ').slice(-1)[0]}</b> ({summary.need_attention[0].score})</span>
          )}
        </div>
      </div>

      {/* Team Grid */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <TeamGrid summary={summary} />
      </div>
    </>
  )
}

// ── EMPLOYEE VIEW ──
function EmployeeView({ userId, period }: { userId: string; storeId: string; period: string }) {
  const myEval = mockEvaluations.find(e => e.employee_id === userId && e.period === period &&
    ['published', 'finalized'].includes(e.status))
  const peer = compareWithPeers(userId, period)
  const trend = getEmployeeKPITrend(userId, 6)
  const prediction = predictNextMonth(userId)
  const streak = trend.months.filter(m => m.score >= 85).length

  if (!myEval) {
    // Draft or not yet evaluated
    const draftEval = mockEvaluations.find(e => e.employee_id === userId && e.period === period)
    return (
      <div className="card-elevated p-5 text-center animate-slide-up">
        <div className="text-4xl mb-3">📝</div>
        <h3 className="text-sm font-bold mb-1">
          {draftEval?.status === 'self_submitted' ? 'Đã gửi tự đánh giá' : 'Chưa đánh giá'}
        </h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          {draftEval?.status === 'self_submitted'
            ? 'Đang chờ Manager review'
            : 'Hãy hoàn thành tự đánh giá KPI tháng này'}
        </p>
        {(!draftEval || draftEval.status === 'draft') && (
          <Link href="/kpi/evaluate"
            className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white no-underline"
            style={{ background: 'var(--primary)' }}>
            Tự đánh giá ngay
          </Link>
        )}
      </div>
    )
  }

  const gradeCode = myEval.grade_code as KPIGradeCode

  return (
    <>
      {/* Score Card */}
      <div className="card-elevated p-5 animate-slide-up">
        <KPIScoreRing score={myEval.total_score} gradeCode={gradeCode}
          change={peer.my_score - (peer.peer_average || myEval.total_score)}
          subtitle={peer.rank > 0 ? `Top ${peer.rank}/${peer.total} store` : undefined}
          size="lg" />

        {/* Streak */}
        {streak >= 2 && (
          <div className="text-center mt-3 text-xs font-bold" style={{ color: '#D9381E' }}>
            🔥 {streak} tháng liên tiếp Top performer!
          </div>
        )}

        {/* Promotion progress */}
        {prediction.current_score >= 75 && (
          <div className="mt-3 px-3">
            <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
              Thăng tiến: {streak}/6 tháng
            </div>
            <div className="h-2 rounded-full" style={{ background: 'var(--gray-100)' }}>
              <div className="h-full rounded-full" style={{
                width: `${Math.min((streak / 6) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #2F6FA8, #001D3D)',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="card p-2.5 text-center">
          <div className="text-lg font-black" style={{ color: '#2F6FA8' }}>#{peer.rank}</div>
          <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Thứ hạng</div>
        </div>
        <div className="card p-2.5 text-center">
          <div className="text-lg font-black">{trend.average}</div>
          <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>TB 6 tháng</div>
        </div>
        <div className="card p-2.5 text-center">
          <div className="text-lg font-black" style={{ color: '#1E9E57' }}>{prediction.predicted_next_month}</div>
          <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Dự kiến T+1</div>
        </div>
      </div>
    </>
  )
}
