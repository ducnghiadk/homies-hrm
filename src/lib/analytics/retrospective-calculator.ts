// Plan vs Actual comparison logic

export interface DailyStats {
  date: string
  dayOfWeek: string
  plannedHours: number
  actualHours: number
  plannedCost: number
  actualCost: number
  staffCount: number
  issues: Issue[]
}

export interface Issue {
  type: 'overtime' | 'understaffed' | 'overstaffed' | 'no_show' | 'late'
  severity: 'low' | 'medium' | 'high'
  description: string
  impact: number
}

export interface WeeklyComparison {
  weekStart: string
  weekEnd: string
  planned: {
    totalShifts: number
    totalHours: number
    totalCost: number
    ftHours: number
    ptHours: number
    byDay: DailyStats[]
  }
  actual: {
    totalShifts: number
    totalHours: number
    totalCost: number
    ftHours: number
    ptHours: number
    overtimeHours: number
    lateArrivals: number
    noShows: number
    byDay: DailyStats[]
  }
  variance: {
    hours: number
    hoursPercent: number
    cost: number
    costPercent: number
    efficiency: number
  }
}

export interface TrendData {
  weeks: { weekStart: string; value: number }[]
  direction: 'up' | 'down' | 'flat'
  changePercent: number
}

// ── Mock data generator (will be replaced with real API) ──

const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function mockDailyStats(dayOffset: number, isPlanned: boolean): DailyStats {
  const baseHours = 20 + Math.floor(Math.random() * 8)
  const variance = isPlanned ? 0 : Math.floor(Math.random() * 6) - 2
  const hours = baseHours + variance
  const costPerHour = 35000

  const issues: Issue[] = []
  if (!isPlanned && variance > 3) {
    issues.push({
      type: 'overtime',
      severity: 'medium',
      description: `+${variance}h OT ngày ${dayLabels[dayOffset]}`,
      impact: variance * costPerHour * 1.5,
    })
  }

  return {
    date: `2026-02-${17 + dayOffset}`,
    dayOfWeek: dayLabels[dayOffset],
    plannedHours: baseHours,
    actualHours: hours,
    plannedCost: baseHours * costPerHour,
    actualCost: hours * costPerHour,
    staffCount: 3 + Math.floor(Math.random() * 3),
    issues,
  }
}

export function generateMockComparison(weekOffset: number = 0): WeeklyComparison {
  const plannedDays = Array.from({ length: 7 }, (_, i) => mockDailyStats(i, true))
  const actualDays = Array.from({ length: 7 }, (_, i) => mockDailyStats(i, false))

  const planned = {
    totalShifts: 25 - weekOffset * 2,
    totalHours: plannedDays.reduce((s, d) => s + d.plannedHours, 0),
    totalCost: plannedDays.reduce((s, d) => s + d.plannedCost, 0),
    ftHours: 120 - weekOffset * 5,
    ptHours: 48 + weekOffset * 3,
    byDay: plannedDays,
  }

  const actual = {
    totalShifts: planned.totalShifts + Math.floor(Math.random() * 4) - 1,
    totalHours: actualDays.reduce((s, d) => s + d.actualHours, 0),
    totalCost: actualDays.reduce((s, d) => s + d.actualCost, 0),
    ftHours: planned.ftHours + Math.floor(Math.random() * 8) - 3,
    ptHours: planned.ptHours + Math.floor(Math.random() * 6) - 2,
    overtimeHours: 4 + Math.floor(Math.random() * 12),
    lateArrivals: Math.floor(Math.random() * 5),
    noShows: Math.floor(Math.random() * 2),
    byDay: actualDays,
  }

  const hoursDiff = actual.totalHours - planned.totalHours
  const costDiff = actual.totalCost - planned.totalCost

  return {
    weekStart: `2026-02-${17 - weekOffset * 7}`,
    weekEnd: `2026-02-${23 - weekOffset * 7}`,
    planned,
    actual,
    variance: {
      hours: hoursDiff,
      hoursPercent: planned.totalHours > 0
        ? (hoursDiff / planned.totalHours) * 100
        : 0,
      cost: costDiff,
      costPercent: planned.totalCost > 0
        ? (costDiff / planned.totalCost) * 100
        : 0,
      efficiency: 80 + Math.floor(Math.random() * 15),
    },
  }
}

export function calculateTrend(
  comparisons: WeeklyComparison[],
  metric: 'hours' | 'cost' | 'efficiency'
): TrendData {
  const weeks = comparisons.map(c => ({
    weekStart: c.weekStart,
    value: metric === 'hours'
      ? c.actual.totalHours
      : metric === 'cost'
        ? c.actual.totalCost
        : c.variance.efficiency,
  }))

  if (weeks.length < 2) {
    return { weeks, direction: 'flat', changePercent: 0 }
  }

  const first = weeks[0].value
  const last = weeks[weeks.length - 1].value
  const changePercent = first > 0 ? ((last - first) / first) * 100 : 0

  return {
    weeks,
    direction: changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'flat',
    changePercent,
  }
}
