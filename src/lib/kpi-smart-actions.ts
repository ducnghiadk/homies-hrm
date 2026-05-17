// =============================================
// HRM Trà Sữa 🧋 — Smart Action Suggestions
// Phase 3F-UX: Upgrade 8
// =============================================

import { mockEvaluations, getCurrentPeriod, mockViolationRecords, mockPromotionReviews } from '@/lib/mock-data-kpi'
import { getEvaluationTimeline } from '@/lib/mock-data-kpi'

export interface SmartAction {
  id: string
  type: 'urgent' | 'reminder' | 'celebration' | 'suggestion'
  priority: number
  title: string
  description: string
  icon: string
  color: 'red' | 'amber' | 'green' | 'blue'
  action: { label: string; href: string }
  dismissable: boolean
}

export function getSmartActions(
  userId: string,
  role: 'employee' | 'store_manager' | 'shift_leader' | 'ceo',
  storeId?: string,
): SmartAction[] {
  const actions: SmartAction[] = []
  const today = new Date().getDate()
  const period = getCurrentPeriod()
  const timeline = getEvaluationTimeline()
  const selfEvalPhase = timeline.find(p => p.phase === 'self_evaluation')
  const reviewPhase = timeline.find(p => p.phase === 'review')

  // === EMPLOYEE ACTIONS ===
  if (role === 'employee') {
    // Urgent: self-evaluation not submitted during self_evaluation period
    if (selfEvalPhase && today >= selfEvalPhase.start_day && today <= selfEvalPhase.end_day) {
      const myEval = mockEvaluations.find(e => e.employee_id === userId && e.period === period)
      if (!myEval || myEval.status === 'draft') {
        const daysLeft = selfEvalPhase.end_day - today
        actions.push({
          id: 'self-eval-pending',
          type: 'urgent',
          priority: 1,
          title: 'Hoàn thành tự đánh giá',
          description: `Còn ${daysLeft} ngày để hoàn thành`,
          icon: '📝',
          color: daysLeft <= 2 ? 'red' : 'amber',
          action: { label: 'Đánh giá ngay', href: '/kpi/evaluate' },
          dismissable: false,
        })
      }
    }

    // Reminder: new violations
    const newViolations = mockViolationRecords.filter(
      v => v.employee_id === userId && v.status === 'pending'
    )
    if (newViolations.length > 0) {
      actions.push({
        id: 'new-violations',
        type: 'reminder',
        priority: 2,
        title: `${newViolations.length} lỗi mới được ghi nhận`,
        description: 'Xem chi tiết và phản hồi nếu cần',
        icon: '⚠️',
        color: 'amber',
        action: { label: 'Xem lỗi', href: '/kpi/violations' },
        dismissable: true,
      })
    }

    // Celebration: good KPI result
    const myResult = mockEvaluations.find(
      e => e.employee_id === userId && e.period === period && e.status === 'published'
    )
    if (myResult && myResult.total_score && myResult.total_score >= 85) {
      actions.push({
        id: 'kpi-celebration',
        type: 'celebration',
        priority: 5,
        title: `KPI đạt ${Math.round(myResult.total_score)} điểm! 🎉`,
        description: 'Tiếp tục phát huy nhé!',
        icon: '🚀',
        color: 'green',
        action: { label: 'Xem chi tiết', href: '/kpi/result' },
        dismissable: true,
      })
    }
  }

  // === MANAGER / CEO ACTIONS ===
  if (role === 'store_manager' || role === 'shift_leader' || role === 'ceo') {
    // Urgent: pending reviews
    const pendingReviews = mockEvaluations.filter(e =>
      e.period === period && e.status === 'self_submitted' &&
      (role === 'ceo' || e.store_id === storeId)
    ).length
    if (pendingReviews > 0) {
      actions.push({
        id: 'pending-reviews',
        type: 'urgent',
        priority: 1,
        title: `${pendingReviews} đánh giá chờ review`,
        description: 'Hoàn thành trước deadline',
        icon: '📋',
        color: 'amber',
        action: { label: 'Review ngay', href: '/kpi/review' },
        dismissable: false,
      })
    }

    // Urgent: pending appeals
    const pendingAppeals = mockViolationRecords.filter(
      v => v.status === 'appealed' && (role === 'ceo' || v.store_id === storeId)
    ).length
    if (pendingAppeals > 0) {
      actions.push({
        id: 'pending-appeals',
        type: 'urgent',
        priority: 2,
        title: `${pendingAppeals} khiếu nại chờ xử lý`,
        description: 'Xử lý trong vòng 48h',
        icon: '⚖️',
        color: 'red',
        action: { label: 'Xét duyệt', href: '/kpi/violations/appeals' },
        dismissable: false,
      })
    }

    // Suggestion: at-risk employees (KPI < 70)
    const lowPerformers = mockEvaluations.filter(e =>
      e.period === period && e.total_score != null && e.total_score < 70 &&
      (role === 'ceo' || e.store_id === storeId)
    ).length
    if (lowPerformers > 0) {
      actions.push({
        id: 'at-risk-employees',
        type: 'suggestion',
        priority: 3,
        title: `${lowPerformers} nhân viên cần hỗ trợ`,
        description: 'KPI dưới 70 — cần kèm cặp',
        icon: '👥',
        color: 'blue',
        action: { label: 'Xem danh sách', href: '/kpi/reports' },
        dismissable: true,
      })
    }

    // Reminder: promotion ready
    const promotionReady = mockPromotionReviews.filter(p => p.status === 'pending').length
    if (promotionReady > 0) {
      actions.push({
        id: 'promotion-ready',
        type: 'reminder',
        priority: 4,
        title: `${promotionReady} NV đủ điều kiện thăng tiến`,
        description: 'Review và đề xuất',
        icon: '🎯',
        color: 'green',
        action: { label: 'Xem xét', href: '/kpi/promotion' },
        dismissable: true,
      })
    }

    // Suggestion: end-of-shift logging (in review phase)
    if (reviewPhase && today >= reviewPhase.start_day && today <= reviewPhase.end_day) {
      actions.push({
        id: 'batch-violation',
        type: 'suggestion',
        priority: 5,
        title: 'Log lỗi cuối ca nhanh',
        description: 'Ghi nhận lỗi nhiều NV cùng lúc',
        icon: '📋',
        color: 'blue',
        action: { label: 'Log ngay', href: '/kpi/violations/batch' },
        dismissable: true,
      })
    }
  }

  return actions.sort((a, b) => a.priority - b.priority)
}
