import { masterPositions, settingsPayroll } from '@/lib/mock-data-settings'

export type PayrollPolicyStatus = 'draft' | 'pending_ceo' | 'active'

export type PayrollSalaryGrade = {
  id: string
  name: string
  level: number
  band: string
  base_salary: number
  minSalary: number
  maxSalary: number
  probation: number
  kpiPool: number
  status: string
}

export type PayrollAllowanceRule = {
  name: string
  type: string
  amount: number
  taxable: string
  appliesTo: string
}

export type PayrollFnbPolicy = {
  mealAllowancePerShift: number
  openingShiftAllowance: number
  closingShiftAllowance: number
  splitShiftAllowance: number
  peakHourBonus: number
  nightShiftAllowance: number
  trainingShiftAllowance: number
  serviceChargePoolRate: number
  tipPoolRate: number
  holidayPeakBonusRate: number
  tetPeakBonusRate: number
  cashShortageAutoDeductionLimit: number
  requireCashShortageApproval: boolean
  requireInventoryBreakageApproval: boolean
}

export type PayrollPolicy = {
  version: string
  status: PayrollPolicyStatus
  updatedBy: string
  updatedAt: string
  grades: PayrollSalaryGrade[]
  allowances: PayrollAllowanceRule[]
  fnb: PayrollFnbPolicy
  rates: {
    probation: number
    bhxhEmployee: number
    bhytEmployee: number
    bhtnEmployee: number
    taxBracket1: number
    otWeekday: number
    otNight: number
    otHoliday: number
  }
}

export type PayrollPolicyHistoryEntry = {
  id: string
  version: string
  status: PayrollPolicyStatus
  updatedBy: string
  updatedAt: string
  note: string
  snapshot: PayrollPolicy
}

export type PayrollPolicyDiff = {
  group: string
  label: string
  before: string
  after: string
  trend: 'up' | 'down' | 'neutral'
}

export const PAYROLL_POLICY_STORAGE_KEY = 'homies-payroll-policy-v1'
export const PAYROLL_POLICY_HISTORY_KEY = 'homies-payroll-policy-history-v1'
export const MIN_REGION_1_SALARY = 4680000
export const INSURANCE_MAX_BASE = 29800000

const defaultFnbPolicy: PayrollFnbPolicy = {
  mealAllowancePerShift: 30000,
  openingShiftAllowance: 20000,
  closingShiftAllowance: 40000,
  splitShiftAllowance: 25000,
  peakHourBonus: 15000,
  nightShiftAllowance: 50000,
  trainingShiftAllowance: 25000,
  serviceChargePoolRate: 0.03,
  tipPoolRate: 0.7,
  holidayPeakBonusRate: 0.5,
  tetPeakBonusRate: 1,
  cashShortageAutoDeductionLimit: 200000,
  requireCashShortageApproval: true,
  requireInventoryBreakageApproval: true,
}

export function buildDefaultPayrollPolicy(): PayrollPolicy {
  const grades = masterPositions.map((position, index) => ({
    ...position,
    band: index < 3 ? 'Cửa hàng' : 'Quản lý ca',
    minSalary: Math.round(position.base_salary * 0.9),
    maxSalary: Math.round(position.base_salary * 1.28),
    probation: Math.round(position.base_salary * settingsPayroll.salary_coefficients.probation_rate),
    kpiPool: index < 3 ? 600000 : 1500000,
    status: position.base_salary >= MIN_REGION_1_SALARY ? 'Đạt sàn vùng I' : 'Cần kiểm tra',
  }))

  return {
    version: 'VN-2026.01',
    status: 'active',
    updatedBy: 'System preset',
    updatedAt: '22/05/2026 09:10',
    grades,
    allowances: [
      { name: 'Phụ cấp cơm ca', type: 'Theo ca', amount: 650000, taxable: 'Theo chính sách nội bộ', appliesTo: 'Nhân viên full-time' },
      { name: 'Phụ cấp điện thoại', type: 'Cố định', amount: 250000, taxable: 'Tính PIT nếu vượt định mức', appliesTo: 'Trưởng ca, quản lý' },
      { name: 'Phụ cấp trách nhiệm', type: 'Theo vai trò', amount: 1200000, taxable: 'Tính PIT', appliesTo: 'Trưởng ca trở lên' },
      { name: 'Thưởng chuyên cần', type: 'Điều kiện', amount: 500000, taxable: 'Tính PIT', appliesTo: 'Không đi trễ, không vắng' },
    ],
    fnb: defaultFnbPolicy,
    rates: {
      probation: settingsPayroll.salary_coefficients.probation_rate,
      bhxhEmployee: settingsPayroll.salary_coefficients.bhxh_employee,
      bhytEmployee: settingsPayroll.salary_coefficients.bhyt_employee,
      bhtnEmployee: settingsPayroll.salary_coefficients.bhtn_employee,
      taxBracket1: settingsPayroll.salary_coefficients.tax_bracket_1,
      otWeekday: settingsPayroll.standard_work_days.ot_coefficient,
      otNight: settingsPayroll.standard_work_days.night_coefficient,
      otHoliday: settingsPayroll.standard_work_days.holiday_coefficient,
    },
  }
}

export function getStoredPayrollPolicy(): PayrollPolicy {
  const fallback = buildDefaultPayrollPolicy()
  if (typeof window === 'undefined') return fallback

  const stored = window.localStorage.getItem(PAYROLL_POLICY_STORAGE_KEY)
  if (!stored) return fallback

  try {
    return normalizePayrollPolicy(JSON.parse(stored) as Partial<PayrollPolicy>)
  } catch {
    window.localStorage.removeItem(PAYROLL_POLICY_STORAGE_KEY)
    return fallback
  }
}

export function saveStoredPayrollPolicy(policy: PayrollPolicy) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PAYROLL_POLICY_STORAGE_KEY, JSON.stringify(policy))
}

export function getStoredPayrollPolicyHistory(): PayrollPolicyHistoryEntry[] {
  const policy = getStoredPayrollPolicy()
  if (typeof window === 'undefined') {
    return [createHistoryEntry(policy, 'Khởi tạo cấu hình mặc định')]
  }

  const stored = window.localStorage.getItem(PAYROLL_POLICY_HISTORY_KEY)
  if (!stored) {
    const seed = [createHistoryEntry(policy, 'Khởi tạo cấu hình hiện tại')]
    saveStoredPayrollPolicyHistory(seed)
    return seed
  }

  try {
    const history = JSON.parse(stored) as PayrollPolicyHistoryEntry[]
    return history.length ? history.map((item) => ({ ...item, snapshot: normalizePayrollPolicy(item.snapshot) })) : [createHistoryEntry(policy, 'Khởi tạo cấu hình hiện tại')]
  } catch {
    window.localStorage.removeItem(PAYROLL_POLICY_HISTORY_KEY)
    return [createHistoryEntry(policy, 'Khởi tạo cấu hình hiện tại')]
  }
}

export function recordPayrollPolicyChange(policy: PayrollPolicy, note: string): PayrollPolicyHistoryEntry[] {
  saveStoredPayrollPolicy(policy)

  const history = getStoredPayrollPolicyHistory()
  const entry = createHistoryEntry(policy, note)
  const nextHistory = [
    entry,
    ...history.filter((item) => item.id !== entry.id),
  ].slice(0, 20)

  saveStoredPayrollPolicyHistory(nextHistory)
  return nextHistory
}

export function rollbackPayrollPolicy(version: string, actor: string = 'CEO'): PayrollPolicy | null {
  const target = getStoredPayrollPolicyHistory().find((item) => item.version === version)
  if (!target) return null

  const rollbackPolicy: PayrollPolicy = {
    ...target.snapshot,
    status: 'active',
    updatedBy: actor,
    updatedAt: new Date().toLocaleString('vi-VN'),
  }

  recordPayrollPolicyChange(rollbackPolicy, `Khôi phục cấu hình từ ${version}`)
  return rollbackPolicy
}

export function getActivePayrollPolicy(): PayrollPolicy {
  const policy = getStoredPayrollPolicy()
  if (policy.status === 'active') return policy

  const activeHistory = getStoredPayrollPolicyHistory().find((item) => item.snapshot.status === 'active')
  return activeHistory?.snapshot ?? buildDefaultPayrollPolicy()
}

export function comparePayrollPolicies(base: PayrollPolicy, next: PayrollPolicy): PayrollPolicyDiff[] {
  const diffs: PayrollPolicyDiff[] = []

  addMoneyDiff(diffs, 'Bảo hiểm & thuế', 'Tỷ lệ thử việc', base.rates.probation, next.rates.probation, true)
  addMoneyDiff(diffs, 'Bảo hiểm & thuế', 'BHXH nhân viên', base.rates.bhxhEmployee, next.rates.bhxhEmployee, true)
  addMoneyDiff(diffs, 'Bảo hiểm & thuế', 'BHYT nhân viên', base.rates.bhytEmployee, next.rates.bhytEmployee, true)
  addMoneyDiff(diffs, 'Bảo hiểm & thuế', 'BHTN nhân viên', base.rates.bhtnEmployee, next.rates.bhtnEmployee, true)
  addMoneyDiff(diffs, 'OT', 'OT ngày thường', base.rates.otWeekday, next.rates.otWeekday, true)
  addMoneyDiff(diffs, 'OT', 'OT ban đêm', base.rates.otNight, next.rates.otNight, true)
  addMoneyDiff(diffs, 'OT', 'OT ngày lễ', base.rates.otHoliday, next.rates.otHoliday, true)

  for (const grade of next.grades) {
    const oldGrade = base.grades.find((item) => item.id === grade.id)
    if (!oldGrade) continue
    addMoneyDiff(diffs, 'Bậc lương', grade.name, oldGrade.base_salary, grade.base_salary)
    addMoneyDiff(diffs, 'KPI', `${grade.name} KPI`, oldGrade.kpiPool, grade.kpiPool)
  }

  for (const allowance of next.allowances) {
    const oldAllowance = base.allowances.find((item) => item.name === allowance.name)
    if (!oldAllowance) continue
    addMoneyDiff(diffs, 'Phụ cấp', allowance.name, oldAllowance.amount, allowance.amount)
  }

  addMoneyDiff(diffs, 'F&B', 'Cơm ca/shift', base.fnb.mealAllowancePerShift, next.fnb.mealAllowancePerShift)
  addMoneyDiff(diffs, 'F&B', 'Ca mở cửa', base.fnb.openingShiftAllowance, next.fnb.openingShiftAllowance)
  addMoneyDiff(diffs, 'F&B', 'Ca đóng cửa', base.fnb.closingShiftAllowance, next.fnb.closingShiftAllowance)
  addMoneyDiff(diffs, 'F&B', 'Ca gãy', base.fnb.splitShiftAllowance, next.fnb.splitShiftAllowance)
  addMoneyDiff(diffs, 'F&B', 'Giờ cao điểm', base.fnb.peakHourBonus, next.fnb.peakHourBonus)
  addMoneyDiff(diffs, 'F&B', 'Ca đêm', base.fnb.nightShiftAllowance, next.fnb.nightShiftAllowance)
  addMoneyDiff(diffs, 'F&B', 'Training shift', base.fnb.trainingShiftAllowance, next.fnb.trainingShiftAllowance)
  addMoneyDiff(diffs, 'F&B', 'Service charge pool', base.fnb.serviceChargePoolRate, next.fnb.serviceChargePoolRate, true)
  addMoneyDiff(diffs, 'F&B', 'Tip pool cho team', base.fnb.tipPoolRate, next.fnb.tipPoolRate, true)
  addMoneyDiff(diffs, 'F&B', 'Lễ cao điểm', base.fnb.holidayPeakBonusRate, next.fnb.holidayPeakBonusRate, true)
  addMoneyDiff(diffs, 'F&B', 'Tết cao điểm', base.fnb.tetPeakBonusRate, next.fnb.tetPeakBonusRate, true)
  addMoneyDiff(diffs, 'F&B', 'Trần lệch tiền tự khấu trừ', base.fnb.cashShortageAutoDeductionLimit, next.fnb.cashShortageAutoDeductionLimit)
  addBoolDiff(diffs, 'F&B', 'Duyệt lệch tiền', base.fnb.requireCashShortageApproval, next.fnb.requireCashShortageApproval)
  addBoolDiff(diffs, 'F&B', 'Duyệt hủy/hỏng nguyên liệu', base.fnb.requireInventoryBreakageApproval, next.fnb.requireInventoryBreakageApproval)

  return diffs
}

function saveStoredPayrollPolicyHistory(history: PayrollPolicyHistoryEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PAYROLL_POLICY_HISTORY_KEY, JSON.stringify(history))
}

function createHistoryEntry(policy: PayrollPolicy, note: string): PayrollPolicyHistoryEntry {
  return {
    id: `${policy.version}-${policy.status}-${policy.updatedAt}`,
    version: policy.version,
    status: policy.status,
    updatedBy: policy.updatedBy,
    updatedAt: policy.updatedAt,
    note,
    snapshot: policy,
  }
}

function normalizePayrollPolicy(policy: Partial<PayrollPolicy>): PayrollPolicy {
  const fallback = buildDefaultPayrollPolicy()

  return {
    ...fallback,
    ...policy,
    grades: policy.grades ?? fallback.grades,
    allowances: policy.allowances ?? fallback.allowances,
    fnb: { ...fallback.fnb, ...(policy.fnb ?? {}) },
    rates: { ...fallback.rates, ...(policy.rates ?? {}) },
  }
}

function addMoneyDiff(
  diffs: PayrollPolicyDiff[],
  group: string,
  label: string,
  before: number,
  after: number,
  isPercent = false,
) {
  if (before === after) return

  diffs.push({
    group,
    label,
    before: isPercent ? formatPercent(before) : formatMoney(before),
    after: isPercent ? formatPercent(after) : formatMoney(after),
    trend: after > before ? 'up' : 'down',
  })
}

function addBoolDiff(
  diffs: PayrollPolicyDiff[],
  group: string,
  label: string,
  before: boolean,
  after: boolean,
) {
  if (before === after) return

  diffs.push({
    group,
    label,
    before: before ? 'Bật' : 'Tắt',
    after: after ? 'Bật' : 'Tắt',
    trend: 'neutral',
  })
}

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')} đ`
}

function formatPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`
}
