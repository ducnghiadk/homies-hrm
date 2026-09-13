// =============================================
// HRM Trà Sữa 🧋 — KPI Insights Engine
// Phase 3F-4: Auto-generated insights & notifications
// =============================================

import type { KPIInsight } from '@/lib/kpi-report-service'
import {
  getStoreKPISummary, getLeaderboard, identifyAtRiskEmployees,
  compareWithPeers,
} from '@/lib/kpi-report-service'
import { mockEvaluations, getCurrentPeriod, mockPromotionReviews } from '@/lib/mock-data-kpi'

// ══════════════════════════════════════
// INSIGHT TEMPLATES (Vietnamese)
// ══════════════════════════════════════

const TEMPLATES = {
  TOP_STREAK: (name: string, months: number) =>
    `🔥 ${name} đạt Top performer ${months} tháng liên tiếp!`,
  SCORE_UP: (name: string, inc: number) =>
    `📈 ${name} cải thiện ${inc} điểm so với tháng trước`,
  AT_RISK: (count: number) =>
    `⚠️ ${count} nhân viên có nguy cơ KPI dưới 70 tháng tới`,
  PENDING_REVIEW: (count: number) =>
    `📋 ${count} đánh giá chờ review`,
  PROMO_READY: (name: string) =>
    `🎯 ${name} đủ điều kiện thăng tiến, chờ duyệt`,
  STORE_RANK: (rank: number, total: number) =>
    `🏆 Store xếp #${rank}/${total} toàn công ty tháng này`,
  VIOLATION_SPIKE: (pct: number) =>
    `🚨 Lỗi vận hành tăng ${pct}%, cần review`,
  CATEGORY_WEAK: (cat: string) =>
    `💡 "${cat}" là điểm yếu nhất, cần tập trung cải thiện`,
  EXCELLENCE_COUNT: (count: number, change: number) =>
    `🎉 ${count} nhân viên đạt Xuất sắc${change > 0 ? `, tăng ${change} so với tháng trước` : ''}`,
  STORE_AVG_UP: (months: number) =>
    `📈 Điểm TB store tăng liên tục ${months} tháng`,
}

let insightCounter = 0
function mkInsight(
  type: KPIInsight['type'],
  priority: KPIInsight['priority'],
  icon: string,
  title: string,
  description: string,
  action?: KPIInsight['action'],
  metric?: { value?: number; change?: number },
): KPIInsight {
  return {
    id: `insight-${++insightCounter}`,
    type, priority, icon, title, description,
    metric_value: metric?.value,
    metric_change: metric?.change,
    action,
    generated_at: new Date().toISOString(),
  }
}

// ══════════════════════════════════════
// GENERATE INSIGHTS FOR STORE
// ══════════════════════════════════════

export function generateStoreInsights(storeId: string, period?: string): KPIInsight[] {
  const p = period || getCurrentPeriod()
  const summary = getStoreKPISummary(storeId, p)
  const lb = getLeaderboard(storeId, p)
  const atRisk = identifyAtRiskEmployees(storeId)
  const insights: KPIInsight[] = []

  // 1. Excellence count
  const excCount = summary.grade_distribution.excellent
  if (excCount > 0) {
    insights.push(mkInsight(
      'celebration', 'high', '🎉',
      `${excCount} nhân viên Xuất sắc`,
      TEMPLATES.EXCELLENCE_COUNT(excCount, summary.score_change > 0 ? 1 : 0),
      { label: 'Xem chi tiết', href: '/kpi/leaderboard' },
    ))
  }

  // 2. Top performer streak
  const streaker = lb.streaks.find(s => s.streak_months >= 3)
  if (streaker) {
    insights.push(mkInsight(
      'achievement', 'high', '🔥',
      `${streaker.name} — Top liên tiếp`,
      TEMPLATES.TOP_STREAK(streaker.name, streaker.streak_months),
      { label: 'Xem leaderboard', href: '/kpi/leaderboard' },
    ))
  }

  // 3. Score improvement
  if (summary.score_change > 0) {
    insights.push(mkInsight(
      'trend', 'medium', '📈',
      'Điểm TB cải thiện',
      `Điểm TB store: ${summary.average_score} (↑${summary.score_change} so với tháng trước)`,
      { label: 'Xem báo cáo', href: '/kpi/reports' },
      { value: summary.average_score, change: summary.score_change },
    ))
  }

  // 4. At-risk employees
  if (atRisk.length > 0) {
    const names = atRisk.slice(0, 3).map(r => r.name).join(', ')
    insights.push(mkInsight(
      'warning', atRisk.some(r => r.risk_level === 'high') ? 'high' : 'medium', '⚠️',
      TEMPLATES.AT_RISK(atRisk.length),
      `Cần hỗ trợ: ${names}`,
      { label: 'Xem và lên kế hoạch', href: '/kpi/reports' },
    ))
  }

  // 5. Pending reviews
  const pendingCount = mockEvaluations.filter(
    e => e.store_id === storeId && e.period === p && e.status === 'self_submitted',
  ).length
  if (pendingCount > 0) {
    insights.push(mkInsight(
      'action_needed', 'high', '📋',
      TEMPLATES.PENDING_REVIEW(pendingCount),
      `${pendingCount} nhân viên đã gửi tự đánh giá, chờ review`,
      { label: 'Review ngay', href: '/kpi/review' },
    ))
  }

  // 6. Promotion ready
  summary.promotion_ready.forEach(pr => {
    insights.push(mkInsight(
      'action_needed', 'medium', '🎯',
      TEMPLATES.PROMO_READY(pr.name),
      `${pr.name} đủ điều kiện thăng tiến (xác suất ${pr.probability}%)`,
      { label: 'Xem hồ sơ', href: '/kpi/promotion' },
    ))
  })

  // 7. Weakest category
  const weakest = summary.category_performance.find(c => c.weakest_area)
  if (weakest && weakest.average < 80) {
    insights.push(mkInsight(
      'trend', 'low', '💡',
      TEMPLATES.CATEGORY_WEAK(weakest.name),
      `${weakest.name}: điểm TB ${weakest.average}`,
      { label: 'Xem phân tích', href: '/kpi/reports' },
    ))
  }

  // 8. Violation spike
  if (summary.violation_summary.change > 0 && summary.violation_summary.total > 3) {
    const pct = summary.violation_summary.total > 0
      ? Math.round((summary.violation_summary.change / Math.max(summary.violation_summary.total - summary.violation_summary.change, 1)) * 100)
      : 0
    insights.push(mkInsight(
      'warning', 'medium', '🚨',
      TEMPLATES.VIOLATION_SPIKE(pct),
      `${summary.violation_summary.total} lỗi tháng này (↑${summary.violation_summary.change})`,
      { label: 'Xem vi phạm', href: '/kpi/violations' },
    ))
  }

  return insights.sort((a, b) => {
    const prio = { high: 0, medium: 1, low: 2 }
    return prio[a.priority] - prio[b.priority]
  })
}

// ══════════════════════════════════════
// ROLE-BASED INSIGHTS
// ══════════════════════════════════════

export function getInsightsForRole(
  role: 'ceo' | 'store_manager' | 'shift_leader' | 'employee',
  userId: string,
  storeId: string,
): KPIInsight[] {
  const period = getCurrentPeriod()

  if (role === 'ceo') {
    // Aggregate insights across all stores
    const allInsights: KPIInsight[] = []
    const stores = ['store-001', 'store-002', 'store-003']
    stores.forEach(sid => {
      allInsights.push(...generateStoreInsights(sid, period))
    })
    return allInsights
      .sort((a, b) => {
        const prio = { high: 0, medium: 1, low: 2 }
        return prio[a.priority] - prio[b.priority]
      })
      .slice(0, 8)
  }

  if (role === 'store_manager' || role === 'shift_leader') {
    return generateStoreInsights(storeId, period)
  }

  // Employee — personal insights
  const insights: KPIInsight[] = []
  const peer = compareWithPeers(userId, period)

  // My rank
  if (peer.rank > 0) {
    insights.push(mkInsight(
      peer.rank <= 3 ? 'achievement' : 'trend',
      peer.rank <= 3 ? 'high' : 'medium',
      peer.rank <= 3 ? '🏆' : '📍',
      `Xếp hạng #${peer.rank}/${peer.total}`,
      `Điểm: ${peer.my_score} | TB store: ${peer.peer_average} | Top ${peer.percentile}%`,
      { label: 'Xem leaderboard', href: '/kpi/leaderboard' },
    ))
  }

  // Self eval pending
  const myEval = mockEvaluations.find(e => e.employee_id === userId && e.period === period)
  if (myEval?.status === 'draft') {
    insights.push(mkInsight(
      'action_needed', 'high', '📝',
      'Chưa hoàn thành tự đánh giá',
      'Hãy tự đánh giá KPI tháng này trước deadline',
      { label: 'Tự đánh giá ngay', href: '/kpi/evaluate' },
    ))
  }

  if (myEval?.status === 'published') {
    insights.push(mkInsight(
      'celebration', 'high', '📊',
      'Kết quả đã công bố!',
      `Điểm tháng này: ${myEval.total_score} (${myEval.grade_code})`,
      { label: 'Xem kết quả', href: '/kpi/result' },
    ))
  }

  // Promotion check
  const promo = mockPromotionReviews.find(r => r.employee_id === userId && r.status === 'pending')
  if (promo) {
    insights.push(mkInsight(
      'achievement', 'high', '🚀',
      'Đủ điều kiện thăng tiến!',
      `Hồ sơ đang chờ duyệt (L${promo.current_level.slice(1)} → L${promo.target_level.slice(1)})`,
      { label: 'Xem hồ sơ', href: '/kpi/result' },
    ))
  }

  return insights
}

// ══════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════

export interface KPINotification {
  id: string
  icon: string
  message: string
  time: string
  read: boolean
  href?: string
}

export function getKPINotifications(userId: string, role: string): KPINotification[] {
  const period = getCurrentPeriod()
  const notifs: KPINotification[] = []
  let nid = 0

  const myEval = mockEvaluations.find(e => e.employee_id === userId && e.period === period)

  if (role === 'employee' || role === 'shift_leader') {
    if (myEval?.status === 'draft') {
      notifs.push({ id: `n-${++nid}`, icon: '📋', message: 'Hãy hoàn thành tự đánh giá KPI tháng này', time: '1 giờ trước', read: false, href: '/kpi/evaluate' })
    }
    if (myEval?.status === 'published') {
      notifs.push({ id: `n-${++nid}`, icon: '🎉', message: `KPI tháng ${period.slice(5)} đã công bố: ${myEval.total_score} điểm`, time: '2 giờ trước', read: false, href: '/kpi/result' })
    }
  }

  if (['store_manager', 'ceo'].includes(role)) {
    const pending = mockEvaluations.filter(e => e.period === period && e.status === 'self_submitted').length
    if (pending > 0) {
      notifs.push({ id: `n-${++nid}`, icon: '📋', message: `${pending} đánh giá chờ review`, time: '30 phút trước', read: false, href: '/kpi/review' })
    }
    const appeals = mockEvaluations.filter(e => e.status === 'appealed').length
    if (appeals > 0) {
      notifs.push({ id: `n-${++nid}`, icon: '⚖️', message: `${appeals} khiếu nại KPI chờ xử lý`, time: '1 giờ trước', read: false, href: '/kpi/review' })
    }
    const promos = mockPromotionReviews.filter(r => r.status === 'pending').length
    if (promos > 0) {
      notifs.push({ id: `n-${++nid}`, icon: '🚀', message: `${promos} hồ sơ thăng tiến chờ duyệt`, time: '3 giờ trước', read: false, href: '/kpi/promotion' })
    }
  }

  return notifs
}
