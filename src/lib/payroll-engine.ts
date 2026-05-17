// =============================================
// HRM Trà Sữa 🧋 — Payroll Calculation Engine
// Real calculation: Attendance → Leave → Salary
// =============================================

import {
  mockAttendances, mockEmployees, mockPositions,
  type Attendance,
} from './mock-data'
import {
  mockBonuses, mockDeductions, mockAdvances,
  mockAllowanceTypes, type SalarySlipData,
} from './mock-data-payroll'

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface PayrollInput {
  employeeId: string
  periodStart: string   // '2026-02-01'
  periodEnd: string     // '2026-02-28'
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

const INSURANCE_RATES = {
  bhxh: 0.08,
  bhyt: 0.015,
  bhtn: 0.01,
}
const INSURANCE_MAX_BASE = 29800000

// Leave types considered "paid"
const PAID_LEAVE_TYPES = ['annual', 'sick', 'wedding', 'bereavement', 'maternity']

// ══════════════════════════════════════
// 1. GET EMPLOYEE BASE SALARY
// ══════════════════════════════════════

export function getEmployeeBaseSalary(employeeId: string): number {
  const emp = mockEmployees.find(e => e.id === employeeId)
  if (!emp) return 0
  const pos = mockPositions.find(p => p.id === emp.position_id)
  return pos?.base_salary ?? 0
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
  const hourlyRate = baseSalary / STANDARD_WORK_DAYS / 8
  return Math.round(overtimeHours * hourlyRate * OT_RATES[otType])
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
  const base = Math.min(baseSalary, INSURANCE_MAX_BASE)
  const bhxh = Math.round(base * INSURANCE_RATES.bhxh)
  const bhyt = Math.round(base * INSURANCE_RATES.bhyt)
  const bhtn = Math.round(base * INSURANCE_RATES.bhtn)
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

function getAllowancesForEmployee(employeeId: string, baseSalary: number): { name: string; amount: number }[] {
  const emp = mockEmployees.find(e => e.id === employeeId)
  if (!emp) return []

  // All active fixed allowances apply to all employees
  const result: { name: string; amount: number }[] = []
  for (const a of mockAllowanceTypes) {
    if (!a.is_active) continue
    if (a.type === 'fixed') {
      result.push({ name: a.name, amount: a.amount })
    } else {
      // percent-based
      result.push({ name: a.name, amount: Math.round(baseSalary * a.amount / 100) })
    }
  }

  // Manager-level get responsibility allowance, others don't
  if (emp.role === 'employee' || emp.role === 'shift_leader') {
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

  // ── Step 1: Employee info
  const emp = mockEmployees.find(e => e.id === employeeId)
  const pos = mockPositions.find(p => p.id === emp?.position_id)
  const baseSalary = pos?.base_salary ?? 0
  const storeName = emp?.store_id === 'store-001' ? 'Boba House Q.1'
    : emp?.store_id === 'store-002' ? 'Boba House Thủ Đức'
    : 'Boba House Lê Văn Sỹ'

  // ── Step 2: Attendance
  const att = getPayrollAttendanceSummary(employeeId, periodStart, periodEnd)

  // ── Step 3: Base earned
  const effectiveDays = att.workDays + att.leavePaid
  const baseEarned = Math.round(baseSalary * (effectiveDays / STANDARD_WORK_DAYS))

  // ── Step 4: Overtime
  const overtimeAmount = calculateOvertimeAmount(baseSalary, att.overtimeHours)

  // ── Step 5: Allowances
  const allowances = getAllowancesForEmployee(employeeId, baseSalary)
  const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0)

  // ── Step 6: Bonuses
  const bonuses = getBonusesForPeriod(employeeId, periodStart)
  const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0)

  // ── Step 7: Deductions
  const lateDeduction = att.lateCount * LATE_PENALTY
  const dailyRate = Math.round(baseSalary / STANDARD_WORK_DAYS)
  const absentDeduction = att.absentDays * dailyRate
  const advanceDeduction = getAdvanceDeduction(employeeId, periodStart)
  const otherDeductions = getOtherDeductions(employeeId, periodStart)
  const totalOtherDeductions = otherDeductions.reduce((sum, d) => sum + d.amount, 0)
  const totalDeductions = lateDeduction + absentDeduction + advanceDeduction + totalOtherDeductions

  // ── Step 8: Total earnings
  const totalEarnings = baseEarned + overtimeAmount + totalAllowances + totalBonuses

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
  // Only calculate for active employees (not CEO/HR admin)
  const activeEmployees = mockEmployees.filter(
    e => e.status !== 'inactive' && e.role !== 'ceo',
  )
  return activeEmployees.map(emp =>
    calculatePayroll({ employeeId: emp.id, periodStart, periodEnd }),
  )
}

// ══════════════════════════════════════
// 8. GENERATE SALARY SLIP (SalarySlipData)
// ══════════════════════════════════════

let slipCounter = 100

export function generateSalarySlip(result: PayrollResult): SalarySlipData {
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
    allowances: result.allowances,
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
