// Auto-generate insights from weekly comparison data

import type { WeeklyComparison } from './retrospective-calculator'

export interface Insight {
  id: string
  type: 'saving' | 'warning' | 'improvement' | 'praise'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  metric: {
    value: number
    unit: string
    comparison?: string
  }
  action?: {
    label: string
    href?: string
  }
}

function formatCurrency(val: number): string {
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} triệu`
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}k`
  return val.toLocaleString('vi-VN') + '₫'
}

export function generateInsights(
  comparisons: WeeklyComparison[]
): Insight[] {
  if (comparisons.length === 0) return []

  const latest = comparisons[0]
  const insights: Insight[] = []

  // 1. High OT warning
  if (latest.actual.overtimeHours > 10) {
    const avgOT = comparisons.length > 1
      ? comparisons.slice(1).reduce((s, c) => s + c.actual.overtimeHours, 0) / (comparisons.length - 1)
      : latest.actual.overtimeHours
    const diff = ((latest.actual.overtimeHours - avgOT) / Math.max(avgOT, 1)) * 100

    insights.push({
      id: 'overtime-high',
      type: 'warning',
      priority: 'high',
      title: '⚠️ Giờ OT cao bất thường',
      description: `Tuần này có ${latest.actual.overtimeHours}h OT${diff > 0 ? `, cao hơn trung bình ${Math.round(diff)}%` : ''}. Nên thêm PT vào giờ cao điểm.`,
      metric: {
        value: latest.actual.overtimeHours,
        unit: 'giờ OT',
        comparison: diff > 0 ? `+${Math.round(diff)}% so với TB` : undefined,
      },
      action: { label: 'Xem chi tiết', href: '/reports/staff-hours' },
    })
  }

  // 2. Cost saving praise
  if (latest.variance.cost < 0) {
    insights.push({
      id: 'cost-saving',
      type: 'praise',
      priority: 'medium',
      title: '🎉 Tiết kiệm chi phí!',
      description: `Tuần này tiết kiệm được ${formatCurrency(Math.abs(latest.variance.cost))} so với kế hoạch.`,
      metric: {
        value: Math.abs(latest.variance.cost),
        unit: '₫',
        comparison: `${Math.abs(latest.variance.costPercent).toFixed(0)}% dưới budget`,
      },
    })
  }

  // 3. Cost over budget warning
  if (latest.variance.costPercent > 10) {
    insights.push({
      id: 'cost-over',
      type: 'warning',
      priority: 'high',
      title: '💸 Vượt ngân sách',
      description: `Chi phí thực tế vượt ${formatCurrency(latest.variance.cost)} so với kế hoạch (+${latest.variance.costPercent.toFixed(0)}%).`,
      metric: {
        value: latest.variance.cost,
        unit: '₫',
        comparison: `+${latest.variance.costPercent.toFixed(0)}% so với KH`,
      },
      action: { label: 'Xem phân tích', href: '/settings/labor-cost' },
    })
  }

  // 4. No-shows
  if (latest.actual.noShows > 0) {
    insights.push({
      id: 'no-shows',
      type: 'warning',
      priority: latest.actual.noShows >= 3 ? 'high' : 'medium',
      title: '🚫 Nhân viên vắng không phép',
      description: `Có ${latest.actual.noShows} lượt vắng không phép tuần này, gây ảnh hưởng đến vận hành.`,
      metric: { value: latest.actual.noShows, unit: 'lượt' },
      action: { label: 'Xem chi tiết', href: '/tasks/incidents' },
    })
  }

  // 5. Efficiency improvement suggestion
  if (latest.variance.efficiency < 85) {
    insights.push({
      id: 'efficiency-improve',
      type: 'improvement',
      priority: 'medium',
      title: '📊 Có thể tối ưu thêm',
      description: `Hiệu quả xếp ca đang ở ${latest.variance.efficiency}%. Tăng PT vào giờ cao điểm có thể cải thiện.`,
      metric: {
        value: latest.variance.efficiency,
        unit: '%',
        comparison: 'Mục tiêu: 90%',
      },
      action: { label: 'Phân tích chi tiết' },
    })
  }

  // 6. Praise for no understaffing
  const allIssues = latest.actual.byDay.flatMap(d => d.issues)
  const understaffed = allIssues.filter(i => i.type === 'understaffed')
  if (understaffed.length === 0) {
    insights.push({
      id: 'no-understaffing',
      type: 'praise',
      priority: 'low',
      title: '🎉 Tuyệt vời!',
      description: 'Không có ca thiếu người tuần này. Tiếp tục phát huy!',
      metric: { value: 0, unit: 'ca thiếu người' },
    })
  }

  // 7. Late arrivals
  if (latest.actual.lateArrivals >= 3) {
    insights.push({
      id: 'late-arrivals',
      type: 'improvement',
      priority: 'low',
      title: '⏰ Đi muộn nhiều',
      description: `${latest.actual.lateArrivals} lượt đi muộn tuần này. Xem xét điều chỉnh giờ ca.`,
      metric: { value: latest.actual.lateArrivals, unit: 'lượt' },
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return insights
}

// Saving opportunities
export interface SavingOpportunity {
  id: string
  description: string
  monthlySaving: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export function findSavingOpportunities(
  comparisons: WeeklyComparison[]
): SavingOpportunity[] {
  if (comparisons.length === 0) return []

  const latest = comparisons[0]
  const opportunities: SavingOpportunity[] = []

  // Check for consistently overstaffed days
  latest.actual.byDay.forEach(day => {
    if (day.actualHours > day.plannedHours + 8) {
      opportunities.push({
        id: `reduce-${day.dayOfWeek}`,
        description: `Giảm 1 FT ${day.dayOfWeek} (traffic thấp hơn dự kiến)`,
        monthlySaving: 400_000,
        difficulty: 'easy',
      })
    }
  })

  // Check for high OT that could be replaced with PT
  if (latest.actual.overtimeHours > 8) {
    opportunities.push({
      id: 'ot-to-pt',
      description: `Thay ${Math.ceil(latest.actual.overtimeHours / 4)}h OT bằng ca PT`,
      monthlySaving: Math.ceil(latest.actual.overtimeHours * 15000),
      difficulty: 'medium',
    })
  }

  return opportunities
}
