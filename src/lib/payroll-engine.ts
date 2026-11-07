// =============================================
// HRM Trà Sữa 🧋 — Payroll Calculation Engine
// Real calculation: Attendance → Leave → Salary
// =============================================

import {
  mockEmployees, mockPositions, mockShifts, mockStores,
  type Attendance,
  type Employee,
  type Position,
  type Store,
} from './mock-data'
import { mockRevenueByMonth, mockRevenueByStore } from './mock-data-p4'
import {
  mockBonuses, mockDeductions, mockAdvances,
  type SalarySlipData,
} from './mock-data-payroll'
import { getActivePayrollPolicy, INSURANCE_MAX_BASE } from './services/payroll-policy-service'
import { AttendanceService, type PayrollAttendanceRecord } from './services/attendance/attendance-service'
import { employeeAdapter, type PayrollEmployeeDbRow } from './adapters/employee-adapter'
import { getEffectiveHourlyRate, calculateHourlyEarnings } from './payroll/payroll-calculator'

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface PayrollInput {
  employeeId: string
  periodStart: string   // '2026-02-01'
  periodEnd: string     // '2026-02-28'
  fnbAllocations?: Record<string, FnbPayrollAllocation>
  contractType?: string
  hasInsurance?: boolean
  dependents?: number
  employee?: Employee
  position?: Position
  store?: Store
}

export interface FnbAllocationBreakdown {
  store_id: string
  store_name: string
  shift_id: string
  shift_name: string
  store_revenue: number
  store_revenue_share: number
  shift_revenue: number
  shift_points: number
  store_points: number
  service_charge_pool: number
  tip_pool: number
  store_reserve: number
  employee_points: number
  employee_share: number
}

export interface FnbPayrollAllocation {
  serviceChargePool: number
  tipPool: number
  storeReserve: number
  share: number
  points: number
  breakdown: FnbAllocationBreakdown[]
}

export interface PayrollAnomaly {
  type: string
  date?: string
  message: string
}

type PayrollInputResolved = PayrollInput & {
  attendanceSummary?: AttendanceSummaryForPayroll
}

export interface PayrollResult {
  employee_id: string
  employee_code: string
  employee_name: string
  is_resigned_employee: boolean
  is_part_time: boolean           // true nếu loại hợp đồng = ban_thoi_gian
  position: string
  store: string
  period: string

  // Attendance
  standard_days: number
  total_shifts: number
  work_days: number
  leave_days_paid: number
  leave_days_unpaid: number
  absent_days: number
  late_count: number
  soCaChoDuyet: number
  soCaChuaCheckOut: number
  total_hours: number
  split_shift_days?: number
  night_shift_shifts?: number

  // Earnings
  base_salary: number
  base_earned: number
  overtime_hours: number
  overtime_amount: number
  allowances: { name: string; amount: number }[]
  total_allowances: number
  bonuses: { name: string; amount: number }[]
  total_bonuses: number
  fnb_service_charge_pool: number
  fnb_tip_pool: number
  fnb_fnb_share: number
  fnb_allocation_points: number
  fnb_allocation_breakdown: FnbAllocationBreakdown[]
  total_earnings: number

  // Deductions
  late_deduction: number
  absent_deduction: number
  advance_deduction: number
  other_deductions: { name: string; amount: number }[]
  total_other_deductions: number
  total_deductions: number

  // Insurance
  bhxh: number
  bhyt: number
  bhtn: number
  total_insurance: number

  // Tax
  taxable_income: number
  tax: number

  // Final
  gross_salary: number
  net_salary: number
  kpi_salary?: number
  union_fee?: number
  hold_salary?: number
  return_hold_salary?: number

  // Warnings
  anomalies?: PayrollAnomaly[]
  late_incidents?: LateIncident[]
}

// ══════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════

const STANDARD_WORK_DAYS = 26
const LATE_PENALTY = 50000 // 50k per late

const OT_RATES = {
  weekday: 1.5,
  weekend: 2.0,
  holiday: 3.0,
}

// Vietnamese Public Holidays
const VN_HOLIDAYS = [
  '2026-01-01', // Tết Dương lịch
  '2026-01-28', '2026-01-29', '2026-01-30', '2026-01-31', '2026-02-01', // Tết Nguyên đán
  '2026-04-30', // Giải phóng
  '2026-05-01', // Quốc tế Lao động
  '2026-09-02', // Quốc khánh
]

export function isWeekendDay(dateStr?: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  return day === 0 || day === 6
}

export function isHolidayDay(dateStr?: string): boolean {
  if (!dateStr) return false
  return VN_HOLIDAYS.includes(dateStr)
}

// Leave types considered "paid"
const PAID_LEAVE_TYPES = ['annual', 'sick', 'wedding', 'bereavement', 'maternity']

const FNB_SHIFT_POINTS: Record<string, number> = {
  'shift-001': 0.96,
  'shift-002': 1.04,
  'shift-003': 1.08,
}

const FNB_POSITION_WEIGHTS: Record<string, number> = {
  'pos-001': 1.04,
  'pos-002': 1.02,
  'pos-003': 1.00,
  'pos-004': 1.08,
  'pos-005': 1.18,
}

function getPayrollMonth(periodStart: string): string {
  return periodStart.slice(0, 7)
}

export const DEFAULT_PAYROLL_PERIOD = '2026-02'

export function normalizePayrollPeriod(value: string | null): string {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : DEFAULT_PAYROLL_PERIOD
}

export function getPayrollPeriodBounds(period: string): {
  start: string
  end: string
  year: number
  month: string
  endDay: string
} {
  const [year, month] = period.split('-').map(Number)
  const endDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    start: `${period}-01`,
    end: `${period}-${String(endDay).padStart(2, '0')}`,
    year,
    month: String(month).padStart(2, '0'),
    endDay: String(endDay).padStart(2, '0'),
  }
}

function getStoreRevenueForPeriod(storeId: string, periodStart: string): { name: string; revenue: number } {
  const base = mockRevenueByStore.find((store) => store.store_id === storeId)
  const store = mockStores.find((item) => item.id === storeId)
  const baseRevenue = mockRevenueByStore.reduce((sum, store) => sum + store.revenue, 0)
  const monthRevenue = mockRevenueByMonth.find((item) => item.month === getPayrollMonth(periodStart))?.revenue
  const scale = baseRevenue > 0 && monthRevenue ? monthRevenue / baseRevenue : 1
  return {
    name: store?.name ?? base?.name ?? storeId,
    revenue: Math.round((base?.revenue ?? 0) * scale),
  }
}

function getShiftName(shiftId: string): string {
  return mockShifts.find((shift) => shift.id === shiftId)?.name ?? shiftId
}

function inferShiftId(employee: { position_id: string; role: string }, attendance: Attendance): string {
  if (attendance.shift_id) return attendance.shift_id
  if (employee.position_id === 'pos-001') return 'shift-001'
  if (employee.position_id === 'pos-002') return 'shift-002'
  if (employee.position_id === 'pos-003') return 'shift-003'
  if (employee.position_id === 'pos-004') return 'shift-002'
  if (employee.position_id === 'pos-005') return 'shift-001'

  const daySeed = Number(attendance.date.slice(-2)) || 1
  return mockShifts[(daySeed - 1) % mockShifts.length]?.id ?? 'shift-001'
}

function getFnbContributionPoints(employee: { position_id: string; role: string }, attendance: Attendance): number {
  const hours = attendance.total_hours > 0 ? attendance.total_hours : 8 + (attendance.overtime_hours || 0)
  const hoursWeight = Math.max(0.65, Math.min((hours || 8) / 8, 1.35))
  const punctualityWeight = attendance.status === 'late' ? 0.92 : attendance.status === 'early' ? 1.02 : 1
  const roleWeight = employee.role === 'store_manager'
    ? 1.25
    : employee.role === 'shift_leader'
      ? 1.15
      : employee.role === 'hr_admin'
        ? 0.5
        : 1
  const positionWeight = FNB_POSITION_WEIGHTS[employee.position_id] ?? 1
  const shiftWeight = FNB_SHIFT_POINTS[inferShiftId(employee, attendance)] ?? 1
  return hoursWeight * punctualityWeight * roleWeight * positionWeight * shiftWeight
}

function buildFnbPayrollAllocations(
  periodStart: string,
  periodEnd: string,
  employees: Employee[],
  attendanceRecords?: PayrollAttendanceRecord[]
): Record<string, FnbPayrollAllocation> {
  const policy = getActivePayrollPolicy()
  if (policy.fnb.serviceChargePoolRate <= 0 || policy.fnb.tipPoolRate <= 0) return {}

  const activeEmployees = employees.filter((e) => e.status !== 'inactive' && e.role !== 'ceo')
  const employeeMap = new Map(activeEmployees.map((employee) => [employee.id, employee]))
  const storePointTotals = new Map<string, number>()
  const shiftBuckets = new Map<string, {
    storeId: string
    storeName: string
    shiftId: string
    shiftName: string
    storeRevenue: number
    totalPoints: number
    employeePoints: Map<string, number>
  }>()

  for (const attendance of attendanceRecords ?? AttendanceService.getLocalAttendanceRecordsForPeriod(periodStart, periodEnd)) {
    if (attendance.status !== 'on_time' && attendance.status !== 'late' && attendance.status !== 'early') continue

    const employee = employeeMap.get(attendance.employee_id)
    if (!employee) continue

    const storeId = attendance.store_id || employee.store_id
    const storeRevenueInfo = getStoreRevenueForPeriod(storeId, periodStart)
    const shiftId = inferShiftId(employee, attendance)
    const shiftName = getShiftName(shiftId)
    const points = getFnbContributionPoints(employee, attendance)
    if (points <= 0) continue

    const bucketKey = `${storeId}:${shiftId}`
    const bucket = shiftBuckets.get(bucketKey) ?? {
      storeId,
      storeName: storeRevenueInfo.name,
      shiftId,
      shiftName,
      storeRevenue: storeRevenueInfo.revenue,
      totalPoints: 0,
      employeePoints: new Map<string, number>(),
    }

    bucket.totalPoints += points
    bucket.employeePoints.set(employee.id, (bucket.employeePoints.get(employee.id) ?? 0) + points)
    shiftBuckets.set(bucketKey, bucket)
    storePointTotals.set(storeId, (storePointTotals.get(storeId) ?? 0) + points)
  }

  const allocations: Record<string, FnbPayrollAllocation> = {}

  for (const bucket of shiftBuckets.values()) {
    const storePoints = storePointTotals.get(bucket.storeId) ?? 0
    const storeRevenueShare = storePoints > 0 ? bucket.totalPoints / storePoints : 0
    const shiftRevenue = Math.round(bucket.storeRevenue * storeRevenueShare)
    const serviceChargePool = Math.round(shiftRevenue * policy.fnb.serviceChargePoolRate)
    const isTipEnabled = policy.fnb.tipDistributionEnabled !== false
    const tipPool = isTipEnabled ? Math.round(serviceChargePool * policy.fnb.tipPoolRate) : 0
    const storeReserve = Math.max(0, serviceChargePool - tipPool)
    const employeeShares = Array.from(bucket.employeePoints.entries()).map(([employeeId, points]) => ({
      employeeId,
      points,
      share: bucket.totalPoints > 0 ? (tipPool * points) / bucket.totalPoints : 0,
    }))

    const roundedShares = employeeShares.map((entry) => ({ ...entry, share: Math.round(entry.share) }))
    const roundedTotal = roundedShares.reduce((sum, entry) => sum + entry.share, 0)
    const diff = tipPool - roundedTotal
    if (diff !== 0 && roundedShares.length > 0) {
      const adjustIndex = roundedShares.reduce((bestIndex, entry, index, list) =>
        entry.share > list[bestIndex].share ? index : bestIndex, 0)
      roundedShares[adjustIndex].share += diff
    }

    for (const entry of roundedShares) {
      const current = allocations[entry.employeeId] ?? {
        serviceChargePool: 0,
        tipPool: 0,
        storeReserve: 0,
        share: 0,
        points: 0,
        breakdown: [],
      }

      current.serviceChargePool += serviceChargePool
      current.tipPool += tipPool
      current.storeReserve += storeReserve
      current.share += entry.share
      current.points += entry.points
      current.breakdown.push({
        store_id: bucket.storeId,
        store_name: bucket.storeName,
        shift_id: bucket.shiftId,
        shift_name: bucket.shiftName,
        store_revenue: bucket.storeRevenue,
        store_revenue_share: storeRevenueShare,
        shift_revenue: shiftRevenue,
        shift_points: bucket.totalPoints,
        store_points: storePoints,
        service_charge_pool: serviceChargePool,
        tip_pool: tipPool,
        store_reserve: storeReserve,
        employee_points: entry.points,
        employee_share: entry.share,
      })

      allocations[entry.employeeId] = current
    }
  }

  return allocations
}

// ══════════════════════════════════════
// 1. GET EMPLOYEE BASE SALARY
// ══════════════════════════════════════

export function getEmployeeBaseSalary(employeeId: string): number {
  const emp = mockEmployees.find(e => e.id === employeeId)
  if (!emp) return 0
  const pos = mockPositions.find(p => p.id === emp.position_id)
  // Part-time: đơn giá giờ (ưu tiên hourly_rate riêng, nếu không có thì quy đổi lương tháng chức vụ ra giờ)
  if (emp.contract_type === 'ban_thoi_gian') {
    return getEffectiveHourlyRate(emp, pos, 22000)
  }
  const policyGrade = getActivePayrollPolicy().grades.find(grade => grade.id === emp.position_id)
  return policyGrade?.base_salary ?? pos?.base_salary ?? 0
}

// ══════════════════════════════════════
// 2. GET ATTENDANCE SUMMARY FOR PERIOD
// ══════════════════════════════════════

export interface LateIncident {
  date: string
  minutes: number
  penalty: number
  isExempt: boolean
  tierLabel: string
}

export interface AttendanceSummaryForPayroll {
  totalShifts: number    // Tổng số ca làm việc hợp lệ
  workDays: number       // Số ngày làm việc thực tế (distinct dates: on_time + late + early)
  leavePaid: number      // leave with paid leave_type
  leaveUnpaid: number    // unpaid leave
  absentDays: number
  lateCount: number
  overtimeHours: number
  overtimeHoursWeekday?: number
  overtimeHoursWeekend?: number
  overtimeHoursHoliday?: number
  totalHours: number
  soCaChoDuyet: number
  soCaChuaCheckOut: number
  partTimeOvertimeHours?: number
  anomalies: PayrollAnomaly[]
  lateIncidents?: LateIncident[]
  totalLatePenalty?: number
  splitShiftDays?: number
  nightShiftShifts?: number
  splitShiftDates?: string[]
  nightShiftDates?: string[]
}

export function parseTimeToHours(timeStr?: string): number | null {
  if (!timeStr) return null
  let str = timeStr.trim()
  if (str.includes('T')) {
    str = str.split('T')[1] || ''
  } else if (str.includes(' ')) {
    str = str.split(' ')[1] || ''
  }
  const parts = str.split(':')
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    if (!isNaN(h) && !isNaN(m)) {
      return h + m / 60
    }
  }
  return null
}

function summarizeAttendanceRecords(
  records: PayrollAttendanceRecord[],
  overtimeThresholdHours?: number,
): AttendanceSummaryForPayroll {
  let totalShifts = 0
  const workedDates = new Set<string>()
  let leavePaid = 0
  let leaveUnpaid = 0
  let absentDays = 0
  let lateCount = 0
  let overtimeHours = 0
  let overtimeHoursWeekday = 0
  let overtimeHoursWeekend = 0
  let overtimeHoursHoliday = 0
  let totalHours = 0
  let soCaChoDuyet = 0
  let soCaChuaCheckOut = 0
  const dailyHoursMap = new Map<string, number>()
  const anomalies: PayrollAnomaly[] = []

  for (const r of records) {
    const isPendingApproval = r.soCaChoDuyet || r.trang_thai_db === 'cho_duyet'
    const isWorkStatus = r.status === 'on_time' || r.status === 'late' || r.status === 'early'
    const isOpenShift = r.chuaCheckOut || (!r.check_out_time && isWorkStatus)
    if (isPendingApproval) {
      soCaChoDuyet++
      anomalies.push({ type: 'ca_chua_duyet', date: r.date, message: `Ca ngày ${r.date} chưa được quản lý duyệt.` })
    }
    if (isOpenShift) {
      soCaChuaCheckOut++
      anomalies.push({ type: 'quen_checkout', date: r.date, message: `Quên check-out hoặc ca ngày ${r.date} đang mở.` })
    }
    if (isPendingApproval || isOpenShift) {
      continue
    }

    const recHours = r.total_hours || 0
    const policy = getActivePayrollPolicy()
    const minShiftHours = policy.shiftRules?.minShiftHours ?? 2
    const countsAsShift = recHours >= minShiftHours || recHours === 0

    switch (r.status) {
      case 'on_time':
      case 'early':
        if (countsAsShift) totalShifts++
        if (r.date) workedDates.add(r.date)
        break
      case 'late':
        if (countsAsShift) totalShifts++
        if (r.date) workedDates.add(r.date)
        lateCount++
        break
      case 'leave':
        if (r.leave_type && PAID_LEAVE_TYPES.includes(r.leave_type)) {
          leavePaid++
        } else {
          leaveUnpaid++
        }
        break
      case 'absent':
        absentDays++
        break
    }
    const otH = r.overtime_hours || 0
    overtimeHours += otH
    if (otH > 0) {
      if (isHolidayDay(r.date)) {
        overtimeHoursHoliday += otH
      } else if (isWeekendDay(r.date)) {
        overtimeHoursWeekend += otH
      } else {
        overtimeHoursWeekday += otH
      }
    }
    totalHours += recHours
    if (r.date) {
      dailyHoursMap.set(r.date, (dailyHoursMap.get(r.date) ?? 0) + recHours)
    }
  }

  const workDays = workedDates.size > 0 ? workedDates.size : totalShifts

  let partTimeOvertimeHours = 0
  if (typeof overtimeThresholdHours === 'number' && Number.isFinite(overtimeThresholdHours) && overtimeThresholdHours > 0) {
    let totalPtOt = 0
    for (const dayHours of dailyHoursMap.values()) {
      if (dayHours > overtimeThresholdHours) {
        totalPtOt += (dayHours - overtimeThresholdHours)
      }
    }
    partTimeOvertimeHours = Math.round(totalPtOt * 100) / 100
  }

  // ── Tính chi tiết phạt đi muộn theo chính sách (Miễn phạt lần đầu & Bậc thang số phút)
  const policy = getActivePayrollPolicy()
  const lateRecords = records
    .filter(r => r.status === 'late' && !r.soCaChoDuyet && r.trang_thai_db !== 'cho_duyet' && (r.check_out_time || !r.chuaCheckOut))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const mode = policy.latePenaltyPolicy?.mode ?? 'fixed'
  const graceCount = policy.latePenaltyPolicy?.graceOccurrences ?? 2
  const fixedRate = policy.latePenaltyPolicy?.fixedAmount ?? policy.rates?.latePenaltyPerOccurrence ?? 50000
  const t1Max = policy.latePenaltyPolicy?.tier1MaxMinutes ?? 15
  const t1Amt = policy.latePenaltyPolicy?.tier1Amount ?? 20000
  const t2Max = policy.latePenaltyPolicy?.tier2MaxMinutes ?? 30
  const t2Amt = policy.latePenaltyPolicy?.tier2Amount ?? 50000
  const t3Amt = policy.latePenaltyPolicy?.tier3Amount ?? 100000

  const lateIncidents: LateIncident[] = []
  let totalLatePenalty = 0

  lateRecords.forEach((rec, idx) => {
    const occurrenceIndex = idx + 1
    const minutes = rec.late_minutes || 0
    if (occurrenceIndex <= graceCount) {
      lateIncidents.push({
        date: rec.date,
        minutes,
        penalty: 0,
        isExempt: true,
        tierLabel: `Miễn phạt (${occurrenceIndex}/${graceCount})`,
      })
    } else {
      let penalty = fixedRate
      let tierLabel = 'Phạt cố định'
      if (mode === 'tiered') {
        if (minutes <= t1Max) {
          penalty = t1Amt
          tierLabel = `Bậc 1 (≤${t1Max}p - Nhắc nhở, 0đ)`
        } else if (minutes <= t2Max) {
          penalty = t2Amt
          tierLabel = `Bậc 2 (${t1Max + 1}-${t2Max}p - Trừ 25k)`
        } else {
          if (policy.latePenaltyPolicy?.tier3HalfShiftDeduction) {
            const shiftHours = policy.shiftRules?.partTimeShiftHours ?? 5.5
            const empRate = 22000
            penalty = Math.round(shiftHours * empRate * 0.5)
            tierLabel = `Bậc 3 (>${t2Max}p - Trừ 50% ca)`
          } else {
            penalty = t3Amt
            tierLabel = `Bậc 3 (>${t2Max}p)`
          }
        }
      }
      totalLatePenalty += penalty
      lateIncidents.push({
        date: rec.date,
        minutes,
        penalty,
        isExempt: false,
        tierLabel,
      })
    }
  })

  // ── Phân tích Ca gãy & Ca đêm từ dữ liệu chấm công thực tế
  let splitShiftDays = 0
  let nightShiftShifts = 0
  const splitShiftDates: string[] = []
  const nightShiftDates: string[] = []

  const validWorkRecords = records.filter(r => {
    const isPending = r.soCaChoDuyet || r.trang_thai_db === 'cho_duyet'
    const isOpen = r.chuaCheckOut || (!r.check_out_time && (r.status === 'on_time' || r.status === 'late' || r.status === 'early'))
    return !isPending && !isOpen && ['on_time', 'late', 'early'].includes(r.status) && (r.total_hours || 0) > 0
  })

  // 1. Nhận diện ca đêm (Night Shift) theo cài đặt nightShiftStartHour
  const nightStartHour = policy.fnb?.nightShiftStartHour ?? 22
  validWorkRecords.forEach(r => {
    const outH = parseTimeToHours(r.check_out_time)
    const inH = parseTimeToHours(r.check_in_time)
    let isNight = false

    if (outH !== null) {
      if (outH >= nightStartHour || outH < 6) {
        isNight = true
      }
    } else if (inH !== null && inH >= nightStartHour) {
      isNight = true
    }

    if (isNight) {
      nightShiftShifts++
      if (r.date && !nightShiftDates.includes(r.date)) {
        nightShiftDates.push(r.date)
      }
    }
  })

  // 2. Nhận diện ca gãy (Split Shift) theo cài đặt splitShiftMinBreakHours
  const recordsByDate = new Map<string, PayrollAttendanceRecord[]>()
  validWorkRecords.forEach(r => {
    if (!r.date) return
    const list = recordsByDate.get(r.date) || []
    list.push(r)
    recordsByDate.set(r.date, list)
  })

  const minBreakHours = policy.fnb?.splitShiftMinBreakHours ?? 2
  recordsByDate.forEach((dayRecords, dateStr) => {
    if (dayRecords.length >= 2) {
      const sortedShifts = [...dayRecords].sort((a, b) => {
        const timeA = parseTimeToHours(a.check_in_time) ?? 0
        const timeB = parseTimeToHours(b.check_in_time) ?? 0
        return timeA - timeB
      })

      let hasQualifyingBreak = false
      for (let i = 0; i < sortedShifts.length - 1; i++) {
        const outPrev = parseTimeToHours(sortedShifts[i].check_out_time)
        const inNext = parseTimeToHours(sortedShifts[i + 1].check_in_time)
        if (outPrev !== null && inNext !== null) {
          const breakDuration = inNext - outPrev
          if (breakDuration >= minBreakHours) {
            hasQualifyingBreak = true
            break
          }
        } else {
          hasQualifyingBreak = true
          break
        }
      }

      if (hasQualifyingBreak) {
        splitShiftDays++
        splitShiftDates.push(dateStr)
      }
    }
  })

  return {
    totalShifts,
    workDays,
    leavePaid,
    leaveUnpaid,
    absentDays,
    lateCount,
    overtimeHours,
    overtimeHoursWeekday,
    overtimeHoursWeekend,
    overtimeHoursHoliday,
    totalHours,
    soCaChoDuyet,
    soCaChuaCheckOut,
    partTimeOvertimeHours,
    anomalies,
    lateIncidents,
    totalLatePenalty,
    splitShiftDays,
    nightShiftShifts,
    splitShiftDates,
    nightShiftDates,
  }
}

export function getPayrollAttendanceSummary(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
): AttendanceSummaryForPayroll {
  const policy = getActivePayrollPolicy()
  const otThreshold = policy.partTimeOvertimeEnabled === true
    ? ((typeof policy.partTimeOvertimeThresholdHours === 'number' && policy.partTimeOvertimeThresholdHours > 0) ? policy.partTimeOvertimeThresholdHours : 8)
    : 0
  const records = AttendanceService.getLocalAttendanceRecordsForPeriod(periodStart, periodEnd, employeeId)
  return summarizeAttendanceRecords(records, otThreshold)
}

export async function getPayrollAttendanceSummaryAsync(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
): Promise<AttendanceSummaryForPayroll> {
  const policy = getActivePayrollPolicy()
  const otThreshold = policy.partTimeOvertimeEnabled === true
    ? ((typeof policy.partTimeOvertimeThresholdHours === 'number' && policy.partTimeOvertimeThresholdHours > 0) ? policy.partTimeOvertimeThresholdHours : 8)
    : 0
  const records = await AttendanceService.getAttendanceRecordsForPeriod(periodStart, periodEnd, employeeId)
  return summarizeAttendanceRecords(records, otThreshold)
}

// ══════════════════════════════════════
// 3. CALCULATE OVERTIME
// ══════════════════════════════════════

export function calculateOvertimeAmount(
  baseSalary: number,
  overtimeHours: number,
  otType: 'weekday' | 'weekend' | 'holiday' = 'weekday',
): number {
  const policy = getActivePayrollPolicy()
  const standardDays = (typeof policy.standardDaysPerMonth === 'number' && policy.standardDaysPerMonth > 0)
    ? policy.standardDaysPerMonth
    : STANDARD_WORK_DAYS
  const standardHours = (typeof policy.standardHoursPerDay === 'number' && policy.standardHoursPerDay > 0)
    ? policy.standardHoursPerDay
    : 8
  const hourlyRate = baseSalary / standardDays / standardHours
  const rate = otType === 'weekday'
    ? (policy.rates.otWeekday || 1.5)
    : otType === 'weekend'
      ? (policy.rates.otWeekend || 2.0)
      : (policy.rates.otHoliday || 3.0)
  return Math.round(overtimeHours * hourlyRate * rate)
}

// ══════════════════════════════════════
// 4. CALCULATE INSURANCE
// ══════════════════════════════════════

export function calculateInsurance(baseSalary: number): {
  bhxh: number
  bhyt: number
  bhtn: number
  total: number
} {
  const policy = getActivePayrollPolicy()
  const maxBase = policy.legal?.maxInsuranceSalary ?? INSURANCE_MAX_BASE
  const base = Math.min(baseSalary, maxBase)
  const bhxh = Math.round(base * policy.rates.bhxhEmployee)
  const bhyt = Math.round(base * policy.rates.bhytEmployee)
  const bhtn = Math.round(base * policy.rates.bhtnEmployee)
  return { bhxh, bhyt, bhtn, total: bhxh + bhyt + bhtn }
}

// ══════════════════════════════════════
// 5. CALCULATE TAX (Progressive)
// ══════════════════════════════════════

export function calculateTax(
  taxableIncome: number,
  dependents: number = 0,
): number {
  const policy = getActivePayrollPolicy()
  const personalDeduction = policy.legal?.personalDeduction ?? 11000000
  const dependentDeduction = policy.legal?.dependentDeduction ?? 4400000
  const deduction = personalDeduction + dependents * dependentDeduction
  const income = Math.max(0, taxableIncome - deduction)

  if (income <= 0) return 0
  if (income <= 5000000) return Math.round(income * 0.05)
  if (income <= 10000000) return Math.round(250000 + (income - 5000000) * 0.1)
  if (income <= 18000000) return Math.round(750000 + (income - 10000000) * 0.15)
  if (income <= 32000000) return Math.round(1950000 + (income - 18000000) * 0.2)
  if (income <= 52000000) return Math.round(4750000 + (income - 32000000) * 0.25)
  if (income <= 80000000) return Math.round(9750000 + (income - 52000000) * 0.3)
  return Math.round(18150000 + (income - 80000000) * 0.35)
}

// ══════════════════════════════════════
// HELPERS: Allowances, Bonuses, Deductions
// ══════════════════════════════════════

function getAllowancesForEmployee(
  employeeId: string,
  _baseSalary: number,
  attendance: AttendanceSummaryForPayroll,
  employeeRecord?: Employee,
  isPartTimeEmployee?: boolean,
): { name: string; amount: number }[] {
  const emp = employeeRecord ?? mockEmployees.find(e => e.id === employeeId)
  if (!emp) return []

  const isPartTime = isPartTimeEmployee ?? emp.contract_type === 'ban_thoi_gian'
  const effectiveDays = attendance.workDays + (attendance.leavePaid || 0)

  // 1. Không đi làm ngày nào (0 ngày công, 0 giờ làm việc và 0 ngày nghỉ phép có lương) -> Không có phụ cấp
  if (attendance.workDays === 0 && (attendance.totalHours || 0) === 0 && (attendance.leavePaid || 0) === 0) {
    return []
  }

  const policy = getActivePayrollPolicy()

  // 2. Nhân viên đã thôi việc (inactive): chỉ tính phụ cấp ăn ca nếu có đi làm thực tế trong kỳ
  if (emp.status === 'inactive') {
    const mealAllowance = Math.round(attendance.workDays * policy.fnb.mealAllowancePerShift)
    return mealAllowance > 0 ? [{ name: 'F&B: Cơm ca theo ngày công', amount: mealAllowance }] : []
  }

  // 3. Nhân viên Bán thời gian (Part-time):
  // Không hưởng các phụ cấp tháng cố định của Full-time (cơm ca trọn gói, chuyên cần, điện thoại, trách nhiệm).
  // Chỉ hưởng:
  // - Cơm ca theo số ca thực tế (30k/ca)
  // - Hỗ trợ ca đêm/chốt muộn nếu có làm thêm ca đêm
  if (isPartTime) {
    const ptResult: { name: string; amount: number }[] = []
    const mealAllowance = Math.round(attendance.workDays * policy.fnb.mealAllowancePerShift)
    if (mealAllowance > 0) {
      ptResult.push({ name: 'F&B: Cơm ca theo ngày công', amount: mealAllowance })
    }

    const splitShiftRate = policy.fnb.splitShiftAllowance || 0
    const splitDays = attendance.splitShiftDays || 0
    if (splitShiftRate > 0 && splitDays > 0) {
      ptResult.push({ name: `F&B: Phụ cấp ca gãy (${splitDays} ngày)`, amount: splitDays * splitShiftRate })
    }

    const nightShiftRate = policy.fnb.nightShiftAllowance || 0
    const nightShifts = attendance.nightShiftShifts || 0
    if (nightShiftRate > 0 && nightShifts > 0) {
      ptResult.push({ name: `F&B: Phụ cấp ca đêm (${nightShifts} ca)`, amount: nightShifts * nightShiftRate })
    } else if (attendance.overtimeHours > 0 && nightShiftRate > 0) {
      ptResult.push({ name: 'F&B: Hỗ trợ ca đêm/chốt muộn', amount: nightShiftRate })
    }
    return ptResult
  }

  // 4. Nhân viên Toàn thời gian (Full-time):
  const standardDays = (typeof policy.standardDaysPerMonth === 'number' && policy.standardDaysPerMonth > 0)
    ? policy.standardDaysPerMonth
    : STANDARD_WORK_DAYS
  const result: { name: string; amount: number }[] = []
  const workRatio = Math.min(1, effectiveDays / standardDays)

  for (const allowance of policy.allowances) {
    const appliesToManagers = allowance.appliesTo.toLowerCase().includes('quản lý') || allowance.appliesTo.toLowerCase().includes('trưởng ca')
    const isManagerLevel = emp.role !== 'employee'
    if (appliesToManagers && !isManagerLevel) continue

    // Thưởng chuyên cần: chỉ hưởng nếu đi làm đủ công chuẩn và không đi muộn / vắng
    if (allowance.name.includes('chuyên cần') || allowance.name.includes('Chuyên cần')) {
      const isQualifiedAttendance = attendance.workDays >= standardDays && attendance.lateCount === 0 && attendance.absentDays === 0
      if (!isQualifiedAttendance) continue
      result.push({ name: allowance.name, amount: allowance.amount })
      continue
    }

    // Phụ cấp cơm ca tháng của full-time: tính theo tỷ lệ ngày công đi làm
    if (allowance.name.includes('Cơm ca') || allowance.name.includes('cơm ca')) {
      const mealAmount = Math.round(allowance.amount * (attendance.workDays / standardDays))
      if (mealAmount > 0) {
        result.push({ name: allowance.name, amount: mealAmount })
      }
      continue
    }

    // Các phụ cấp cố định khác (trách nhiệm, điện thoại...): nếu đi làm thiếu công thì prorate theo ngày công
    if (workRatio > 0) {
      const proratedAmount = Math.round(allowance.amount * workRatio)
      if (proratedAmount > 0) {
        result.push({ name: allowance.name, amount: proratedAmount })
      }
    }
  }

  // Hỗ trợ ca mở cửa, đóng cửa, ca đêm nếu có phát sinh ngày làm việc thực tế
  if (emp.role !== 'employee' && policy.fnb.closingShiftAllowance > 0 && attendance.workDays > 0) {
    result.push({ name: 'F&B: Phụ cấp ca đóng cửa', amount: policy.fnb.closingShiftAllowance })
  }

  if (['shift_leader', 'store_manager', 'area_manager'].includes(emp.role) && policy.fnb.openingShiftAllowance > 0 && attendance.workDays > 0) {
    result.push({ name: 'F&B: Phụ cấp ca mở cửa', amount: policy.fnb.openingShiftAllowance })
  }

  const splitShiftRate = policy.fnb.splitShiftAllowance || 0
  const splitDays = attendance.splitShiftDays || 0
  if (splitShiftRate > 0 && splitDays > 0) {
    result.push({ name: `F&B: Phụ cấp ca gãy (${splitDays} ngày)`, amount: splitDays * splitShiftRate })
  }

  const nightShiftRate = policy.fnb.nightShiftAllowance || 0
  const nightShifts = attendance.nightShiftShifts || 0
  if (nightShiftRate > 0 && nightShifts > 0) {
    result.push({ name: `F&B: Phụ cấp ca đêm (${nightShifts} ca)`, amount: nightShifts * nightShiftRate })
  } else if (attendance.overtimeHours > 0 && nightShiftRate > 0) {
    result.push({ name: 'F&B: Hỗ trợ ca đêm/chốt muộn', amount: nightShiftRate })
  }

  // Manager-level get responsibility allowance, others don't
  if (emp.role === 'employee') {
    return result.filter(r => r.name !== 'Phụ cấp trách nhiệm')
  }
  return result
}

function matchesPeriod(recordMonth: string | undefined, periodStart: string): boolean {
  if (!recordMonth) return false
  const [y, m] = periodStart.split('-')
  const mmyyyy = `${m}/${y}`
  const yyyymm = `${y}-${m}`
  return recordMonth === mmyyyy || recordMonth === yyyymm
}

function periodToMonth(periodStart: string): string {
  // '2026-02-01' → '02/2026'
  const [y, m] = periodStart.split('-')
  return `${m}/${y}`
}

function getBonusesForPeriod(
  employeeId: string,
  periodStart: string,
): { name: string; amount: number }[] {
  return mockBonuses
    .filter(b => b.employee_id === employeeId && matchesPeriod(b.month, periodStart) && b.status === 'approved')
    .map(b => ({ name: b.reason, amount: b.amount }))
}

function getAdvanceDeduction(
  employeeId: string,
  periodStart: string,
): number {
  return mockAdvances
    .filter(a => a.employee_id === employeeId && a.status === 'approved')
    .filter(a => matchesPeriod(a.created_at?.slice(0, 7), periodStart) || matchesPeriod(periodToMonth(a.created_at?.slice(0, 10)), periodStart))
    .reduce((sum, a) => sum + a.requested_amount, 0)
}

function getOtherDeductions(
  employeeId: string,
  periodStart: string,
): { name: string; amount: number }[] {
  return mockDeductions
    .filter(d => d.employee_id === employeeId && matchesPeriod(d.month, periodStart) && d.status === 'approved')
    .map(d => ({ name: `${d.type_label}: ${d.reason}`, amount: d.amount }))
}

// ══════════════════════════════════════
// 6. MAIN: CALCULATE PAYROLL
// ══════════════════════════════════════

export function calculatePayroll(input: PayrollInputResolved): PayrollResult {
  const { employeeId, periodStart, periodEnd } = input
  const policy = getActivePayrollPolicy()
  const standardDays = (typeof policy.standardDaysPerMonth === 'number' && policy.standardDaysPerMonth > 0)
    ? policy.standardDaysPerMonth
    : STANDARD_WORK_DAYS

  // ── Step 1: Employee info
  const emp = input.employee ?? mockEmployees.find(e => e.id === employeeId)
  const pos = input.position ?? mockPositions.find(p => p.id === emp?.position_id)
  const policyGrade = policy.grades.find(grade => grade.id === pos?.id)
  const isPartTime = input.contractType === 'ban_thoi_gian' || emp?.contract_type === 'ban_thoi_gian'
  let baseSalary = 0
  if (isPartTime) {
    const fallbackRate = (policy.legal?.minRegionSalary && policy.legal.minRegionSalary < 100000)
      ? policy.legal.minRegionSalary
      : 22000
    baseSalary = getEffectiveHourlyRate(emp, pos, fallbackRate, standardDays, policy.standardHoursPerDay || 8)
  } else {
    baseSalary = policyGrade?.base_salary ?? pos?.base_salary ?? 0
  }
  const storeName = input.store?.name ?? (emp ? getStoreRevenueForPeriod(emp.store_id, periodStart).name : '')

  // ── Step 2: Attendance
  const att = input.attendanceSummary ?? getPayrollAttendanceSummary(employeeId, periodStart, periodEnd)

  // ── Step 2.5: Compile anomalies
  const anomalies: PayrollAnomaly[] = att.anomalies ? [...att.anomalies] : []
  if (baseSalary <= 0) {
    if (isPartTime) {
      anomalies.push({ type: 'thieu_don_gia_gio', message: 'Nhân viên bán thời gian chưa được cài đặt đơn giá giờ (đang lấy giá trị 0đ).' })
    } else {
      anomalies.push({ type: 'thieu_luong_co_ban', message: 'Nhân viên chưa được cài đặt mức lương cơ bản (đang lấy giá trị 0đ).' })
    }
  }
  if (!input.contractType) {
    anomalies.push({ type: 'thieu_loai_hop_dong', message: 'Nhân viên chưa được gắn loại hợp đồng (Toàn thời gian/Bán thời gian).' })
  }

  // ── Step 3: Base earned & Step 4: Overtime
  let baseEarned = 0
  let overtimeAmount = 0
  let overtimeHoursToReport = att.overtimeHours
  let dailyRate = 0
  let absentDeduction = 0

  if (isPartTime) {
    const hourlyRate = baseSalary > 0 ? baseSalary : 0
    const ptOt = att.partTimeOvertimeHours ?? 0
    const ptMultiplier = (typeof policy.partTimeOvertimeMultiplier === 'number' && policy.partTimeOvertimeMultiplier > 0)
      ? policy.partTimeOvertimeMultiplier
      : 1.5
    const hourlyCalc = calculateHourlyEarnings({
      totalHours: att.totalHours,
      hourlyRate,
      overtimeHours: ptOt,
      overtimeMultiplier: ptMultiplier,
    })
    baseEarned = hourlyCalc.baseEarned
    overtimeAmount = hourlyCalc.overtimeAmount
    overtimeHoursToReport = ptOt
    dailyRate = 0
    absentDeduction = 0
  } else {
    const effectiveDays = att.workDays + att.leavePaid
    baseEarned = Math.round(baseSalary * (effectiveDays / standardDays))

    // ── Step 4: Overtime (BUG-G FIX: differentiate weekday, weekend, holiday rates)
    const otWeekday = att.overtimeHoursWeekday ?? att.overtimeHours
    const otWeekend = att.overtimeHoursWeekend ?? 0
    const otHoliday = att.overtimeHoursHoliday ?? 0
    const otWeekdayAmt = calculateOvertimeAmount(baseSalary, otWeekday, 'weekday')
    const otWeekendAmt = calculateOvertimeAmount(baseSalary, otWeekend, 'weekend')
    const otHolidayAmt = calculateOvertimeAmount(baseSalary, otHoliday, 'holiday')
    overtimeAmount = otWeekdayAmt + otWeekendAmt + otHolidayAmt
    overtimeHoursToReport = att.overtimeHours

    dailyRate = Math.round(baseSalary / standardDays)
    absentDeduction = att.absentDays * dailyRate
  }

  // ── Step 5: Allowances
  const allowances = getAllowancesForEmployee(employeeId, baseSalary, att, emp, isPartTime)
  const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0)

  // ── Step 6: Bonuses
  const bonuses = getBonusesForPeriod(employeeId, periodStart)
  const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0)

  // ── Step 6b: F&B tip/service charge allocation
  const fnbAllocations = input.fnbAllocations ?? buildFnbPayrollAllocations(periodStart, periodEnd, mockEmployees)
  const fnbAllocation = fnbAllocations[employeeId]
  const fnbShare = fnbAllocation?.share ?? 0

  // ── Step 7: Deductions
  const latePenaltyRate = (typeof policy.rates?.latePenaltyPerOccurrence === 'number' && policy.rates.latePenaltyPerOccurrence >= 0)
    ? policy.rates.latePenaltyPerOccurrence
    : LATE_PENALTY
  const lateDeduction = att.totalLatePenalty !== undefined
    ? att.totalLatePenalty
    : att.lateCount * latePenaltyRate
  const advanceDeduction = getAdvanceDeduction(employeeId, periodStart)
  const otherDeductions = getOtherDeductions(employeeId, periodStart)
  const totalOtherDeductions = otherDeductions.reduce((sum, d) => sum + d.amount, 0)
  // BUG FIX: absentDeduction is kept for reporting loss of workdays, but NOT added to totalDeductions
  // because baseEarned was already prorated by effectiveDays / standardDays (prevents double penalty)
  const totalDeductions = lateDeduction + advanceDeduction + totalOtherDeductions

  // ── Step 8: Total earnings (Gross Salary)
  const totalEarnings = baseEarned + overtimeAmount + totalAllowances + totalBonuses + fnbShare

  // ── Step 9: Insurance
  // BUG-F FIX: Under VN law, statutory insurance base excludes OT. Part-time base uses baseEarned only.
  const insuranceBase = isPartTime ? baseEarned : baseSalary
  // Theo Khoản 3 Điều 85 Luật BHXH: Người lao động không làm việc và không hưởng tiền lương từ 14 ngày làm việc trở lên trong tháng
  // (hoặc không đi làm ngày nào trong tháng: effectiveDays === 0), tháng đó không đóng BHXH.
  const effectiveDaysForInsurance = isPartTime ? att.workDays : (att.workDays + att.leavePaid)
  const isUnpaidExempt = !isPartTime && (effectiveDaysForInsurance === 0 || effectiveDaysForInsurance <= standardDays - 14)
  const shouldCalculateInsurance = (input.hasInsurance ?? (!isPartTime)) && !isUnpaidExempt
  const insurance = shouldCalculateInsurance
    ? calculateInsurance(insuranceBase)
    : { bhxh: 0, bhyt: 0, bhtn: 0, total: 0 }

  // ── Step 10: Tax & Gross definition
  // Standard Gross Salary = Total earnings before any statutory or disciplinary deductions
  // BUG-L FIX: Khấu trừ phụ cấp cơm ca không chịu thuế theo luật Thuế TNCN
  const nonTaxableAllowances = allowances
    .filter(a => a.name.includes('Cơm ca') || a.name.includes('cơm ca'))
    .reduce((sum, a) => sum + a.amount, 0)
  const grossSalary = totalEarnings
  const taxableIncome = Math.max(0, grossSalary - insurance.total - nonTaxableAllowances)
  const tax = calculateTax(taxableIncome, input.dependents ?? 0)

  // ── Step 11: Net Salary
  // Advance payment is deducted from net payout, NOT from taxable income
  const netSalary = grossSalary - insurance.total - tax - lateDeduction - totalOtherDeductions - advanceDeduction

  return {
    employee_id: employeeId,
    employee_code: emp?.employee_code ?? '',
    employee_name: emp?.full_name ?? '',
    is_resigned_employee: false,
    is_part_time: isPartTime,
    position: pos?.name ?? '',
    store: storeName,
    period: `${periodStart.slice(0, 7)}`,
    standard_days: standardDays,
    total_shifts: att.totalShifts ?? att.workDays,
    work_days: att.workDays,
    leave_days_paid: att.leavePaid,
    leave_days_unpaid: att.leaveUnpaid,
    absent_days: att.absentDays,
    late_count: att.lateCount,
    soCaChoDuyet: att.soCaChoDuyet,
    soCaChuaCheckOut: att.soCaChuaCheckOut,
    total_hours: att.totalHours,
    split_shift_days: att.splitShiftDays || 0,
    night_shift_shifts: att.nightShiftShifts || 0,
    base_salary: baseSalary,
    base_earned: baseEarned,
    overtime_hours: overtimeHoursToReport,
    overtime_amount: overtimeAmount,
    other_deductions: otherDeductions,
    total_other_deductions: totalOtherDeductions,
    total_deductions: totalDeductions,

    bhxh: insurance.bhxh,
    bhyt: insurance.bhyt,
    bhtn: insurance.bhtn,
    allowances,
    total_allowances: totalAllowances,
    bonuses,
    total_bonuses: totalBonuses,
    fnb_service_charge_pool: fnbAllocation?.serviceChargePool ?? 0,
    fnb_tip_pool: fnbAllocation?.tipPool ?? 0,
    fnb_fnb_share: fnbShare,
    fnb_allocation_points: fnbAllocation?.points ?? 0,
    fnb_allocation_breakdown: fnbAllocation?.breakdown ?? [],
    total_earnings: totalEarnings,

    late_deduction: lateDeduction,
    absent_deduction: absentDeduction,
    advance_deduction: advanceDeduction,

    total_insurance: insurance.total,

    taxable_income: taxableIncome,
    tax,

    gross_salary: grossSalary,
    net_salary: netSalary,
    kpi_salary: 0,
    union_fee: 0,
    hold_salary: 0,
    return_hold_salary: 0,
    anomalies,
    late_incidents: att.lateIncidents || [],
  }
}

// ══════════════════════════════════════
// 7. BATCH: All employees
// ══════════════════════════════════════

export function calculatePayrollBatch(
  periodStart: string,
  periodEnd: string,
): PayrollResult[] {
  const activeEmployees = mockEmployees.filter(e => {
    if (e.role === 'ceo') return false
    if (e.status === 'inactive') {
      if (!e.resign_date) return false
      return e.resign_date >= periodStart
    }
    return true
  })
  const fnbAllocations = buildFnbPayrollAllocations(periodStart, periodEnd, mockEmployees)
  return activeEmployees.map(emp =>
    // BUG-01 fix: truyền contract_type từ mock employee để isPartTime tính đúng
    calculatePayroll({
      employeeId: emp.id,
      periodStart,
      periodEnd,
      fnbAllocations,
      contractType: emp.contract_type,
    }),
  )
}

export async function calculatePayrollBatchAsync(
  periodStart: string,
  periodEnd: string,
): Promise<PayrollResult[]> {
  const payrollEmployeesResult = await employeeAdapter.getPayrollEmployees()
  if (payrollEmployeesResult.coLoi || payrollEmployeesResult.employees.length === 0) {
    const activeEmployees = mockEmployees.filter(e => {
      if (e.role === 'ceo') return false
      if (e.status === 'inactive') {
        if (!e.resign_date) return false
        return e.resign_date >= periodStart
      }
      return true
    })
    const policy = getActivePayrollPolicy()
    const otThreshold = policy.partTimeOvertimeEnabled === true
      ? ((typeof policy.partTimeOvertimeThresholdHours === 'number' && policy.partTimeOvertimeThresholdHours > 0) ? policy.partTimeOvertimeThresholdHours : 8)
      : 0
    const attendanceRecords = await AttendanceService.getAttendanceRecordsForPeriod(periodStart, periodEnd)
    const fnbAllocations = buildFnbPayrollAllocations(periodStart, periodEnd, mockEmployees, attendanceRecords)

    return activeEmployees.map(emp =>
      calculatePayroll({
        employeeId: emp.id,
        periodStart,
        periodEnd,
        fnbAllocations,
        contractType: emp.contract_type,
        attendanceSummary: summarizeAttendanceRecords(
          attendanceRecords.filter(record => record.employee_id === emp.id),
          otThreshold,
        ),
      }),
    )
  }

  const attendanceRecords = await AttendanceService.getAttendanceRecordsForPeriod(periodStart, periodEnd)
  const activeEmployeeIds = new Set(payrollEmployeesResult.employees.map(employee => employee.id))
  const payrollEligibleAttendanceEmployeeIds = new Set(
    attendanceRecords
      .filter(record => {
        const isWorkStatus = record.status === 'on_time' || record.status === 'late' || record.status === 'early'
        return Boolean(record.employee_id) && Boolean(record.check_out_time) && isWorkStatus && (record.total_hours || 0) > 0
      })
      .map(record => record.employee_id),
  )
  const supplementalEmployeeIds = Array.from(payrollEligibleAttendanceEmployeeIds)
    .filter(employeeId => !activeEmployeeIds.has(employeeId))
  const supplementalEmployeesResult = supplementalEmployeeIds.length > 0
    ? await employeeAdapter.getPayrollEmployeesByIds(supplementalEmployeeIds)
    : { employees: [], coLoi: false }
  const payrollEmployees = Array.from(
    new Map(
      [
        ...payrollEmployeesResult.employees,
        ...(supplementalEmployeesResult.coLoi ? [] : supplementalEmployeesResult.employees),
      ].map(employee => [employee.id, employee]),
    ).values(),
  ).filter(e => {
    if (e.trang_thai === 'da_nghi_viec') {
      if (!e.ngay_nghi_viec) return false
      return e.ngay_nghi_viec >= periodStart
    }
    return true
  })
  const mapDbRole = (role: string): Employee['role'] => {
    if (role === 'ban_giam_doc') return 'ceo'
    if (role === 'quan_tri_hr') return 'hr_admin'
    if (role === 'quan_ly_cua_hang' || role === 'quan_ly_khu_vuc') return 'store_manager'
    if (role === 'truong_ca') return 'shift_leader'
    return 'employee'
  }
  const getBaseSalary = (employee: PayrollEmployeeDbRow) => {
    if (employee.loai_hop_dong === 'ban_thoi_gian') {
      if (employee.muc_luong_co_ban > 0) {
        return employee.muc_luong_co_ban >= 1000000
          ? Math.round(employee.muc_luong_co_ban / 26 / 8)
          : employee.muc_luong_co_ban
      }
      return employee.chuc_vu_luong_co_ban > 0
        ? Math.round(employee.chuc_vu_luong_co_ban / 26 / 8)
        : 22500
    }
    return employee.muc_luong_co_ban > 0 ? employee.muc_luong_co_ban : employee.chuc_vu_luong_co_ban
  }

  const dbEmployees = payrollEmployees
    .map<Employee>(employee => ({
      id: employee.id,
      org_id: 'org-001',
      store_id: employee.cua_hang_id || 'store-001',
      position_id: `db-position-${employee.id}`,
      employee_code: employee.ma_nhan_vien,
      full_name: employee.ho_ten,
      phone: '',
      email: '',
      date_of_birth: '',
      gender: 'male',
      address: '',
      role: mapDbRole(employee.vai_tro),
      status: employee.trang_thai === 'thu_viec' ? 'probation' : employee.trang_thai === 'da_nghi_viec' ? 'inactive' : 'active',
      contract_type: employee.loai_hop_dong === 'ban_thoi_gian' ? 'ban_thoi_gian' : 'toan_thoi_gian',
      hourly_rate: employee.loai_hop_dong === 'ban_thoi_gian' ? getBaseSalary(employee) : undefined,
      hire_date: '',
      total_points: 0,
      gamification_level: 'bronze',
    }))
    .filter(employee => employee.role !== 'ceo')

  const dbPositions = payrollEmployees.map<Position>(employee => ({
    id: `db-position-${employee.id}`,
    org_id: 'org-001',
    name: employee.chuc_vu_ten || 'Nhân viên',
    level: employee.vai_tro === 'truong_ca' ? 2 : employee.vai_tro === 'quan_ly_cua_hang' ? 3 : 1,
    base_salary: getBaseSalary(employee),
  }))
  const dbStores = payrollEmployees.map<Store>(employee => ({
    id: employee.cua_hang_id || 'store-001',
    org_id: 'org-001',
    name: employee.cua_hang_ten || employee.cua_hang_id || 'Cửa hàng',
    address: '',
    latitude: 0,
    longitude: 0,
    checkin_radius_meters: 0,
    is_active: true,
  }))
    const policy = getActivePayrollPolicy()
    const otThreshold = policy.partTimeOvertimeEnabled === true
      ? ((typeof policy.partTimeOvertimeThresholdHours === 'number' && policy.partTimeOvertimeThresholdHours > 0) ? policy.partTimeOvertimeThresholdHours : 8)
      : 0
    const fnbAllocations = buildFnbPayrollAllocations(periodStart, periodEnd, dbEmployees, attendanceRecords)

    return dbEmployees.map(emp => {
      const payrollEmp = payrollEmployees.find(employee => employee.id === emp.id)
      const empPos = dbPositions.find(p => p.id === emp.position_id)
      const empStore = dbStores.find(s => s.id === emp.store_id)
      const result = calculatePayroll({
        employeeId: emp.id,
        periodStart,
        periodEnd,
        fnbAllocations,
        contractType: payrollEmp?.loai_hop_dong,
        hasInsurance: payrollEmp?.tham_gia_bao_hiem ?? undefined,
        dependents: payrollEmp?.so_nguoi_phu_thuoc ?? undefined,
        employee: emp,
        position: empPos,
        store: empStore,
        attendanceSummary: summarizeAttendanceRecords(
          attendanceRecords.filter(record => record.employee_id === emp.id),
          otThreshold,
        ),
      })
      return {
        ...result,
        is_resigned_employee: emp.status === 'inactive',
      }
    })
}

// ══════════════════════════════════════
// 8. GENERATE SALARY SLIP (SalarySlipData)
// ══════════════════════════════════════

let slipCounter = 100

export function generateSalarySlip(result: PayrollResult): SalarySlipData {
  const fnbAllowance = result.fnb_fnb_share > 0
    ? [{ name: 'F&B: Tip/service charge', amount: result.fnb_fnb_share }]
    : []

  return {
    id: `slip-gen-${slipCounter++}`,
    employee_id: result.employee_id,
    employee_name: result.employee_name,
    position: result.position,
    store: result.store,
    period: result.period,
    work_days: result.work_days,
    standard_days: result.standard_days,
    base_salary: result.base_earned,
    allowances: [...result.allowances, ...fnbAllowance],
    overtime_hours: result.overtime_hours,
    overtime_amount: result.overtime_amount,
    bonus: result.total_bonuses,
    total_earnings: result.total_earnings,
    late_deduction: result.late_deduction,
    advance_deduction: result.advance_deduction,
    bhxh: result.bhxh,
    bhyt: result.bhyt,
    bhtn: result.bhtn,
    tax: result.tax,
    other_deduction: result.total_other_deductions,
    total_deductions: result.total_deductions + result.total_insurance + result.tax,
    net_salary: result.net_salary,
  }
}
