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
import {
  mockBonuses, mockDeductions, mockAdvances,
  type SalarySlipData,
} from './mock-data-payroll'
import { getActivePayrollPolicy, getPitSettingsFromPolicy, INSURANCE_MAX_BASE } from './services/payroll-policy-service'
import { calculatePit, calculateOvertimeTaxExemption } from './payroll/pit'
import { AttendanceService, type PayrollAttendanceRecord } from './services/attendance/attendance-service'
import { employeeAdapter, type PayrollEmployeeDbRow } from './adapters/employee-adapter'
import { getEffectiveHourlyRate, calculateHourlyEarnings } from './payroll/payroll-calculator'
import { careerAllowancesFor, fetchCareerPayPlans } from './career-path/payroll-link'
import { computeLatePenalties, type LatePenaltySettings } from './payroll/late-penalty'
import { EmployeeService } from './services/employee-service'

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
  /** Khoản cộng thêm tính sẵn bên ngoài (vd: cộng lương theo bậc lộ trình), chịu thuế như phụ cấp thường. */
  extraAllowances?: { name: string; amount: number; tax_exempt?: boolean }[]
  /** Thời hạn hợp đồng để xét thuế TNCN: không HĐ / dưới 3 tháng thì khấu trừ 10%, từ 3 tháng thì tính lũy tiến. */
  contractTerm?: 'khong_hop_dong' | 'duoi_3_thang' | 'tu_3_thang'
  /** Đã nộp bản cam kết mẫu 08/CK-TNCN (thu nhập cả năm chưa tới mức chịu thuế) → không khấu trừ 10%. */
  pitCommitment08?: boolean
  /** Mức lương đóng bảo hiểm do HR nhập trong hồ sơ (để trống = tính tự động). */
  insuranceSalary?: number
  /** Ngày nghỉ hằng tuần riêng của nhân viên (để trống = theo Cài đặt lương). */
  weeklyRestDays?: number[]
  /** Tổng phụ cấp ghi trong hợp đồng phải tính đóng BH (toàn thời gian). Để trống = 0. */
  contractInsuranceAllowances?: number
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
  night_hours?: number

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
  /** Số người phụ thuộc đã dùng khi tính thuế (để tính lại thuế khi thưởng/phạt thay đổi trên bảng lương). */
  pit_dependents?: number
  /** Số ngày lễ, Tết nghỉ được trả lương (toàn thời gian). */
  holiday_paid_days?: number

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

const OT_RATES = {
  weekday: 1.5,
  weekend: 2.0,
  holiday: 3.0,
}

/**
 * Ngày nghỉ hằng tuần lấy từ Cài đặt lương (0 = Chủ nhật ... 6 = Thứ Bảy).
 * Để trống = không có ngày nào được coi là ngày nghỉ tuần (tăng ca tính hệ số ngày thường).
 */
export function getPolicyWeeklyRestDays(policy?: ReturnType<typeof getActivePayrollPolicy>): Set<number> {
  const p = policy ?? getActivePayrollPolicy()
  const days = Array.isArray(p.weeklyRestDays) ? p.weeklyRestDays : []
  return new Set(days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))
}

/** Ngày nghỉ tuần của 1 nhân viên: dùng ngày riêng trong hồ sơ nếu có, không thì theo Cài đặt lương. */
export function resolveWeeklyRestDays(employeeDays?: number[], policy?: ReturnType<typeof getActivePayrollPolicy>): Set<number> {
  if (Array.isArray(employeeDays) && employeeDays.length > 0) {
    const own = new Set(employeeDays.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))
    if (own.size > 0) return own
  }
  return getPolicyWeeklyRestDays(policy)
}

export function isRestDay(dateStr: string | undefined, restDays: Set<number>): boolean {
  if (!dateStr || restDays.size === 0) return false
  const d = new Date(dateStr + 'T00:00:00')
  return restDays.has(d.getDay())
}

/** Số giờ làm rơi vào khung ban đêm (mặc định 22:00 - 06:00, Điều 106 BLLĐ). */
export function computeNightHours(checkIn?: string, checkOut?: string, nightStartHour: number = 22, nightEndHour: number = 6): number {
  const inH = parseTimeToHours(checkIn)
  let outH = parseTimeToHours(checkOut)
  if (inH === null || outH === null) return 0
  if (outH <= inH) outH += 24
  const windows: Array<[number, number]> = [
    [nightStartHour - 24, nightEndHour],
    [nightStartHour, 24 + nightEndHour],
  ]
  let total = 0
  for (const [ws, we] of windows) {
    total += Math.max(0, Math.min(outH, we) - Math.max(inH, ws))
  }
  return Math.round(total * 100) / 100
}

export function isWeekendDay(dateStr?: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  return day === 0 || day === 6
}

/** Ngày nghỉ lễ, Tết lấy từ Cài đặt lương (CEO/HR nhập theo thông báo Nhà nước). Để trống = không có ngày lễ. */
export function getPolicyHolidayDates(policy?: ReturnType<typeof getActivePayrollPolicy>): Set<string> {
  const p = policy ?? getActivePayrollPolicy()
  const list = Array.isArray(p.holidays) ? p.holidays : []
  return new Set(list.map(h => (h && typeof h.date === 'string' ? h.date.trim() : '')).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)))
}

export function isHolidayDay(dateStr?: string, holidayDates?: Set<string>): boolean {
  if (!dateStr) return false
  return (holidayDates ?? getPolicyHolidayDates()).has(dateStr)
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

/**
 * Doanh thu thật của từng cửa hàng trong kỳ (VNĐ). Chỉ dùng khi bên gọi truyền vào;
 * không bao giờ đoán từ dữ liệu mẫu. Thiếu doanh thu thật thì quỹ tip = 0.
 */
export type StoreRevenueByStore = Record<string, number>

function getStoreRevenueForPeriod(storeId: string, storeRevenues?: StoreRevenueByStore): { name: string; revenue: number } {
  const store = mockStores.find((item) => item.id === storeId)
  const raw = storeRevenues ? Number(storeRevenues[storeId]) : 0
  return {
    name: store?.name ?? storeId,
    revenue: Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0,
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
  attendanceRecords?: PayrollAttendanceRecord[],
  storeRevenues?: StoreRevenueByStore,
): Record<string, FnbPayrollAllocation> {
  const policy = getActivePayrollPolicy()
  if (policy.fnb.serviceChargePoolRate <= 0 || policy.fnb.tipPoolRate <= 0) return {}
  // Không có doanh thu thật thì không chia tip (trước đây đoán từ doanh thu mẫu → tip giả).
  if (!storeRevenues || !Object.values(storeRevenues).some((value) => Number(value) > 0)) return {}

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
    const storeRevenueInfo = getStoreRevenueForPeriod(storeId, storeRevenues)
    const shiftId = inferShiftId(employee, attendance)
    const shiftName = getShiftName(shiftId)
    const points = getFnbContributionPoints(employee, attendance)
    if (points <= 0 || storeRevenueInfo.revenue <= 0) continue

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
    // Không tự lấy đơn giá mặc định: thiếu đơn giá phải hiện cảnh báo để quản lý cài đặt
    return getEffectiveHourlyRate(emp, pos, 0)
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
  /** Giờ làm trong giờ chuẩn vào ngày lễ (full-time được trả thêm cho đủ mức ngày lễ). */
  holidayRegularHours?: number
  /** Tổng số giờ làm vượt giờ chuẩn/ngày (dù có được trả tăng ca hay không). */
  hoursOverStandard?: number
  /** Tổng số giờ làm trong khung ban đêm (22h - 6h). */
  nightHours?: number
  /** Các ngày có đi làm (dùng để biết ngày lễ nào nhân viên nghỉ). */
  workedDateList?: string[]
  /** Các ngày nghỉ phép (có hoặc không lương). */
  leaveDateList?: string[]
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

/** Đọc cài đặt phạt đi trễ (giữ đúng giá trị mặc định cũ khi chưa cài). */
function getLatePenaltySettings(policy: ReturnType<typeof getActivePayrollPolicy>): LatePenaltySettings {
  const lp = policy.latePenaltyPolicy
  // Chỉ giữ cách đúng luật (Điều 127 BLLĐ cấm phạt tiền): không trả lương phút trễ, hoặc không trừ tiền.
  const rawMode = lp?.mode ?? 'none'
  const mode = rawMode === 'fixed' || rawMode === 'tiered' ? 'per_minute' : rawMode
  const rawMult = Number(lp?.perMinuteMultiplier)
  return {
    mode,
    graceOccurrences: lp?.graceOccurrences ?? 0,
    fixedAmount: lp?.fixedAmount ?? policy.rates?.latePenaltyPerOccurrence ?? 50000,
    tier1MaxMinutes: lp?.tier1MaxMinutes ?? 15,
    tier1Amount: lp?.tier1Amount ?? 20000,
    tier2MaxMinutes: lp?.tier2MaxMinutes ?? 30,
    tier2Amount: lp?.tier2Amount ?? 50000,
    tier3Amount: lp?.tier3Amount ?? 100000,
    tier3HalfShiftDeduction: lp?.tier3HalfShiftDeduction,
    perMinuteMultiplier: rawMult > 0 && rawMult < 1 ? rawMult : 1,
    perMinuteMaxPerOccurrence: lp?.perMinuteMaxPerOccurrence ?? 0,
    perMinuteApplyToPartTime: lp?.perMinuteApplyToPartTime ?? false,
  }
}

function summarizeAttendanceRecords(
  records: PayrollAttendanceRecord[],
  overtimeThresholdHours?: number,
  employeeRestDays?: number[],
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
  const dailyRecordedOtMap = new Map<string, number>()
  const anomalies: PayrollAnomaly[] = []
  const holidayDates = getPolicyHolidayDates()
  const restDays = resolveWeeklyRestDays(employeeRestDays)
  const leaveDates = new Set<string>()

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
    // Ca 0 giờ (chấm vào rồi ra ngay, hoặc giờ không hợp lệ) không tính là ca/ngày công.
    // Dữ liệu cũ không ghi số giờ (undefined) vẫn được tính như trước.
    const hoursKnown = typeof r.total_hours === 'number'
    const countsAsShift = hoursKnown ? recHours >= minShiftHours : true
    const countsAsDay = hoursKnown ? recHours > 0 : true

    switch (r.status) {
      case 'on_time':
      case 'early':
        if (countsAsShift) totalShifts++
        if (r.date && countsAsDay) workedDates.add(r.date)
        break
      case 'late':
        if (countsAsShift) totalShifts++
        if (r.date && countsAsDay) workedDates.add(r.date)
        lateCount++
        break
      case 'leave':
        if (r.date) leaveDates.add(r.date)
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
      if (isHolidayDay(r.date, holidayDates)) {
        overtimeHoursHoliday += otH
      } else if (isRestDay(r.date, restDays)) {
        overtimeHoursWeekend += otH
      } else {
        overtimeHoursWeekday += otH
      }
    }
    totalHours += recHours
    if (r.date) {
      dailyHoursMap.set(r.date, (dailyHoursMap.get(r.date) ?? 0) + recHours)
      if (otH > 0) dailyRecordedOtMap.set(r.date, (dailyRecordedOtMap.get(r.date) ?? 0) + otH)
    }
  }

  // Tăng ca full-time lấy từ giờ chấm công thực tế: ngày nào làm quá giờ chuẩn mà
  // dữ liệu chấm công chưa ghi sẵn giờ tăng ca thì phần vượt được tính là tăng ca.
  const stdHoursPerDay = (() => {
    const p = getActivePayrollPolicy()
    return typeof p.standardHoursPerDay === 'number' && p.standardHoursPerDay > 0 ? p.standardHoursPerDay : 8
  })()
  let holidayRegularHours = 0
  let hoursOverStandard = 0
  for (const [date, dayHours] of dailyHoursMap) {
    const recordedOt = dailyRecordedOtMap.get(date) ?? 0
    if (dayHours > stdHoursPerDay) hoursOverStandard += dayHours - stdHoursPerDay
    if (isHolidayDay(date, holidayDates)) {
      holidayRegularHours += Math.min(Math.max(dayHours - recordedOt, 0), stdHoursPerDay)
    }
    if (recordedOt > 0 || dayHours <= stdHoursPerDay) continue
    const extra = Math.round((dayHours - stdHoursPerDay) * 100) / 100
    overtimeHours += extra
    if (isHolidayDay(date, holidayDates)) overtimeHoursHoliday += extra
    else if (isRestDay(date, restDays)) overtimeHoursWeekend += extra
    else overtimeHoursWeekday += extra
  }
  holidayRegularHours = Math.round(holidayRegularHours * 100) / 100
  hoursOverStandard = Math.round(hoursOverStandard * 100) / 100

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

  // Tạm tính với đơn giá 0; calculatePayroll tính lại với đơn giá thật của nhân viên
  const lateCalc = computeLatePenalties(
    lateRecords.map(r => ({ date: r.date, minutes: r.late_minutes || 0 })),
    getLatePenaltySettings(policy),
    { hourlyRate: 0, shiftHours: policy.shiftRules?.partTimeShiftHours ?? 5.5, isPartTime: true },
  )
  const lateIncidents: LateIncident[] = lateCalc.items
  const totalLatePenalty = lateCalc.total

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
  let nightHours = 0
  validWorkRecords.forEach(r => {
    nightHours += computeNightHours(r.check_in_time, r.check_out_time, nightStartHour, 6)
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
        }
        // Thiếu giờ ra ca trước hoặc giờ vào ca sau: không đủ căn cứ để trả phụ cấp ca gãy
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
    holidayRegularHours,
    hoursOverStandard,
    nightHours: Math.round(nightHours * 100) / 100,
    workedDateList: Array.from(workedDates),
    leaveDateList: Array.from(leaveDates),
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
  return summarizeAttendanceRecords(records, otThreshold, getEmployeeTaxProfile(employeeId).weeklyRestDays)
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
  return summarizeAttendanceRecords(records, otThreshold, getEmployeeTaxProfile(employeeId).weeklyRestDays)
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

/**
 * Thuế TNCN tháng. Mức giảm trừ, biểu thuế và tỷ lệ khấu trừ part-time
 * đều lấy từ Cài đặt lương (policy.legal), không viết cứng ở đây.
 */
export function calculateTax(
  taxableIncome: number,
  dependents: number = 0,
  options: { isPartTime?: boolean; grossPaid?: number } = {},
): number {
  const policy = getActivePayrollPolicy()
  return calculatePit({
    taxableIncome,
    dependents,
    isPartTime: options.isPartTime,
    grossPaid: options.grossPaid,
    settings: getPitSettingsFromPolicy(policy),
  }).tax
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
      const maxLate = Math.max(0, Math.floor(policy.latePenaltyPolicy?.attendanceBonusMaxLate ?? 0))
      const isQualifiedAttendance = attendance.workDays >= standardDays && attendance.lateCount <= maxLate && attendance.absentDays === 0
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

/** Đếm ngày lễ trong kỳ mà nhân viên toàn thời gian nghỉ (không đi làm, không ghi nghỉ phép) để trả lương ngày lễ. */
export function countPaidHolidayOffDays(
  att: Pick<AttendanceSummaryForPayroll, 'workedDateList' | 'leaveDateList'>,
  periodStart: string,
  periodEnd: string,
  hireDate?: string,
  resignDate?: string,
  holidayDates?: Set<string>,
): number {
  const worked = new Set(att.workedDateList ?? [])
  const leave = new Set(att.leaveDateList ?? [])
  let count = 0
  for (const date of holidayDates ?? getPolicyHolidayDates()) {
    if (date < periodStart || date > periodEnd) continue
    if (hireDate && date < hireDate.slice(0, 10)) continue
    if (resignDate && date > resignDate.slice(0, 10)) continue
    if (worked.has(date) || leave.has(date)) continue
    count++
  }
  return count
}

/** Thông tin thuế khai trong hồ sơ nhân viên (thời hạn hợp đồng, cam kết 08, người phụ thuộc). */
export function getEmployeeTaxProfile(employeeId: string): Pick<PayrollInput, 'contractTerm' | 'pitCommitment08' | 'dependents' | 'insuranceSalary' | 'weeklyRestDays' | 'contractInsuranceAllowances'> {
  try {
    const profile = EmployeeService.getEmployeeById(employeeId)
    if (!profile) return {}
    const term = profile.pit_contract_term
    return {
      contractTerm: term === 'khong_hop_dong' || term === 'duoi_3_thang' || term === 'tu_3_thang' ? term : undefined,
      pitCommitment08: profile.pit_commitment_08 === true,
      dependents: typeof profile.dependents_count === 'number' ? profile.dependents_count : undefined,
      insuranceSalary: typeof profile.insurance_salary === 'number' && profile.insurance_salary > 0 ? profile.insurance_salary : undefined,
      weeklyRestDays: Array.isArray(profile.weekly_rest_days) && profile.weekly_rest_days.length > 0 ? profile.weekly_rest_days : undefined,
      contractInsuranceAllowances: typeof profile.contract_insurance_allowances === 'number' && profile.contract_insurance_allowances > 0 ? profile.contract_insurance_allowances : undefined,
    }
  } catch {
    return {}
  }
}

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
    // Thiếu đơn giá giờ thì để 0 và báo bất thường, không tự đoán mức lương
    baseSalary = getEffectiveHourlyRate(emp, pos, 0, standardDays, policy.standardHoursPerDay || 8)
  } else {
    baseSalary = policyGrade?.base_salary ?? pos?.base_salary ?? 0
  }
  const storeName = input.store?.name ?? (emp ? getStoreRevenueForPeriod(emp.store_id).name : '')

  // ── Step 2: Attendance
  const rawAtt = input.attendanceSummary ?? getPayrollAttendanceSummary(employeeId, periodStart, periodEnd)
  // Tính lại phạt đi trễ với đơn giá giờ thật của nhân viên (không dùng đơn giá cố định)
  const att: AttendanceSummaryForPayroll = (() => {
    if (!rawAtt.lateIncidents || rawAtt.lateIncidents.length === 0) return rawAtt
    const stdHours = (typeof policy.standardHoursPerDay === 'number' && policy.standardHoursPerDay > 0) ? policy.standardHoursPerDay : 8
    const hourlyRate = isPartTime ? baseSalary : (standardDays > 0 ? baseSalary / standardDays / stdHours : 0)
    const shiftHours = isPartTime
      ? (policy.shiftRules?.partTimeShiftHours ?? 5.5)
      : (policy.shiftRules?.fullTimeShiftHours ?? stdHours)
    const recalc = computeLatePenalties(
      rawAtt.lateIncidents.map(i => ({ date: i.date, minutes: i.minutes })),
      getLatePenaltySettings(policy),
      { hourlyRate, shiftHours, isPartTime },
    )
    return { ...rawAtt, lateIncidents: recalc.items, totalLatePenalty: recalc.total }
  })()

  // ── Step 2.5: Compile anomalies
  const anomalies: PayrollAnomaly[] = att.anomalies ? [...att.anomalies] : []
  if (baseSalary <= 0) {
    if (isPartTime) {
      anomalies.push({ type: 'thieu_don_gia_gio', message: 'Nhân viên bán thời gian chưa được cài đặt đơn giá giờ (đang lấy giá trị 0đ).' })
    } else {
      anomalies.push({ type: 'thieu_luong_co_ban', message: 'Nhân viên chưa được cài đặt mức lương cơ bản (đang lấy giá trị 0đ).' })
    }
  }
  // Cảnh báo đơn giá giờ thấp hơn lương tối thiểu theo giờ trong Cài đặt (để trống = không kiểm tra)
  const minHourlyWage = policy.legal?.minHourlyWage
  if (isPartTime && baseSalary > 0 && typeof minHourlyWage === 'number' && minHourlyWage > 0 && baseSalary < minHourlyWage) {
    anomalies.push({
      type: 'duoi_luong_toi_thieu',
      message: `Đơn giá ${baseSalary.toLocaleString('vi-VN')}đ/giờ thấp hơn lương tối thiểu theo giờ trong Cài đặt (${minHourlyWage.toLocaleString('vi-VN')}đ/giờ).`,
    })
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
  // Phần chênh lệch tiền tăng ca so với giờ thường được miễn thuế TNCN
  let overtimeTaxExempt = 0
  let holidayOffDays = 0

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
    // Làm vào ngày lễ: giờ đã trả 100%, trả thêm phần chênh cho đủ hệ số ngày lễ trong Cài đặt (mặc định 300%)
    const ptHolidayRate = policy.rates?.otHoliday || 3.0
    const ptHolidayPremium = Math.round((att.holidayRegularHours || 0) * hourlyRate * Math.max(0, ptHolidayRate - 1))
    overtimeAmount = hourlyCalc.overtimeAmount + ptHolidayPremium
    overtimeTaxExempt = calculateOvertimeTaxExemption(hourlyCalc.overtimeAmount, ptOt, hourlyRate) + ptHolidayPremium
    overtimeHoursToReport = ptOt
    dailyRate = 0
    absentDeduction = 0
  } else {
    // Ngày lễ, Tết trong kỳ mà nhân viên nghỉ (không đi làm, không ghi nghỉ phép) vẫn được trả lương (Điều 112 BLLĐ)
    holidayOffDays = countPaidHolidayOffDays(att, periodStart, periodEnd, emp?.hire_date, emp?.resign_date)
    const effectiveDays = att.workDays + att.leavePaid + holidayOffDays
    // Lương cơ bản tối đa đủ số ngày công chuẩn; ngày làm vượt chuẩn trả theo hệ số ngày nghỉ (mặc định 200%)
    const paidDays = Math.min(effectiveDays, standardDays)
    const extraDays = Math.max(0, att.workDays - Math.max(0, standardDays - att.leavePaid - holidayOffDays))
    baseEarned = Math.round(baseSalary * (paidDays / standardDays))
    const restDayRate = policy.rates?.otWeekend || 2.0
    const extraDaysAmount = Math.round((baseSalary / standardDays) * extraDays * restDayRate)

    // ── Step 4: Overtime (BUG-G FIX: differentiate weekday, weekend, holiday rates)
    const otWeekday = att.overtimeHoursWeekday ?? att.overtimeHours
    const otWeekend = att.overtimeHoursWeekend ?? 0
    const otHoliday = att.overtimeHoursHoliday ?? 0
    const otWeekdayAmt = calculateOvertimeAmount(baseSalary, otWeekday, 'weekday')
    const otWeekendAmt = calculateOvertimeAmount(baseSalary, otWeekend, 'weekend')
    const otHolidayAmt = calculateOvertimeAmount(baseSalary, otHoliday, 'holiday')
    const standardHoursPerDay = (typeof policy.standardHoursPerDay === 'number' && policy.standardHoursPerDay > 0)
      ? policy.standardHoursPerDay
      : 8
    const normalHourlyRate = baseSalary / standardDays / standardHoursPerDay
    // Làm trong giờ chuẩn vào ngày lễ (Điều 98 BLLĐ): ngày đó đã tính 100% (lương ngày lễ),
    // trả thêm đủ hệ số ngày lễ trong Cài đặt (mặc định 300%) → tổng 400%.
    const holidayRate = policy.rates?.otHoliday || 3.0
    const holidayPremium = Math.round((att.holidayRegularHours || 0) * normalHourlyRate * holidayRate)
    // Phần 100% tương ứng giờ làm bình thường vẫn chịu thuế; phần cao hơn được miễn thuế
    const holidayPremiumTaxExempt = Math.round((att.holidayRegularHours || 0) * normalHourlyRate * Math.max(0, holidayRate - 1))
    overtimeAmount = otWeekdayAmt + otWeekendAmt + otHolidayAmt + extraDaysAmount + holidayPremium
    overtimeHoursToReport = att.overtimeHours
    const extraDaysHours = extraDays * standardHoursPerDay
    overtimeTaxExempt = calculateOvertimeTaxExemption(
      otWeekdayAmt + otWeekendAmt + otHolidayAmt,
      otWeekday + otWeekend + otHoliday,
      normalHourlyRate,
    )
      + calculateOvertimeTaxExemption(extraDaysAmount, extraDaysHours, normalHourlyRate)
      + holidayPremiumTaxExempt

    dailyRate = Math.round(baseSalary / standardDays)
    absentDeduction = att.absentDays * dailyRate
  }

  // ── Step 4b: Làm việc ban đêm (Điều 98 BLLĐ): trả thêm theo giờ, hệ số trong Cài đặt (rates.otNight, 130% = thêm 30%).
  // Phần trả thêm được miễn thuế TNCN.
  const nightHours = att.nightHours ?? 0
  const nightRate = typeof policy.rates?.otNight === 'number' ? policy.rates.otNight : 0
  const nightHourlyRate = isPartTime
    ? (baseSalary > 0 ? baseSalary : 0)
    : baseSalary / standardDays / ((typeof policy.standardHoursPerDay === 'number' && policy.standardHoursPerDay > 0) ? policy.standardHoursPerDay : 8)
  const nightPremium = nightHours > 0 && nightRate > 1
    ? Math.round(nightHours * nightHourlyRate * (nightRate - 1))
    : 0
  const nightAllowances = nightPremium > 0
    ? [{ name: `Trả thêm làm ban đêm (${nightHours} giờ × ${Math.round((nightRate - 1) * 100)}%)`, amount: nightPremium, tax_exempt: true }]
    : []

  // ── Step 5: Allowances
  const allowances = [...getAllowancesForEmployee(employeeId, baseSalary, att, emp, isPartTime), ...nightAllowances, ...(input.extraAllowances || [])]
  const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0)

  // ── Step 6: Bonuses
  const bonuses = getBonusesForPeriod(employeeId, periodStart)
  const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0)

  // ── Step 6b: F&B tip/service charge allocation
  const fnbAllocations = input.fnbAllocations ?? buildFnbPayrollAllocations(periodStart, periodEnd, mockEmployees)
  const fnbAllocation = fnbAllocations[employeeId]
  const fnbShare = fnbAllocation?.share ?? 0

  // ── Step 7: Deductions
  // Không còn phạt tiền cố định mỗi lần đi trễ (trái Điều 127 BLLĐ); chỉ trừ theo cài đặt đúng luật.
  const lateDeduction = att.totalLatePenalty ?? 0
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
  // Mức đóng BH nhập tay trong hồ sơ (nếu có) được ưu tiên; để trống thì tính tự động như trên.
  // Toàn thời gian: lương hợp đồng + phụ cấp ghi trong hợp đồng (Điều 89 Luật BHXH), nhập trong hồ sơ nhân viên.
  const contractInsuranceAllowances = !isPartTime && typeof input.contractInsuranceAllowances === 'number' && input.contractInsuranceAllowances > 0
    ? input.contractInsuranceAllowances
    : 0
  const autoInsuranceBase = isPartTime ? baseEarned : baseSalary + contractInsuranceAllowances
  const customInsuranceSalary = typeof input.insuranceSalary === 'number' && input.insuranceSalary > 0 ? input.insuranceSalary : undefined
  const insuranceBase = customInsuranceSalary ?? autoInsuranceBase
  // Theo Khoản 3 Điều 85 Luật BHXH: Người lao động không làm việc và không hưởng tiền lương từ 14 ngày làm việc trở lên trong tháng
  // (hoặc không đi làm ngày nào trong tháng: effectiveDays === 0), tháng đó không đóng BHXH.
  const effectiveDaysForInsurance = isPartTime ? att.workDays : (att.workDays + att.leavePaid)
  const isUnpaidExempt = !isPartTime && (effectiveDaysForInsurance === 0 || effectiveDaysForInsurance <= standardDays - 14)
  // Bán thời gian (Luật BHXH 2024, từ 01/07/2025): lương tháng từ mức trong Cài đặt trở lên thì bắt buộc đóng.
  // Để trống mức này thì chỉ đóng khi hồ sơ nhân viên bật "Tham gia bảo hiểm".
  const ptInsuranceMin = policy.legal?.partTimeInsuranceMinMonthlySalary
  const ptMustInsure = isPartTime && typeof ptInsuranceMin === 'number' && ptInsuranceMin > 0 && baseEarned >= ptInsuranceMin
  const shouldCalculateInsurance = (ptMustInsure || (input.hasInsurance ?? (!isPartTime))) && !isUnpaidExempt
  const insurance = shouldCalculateInsurance
    ? calculateInsurance(insuranceBase)
    : { bhxh: 0, bhyt: 0, bhtn: 0, total: 0 }

  // Mức đóng BH nhập tay thấp hơn lương hợp đồng hoặc lương tối thiểu vùng: chỉ cảnh báo, không chặn
  if (customInsuranceSalary !== undefined && shouldCalculateInsurance) {
    const contractSalary = isPartTime ? 0 : baseSalary + contractInsuranceAllowances
    const minRegion = policy.legal?.minRegionSalary
    if (contractSalary > 0 && customInsuranceSalary < contractSalary) {
      anomalies.push({
        type: 'muc_dong_bh_thap',
        message: `Mức lương đóng bảo hiểm ${customInsuranceSalary.toLocaleString('vi-VN')}đ thấp hơn lương${contractInsuranceAllowances > 0 ? ' và phụ cấp' : ''} trong hợp đồng ${contractSalary.toLocaleString('vi-VN')}đ. Luật yêu cầu đóng theo lương và phụ cấp ghi trong hợp đồng, có thể bị truy thu khi thanh tra.`,
      })
    } else if (typeof minRegion === 'number' && minRegion > 0 && customInsuranceSalary < minRegion) {
      anomalies.push({
        type: 'muc_dong_bh_thap',
        message: `Mức lương đóng bảo hiểm ${customInsuranceSalary.toLocaleString('vi-VN')}đ thấp hơn lương tối thiểu vùng ${minRegion.toLocaleString('vi-VN')}đ.`,
      })
    }
  }

  // ── Step 10: Tax & Gross definition
  // Standard Gross Salary = Total earnings before any statutory or disciplinary deductions
  // BUG-L FIX: Khấu trừ phụ cấp cơm ca không chịu thuế theo luật Thuế TNCN
  // Cơm ca: nếu Cài đặt có trần miễn thuế (vd trả tiền mặt), phần vượt trần chịu thuế; để trống = miễn toàn bộ.
  const isMealAllowance = (a: { name: string }) => a.name.includes('Cơm ca') || a.name.includes('cơm ca')
  const mealTotal = allowances.filter(isMealAllowance).reduce((sum, a) => sum + a.amount, 0)
  const mealCap = policy.legal?.mealAllowanceTaxExemptCap
  const mealExempt = typeof mealCap === 'number' && mealCap > 0 ? Math.min(mealTotal, mealCap) : mealTotal
  const nonTaxableAllowances = mealExempt + allowances
    .filter(a => !isMealAllowance(a) && 'tax_exempt' in a && (a as { tax_exempt?: boolean }).tax_exempt === true)
    .reduce((sum, a) => sum + a.amount, 0)
  const grossSalary = totalEarnings
  const taxableIncome = Math.max(0, grossSalary - insurance.total - nonTaxableAllowances - overtimeTaxExempt)
  // Khấu trừ 10% chỉ áp cho người không có hợp đồng hoặc hợp đồng dưới 3 tháng (Thông tư 111/2013).
  // Hồ sơ chưa ghi thời hạn hợp đồng: bán thời gian vẫn khấu trừ 10% như trước, toàn thời gian tính lũy tiến.
  const contractTerm = input.contractTerm
  const flatWithholding = contractTerm === 'khong_hop_dong' || contractTerm === 'duoi_3_thang'
    || (contractTerm === undefined && isPartTime)
  const tax = flatWithholding && input.pitCommitment08 === true
    ? 0
    : calculateTax(taxableIncome, input.dependents ?? 0, { isPartTime: flatWithholding, grossPaid: grossSalary })
  if (isPartTime && contractTerm === undefined) {
    anomalies.push({
      type: 'thieu_thoi_han_hop_dong',
      message: 'Hồ sơ chưa ghi thời hạn hợp đồng: đang tạm khấu trừ thuế 10%. Nếu hợp đồng từ 3 tháng trở lên, cập nhật hồ sơ để tính thuế lũy tiến.',
    })
  }

  // Bán thời gian làm quá giờ chuẩn/ngày nhưng Cài đặt đang tắt tăng ca: báo để quản lý kiểm tra
  const hoursOverStandard = att.hoursOverStandard ?? 0
  if (isPartTime && policy.partTimeOvertimeEnabled !== true && hoursOverStandard > 0) {
    anomalies.push({
      type: 'tang_ca_chua_tra',
      message: `Có ${hoursOverStandard} giờ làm vượt giờ chuẩn/ngày nhưng Cài đặt đang tắt tăng ca bán thời gian, nên chỉ trả 100%. Luật yêu cầu trả từ 150%.`,
    })
  }
  // Vượt giới hạn giờ tăng ca/tháng trong Cài đặt (để trống = không kiểm tra; luật hiện hành 40 giờ/tháng)
  const maxOtHours = policy.legal?.maxMonthlyOvertimeHours
  const monthOtHours = Math.max(overtimeHoursToReport || 0, hoursOverStandard)
  if (typeof maxOtHours === 'number' && maxOtHours > 0 && monthOtHours > maxOtHours) {
    anomalies.push({
      type: 'vuot_gio_tang_ca',
      message: `Tăng ca ${monthOtHours} giờ trong tháng, vượt giới hạn ${maxOtHours} giờ trong Cài đặt.`,
    })
  }

  // ── Step 11: Net Salary
  // Advance payment is deducted from net payout, NOT from taxable income
  const rawNetSalary = grossSalary - insurance.total - tax - lateDeduction - totalOtherDeductions - advanceDeduction
  // Không trả lương âm: phần khấu trừ vượt thu nhập được báo để quản lý xử lý (chuyển kỳ sau / thu lại)
  const netSalary = Math.max(0, rawNetSalary)
  // Khấu trừ bồi thường (phiếu trừ đã duyệt) vượt tỷ lệ trong Cài đặt (để trống = không kiểm tra; luật tối đa 30%, Điều 129 BLLĐ)
  const maxCompRate = policy.legal?.maxCompensationDeductionPercent
  const salaryAfterStatutory = Math.max(0, grossSalary - insurance.total - tax)
  if (typeof maxCompRate === 'number' && maxCompRate > 0 && totalOtherDeductions > 0
    && totalOtherDeductions > Math.round(salaryAfterStatutory * maxCompRate / 100)) {
    anomalies.push({
      type: 'vuot_khau_tru_boi_thuong',
      message: `Phiếu trừ ${totalOtherDeductions.toLocaleString('vi-VN')}đ vượt ${maxCompRate}% lương tháng (tối đa ${Math.round(salaryAfterStatutory * maxCompRate / 100).toLocaleString('vi-VN')}đ). Phần vượt cần chuyển sang tháng sau.`,
    })
  }
  if (rawNetSalary < 0) {
    anomalies.push({
      type: 'luong_am',
      message: `Khấu trừ (tạm ứng, phạt, thuế, bảo hiểm) vượt thu nhập ${Math.abs(Math.round(rawNetSalary)).toLocaleString('vi-VN')}đ. Thực nhận để 0đ, phần thiếu cần chuyển sang kỳ sau hoặc thu lại.`,
    })
  }

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
    night_hours: nightHours,
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
    pit_dependents: input.dependents ?? 0,
    holiday_paid_days: holidayOffDays,

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
      ...getEmployeeTaxProfile(emp.id),
    }),
  )
}

export async function calculatePayrollBatchAsync(
  periodStart: string,
  periodEnd: string,
): Promise<PayrollResult[]> {
  const careerPlans = await fetchCareerPayPlans(periodStart)
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
        ...getEmployeeTaxProfile(emp.id),
        extraAllowances: careerAllowancesFor(careerPlans, emp.id, emp.contract_type === 'ban_thoi_gian', periodStart, periodEnd, attendanceRecords),
        attendanceSummary: summarizeAttendanceRecords(
          attendanceRecords.filter(record => record.employee_id === emp.id),
          otThreshold,
          getEmployeeTaxProfile(emp.id).weeklyRestDays,
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
        : 0 // Không đoán đơn giá: để 0 để bảng lương báo "Thiếu đơn giá giờ"
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
        contractTerm: getEmployeeTaxProfile(emp.id).contractTerm,
        pitCommitment08: getEmployeeTaxProfile(emp.id).pitCommitment08,
        insuranceSalary: getEmployeeTaxProfile(emp.id).insuranceSalary,
        contractInsuranceAllowances: getEmployeeTaxProfile(emp.id).contractInsuranceAllowances,
        hasInsurance: payrollEmp?.tham_gia_bao_hiem ?? undefined,
        dependents: payrollEmp?.so_nguoi_phu_thuoc ?? undefined,
        employee: emp,
        position: empPos,
        store: empStore,
        extraAllowances: careerAllowancesFor(careerPlans, emp.id, payrollEmp?.loai_hop_dong === 'ban_thoi_gian', periodStart, periodEnd, attendanceRecords),
        attendanceSummary: summarizeAttendanceRecords(
          attendanceRecords.filter(record => record.employee_id === emp.id),
          otThreshold,
          getEmployeeTaxProfile(emp.id).weeklyRestDays,
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
