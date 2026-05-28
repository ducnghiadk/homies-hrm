// =============================================
// HRM Trà Sữa 🧋 — KPI Report Service
// Phase 3F-4: Reports, summaries, leaderboard, comparisons
// =============================================

import type { KPIGradeCode } from '@/lib/kpi-types'
import { mockEvaluations, mockKPICategories, getCurrentPeriod, getPreviousPeriodsHelper, mockPromotionReviews, mockViolationRecords } from '@/lib/mock-data-kpi'
import { mockEmployees, mockStores } from '@/lib/mock-data'

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface KPIInsight {
  id: string
  type: 'achievement' | 'warning' | 'trend' | 'action_needed' | 'celebration'
  priority: 'high' | 'medium' | 'low'
  icon: string
  title: string
  description: string
  metric_value?: number
  metric_change?: number
  action?: { label: string; href: string }
  affected_employees?: string[]
  generated_at: string
}

export interface KPIPrediction {
  employee_id: string
  name: string
  current_score: number
  predicted_next_month: number
  confidence: number
  factors: { factor: string; impact: 'positive' | 'negative'; weight: number }[]
  risk_level: 'low' | 'medium' | 'high'
  recommendations: string[]
}

export interface LeaderboardEntry {
  rank: number
  employee_id: string
  name: string
  avatar?: string
  score: number
  prev_score?: number
  change: number
  streak: number
  trend: 'up' | 'down' | 'stable'
  grade_code: KPIGradeCode
}

export interface StoreKPISummary {
  store_id: string
  store_name: string
  period: string
  total_employees: number
  evaluated_count: number
  average_score: number
  score_change: number
  grade_distribution: Record<KPIGradeCode, number>
  top_performers: { employee_id: string; name: string; score: number; streak: number; trend: 'up' | 'down' | 'stable' }[]
  need_attention: { employee_id: string; name: string; score: number; issues: string[]; risk_level: 'medium' | 'high' }[]
  category_performance: { category_id: string; name: string; average: number; trend: 'up' | 'down' | 'stable'; weakest_area: boolean }[]
  violation_summary: { total: number; change: number; hotspots: { type: string; count: number }[] }
  promotion_ready: { employee_id: string; name: string; probability: number }[]
}

export interface StoreComparison {
  store_id: string
  store_name: string
  average_score: number
  evaluated_percentage: number
  top_grade_count: number
  violation_count: number
}

export interface EmployeeKPITrend {
  employee_id: string
  name: string
  months: { period: string; score: number; grade_code: KPIGradeCode }[]
  average: number
  trend: 'up' | 'down' | 'stable'
  best_month: { period: string; score: number }
  worst_month: { period: string; score: number }
}

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

function getEmpName(empId: string): string {
  return mockEmployees.find(e => e.id === empId)?.full_name || empId
}

function getPublished(storeId: string, period: string) {
  return mockEvaluations.filter(
    e => e.store_id === storeId && e.period === period &&
    ['published', 'finalized'].includes(e.status),
  )
}

function getPublishedAll(period: string) {
  return mockEvaluations.filter(
    e => e.period === period && ['published', 'finalized'].includes(e.status),
  )
}

function getScoreTrend(prev?: number, curr?: number): 'up' | 'down' | 'stable' {
  if (!prev || !curr) return 'stable'
  if (curr > prev + 1) return 'up'
  if (curr < prev - 1) return 'down'
  return 'stable'
}

// Simulate streak by checking consecutive months ≥ threshold
function getStreak(empId: string, threshold: number = 85): number {
  const periods = getPreviousPeriodsHelper(6)
  let streak = 0
  for (const p of periods) {
    const ev = mockEvaluations.find(
      e => e.employee_id === empId && e.period === p && ['published', 'finalized'].includes(e.status),
    )
    if (ev && ev.total_score >= threshold) streak++
    else break
  }
  return streak
}

// ══════════════════════════════════════
// STORE KPI SUMMARY
// ══════════════════════════════════════

export function getStoreKPISummary(storeId: string, period: string): StoreKPISummary {
  const store = mockStores.find(s => s.id === storeId)
  const storeEmps = mockEmployees.filter(e => e.store_id === storeId && e.status === 'active')
  const evals = getPublished(storeId, period)
  const prevPeriod = getPreviousPeriodsHelper(2)[1]
  const prevEvals = getPublished(storeId, prevPeriod)

  const scores = evals.map(e => e.total_score)
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const prevScores = prevEvals.map(e => e.total_score)
  const prevAvg = prevScores.length ? Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length) : 0

  // Grade distribution
  const dist: Record<KPIGradeCode, number> = { excellent: 0, good: 0, fair: 0, average: 0, poor: 0 }
  evals.forEach(e => { if (e.grade_code) dist[e.grade_code]++ })

  // Top performers
  const sorted = [...evals].sort((a, b) => b.total_score - a.total_score)
  const topPerformers = sorted.slice(0, 5).map(e => {
    const prev = prevEvals.find(p => p.employee_id === e.employee_id)
    return {
      employee_id: e.employee_id,
      name: getEmpName(e.employee_id),
      score: e.total_score,
      streak: getStreak(e.employee_id),
      trend: getScoreTrend(prev?.total_score, e.total_score),
    }
  })

  // Need attention
  const needAttention = sorted.filter(e => e.total_score < 75).map(e => {
    const issues: string[] = []
    e.category_scores.forEach(c => {
      if (c.raw_score < 70) issues.push(`${c.category_name} thấp (${c.raw_score})`)
    })
    if (e.violation_score && e.violation_score < 80) issues.push('Nhiều lỗi vi phạm')
    return {
      employee_id: e.employee_id,
      name: getEmpName(e.employee_id),
      score: e.total_score,
      issues,
      risk_level: (e.total_score < 60 ? 'high' : 'medium') as 'high' | 'medium',
    }
  })

  // Category performance
  const catIds = new Set(evals.flatMap(e => e.category_scores.map(c => c.category_id)))
  const catPerf = [...catIds].map(catId => {
    const catName = mockKPICategories.find(c => c.id === catId)?.name || catId
    const catScores = evals.flatMap(e => e.category_scores.filter(c => c.category_id === catId).map(c => c.raw_score))
    const catAvg = catScores.length ? Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length) : 0
    const prevCatScores = prevEvals.flatMap(e => e.category_scores.filter(c => c.category_id === catId).map(c => c.raw_score))
    const prevCatAvg = prevCatScores.length ? Math.round(prevCatScores.reduce((a, b) => a + b, 0) / prevCatScores.length) : 0
    return { category_id: catId, name: catName, average: catAvg, trend: getScoreTrend(prevCatAvg, catAvg), weakest_area: false }
  }).sort((a, b) => a.average - b.average)
  if (catPerf.length) catPerf[0].weakest_area = true

  // Violations
  const storeViolations = mockViolationRecords.filter(v => {
    const emp = mockEmployees.find(e => e.id === v.employee_id)
    return emp?.store_id === storeId
  })
  const prevStoreViolations = storeViolations.filter(v => v.occurred_at.startsWith(prevPeriod))
  const currStoreViolations = storeViolations.filter(v => v.occurred_at.startsWith(period))
  const hotspots = new Map<string, number>()
  currStoreViolations.forEach(v => {
    const key = v.violation_type_id
    hotspots.set(key, (hotspots.get(key) || 0) + 1)
  })

  // Promotion ready
  const promoReady = mockPromotionReviews
    .filter(r => r.status === 'pending' && mockEmployees.find(e => e.id === r.employee_id)?.store_id === storeId)
    .map(r => ({ employee_id: r.employee_id, name: getEmpName(r.employee_id), probability: r.average_score >= 85 ? 90 : 70 }))

  return {
    store_id: storeId,
    store_name: store?.name || storeId,
    period,
    total_employees: storeEmps.length,
    evaluated_count: evals.length,
    average_score: avg,
    score_change: avg - prevAvg,
    grade_distribution: dist,
    top_performers: topPerformers,
    need_attention: needAttention,
    category_performance: catPerf,
    violation_summary: {
      total: currStoreViolations.length,
      change: currStoreViolations.length - prevStoreViolations.length,
      hotspots: [...hotspots.entries()].map(([type, count]) => ({ type, count })).slice(0, 5),
    },
    promotion_ready: promoReady,
  }
}

// ══════════════════════════════════════
// EMPLOYEE KPI TREND
// ══════════════════════════════════════

export function getEmployeeKPITrend(employeeId: string, months: number = 6): EmployeeKPITrend {
  const periods = getPreviousPeriodsHelper(months)
  const data = periods.map(p => {
    const ev = mockEvaluations.find(
      e => e.employee_id === employeeId && e.period === p && ['published', 'finalized'].includes(e.status),
    )
    return { period: p, score: ev?.total_score || 0, grade_code: (ev?.grade_code || 'poor') as KPIGradeCode }
  }).filter(d => d.score > 0).reverse()

  const scores = data.map(d => d.score)
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const best = data.reduce((b, d) => d.score > b.score ? d : b, data[0] || { period: '', score: 0 })
  const worst = data.reduce((w, d) => d.score < w.score ? d : w, data[0] || { period: '', score: 0 })

  const trend = data.length >= 2 ? getScoreTrend(data[data.length - 2]?.score, data[data.length - 1]?.score) : 'stable'

  return {
    employee_id: employeeId,
    name: getEmpName(employeeId),
    months: data,
    average: avg,
    trend,
    best_month: { period: best?.period || '', score: best?.score || 0 },
    worst_month: { period: worst?.period || '', score: worst?.score || 0 },
  }
}

// ══════════════════════════════════════
// COMPARE WITH PEERS
// ══════════════════════════════════════

export function compareWithPeers(employeeId: string, period?: string): {
  my_score: number
  peer_average: number
  percentile: number
  rank: number
  total: number
} {
  const p = period || getCurrentPeriod()
  const emp = mockEmployees.find(e => e.id === employeeId)
  if (!emp) return { my_score: 0, peer_average: 0, percentile: 0, rank: 0, total: 0 }

  const storeEvals = getPublished(emp.store_id, p)
  const myEval = storeEvals.find(e => e.employee_id === employeeId)
  const myScore = myEval?.total_score || 0
  const scores = storeEvals.map(e => e.total_score).sort((a, b) => b - a)
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const rank = scores.indexOf(myScore) + 1
  const percentile = scores.length ? Math.round(((scores.length - rank) / scores.length) * 100) : 0

  return { my_score: myScore, peer_average: avg, percentile, rank, total: scores.length }
}

// ══════════════════════════════════════
// COMPARE STORES
// ══════════════════════════════════════

export function compareStores(period?: string): StoreComparison[] {
  const p = period || getCurrentPeriod()
  return mockStores.map(store => {
    const evals = getPublished(store.id, p)
    const storeEmps = mockEmployees.filter(e => e.store_id === store.id && e.status === 'active')
    const scores = evals.map(e => e.total_score)
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    return {
      store_id: store.id,
      store_name: store.name,
      average_score: avg,
      evaluated_percentage: storeEmps.length ? Math.round((evals.length / storeEmps.length) * 100) : 0,
      top_grade_count: evals.filter(e => e.grade_code === 'excellent' || e.grade_code === 'good').length,
      violation_count: mockViolationRecords.filter(v => {
        const emp = mockEmployees.find(e => e.id === v.employee_id)
        return emp?.store_id === store.id && v.occurred_at.startsWith(p)
      }).length,
    }
  }).sort((a, b) => b.average_score - a.average_score)
}

// ══════════════════════════════════════
// LEADERBOARD
// ══════════════════════════════════════

export function getLeaderboard(storeId?: string, period?: string): {
  current: LeaderboardEntry[]
  movers: { biggest_gainer: LeaderboardEntry | null; biggest_drop: LeaderboardEntry | null }
  streaks: { employee_id: string; name: string; streak_months: number; type: 'top_performer' | 'consistent' }[]
} {
  const p = period || getCurrentPeriod()
  const prevP = getPreviousPeriodsHelper(2)[1]

  const evals = storeId ? getPublished(storeId, p) : getPublishedAll(p)
  const prevEvals = storeId
    ? getPublished(storeId, prevP)
    : getPublishedAll(prevP)

  const entries: LeaderboardEntry[] = evals
    .sort((a, b) => b.total_score - a.total_score)
    .map((e, i) => {
      const prev = prevEvals.find(p => p.employee_id === e.employee_id)
      const prevScore = prev?.total_score || 0
      return {
        rank: i + 1,
        employee_id: e.employee_id,
        name: getEmpName(e.employee_id),
        score: e.total_score,
        prev_score: prevScore || undefined,
        change: prevScore ? e.total_score - prevScore : 0,
        streak: getStreak(e.employee_id),
        trend: getScoreTrend(prevScore, e.total_score),
        grade_code: e.grade_code as KPIGradeCode,
      }
    })

  const withChanges = entries.filter(e => e.change !== 0)
  const biggestGainer = withChanges.length ? withChanges.reduce((a, b) => a.change > b.change ? a : b) : null
  const biggestDrop = withChanges.length ? withChanges.reduce((a, b) => a.change < b.change ? a : b) : null

  // Streaks
  const streaks = entries
    .filter(e => e.streak >= 2)
    .map(e => ({
      employee_id: e.employee_id,
      name: e.name,
      streak_months: e.streak,
      type: (e.streak >= 3 ? 'top_performer' : 'consistent') as 'top_performer' | 'consistent',
    }))
    .sort((a, b) => b.streak_months - a.streak_months)

  return { current: entries, movers: { biggest_gainer: biggestGainer, biggest_drop: biggestDrop }, streaks }
}

// ══════════════════════════════════════
// PREDICTION (Simulated)
// ══════════════════════════════════════

export function predictNextMonth(employeeId: string): KPIPrediction {
  const trend = getEmployeeKPITrend(employeeId, 3)
  const lastScore = trend.months.at(-1)?.score || 0
  const prevScore = trend.months.at(-2)?.score || lastScore
  const delta = lastScore - prevScore

  // Simple linear prediction with dampening
  const predicted = Math.max(0, Math.min(100, lastScore + Math.round(delta * 0.6)))
  const confidence = trend.months.length >= 2 ? 70 + trend.months.length * 5 : 40

  const factors: KPIPrediction['factors'] = []
  if (delta > 0) factors.push({ factor: 'Xu hướng cải thiện', impact: 'positive', weight: 40 })
  if (delta < 0) factors.push({ factor: 'Xu hướng giảm', impact: 'negative', weight: 40 })

  const violations = mockViolationRecords.filter(v => v.employee_id === employeeId).length
  if (violations > 2) factors.push({ factor: `${violations} lỗi vi phạm`, impact: 'negative', weight: 30 })
  else factors.push({ factor: 'Ít vi phạm', impact: 'positive', weight: 20 })

  const streak = getStreak(employeeId)
  if (streak >= 2) factors.push({ factor: `${streak} tháng liên tiếp ≥85`, impact: 'positive', weight: 30 })

  const recs: string[] = []
  if (predicted < 70) recs.push('Cần họp 1-on-1 với quản lý')
  if (predicted < 80) recs.push('Tập trung cải thiện điểm yếu nhất')
  if (violations > 2) recs.push('Giảm thiểu vi phạm')
  if (predicted >= 85) recs.push('Duy trì phong độ tốt!')

  return {
    employee_id: employeeId,
    name: getEmpName(employeeId),
    current_score: lastScore,
    predicted_next_month: predicted,
    confidence: Math.min(confidence, 95),
    factors,
    risk_level: predicted < 65 ? 'high' : predicted < 75 ? 'medium' : 'low',
    recommendations: recs,
  }
}

export function identifyAtRiskEmployees(storeId: string): KPIPrediction[] {
  const storeEmps = mockEmployees.filter(e => e.store_id === storeId && e.status === 'active')
  return storeEmps
    .map(emp => predictNextMonth(emp.id))
    .filter(p => p.risk_level !== 'low')
    .sort((a, b) => a.predicted_next_month - b.predicted_next_month)
}

// ══════════════════════════════════════
// PERIOD COMPARISON
// ══════════════════════════════════════

export interface PeriodComparison {
  metric: string
  period1: number
  period2: number
  change: number
  direction: 'up' | 'down' | 'stable'
  positive: boolean // Is the direction good?
}

export function comparePeriods(storeId: string, period1: string, period2: string): PeriodComparison[] {
  const evals1 = getPublished(storeId, period1)
  const evals2 = getPublished(storeId, period2)

  const avg1 = evals1.length ? Math.round(evals1.reduce((a, e) => a + e.total_score, 0) / evals1.length) : 0
  const avg2 = evals2.length ? Math.round(evals2.reduce((a, e) => a + e.total_score, 0) / evals2.length) : 0

  const exc1 = evals1.filter(e => e.grade_code === 'excellent').length
  const exc2 = evals2.filter(e => e.grade_code === 'excellent').length
  const excPct1 = evals1.length ? Math.round((exc1 / evals1.length) * 100) : 0
  const excPct2 = evals2.length ? Math.round((exc2 / evals2.length) * 100) : 0

  const poor1 = evals1.filter(e => e.grade_code === 'poor').length
  const poor2 = evals2.filter(e => e.grade_code === 'poor').length
  const poorPct1 = evals1.length ? Math.round((poor1 / evals1.length) * 100) : 0
  const poorPct2 = evals2.length ? Math.round((poor2 / evals2.length) * 100) : 0

  const viol1 = mockViolationRecords.filter(v => {
    const emp = mockEmployees.find(e => e.id === v.employee_id)
    return emp?.store_id === storeId && v.occurred_at.startsWith(period1)
  }).length
  const viol2 = mockViolationRecords.filter(v => {
    const emp = mockEmployees.find(e => e.id === v.employee_id)
    return emp?.store_id === storeId && v.occurred_at.startsWith(period2)
  }).length

  const mk = (metric: string, v1: number, v2: number, lowerBetter = false): PeriodComparison => {
    const change = v2 - v1
    const dir: 'up' | 'down' | 'stable' = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    return { metric, period1: v1, period2: v2, change, direction: dir, positive: lowerBetter ? dir === 'down' : dir === 'up' }
  }

  return [
    mk('Điểm TB', avg1, avg2),
    mk('% Xuất sắc', excPct1, excPct2),
    mk('% Yếu', poorPct1, poorPct2, true),
    mk('Lỗi vận hành', viol1, viol2, true),
  ]
}

// ══════════════════════════════════════
// EXPORT (Dummy — returns text summary)
// ══════════════════════════════════════

export function exportKPIReport(storeId: string, period: string): string {
  const summary = getStoreKPISummary(storeId, period)
  return `BÁO CÁO KPI - ${summary.store_name} - T${period.slice(5)}/${period.slice(0, 4)}\n` +
    `Điểm TB: ${summary.average_score}\n` +
    `Đã đánh giá: ${summary.evaluated_count}/${summary.total_employees}\n` +
    `Top: ${summary.top_performers.map(t => `${t.name} (${t.score})`).join(', ')}\n`
}
