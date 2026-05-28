// ============================================
// HRM Trà Sữa 🧋 — Staffing Calculator Engine
// ============================================

import { mockPositions, mockShifts, mockEmployees } from './mock-data'
import { updateRequirement } from './mock-data-staffing'

// ─── Types ───

export type StoreType = 'takeaway' | 'dine_in' | 'both'

export type StoreProfile = {
  store_id: string
  open_time: string   // "07:00"
  close_time: string  // "23:00"
  store_type: StoreType
  tables: number      // 0 for takeaway
  area_sqm: number
}

export type TimeSlot = {
  label: string
  start: string
  end: string
}

export const TIME_SLOTS: TimeSlot[] = [
  { label: '7-9h', start: '07:00', end: '09:00' },
  { label: '9-11h', start: '09:00', end: '11:00' },
  { label: '11-14h', start: '11:00', end: '14:00' },
  { label: '14-17h', start: '14:00', end: '17:00' },
  { label: '17-21h', start: '17:00', end: '21:00' },
  { label: '21-23h', start: '21:00', end: '23:00' },
]

export type DayGroup = 'weekday' | 'friday' | 'saturday' | 'sunday'
export const DAY_GROUPS: { key: DayGroup; label: string }[] = [
  { key: 'weekday', label: 'T2-T5' },
  { key: 'friday', label: 'T6' },
  { key: 'saturday', label: 'T7' },
  { key: 'sunday', label: 'CN' },
]

// Customer forecast: orders per time slot per day group
export type CustomerForecast = Record<string, Record<DayGroup, number>>
// key = time slot label, e.g. "7-9h"

export type ForecastInputMethod = 'manual' | 'auto' | 'pos'

export type ProductivityStandard = {
  position_id: string
  position_name: string
  value: number
  unit: string // "đơn/giờ", "bàn/người"
  min: number
  max: number
  is_fixed: boolean // Shift Leader = fixed
}

export type ShrinkageFactors = {
  absence_rate: number     // 0.15 = 15%
  peak_buffer: number      // 0.20 = 20%
  training_overhead: number // 0.10 = 10%
}

export type ShiftResult = {
  shift_id: string
  shift_name: string
  shift_hours: number
  positions: PositionResult[]
  total: number
}

export type PositionResult = {
  position_id: string
  position_name: string
  count: number
  reasoning: string[] // step-by-step calculation
}

export type FTPTSplit = {
  total_weekly_hours: number
  total_monthly_hours: number
  fulltime_count: number
  fulltime_hours_week: number
  parttime_count: number
  parttime_hours_week: number
  priority: 'stable' | 'cost' | 'flexible'
  ratio_ft: number // 0-100
}

export type CostEstimate = {
  fulltime_salary: number
  parttime_salary: number
  insurance: number     // BHXH+BHYT 21%
  total: number
  revenue: number       // input for % calc
  percent_revenue: number
  benchmark_min: number // 20%
  benchmark_max: number // 30%
  status: 'good' | 'warning' | 'danger'
}

export type OptimizationSuggestion = {
  type: 'cost_high' | 'shortage' | 'comparison' | 'cross_train'
  icon: string
  title: string
  description: string
}

export type IndustryTemplate = {
  id: string
  name: string
  description: string
  ratios: Record<string, number> // position_id → productivity value
  units: Record<string, string>  // position_id → unit
  has_server: boolean
}

export type StaffingCalculation = {
  id: string
  store_id: string
  store_name: string
  created_at: string
  profile: StoreProfile
  forecast: CustomerForecast
  forecast_method: ForecastInputMethod
  standards: ProductivityStandard[]
  factors: ShrinkageFactors
  results: ShiftResult[]
  split: FTPTSplit
  cost: CostEstimate
  suggestions: OptimizationSuggestion[]
  applied: boolean
}

// ─── Industry Templates ───

export const industryTemplates: IndustryTemplate[] = [
  {
    id: 'tpl-001', name: 'Trà sữa take-away',
    description: 'Chủ yếu mang đi, tốc độ phục vụ nhanh',
    ratios: { 'pos-001': 30, 'pos-002': 45 },
    units: { 'pos-001': 'đơn/giờ', 'pos-002': 'đơn/giờ' },
    has_server: false,
  },
  {
    id: 'tpl-002', name: 'Trà sữa dine-in',
    description: 'Có chỗ ngồi, cần phục vụ bàn',
    ratios: { 'pos-001': 25, 'pos-002': 40, 'pos-003': 8 },
    units: { 'pos-001': 'đơn/giờ', 'pos-002': 'đơn/giờ', 'pos-003': 'bàn/người' },
    has_server: true,
  },
  {
    id: 'tpl-003', name: 'Coffee shop',
    description: 'Pha chế phức tạp hơn, tốc độ chậm hơn',
    ratios: { 'pos-001': 20, 'pos-002': 35 },
    units: { 'pos-001': 'đơn/giờ', 'pos-002': 'đơn/giờ' },
    has_server: false,
  },
  {
    id: 'tpl-004', name: 'Fast food',
    description: 'Tốc độ cao, quy trình chuẩn hóa',
    ratios: { 'pos-001': 50, 'pos-002': 60 },
    units: { 'pos-001': 'đơn/giờ', 'pos-002': 'đơn/giờ' },
    has_server: false,
  },
  {
    id: 'tpl-005', name: 'Restaurant',
    description: 'Full service, cần nhiều server',
    ratios: { 'pos-001': 15, 'pos-002': 30, 'pos-003': 5 },
    units: { 'pos-001': 'đơn/giờ', 'pos-002': 'đơn/giờ', 'pos-003': 'bàn/người' },
    has_server: true,
  },
]

// ─── Default Standards ───

export function getDefaultStandards(): ProductivityStandard[] {
  return [
    { position_id: 'pos-001', position_name: 'Pha chế', value: 25, unit: 'đơn/giờ', min: 15, max: 40, is_fixed: false },
    { position_id: 'pos-002', position_name: 'Thu ngân', value: 40, unit: 'đơn/giờ', min: 30, max: 60, is_fixed: false },
    { position_id: 'pos-003', position_name: 'Phục vụ', value: 6, unit: 'bàn/người', min: 4, max: 10, is_fixed: false },
    { position_id: 'pos-004', position_name: 'Phó quản lý', value: 1, unit: 'người/ca', min: 1, max: 1, is_fixed: true },
  ]
}

export const defaultFactors: ShrinkageFactors = {
  absence_rate: 0.15,
  peak_buffer: 0.20,
  training_overhead: 0.10,
}

// ─── Standard F&B Distribution Pattern ───
// Relative weight per time slot (sums to ~1.0 for a full day)

const FB_PATTERN: Record<string, number> = {
  '7-9h': 0.12,
  '9-11h': 0.06,
  '11-14h': 0.28,
  '14-17h': 0.12,
  '17-21h': 0.35,
  '21-23h': 0.07,
}

/** Auto-distribute total daily customers across time slots */
export function distributeCustomers(
  totalPerDay: number,
  weekendBoost: number, // 0.5 = +50%
): CustomerForecast {
  const forecast: CustomerForecast = {}

  TIME_SLOTS.forEach(slot => {
    const weight = FB_PATTERN[slot.label] || 0.1
    const weekdayCount = Math.round(totalPerDay * weight)

    forecast[slot.label] = {
      weekday: weekdayCount,
      friday: Math.round(weekdayCount * (1 + weekendBoost * 0.5)),
      saturday: Math.round(weekdayCount * (1 + weekendBoost)),
      sunday: Math.round(weekdayCount * (1 + weekendBoost * 0.9)),
    }
  })

  return forecast
}

/** Create empty forecast for manual input */
export function createEmptyForecast(): CustomerForecast {
  const forecast: CustomerForecast = {}
  TIME_SLOTS.forEach(slot => {
    forecast[slot.label] = { weekday: 0, friday: 0, saturday: 0, sunday: 0 }
  })
  return forecast
}

// ─── Core Calculation ───

/** Get hours for a shift */
function shiftHours(shiftId: string): number {
  const shift = mockShifts.find(s => s.id === shiftId)
  if (!shift) return 0
  const [sh, sm] = shift.start_time.split(':').map(Number)
  const [eh, em] = shift.end_time.split(':').map(Number)
  return (eh + em / 60) - (sh + sm / 60)
}

/** Map a time slot to which shift it primarily belongs */
function getShiftForSlot(slotLabel: string): string {
  const slotMap: Record<string, string> = {
    '7-9h': 'shift-001',   // Sáng
    '9-11h': 'shift-001',
    '11-14h': 'shift-001',
    '14-17h': 'shift-002', // Chiều
    '17-21h': 'shift-002',
    '21-23h': 'shift-003', // Tối
  }
  return slotMap[slotLabel] || 'shift-001'
}

/** Get slot duration in hours */
function slotDuration(slot: TimeSlot): number {
  const [sh] = slot.start.split(':').map(Number)
  const [eh] = slot.end.split(':').map(Number)
  return eh - sh
}

/** Calculate staffing needs from inputs */
export function calculateStaffingNeeds(
  profile: StoreProfile,
  forecast: CustomerForecast,
  standards: ProductivityStandard[],
  factors: ShrinkageFactors,
): ShiftResult[] {
  // Aggregate orders per shift (use weekday average + peak consideration)
  const shiftOrders: Record<string, { total: number; peak: number; peakSlot: string }> = {}

  mockShifts.forEach(shift => {
    shiftOrders[shift.id] = { total: 0, peak: 0, peakSlot: '' }
  })

  // Sum orders per shift using Saturday (peak day) for sizing
  TIME_SLOTS.forEach(slot => {
    const shiftId = getShiftForSlot(slot.label)
    const counts = forecast[slot.label]
    if (!counts) return

    // Use max of all day groups for peak planning
    const peakCount = Math.max(counts.weekday, counts.friday, counts.saturday, counts.sunday)
    const avgCount = Math.round((counts.weekday * 4 + counts.friday + counts.saturday + counts.sunday) / 7)

    shiftOrders[shiftId].total += avgCount * slotDuration(slot)

    // Track peak slot within shift
    const hourlyPeak = peakCount / slotDuration(slot)
    if (hourlyPeak > shiftOrders[shiftId].peak) {
      shiftOrders[shiftId].peak = hourlyPeak
      shiftOrders[shiftId].peakSlot = slot.label
    }
  })

  return mockShifts.map(shift => {
    const hours = shiftHours(shift.id)
    const orderData = shiftOrders[shift.id]

    const positions: PositionResult[] = standards.map(std => {
      if (std.is_fixed) {
        return {
          position_id: std.position_id,
          position_name: std.position_name,
          count: std.value,
          reasoning: [`${std.position_name}: cố định ${std.value} người/ca`],
        }
      }

      // Server calculation uses tables, not orders
      if (std.unit === 'bàn/người' && (profile.store_type === 'dine_in' || profile.store_type === 'both')) {
        const tablesNeeded = profile.tables
        const rawServer = tablesNeeded / std.value
        const withBuffer = rawServer * (1 + factors.peak_buffer)
        const withAbsence = withBuffer * (1 + factors.absence_rate)
        const final = Math.ceil(withAbsence)

        return {
          position_id: std.position_id,
          position_name: std.position_name,
          count: final,
          reasoning: [
            `${tablesNeeded} bàn ÷ ${std.value} bàn/người = ${rawServer.toFixed(1)} người`,
            `× buffer cao điểm ${(1 + factors.peak_buffer).toFixed(2)} = ${withBuffer.toFixed(1)}`,
            `× hệ số vắng mặt ${(1 + factors.absence_rate).toFixed(2)} = ${withAbsence.toFixed(1)}`,
            `→ Làm tròn lên = ${final} người`,
          ],
        }
      }

      // Skip server for takeaway-only
      if (std.unit === 'bàn/người' && profile.store_type === 'takeaway') {
        return {
          position_id: std.position_id,
          position_name: std.position_name,
          count: 0,
          reasoning: ['Take-away → không cần phục vụ bàn'],
        }
      }

      // Order-based calculation (Barista, Cashier)
      const totalOrders = orderData.total
      const peakOrdersPerHour = orderData.peak
      const capacityPerShift = std.value * hours
      const rawNeeded = totalOrders / capacityPerShift

      // Peak adjustment: if peak hour has more orders than 1 person can handle
      const peakNeeded = peakOrdersPerHour / std.value
      const baseNeeded = Math.max(rawNeeded, peakNeeded)

      const withBuffer = baseNeeded * (1 + factors.peak_buffer)
      const withAbsence = withBuffer * (1 + factors.absence_rate)
      const withTraining = withAbsence * (1 + factors.training_overhead)
      const final = Math.max(1, Math.ceil(withTraining))

      const reasoning = [
        `Dự kiến ~${totalOrders} đơn × ${hours}h ca`,
        `${std.position_name} xử lý ${std.value} ${std.unit}`,
        `${capacityPerShift > 0 ? totalOrders : 0} ÷ ${capacityPerShift} = ${rawNeeded.toFixed(2)} người`,
      ]

      if (peakNeeded > rawNeeded) {
        reasoning.push(
          `Cao điểm ${orderData.peakSlot}: ${Math.round(peakOrdersPerHour)} đơn/h → ${peakNeeded.toFixed(2)} người`
        )
      }

      reasoning.push(
        `× buffer ${(1 + factors.peak_buffer).toFixed(2)} = ${withBuffer.toFixed(2)}`,
        `× vắng mặt ${(1 + factors.absence_rate).toFixed(2)} = ${withAbsence.toFixed(2)}`,
        `× training ${(1 + factors.training_overhead).toFixed(2)} = ${withTraining.toFixed(2)}`,
        `→ Làm tròn = ${final} người`,
      )

      return {
        position_id: std.position_id,
        position_name: std.position_name,
        count: final,
        reasoning,
      }
    }).filter(p => p.count > 0)

    return {
      shift_id: shift.id,
      shift_name: shift.name,
      shift_hours: hours,
      positions,
      total: positions.reduce((s, p) => s + p.count, 0),
    }
  })
}

// ─── FT/PT Split ───

export function calculateFTPTSplit(
  results: ShiftResult[],
  ratioFT: number, // 0-100
  ftHoursPerWeek: number,
  ptHoursPerWeek: number,
  priority: 'stable' | 'cost' | 'flexible',
): FTPTSplit {
  // Total weekly hours = sum of (shift_hours × staff_count × 7days / days_per_shift_approx)
  // Simplification: each position works 6 days/week
  const totalDailyHours = results.reduce((s, r) => s + r.shift_hours * r.total, 0)
  const totalWeeklyHours = totalDailyHours * 6.5 // avg 6.5 days coverage
  const totalMonthlyHours = totalWeeklyHours * 4

  const ftFraction = ratioFT / 100
  const ftHoursNeeded = totalWeeklyHours * ftFraction
  const ptHoursNeeded = totalWeeklyHours * (1 - ftFraction)

  const ftCount = Math.ceil(ftHoursNeeded / ftHoursPerWeek)
  const ptCount = Math.ceil(ptHoursNeeded / ptHoursPerWeek)

  return {
    total_weekly_hours: Math.round(totalWeeklyHours),
    total_monthly_hours: Math.round(totalMonthlyHours),
    fulltime_count: ftCount,
    fulltime_hours_week: ftHoursPerWeek,
    parttime_count: ptCount,
    parttime_hours_week: ptHoursPerWeek,
    priority,
    ratio_ft: ratioFT,
  }
}

// ─── Cost Estimate ───

export function estimateCost(
  split: FTPTSplit,
  revenue: number, // monthly revenue for % calc
): CostEstimate {
  // Average position salary for estimation
  const avgSalary = mockPositions
    .filter(p => ['pos-001', 'pos-002', 'pos-003'].includes(p.id))
    .reduce((s, p) => s + p.base_salary, 0) / 3

  const ftMonthlySalary = avgSalary // ~5-6M
  const ptMonthlySalary = Math.round(avgSalary * (split.parttime_hours_week / 48))

  const ftTotal = split.fulltime_count * ftMonthlySalary
  const ptTotal = split.parttime_count * ptMonthlySalary
  const insurance = Math.round(ftTotal * 0.21) // BHXH only for full-time
  const total = ftTotal + ptTotal + insurance

  const pct = revenue > 0 ? Math.round((total / revenue) * 100 * 10) / 10 : 0
  const status: CostEstimate['status'] = pct > 30 ? 'danger' : pct > 25 ? 'warning' : 'good'

  return {
    fulltime_salary: ftTotal,
    parttime_salary: ptTotal,
    insurance,
    total,
    revenue,
    percent_revenue: pct,
    benchmark_min: 20,
    benchmark_max: 30,
    status,
  }
}

// ─── Optimization Suggestions ───

export function generateSuggestions(
  results: ShiftResult[],
  cost: CostEstimate,
  storeId: string,
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = []

  // Cost too high
  if (cost.status === 'danger' || cost.status === 'warning') {
    const nightShift = results.find(r => r.shift_name.includes('Tối'))
    if (nightShift && nightShift.total > 2) {
      suggestions.push({
        type: 'cost_high',
        icon: '💡',
        title: 'Giảm nhân sự ca tối',
        description: `Có thể giảm 1 Pha chế ca tối (thấp điểm, hiện có ${nightShift.total} người)`,
      })
    }

    suggestions.push({
      type: 'cost_high',
      icon: '🔄',
      title: 'Dùng part-time thay full-time',
      description: 'Xem xét dùng part-time cho ca tối để giảm chi phí BHXH',
    })

    suggestions.push({
      type: 'cross_train',
      icon: '🎓',
      title: 'Đào tạo cross-functional',
      description: 'Thu ngân có thể hỗ trợ pha chế lúc cao điểm → giảm cần tuyển thêm',
    })
  }

  // Comparison with current staffing
  const currentEmps = mockEmployees.filter(e =>
    e.store_id === storeId && (e.role === 'employee' || e.role === 'shift_leader')
  ).length
  const recommended = results.reduce((s, r) => s + r.total, 0)

  if (recommended > currentEmps) {
    suggestions.push({
      type: 'shortage',
      icon: '⚠️',
      title: `Thiếu ${recommended - currentEmps} nhân viên`,
      description: `Hiện tại có ${currentEmps} NV, đề xuất cần ${recommended} NV`,
    })

    // Which position is shortest?
    const baristaNeeded = results.reduce((s, r) => {
      const b = r.positions.find(p => p.position_id === 'pos-001')
      return s + (b?.count || 0)
    }, 0)
    if (baristaNeeded > 3) {
      suggestions.push({
        type: 'shortage',
        icon: '🧋',
        title: 'Đặc biệt thiếu Pha chế',
        description: `Nên tuyển thêm part-time Pha chế cho khung 17-21h`,
      })
    }
  } else if (recommended < currentEmps) {
    suggestions.push({
      type: 'comparison',
      icon: '📊',
      title: `Dư ${currentEmps - recommended} nhân viên`,
      description: `Hiện tại có ${currentEmps} NV, chỉ cần ${recommended} NV. Xem xét điều chuyển.`,
    })
  } else {
    suggestions.push({
      type: 'comparison',
      icon: '✅',
      title: 'Nhân sự đúng chuẩn',
      description: `Hiện tại có ${currentEmps} NV, khớp với đề xuất ${recommended} NV`,
    })
  }

  return suggestions
}

// ─── Apply to Store ───

export function applyCalculation(storeId: string, results: ShiftResult[]) {
  results.forEach(shift => {
    shift.positions.forEach(pos => {
      updateRequirement(storeId, shift.shift_id, pos.position_id, pos.count)
    })
  })
}

// ─── Calculation History (in-memory) ───

let calcIdCounter = 0
export const calculationHistory: StaffingCalculation[] = []

export function saveCalculation(calc: Omit<StaffingCalculation, 'id' | 'created_at'>): StaffingCalculation {
  const saved: StaffingCalculation = {
    ...calc,
    id: `calc-${String(++calcIdCounter).padStart(3, '0')}`,
    created_at: new Date().toISOString(),
  }
  calculationHistory.unshift(saved) // newest first
  return saved
}

export function getCalculationHistory(storeId?: string): StaffingCalculation[] {
  if (storeId) return calculationHistory.filter(c => c.store_id === storeId)
  return calculationHistory
}

export function markCalculationApplied(calcId: string) {
  const calc = calculationHistory.find(c => c.id === calcId)
  if (calc) calc.applied = true
}

// ─── Admin Settings ───

export type AdminSettings = {
  productivity_per_hour: number  // ly/giờ, default 25
  avg_salary: number             // VNĐ/tháng, default 7_000_000
  cost_warning_pct: number       // %, default 20
}

const defaultAdminSettings: AdminSettings = {
  productivity_per_hour: 25,
  avg_salary: 7_000_000,
  cost_warning_pct: 20,
}

let _adminSettings: AdminSettings = { ...defaultAdminSettings }

export function getAdminSettings(): AdminSettings { return { ..._adminSettings } }
export function saveAdminSettings(s: AdminSettings) { _adminSettings = { ...s } }
export function resetAdminSettings() { _adminSettings = { ...defaultAdminSettings } }
export function getDefaultAdminSettings(): AdminSettings { return { ...defaultAdminSettings } }

// ─── Quick Calc Engine ───

export type QuickCalcInput = {
  cupsPerDay: number
  hoursPerDay: number
}

export type QuickCalcResult = {
  barista: number
  cashier: number
  helper: number
  perShift: number
  totalMin: number
  totalMax: number
  costMin: number
  costMax: number
}

export function quickCalc(input: QuickCalcInput): QuickCalcResult {
  const settings = getAdminSettings()
  const { cupsPerDay, hoursPerDay } = input

  // Step 1: Baristas
  const cupsPerHour = cupsPerDay / hoursPerDay
  const barista = Math.max(1, Math.ceil(cupsPerHour / settings.productivity_per_hour))

  // Step 2: Cashier
  const cashier = 1

  // Step 3: Helper
  const helper = cupsPerDay > 150 ? 1 : 0

  // Step 4: Per shift
  const perShift = barista + cashier + helper

  // Step 5: Total to hire (2 shifts × 1.2 buffer)
  const rawTotal = Math.ceil(perShift * 2 * 1.2)
  const totalMin = Math.max(rawTotal - 1, perShift + 1)
  const totalMax = rawTotal + 1

  // Step 6: Cost
  const costMin = totalMin * 6_000_000
  const costMax = totalMax * 8_000_000

  return { barista, cashier, helper, perShift, totalMin, totalMax, costMin, costMax }
}

// ─── Quick Calc Reference Table ───

export const QUICK_CALC_TABLE = [
  { range: '≤ 100', min: 0, max: 100, perShift: 2, totalMin: 3, totalMax: 4, costLabel: '20-30 triệu' },
  { range: '101-200', min: 101, max: 200, perShift: 3, totalMin: 5, totalMax: 6, costLabel: '35-45 triệu' },
  { range: '201-350', min: 201, max: 350, perShift: 4, totalMin: 7, totalMax: 8, costLabel: '50-60 triệu' },
  { range: '351-500', min: 351, max: 500, perShift: 5, totalMin: 9, totalMax: 10, costLabel: '65-75 triệu' },
  { range: '> 500', min: 501, max: 9999, perShift: 6, totalMin: 11, totalMax: 12, costLabel: '80-100 triệu' },
]

// ─── Format helpers ───

export function fmtVND(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return `${n}đ`
}
