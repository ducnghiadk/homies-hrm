// =============================================
// HRM Trà Sữa 🧋 — Payroll Calculation Engine
// Real calculation: Attendance → Leave → Salary
// =============================================

import {
  mockAttendances, mockEmployees, mockPositions, mockShifts, mockStores,
  type Attendance,
} from './mock-data'
import { mockRevenueByMonth, mockRevenueByStore } from './mock-data-p4'
import {
  mockBonuses, mockDeductions, mockAdvances,
  type SalarySlipData,
} from './mock-data-payroll'
import { getActivePayrollPolicy, INSURANCE_MAX_BASE } from './services/payroll-policy-service'

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface PayrollInput {
  employeeId: string
  periodStart: string   // '2026-02-01'
  periodEnd: string     // '2026-02-28'
  fnbAllocations?: Record<string, FnbPayrollAllocation>
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

export interface PayrollResult {
  employee_id: string
  employee_name: string
  position: string
  store: string
  period: string

  // Attendance
  standard_days: number
  work_days: number
  leave_days_paid: number
  leave_days_unpaid: number
  absent_days: number
  late_count: number

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

function buildFnbPayrollAllocations(periodStart: string, periodEnd: string): Record<string, FnbPayrollAllocation> {
  const policy = getActivePayrollPolicy()
  if (policy.fnb.serviceChargePoolRate <= 0 || policy.fnb.tipPoolRate <= 0) return {}

  const employees = mockEmployees.filter((e) => e.status !== 'inactive' && e.role !== 'ceo')
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]))
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

  for (const attendance of mockAttendances) {
    if (attendance.date < periodStart || attendance.date > periodEnd) continue
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
    const tipPool = Math.round(serviceChargePool * policy.fnb.tipPoolRate)
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
  const policyGrade = getActivePayrollPolicy().grades.find(grade => grade.id === emp.position_id)
  return policyGrade?.base_salary ?? pos?.base_salary ?? 0
}

// ══════════════════════════════════════
// 2. GET ATTENDANCE SUMMARY FOR PERIOD
// ══════════════════════════════════════

export interface AttendanceSummaryForPayroll {
  workDays: number       // on_time + late + early
  leavePaid: number      // leave with paid leave_type
  leaveUnpaid: number    // unpaid leave
  absentDays: number
  lateCount: number
  overtimeHours: number
  totalHours: number
}

export function getPayrollAttendanceSummary(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
): AttendanceSummaryForPayroll {
  const records = mockAttendances.filter(
    (a: Attendance) =>
      a.employee_id === employeeId &&
      a.date >= periodStart &&
      a.date <= periodEnd,
  )

  let workDays = 0
  let leavePaid = 0
  let leaveUnpaid = 0
  let absentDays = 0
  let lateCount = 0
  let overtimeHours = 0
  let totalHours = 0

  for (const r of records) {
    switch (r.status) {
      case 'on_time':
      case 'early':
        workDays++
        break
      case 'late':
        workDays++
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
    overtimeHours += r.overtime_hours || 0
    totalHours += r.total_hours || 0
  }

  return { workDays, leavePaid, leaveUnpaid, absentDays, lateCount, overtimeHours, totalHours }
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
  const hourlyRate = baseSalary / STANDARD_WORK_DAYS / 8
  const rate = otType === 'weekday'
    ? policy.rates.otWeekday
    : otType === 'holiday'
      ? policy.rates.otHoliday
      : OT_RATES[otType]
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
  const base = Math.min(baseSalary, INSURANCE_MAX_BASE)
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
  const deduction = 11000000 + dependents * 4400000
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
): { name: string; amount: number }[] {
  const emp = mockEmployees.find(e => e.id === employeeId)
  if (!emp) return []

  const policy = getActivePayrollPolicy()
  const result: { name: string; amount: number }[] = []

  for (const allowance of policy.allowances) {
    const appliesToManagers = allowance.appliesTo.toLowerCase().includes('quản lý') || allowance.appliesTo.toLowerCase().includes('trưởng ca')
    const isManagerLevel = emp.role !== 'employee'
    if (appliesToManagers && !isManagerLevel) continue
    result.push({ name: allowance.name, amount: allowance.amount })
  }

  const mealAllowance = Math.round(attendance.workDays * policy.fnb.mealAllowancePerShift)
  if (mealAllowance > 0) {
    result.push({ name: 'F&B: Cơm ca theo ngày công', amount: mealAllowance })
  }

  if (emp.role !== 'employee' && policy.fnb.closingShiftAllowance > 0) {
    result.push({ name: 'F&B: Phụ cấp ca đóng cửa', amount: policy.fnb.closingShiftAllowance })
  }

  if (['shift_leader', 'store_manager', 'area_manager'].includes(emp.role) && policy.fnb.openingShiftAllowance > 0) {
    result.push({ name: 'F&B: Phụ cấp ca mở cửa', amount: policy.fnb.openingShiftAllowance })
  }

  if (attendance.overtimeHours > 0 && policy.fnb.nightShiftAllowance > 0) {
    result.push({ name: 'F&B: Hỗ trợ ca đêm/chốt muộn', amount: policy.fnb.nightShiftAllowance })
  }

  // Manager-level get responsibility allowance, others don't
  if (emp.role === 'employee') {
    return result.filter(r => r.name !== 'Phụ cấp trách nhiệm')
  }
  return result
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
  const month = periodToMonth(periodStart)
  return mockBonuses
    .filter(b => b.employee_id === employeeId && b.month === month && b.status === 'approved')
    .map(b => ({ name: b.reason, amount: b.amount }))
}

function getAdvanceDeduction(
  employeeId: string,
  periodStart: string,
): number {
  const month = periodToMonth(periodStart)
  return mockAdvances
    .filter(a => a.employee_id === employeeId && a.status === 'approved')
    // Simple: use created_at month match
    .filter(a => {
      const [y, m] = a.created_at.split('-')
      return `${m}/${y}` === month
    })
    .reduce((sum, a) => sum + a.requested_amount, 0)
}

function getOtherDeductions(
  employeeId: string,
  periodStart: string,
): { name: string; amount: number }[] {
  const month = periodToMonth(periodStart)
  return mockDeductions
    .filter(d => d.employee_id === employeeId && d.month === month && d.status === 'approved')
    .map(d => ({ name: `${d.type_label}: ${d.reason}`, amount: d.amount }))
}

// ══════════════════════════════════════
// 6. MAIN: CALCULATE PAYROLL
// ══════════════════════════════════════

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const { employeeId, periodStart, periodEnd } = input
  const policy = getActivePayrollPolicy()

  // ── Step 1: Employee info
  const emp = mockEmployees.find(e => e.id === employeeId)
  const pos = mockPositions.find(p => p.id === emp?.position_id)
  const policyGrade = policy.grades.find(grade => grade.id === pos?.id)
  const baseSalary = policyGrade?.base_salary ?? pos?.base_salary ?? 0
  const storeName = emp ? getStoreRevenueForPeriod(emp.store_id, periodStart).name : ''

  // ── Step 2: Attendance
  const att = getPayrollAttendanceSummary(employeeId, periodStart, periodEnd)

  // ── Step 3: Base earned
  const effectiveDays = att.workDays + att.leavePaid
  const baseEarned = Math.round(baseSalary * (effectiveDays / STANDARD_WORK_DAYS))

  // ── Step 4: Overtime
  const overtimeAmount = calculateOvertimeAmount(baseSalary, att.overtimeHours)

  // ── Step 5: Allowances
  const allowances = getAllowancesForEmployee(employeeId, baseSalary, att)
  const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0)

  // ── Step 6: Bonuses
  const bonuses = getBonusesForPeriod(employeeId, periodStart)
  const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0)

  // ── Step 6b: F&B tip/service charge allocation
  const fnbAllocations = input.fnbAllocations ?? buildFnbPayrollAllocations(periodStart, periodEnd)
  const fnbAllocation = fnbAllocations[employeeId]
  const fnbShare = fnbAllocation?.share ?? 0

  // ── Step 7: Deductions
  const lateDeduction = att.lateCount * LATE_PENALTY
  const dailyRate = Math.round(baseSalary / STANDARD_WORK_DAYS)
  const absentDeduction = att.absentDays * dailyRate
  const advanceDeduction = getAdvanceDeduction(employeeId, periodStart)
  const otherDeductions = getOtherDeductions(employeeId, periodStart)
  const totalOtherDeductions = otherDeductions.reduce((sum, d) => sum + d.amount, 0)
  const totalDeductions = lateDeduction + absentDeduction + advanceDeduction + totalOtherDeductions

  // ── Step 8: Total earnings
  const totalEarnings = baseEarned + overtimeAmount + totalAllowances + totalBonuses + fnbShare

  // ── Step 9: Insurance
  const insurance = calculateInsurance(baseSalary)

  // ── Step 10: Tax
  const grossSalary = totalEarnings - totalDeductions
  const taxableIncome = Math.max(0, grossSalary - insurance.total)
  const tax = calculateTax(taxableIncome)

  // ── Step 11: Net
  const netSalary = grossSalary - insurance.total - tax

  return {
    employee_id: employeeId,
    employee_name: emp?.full_name ?? '',
    position: pos?.name ?? '',
    store: storeName,
    period: `${periodStart.slice(0, 7)}`,

    standard_days: STANDARD_WORK_DAYS,
    work_days: att.workDays,
    leave_days_paid: att.leavePaid,
    leave_days_unpaid: att.leaveUnpaid,
    absent_days: att.absentDays,
    late_count: att.lateCount,

    base_salary: baseSalary,
    base_earned: baseEarned,
    overtime_hours: att.overtimeHours,
    overtime_amount: overtimeAmount,
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
    other_deductions: otherDeductions,
    total_other_deductions: totalOtherDeductions,
    total_deductions: totalDeductions,

    bhxh: insurance.bhxh,
    bhyt: insurance.bhyt,
    bhtn: insurance.bhtn,
    total_insurance: insurance.total,

    taxable_income: taxableIncome,
    tax,

    gross_salary: grossSalary,
    net_salary: netSalary,
  }
}

// ══════════════════════════════════════
// 7. BATCH: All employees
// ══════════════════════════════════════

export function calculatePayrollBatch(
  periodStart: string,
  periodEnd: string,
): PayrollResult[] {
  // Only calculate for active employees, except CEO.
  const activeEmployees = mockEmployees.filter(
    e => e.status !== 'inactive' && e.role !== 'ceo',
  )
  const fnbAllocations = buildFnbPayrollAllocations(periodStart, periodEnd)
  return activeEmployees.map(emp =>
    calculatePayroll({ employeeId: emp.id, periodStart, periodEnd, fnbAllocations }),
  )
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
    other_deduction: result.absent_deduction + result.total_other_deductions,
    total_deductions: result.total_deductions + result.total_insurance + result.tax,
    net_salary: result.net_salary,
  }
}
