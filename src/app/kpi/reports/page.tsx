'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import ExecutiveSummary from '@/components/kpi/ExecutiveSummary'
import { TrendChart, CategoryBarChart, GradeDistribution } from '@/components/kpi/InteractiveChart'
import SmartFilters from '@/components/kpi/SmartFilters'
import ComparisonTable from '@/components/kpi/ComparisonTable'
import EmployeeMiniCard from '@/components/kpi/EmployeeMiniCard'
import {
  getStoreKPISummary, getEmployeeKPITrend, comparePeriods,
  getLeaderboard,
} from '@/lib/kpi-report-service'
import { getCurrentPeriod, getPreviousPeriodsHelper, mockEvaluations } from '@/lib/mock-data-kpi'
import { mockEmployees } from '@/lib/mock-data'

type TabKey = 'overview' | 'team' | 'compare'

export default function ReportsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('overview')
  const [filterState, setFilterState] = useState<{ quick?: string }>({})

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const period = getCurrentPeriod()
  const prevPeriod = getPreviousPeriodsHelper(2)[1]
  const month = period.slice(5)
  const year = period.slice(0, 4)
  const storeId = user.store_id
  const summary = getStoreKPISummary(storeId, period)
  const lb = getLeaderboard(storeId, period)

  // Comparison data
  const comparison = comparePeriods(storeId, prevPeriod, period)
  const weakest = summary.category_performance.find(c => c.weakest_area)
  const compInsight = weakest && weakest.average < 80
    ? `Cải thiện tổng thể tốt, nhưng "${weakest.name}" cần được chú ý hơn.`
    : 'Kết quả ổn định, tiếp tục duy trì!'

  // Filter employees
  const getFilteredEmployees = () => {
    const evals = mockEvaluations.filter(e => e.store_id === storeId && e.period === period && ['published', 'finalized'].includes(e.status))
    let filtered = evals

    if (filterState.quick === 'attention') filtered = filtered.filter(e => e.total_score < 75)
    if (filterState.quick === 'top') filtered = filtered.filter(e => e.total_score >= 85)
    if (filterState.quick === 'violations') filtered = filtered.filter(e => (e.violation_score || 100) < 90)
    if (filterState.quick === 'promo') {
      const promoIds = summary.promotion_ready.map(p => p.employee_id)
      filtered = filtered.filter(e => promoIds.includes(e.employee_id))
    }

    return filtered.sort((a, b) => b.total_score - a.total_score).map(e => {
      const emp = mockEmployees.find(m => m.id === e.employee_id)
      const prevEval = mockEvaluations.find(p => p.employee_id === e.employee_id && p.period === prevPeriod && ['published', 'finalized'].includes(p.status))
      return { ...e, name: emp?.full_name || e.employee_id, trend: prevEval ? e.total_score - prevEval.total_score : 0 }
    })
  }

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Tổng quan', icon: '📊' },
    { key: 'team', label: 'Nhân viên', icon: '👥' },
    { key: 'compare', label: 'So sánh', icon: '⚖️' },
  ]

  return (
    <AppShell title="📈 Báo cáo KPI" backHref="/kpi">
      <div className="space-y-4">
        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl p-1 animate-fade-in" style={{ background: 'var(--gray-50)' }}>
          {tabs.map(t => (
            <button key={t.key}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: tab === t.key ? 'white' : 'transparent',
                color: tab === t.key ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div className="space-y-3">
            <ExecutiveSummary summary={summary} periodLabel={`T${month}/${year}`} />

            {/* Score trend (first employee or store avg) */}
            <TrendChart trend={lb.current[0] ? getEmployeeKPITrend(lb.current[0].employee_id, 6) : null} />

            <CategoryBarChart categories={summary.category_performance} />

            <GradeDistribution distribution={summary.grade_distribution} />
          </div>
        )}

        {/* ── TEAM TAB ── */}
        {tab === 'team' && (
          <div className="space-y-3">
            <SmartFilters onFilter={f => setFilterState(f)} activeQuick={filterState.quick} />

            <div className="space-y-1.5">
              {getFilteredEmployees().map(emp => (
                <EmployeeMiniCard key={emp.id}
                  name={emp.name}
                  score={emp.total_score}
                  subtitle={emp.grade_code}
                  trend={emp.trend}
                  highlight={emp.total_score < 70 ? 'danger' : emp.total_score < 80 ? 'warning' : undefined}
                />
              ))}
              {getFilteredEmployees().length === 0 && (
                <div className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Không có kết quả phù hợp
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMPARE TAB ── */}
        {tab === 'compare' && (
          <div className="space-y-3">
            <ComparisonTable
              data={comparison}
              period1Label={`T${prevPeriod.slice(5)}`}
              period2Label={`T${month}`}
              insight={compInsight}
            />
          </div>
        )}
      </div>
    </AppShell>
  )
}
