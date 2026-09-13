// ============================================
// HRM Trà Sữa 🧋 — Labor Cost Engine
// ============================================

import {
  mockPositions, mockEmployees,
  getShiftById,
  type Schedule,
} from './mock-data'

// ─── Types ───

export type LaborCostSettings = {
  standard_hours_per_month: number
  night_rate: number       // ×1.3
  ot_rate_1: number        // ×1.5 for hours 41-48
  ot_rate_2: number        // ×2.0 for hours 49+
  weekend_rate: number     // ×2.0
  holiday_rate: number     // ×3.0
  warning_threshold: number // 0.8 = 80%
  block_threshold: number   // 1.0 = 100%
  over_budget_action: 'warning' | 'block'
  show_cost_on_schedule: boolean
  show_hourly_rate: boolean
  show_employee_income: boolean
}

export type LaborBudget = {
  id: string
  store_id: string
  weekly_budget: number
  monthly_budget: number
}

export type DailyCostBreakdown = {
  date: string
  totalHours: number
  regularHours: number
  nightHours: number
  overtimeHours: number
  holidayHours: number
  totalCost: number
  headcount: number
}

export type WeeklyCostSummary = {
  totalCost: number
  budget: number
  remaining: number
  percent: number // usage %
  totalHours: number
  daily: DailyCostBreakdown[]
}

export type EmployeeCostSummary = {
  employee_id: string
  employee_name: string
  hourly_rate: number
  totalHours: number
  regularHours: number
  overtimeHours: number
  nightHours: number
  totalCost: number
}

export type CostWarning = {
  type: 'near_budget' | 'over_budget' | 'expensive_shift'
  level: 'info' | 'warning' | 'block'
  message: string
}

// ─── Default Settings ───

export const laborCostSettings: LaborCostSettings = {
  standard_hours_per_month: 176,
  night_rate: 1.3,
  ot_rate_1: 1.5,
  ot_rate_2: 2.0,
  weekend_rate: 2.0,
  holiday_rate: 3.0,
  warning_threshold: 0.8,
  block_threshold: 1.0,
  over_budget_action: 'warning',
  show_cost_on_schedule: true,
  show_hourly_rate: false,
  show_employee_income: false,
}

// ─── Budgets ───

export const laborBudgets: LaborBudget[] = [
  { id: 'lb-001', store_id: 'store-001', weekly_budget: 20000000, monthly_budget: 80000000 },
  { id: 'lb-002', store_id: 'store-002', weekly_budget: 15000000, monthly_budget: 60000000 },
  { id: 'lb-003', store_id: 'store-003', weekly_budget: 18000000, monthly_budget: 72000000 },
]

// ─── Vietnamese Public Holidays 2026 ───

const VN_HOLIDAYS = [
  '2026-01-01', // Tết Dương lịch
  '2026-01-28', '2026-01-29', '2026-01-30', '2026-01-31', '2026-02-01', // Tết Nguyên đán
  '2026-04-30', // Giải phóng
  '2026-05-01', // Quốc tế Lao động
  '2026-09-02', // Quốc khánh
]

// ─── Helpers ───

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h + (m || 0) / 60
}

function getShiftHours(shift: { start_time: string; end_time: string }): number {
  const start = parseTime(shift.start_time)
  let end = parseTime(shift.end_time)
  if (end <= start) end += 24 // overnight
  return end - start
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  return day === 0 || day === 6
}

function isHoliday(dateStr: string): boolean {
  return VN_HOLIDAYS.includes(dateStr)
}

/** Calculate night hours within a shift (22:00-06:00) */
function getNightHours(shift: { start_time: string; end_time: string }): number {
  const start = parseTime(shift.start_time)
  let end = parseTime(shift.end_time)
  if (end <= start) end += 24

  let nightHours = 0
  // Night period: 22:00-30:00 (06:00 next day)
  const nightStart = 22
  const nightEnd = 30 // 06:00 next day

  const overlapStart = Math.max(start, nightStart)
  const overlapEnd = Math.min(end, nightEnd)
  if (overlapEnd > overlapStart) nightHours += overlapEnd - overlapStart

  // Also check 0:00-6:00 range (shifts starting before midnight)
  if (start < 6) {
    nightHours += Math.min(end, 6) - start
  }

  return Math.max(0, nightHours)
}

// ─── Core Functions ───

/** Get hourly rate for an employee based on position salary */
export function getHourlyRate(employeeId: string): number {
  const emp = mockEmployees.find(e => e.id === employeeId)
  if (!emp) return 0
  const pos = mockPositions.find(p => p.id === emp.position_id)
  if (!pos) return 0
  return Math.round(pos.base_salary / laborCostSettings.standard_hours_per_month)
}

/** Classify hours in a shift by type */
export function classifyShiftHours(
  shiftId: string,
  date: string,
  weeklyHoursSoFar = 0,
): { regular: number; night: number; overtime: number; holiday: number; total: number } {
  const shift = getShiftById(shiftId)
  if (!shift) return { regular: 0, night: 0, overtime: 0, holiday: 0, total: 0 }

  const total = getShiftHours(shift)
  const nightH = getNightHours(shift)
  const regularH = total - nightH

  // Holiday check
  if (isHoliday(date)) {
    return { regular: 0, night: 0, overtime: 0, holiday: total, total }
  }

  // Weekend check
  if (isWeekend(date)) {
    return { regular: 0, night: nightH, overtime: total - nightH, holiday: 0, total }
  }

  // OT calculation based on weekly hours
  let otHours = 0
  const newTotal = weeklyHoursSoFar + total
  if (newTotal > 40) {
    otHours = Math.min(total, newTotal - 40)
  }

  return {
    regular: Math.max(0, regularH - otHours),
    night: nightH,
    overtime: otHours,
    holiday: 0,
    total,
  }
}

/** Calculate cost for one shift assignment */
export function calculateShiftCost(
  employeeId: string,
  shiftId: string,
  date: string,
  weeklyHoursSoFar = 0,
): number {
  const rate = getHourlyRate(employeeId)
  if (rate === 0) return 0

  const hours = classifyShiftHours(shiftId, date, weeklyHoursSoFar)

  const cost =
    hours.regular * rate +
    hours.night * rate * laborCostSettings.night_rate +
    hours.overtime * rate * laborCostSettings.ot_rate_1 +
    hours.holiday * rate * laborCostSettings.holiday_rate

  return Math.round(cost)
}

/** Calculate daily cost for a store */
export function calculateDailyCost(
  storeId: string,
  date: string,
  allSchedules: Schedule[],
): DailyCostBreakdown {
  const daySchedules = allSchedules.filter(s => s.store_id === storeId && s.date === date)

  let totalCost = 0
  let totalHours = 0
  let regularHours = 0
  let nightHours = 0
  let overtimeHours = 0
  let holidayHours = 0

  daySchedules.forEach(sch => {
    const shift = getShiftById(sch.shift_id)
    if (!shift) return

    const hours = classifyShiftHours(sch.shift_id, date)
    const rate = getHourlyRate(sch.employee_id)

    totalHours += hours.total
    regularHours += hours.regular
    nightHours += hours.night
    overtimeHours += hours.overtime
    holidayHours += hours.holiday

    totalCost +=
      hours.regular * rate +
      hours.night * rate * laborCostSettings.night_rate +
      hours.overtime * rate * laborCostSettings.ot_rate_1 +
      hours.holiday * rate * laborCostSettings.holiday_rate
  })

  return {
    date,
    totalHours: Math.round(totalHours * 10) / 10,
    regularHours: Math.round(regularHours * 10) / 10,
    nightHours: Math.round(nightHours * 10) / 10,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    holidayHours: Math.round(holidayHours * 10) / 10,
    totalCost: Math.round(totalCost),
    headcount: daySchedules.length,
  }
}

/** Calculate weekly cost summary for a store */
export function calculateWeeklyCost(
  storeId: string,
  weekDates: string[],
  schedules: Schedule[],
): WeeklyCostSummary {
  const daily = weekDates.map(d => calculateDailyCost(storeId, d, schedules))
  const totalCost = daily.reduce((s, d) => s + d.totalCost, 0)
  const totalHours = daily.reduce((s, d) => s + d.totalHours, 0)

  const budgetEntry = laborBudgets.find(b => b.store_id === storeId)
  const budget = budgetEntry?.weekly_budget || 0
  const remaining = budget - totalCost
  const percent = budget > 0 ? Math.round((totalCost / budget) * 100) : 0

  return { totalCost, budget, remaining, percent, totalHours, daily }
}

/** Calculate cost per employee for the week */
export function getEmployeeWeeklyCost(
  employeeId: string,
  weekDates: string[],
  schedules: Schedule[],
): EmployeeCostSummary {
  const emp = mockEmployees.find(e => e.id === employeeId)
  const rate = getHourlyRate(employeeId)

  let totalHours = 0
  let regularHours = 0
  let overtimeHours = 0
  let nightHours = 0
  let totalCost = 0

  const empSchedules = schedules.filter(s => s.employee_id === employeeId)

  // Sort by date to track weekly OT properly
  const sorted = [...empSchedules].sort((a, b) => a.date.localeCompare(b.date))
  let weeklyHoursSoFar = 0

  sorted.forEach(sch => {
    if (!weekDates.includes(sch.date)) return
    const hours = classifyShiftHours(sch.shift_id, sch.date, weeklyHoursSoFar)

    totalHours += hours.total
    regularHours += hours.regular
    overtimeHours += hours.overtime
    nightHours += hours.night

    totalCost +=
      hours.regular * rate +
      hours.night * rate * laborCostSettings.night_rate +
      hours.overtime * rate * laborCostSettings.ot_rate_1 +
      hours.holiday * rate * laborCostSettings.holiday_rate

    weeklyHoursSoFar += hours.total
  })

  return {
    employee_id: employeeId,
    employee_name: emp?.full_name || employeeId,
    hourly_rate: rate,
    totalHours: Math.round(totalHours * 10) / 10,
    regularHours: Math.round(regularHours * 10) / 10,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    nightHours: Math.round(nightHours * 10) / 10,
    totalCost: Math.round(totalCost),
  }
}

/** By-position cost breakdown */
export function getCostByPosition(
  storeId: string,
  weekDates: string[],
  schedules: Schedule[],
): { position_id: string; position_name: string; totalHours: number; totalCost: number; percent: number }[] {
  const storeSchedules = schedules.filter(s => s.store_id === storeId && weekDates.includes(s.date))

  const posMap: Record<string, { hours: number; cost: number }> = {}

  storeSchedules.forEach(sch => {
    const emp = mockEmployees.find(e => e.id === sch.employee_id)
    if (!emp) return
    const posId = emp.position_id
    if (!posMap[posId]) posMap[posId] = { hours: 0, cost: 0 }

    const shift = getShiftById(sch.shift_id)
    if (!shift) return

    const hours = getShiftHours(shift)
    const rate = getHourlyRate(sch.employee_id)
    posMap[posId].hours += hours
    posMap[posId].cost += hours * rate // simplified for breakdown
  })

  const totalCost = Object.values(posMap).reduce((s, v) => s + v.cost, 0)

  return Object.entries(posMap).map(([posId, data]) => {
    const pos = mockPositions.find(p => p.id === posId)
    return {
      position_id: posId,
      position_name: pos?.name || posId,
      totalHours: Math.round(data.hours * 10) / 10,
      totalCost: Math.round(data.cost),
      percent: totalCost > 0 ? Math.round((data.cost / totalCost) * 100) : 0,
    }
  }).sort((a, b) => b.totalCost - a.totalCost)
}

/** Generate cost warnings */
export function checkCostWarnings(
  storeId: string,
  weekDates: string[],
  schedules: Schedule[],
): CostWarning[] {
  const summary = calculateWeeklyCost(storeId, weekDates, schedules)
  const warnings: CostWarning[] = []

  if (summary.budget > 0) {
    const ratio = summary.totalCost / summary.budget

    if (ratio >= laborCostSettings.block_threshold) {
      warnings.push({
        type: 'over_budget',
        level: laborCostSettings.over_budget_action,
        message: `Vượt ngân sách ${fmt(Math.abs(summary.remaining))} (${summary.percent}%)`,
      })
    } else if (ratio >= laborCostSettings.warning_threshold) {
      warnings.push({
        type: 'near_budget',
        level: 'warning',
        message: `Chi phí đạt ${summary.percent}% ngân sách tuần`,
      })
    }
  }

  return warnings
}

// ─── CRUD ───

export function updateCostSetting<K extends keyof LaborCostSettings>(key: K, value: LaborCostSettings[K]) {
  (laborCostSettings as Record<string, unknown>)[key] = value
}

export function updateStoreBudget(storeId: string, weeklyBudget: number) {
  const entry = laborBudgets.find(b => b.store_id === storeId)
  if (entry) {
    entry.weekly_budget = weeklyBudget
    entry.monthly_budget = weeklyBudget * 4
  } else {
    laborBudgets.push({
      id: `lb-${String(laborBudgets.length + 1).padStart(3, '0')}`,
      store_id: storeId,
      weekly_budget: weeklyBudget,
      monthly_budget: weeklyBudget * 4,
    })
  }
}

// ─── Format helper (exported for pages) ───

export function fmt(n: number): string {
  if (Math.abs(n) >= 1000000) {
    return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  }
  return n.toLocaleString('vi-VN') + 'đ'
}

export function fmtFull(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ'
}
